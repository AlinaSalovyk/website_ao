// Package http implements the presentation layer: HTTP routing, request/response
// handling, middleware (CORS, rate limiting, auth, audit logging), and SSE streaming.
// Uses chi/v5 router with clean separation between public (chat) and admin endpoints.
package http

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/auth"
	_ "university-chatbot/backend/internal/infrastructure/metrics"
	"university-chatbot/backend/internal/infrastructure/security"
	"university-chatbot/backend/internal/infrastructure/sqlite"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// RouterDeps aggregates all dependencies needed to construct the HTTP router.
type RouterDeps struct {
	ChatHandler      *ChatHandler                           // Chat handler
	AdminHandler     *AdminHandler                          // Admin panel handler
	IndexHandler     *IndexHandler                          // Document indexing handler
	RateLimiter      *security.RateLimiter                  // Public API rate limiter.
	AdminRateLimiter *security.RateLimiter                  // Admin panel rate limiter.
	AuditRepo        domain.AuditRepo                       // Audit repository
	JWTService       *auth.JWTService                       // JWT service
	AdminToken       string                                 // Static admin token for X-Admin-Token auth.
	AllowedOrigins   []string                               // CORS allowed origins.
	AllowedEmails    []string                               // Admin email whitelist.
	DB               *sql.DB                                // Database connection
	AdminSettings    *sqlite.AdminSettingsRepo              // Admin settings repository
	AdminPathSegment string                                 // Hashed admin URL segment.
	MetricsToken     string                                 // Bearer token for /metrics endpoint.
	HealthChecks     map[string]func(context.Context) error // Named health check functions.
}

// NewRouter constructs the full chi.Mux with all routes, middleware, and CORS.
// Routes:
//   - POST /api/v1/chat/stream — SSE chat endpoint
//   - POST /api/v1/chat/feedback — feedback submission
//   - GET  /api/v1/chat/suggestions — suggested questions
//   - /admin-{hash}/* — admin panel (OAuth, analytics, documents, prompts)
//   - GET  /health — deep health check
//   - GET  /metrics — Prometheus metrics (token-protected)
func NewRouter(deps RouterDeps) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.CleanPath)
	r.Use(middleware.StripSlashes)

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasSuffix(r.URL.Path, "/documents/upload") {
				next.ServeHTTP(w, r)
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB
			next.ServeHTTP(w, r)
		})
	})

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			if strings.HasPrefix(r.URL.Path, "/admin") {
				h.Set("Content-Security-Policy",
					"default-src 'self'; "+
						"script-src 'self'; "+
						"style-src 'self' 'unsafe-inline'; "+
						"img-src 'self' data: https:; "+
						"font-src 'self' https:; "+
						"connect-src 'self'; "+
						"frame-ancestors 'none'; "+
						"base-uri 'self'; "+
						"form-action 'self'")
			}
			next.ServeHTTP(w, r)
		})
	})
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   deps.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Accept", "X-Admin-Token"},
		AllowCredentials: true,
		MaxAge:           3600,
	}))

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		checks := map[string]string{"api": "ok"}
		status := http.StatusOK

		if deps.HealthChecks != nil {
			for name, checkFn := range deps.HealthChecks {
				if err := checkFn(r.Context()); err != nil {
					checks[name] = "error"
					status = http.StatusServiceUnavailable
				} else {
					checks[name] = "ok"
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(checks)
	})

	r.Handle("/metrics", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if deps.MetricsToken != "" {
			authHeader := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if authHeader != deps.MetricsToken {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
		} else {
			remoteIP := r.RemoteAddr
			if idx := strings.LastIndex(remoteIP, ":"); idx > 0 {
				remoteIP = remoteIP[:idx]
			}
			if remoteIP != "127.0.0.1" && remoteIP != "::1" && remoteIP != "[::1]" {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
		}
		promhttp.Handler().ServeHTTP(w, r)
	}))

	r.Route("/api/v1", func(r chi.Router) {
		r.With(RateLimitMiddleware(deps.RateLimiter)).Post("/chat/stream", deps.ChatHandler.StreamChat)
		r.Post("/feedback", deps.ChatHandler.SubmitFeedback)

		if deps.AdminHandler != nil {
			r.Get("/suggestions", deps.AdminHandler.HandleListSuggestions)
		}
	})

	adminPrefix := "/admin-" + deps.AdminPathSegment
	if deps.AdminHandler != nil {
		authRouter := r.With()
		if deps.AdminRateLimiter != nil {
			authRouter = r.With(RateLimitMiddleware(deps.AdminRateLimiter))
		}
		authRouter.Get(adminPrefix+"/auth/login", deps.AdminHandler.HandleLogin)
		authRouter.Get(adminPrefix+"/auth/callback", deps.AdminHandler.HandleCallback)
		authRouter.Post(adminPrefix+"/auth/refresh", deps.AdminHandler.HandleRefreshToken)
	}

	r.Route(adminPrefix, func(r chi.Router) {
		r.Use(DualAuthMiddleware(deps.JWTService, deps.AdminToken, deps.AllowedEmails, deps.AdminSettings))
		if deps.AdminRateLimiter != nil {
			r.Use(RateLimitMiddleware(deps.AdminRateLimiter))
		}

		if deps.AuditRepo != nil {
			r.Use(AuditMiddleware(deps.AuditRepo))
		}

		if deps.AdminHandler != nil {
			r.Post("/auth/logout", deps.AdminHandler.HandleLogout)
		}
		if deps.IndexHandler != nil {
			r.Post("/documents/upload", deps.IndexHandler.HandleAdminUpload)
			r.Get("/documents/jobs/{job_id}", deps.IndexHandler.GetJobStatus)
			r.Delete("/documents/{document_id}", deps.IndexHandler.HandleDeleteDocument)
			r.Post("/documents/{document_id}/reindex", deps.IndexHandler.HandleReindexDocument)
			r.Post("/documents/reindex-all", deps.IndexHandler.HandleReindexAll)
		}

		if deps.AdminHandler != nil {
			r.Get("/documents", deps.AdminHandler.HandleListDocuments)
			r.Get("/documents/{id}/download", deps.AdminHandler.HandleDownloadDocument)
			r.Patch("/documents/{id}/rename", deps.AdminHandler.HandleRenameDocument)
			r.Get("/analytics/summary", deps.AdminHandler.HandleAnalyticsSummary)
			r.Get("/analytics/daily", deps.AdminHandler.HandleDailyStats)
			r.Get("/analytics/top-queries", deps.AdminHandler.HandleTopQueries)
			r.Get("/analytics/feedback", deps.AdminHandler.HandleFeedbackStats)
			r.Get("/analytics/export/csv", deps.AdminHandler.HandleExportCSV)
			r.Get("/queries", deps.AdminHandler.HandleRecentQueries)
			r.Get("/audit", deps.AdminHandler.HandleAuditLog)
			r.Get("/prompts", deps.AdminHandler.HandleListPrompts)
			r.Post("/prompts", deps.AdminHandler.HandleCreatePrompt)
			r.Patch("/prompts/{id}/active", deps.AdminHandler.HandleTogglePromptActive)
			r.Patch("/prompts/{id}", deps.AdminHandler.HandleUpdatePrompt)
			r.Delete("/prompts/{id}", deps.AdminHandler.HandleDeletePrompt)
			r.Get("/suggestions", deps.AdminHandler.HandleListSuggestions)
			r.Post("/suggestions", deps.AdminHandler.HandleCreateSuggestion)
			r.Get("/admins", deps.AdminHandler.HandleListAdmins)
			r.Post("/admins", deps.AdminHandler.HandleAddAdmin)
			r.Delete("/admins/{email}", deps.AdminHandler.HandleRemoveAdmin)
		}
	})

	return r
}
