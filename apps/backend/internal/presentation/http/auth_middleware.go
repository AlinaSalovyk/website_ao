package http

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/auth"
	"university-chatbot/backend/internal/infrastructure/sqlite"
)

type contextKey string

const adminEmailKey contextKey = "admin_email"

// DualAuthMiddleware creates a chi middleware that authenticates admin requests
// using either JWT (Bearer token via Authorization header) or static admin token
// (X-Admin-Token header). Falls through from JWT to token auth on JWT failure.
func DualAuthMiddleware(jwtSvc *auth.JWTService, adminToken string, allowedEmails []string, settings *sqlite.AdminSettingsRepo) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if authHeader := r.Header.Get("Authorization"); strings.HasPrefix(authHeader, "Bearer ") {
				tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
				claims, err := jwtSvc.ValidateToken(tokenStr)
				if err == nil {
					if !CheckAdminAccess(r.Context(), claims.Email, allowedEmails, settings) {
						jsonError(w, "forbidden", "Email not authorized", http.StatusForbidden)
						return
					}
					ctx := context.WithValue(r.Context(), adminEmailKey, claims.Email)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
				slog.Debug("JWT validation failed, trying Admin-Token", "error", err)
			}
			if adminToken != "" {
				token := r.Header.Get("X-Admin-Token")
				if token != "" && subtle.ConstantTimeCompare([]byte(token), []byte(adminToken)) == 1 {
					ctx := context.WithValue(r.Context(), adminEmailKey, "admin@token-auth")
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			jsonError(w, "unauthorized", "Valid JWT or Admin-Token required", http.StatusUnauthorized)
		})
	}
}

// AdminEmailFromCtx extracts the admin email from the request context.
// Returns "unknown" if no email is set.
func AdminEmailFromCtx(ctx context.Context) string {
	email, _ := ctx.Value(adminEmailKey).(string)
	if email == "" {
		return "unknown"
	}
	return email
}

// CheckAdminAccess verifies whether the given email has admin access.
// Checks in order: email whitelist → first-admin auto-promotion → reject.
func CheckAdminAccess(ctx context.Context, email string, allowedEmails []string, settings *sqlite.AdminSettingsRepo) bool {
	if len(allowedEmails) > 0 {
		return isEmailAllowed(email, allowedEmails)
	}
	if settings != nil {
		firstAdmin, err := settings.Get(ctx, "first_admin_email")
		if err != nil {
			slog.Error("Failed to get first_admin_email", "error", err)
			return false
		}

		if firstAdmin == "" {
			_, actualAdmin, err := settings.SetFirstAdminAtomic(ctx, email)
			if err != nil {
				slog.Error("Failed to set first_admin_email atomically", "error", err)
				return false
			}
			won := strings.EqualFold(actualAdmin, email)
			if won {
				slog.Info("Auto-promoted first user to admin", "email", email)
			}
			return won
		}

		return strings.EqualFold(email, firstAdmin)
	}

	return false
}

// isEmailAllowed checks if the given email is in the allowed emails list.
func isEmailAllowed(email string, allowed []string) bool {
	if len(allowed) == 0 {
		return false
	}
	email = strings.ToLower(strings.TrimSpace(email))
	for _, a := range allowed {
		a = strings.ToLower(strings.TrimSpace(a))
		if strings.HasPrefix(a, "@") && strings.HasSuffix(email, a) {
			return true
		}
		if a == email {
			return true
		}
	}
	return false
}

type statusResponseWriter struct {
	http.ResponseWriter
	status int // HTTP status code
}

// WriteHeader writes the HTTP status code to the response writer.
func (sw *statusResponseWriter) WriteHeader(code int) {
	sw.status = code
	sw.ResponseWriter.WriteHeader(code)
}

// Status returns the HTTP status code.
func (sw *statusResponseWriter) Status() int {
	if sw.status == 0 {
		return http.StatusOK
	}
	return sw.status
}

// AuditMiddleware creates a chi middleware that logs admin actions to the audit
// repository. Actions are inferred from HTTP method + URL path. Only successful
// requests (status < 400) are recorded. Recording is asynchronous.
func AuditMiddleware(auditRepo domain.AuditRepo) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			srw := &statusResponseWriter{ResponseWriter: w}
			next.ServeHTTP(srw, r)

			action := inferAction(r.Method, r.URL.Path)
			if action == "" {
				return
			}
			httpStatus := srw.Status()
			if httpStatus >= 400 {
				return
			}

			adminEmail := AdminEmailFromCtx(r.Context())
			urlPath := r.URL.Path
			ip := realIP(r)

			go func() {
				entry := domain.AuditEntry{
					AdminEmail: adminEmail,
					Action:     domain.AdminAction(action),
					Target:     urlPath,
					Details:    fmt.Sprintf("status=%d", httpStatus),
					IP:         ip,
				}
				if err := auditRepo.Record(context.Background(), entry); err != nil {
					slog.Error("Failed to record audit entry", "error", err)
				}
			}()
		})
	}
}

// inferAction infers the action from the HTTP method and URL path.
func inferAction(method, path string) string {
	switch {
	case method == "POST" && strings.Contains(path, "/upload"):
		return string(domain.ActionUploadDocument)
	case method == "DELETE" && strings.Contains(path, "/documents/"):
		return string(domain.ActionDeleteDocument)
	case method == "PATCH" && strings.Contains(path, "/rename"):
		return string(domain.ActionRenameDocument)
	case method == "POST" && strings.Contains(path, "/reindex-all"):
		return string(domain.ActionReindexAll)
	case method == "POST" && strings.Contains(path, "/reindex"):
		return string(domain.ActionReindexDocument)
	case method == "POST" && strings.Contains(path, "/admins"):
		return string(domain.ActionAddAdmin)
	case method == "DELETE" && strings.Contains(path, "/admins/"):
		return string(domain.ActionRemoveAdmin)
	case method == "GET" && strings.Contains(path, "/export"):
		return string(domain.ActionExportCSV)
	case method == "GET" && strings.Contains(path, "/analytics"):
		return string(domain.ActionViewAnalytics)
	case method == "GET" && strings.Contains(path, "/audit"):
		return string(domain.ActionViewAuditLog)
	default:
		return ""
	}
}

// GenerateState generates a random state token for CSRF protection.
func GenerateState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

type csrfEntry struct {
	createdAt time.Time // Time when the CSRF state token was created
}

const csrfStateTTL = 10 * time.Minute // Time to live for CSRF state tokens
const csrfStoreMaxSize = 500          // Maximum number of CSRF state tokens to store

var (
	csrfStore   = make(map[string]csrfEntry) // Map of CSRF state tokens
	csrfStoreMu sync.RWMutex                 // Mutex for protecting the CSRF store
)

// StartCSRFCleanup begins a background goroutine that removes expired CSRF
// state tokens every 5 minutes. Stops when ctx is cancelled.
func StartCSRFCleanup(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				csrfStoreMu.Lock()
				cutoff := time.Now().Add(-csrfStateTTL)
				for state, entry := range csrfStore {
					if entry.createdAt.Before(cutoff) {
						delete(csrfStore, state)
					}
				}
				csrfStoreMu.Unlock()
			}
		}
	}()
}

// StoreState stores a CSRF state token in the store. Returns false if the store is full.
func StoreState(state string) bool {
	csrfStoreMu.Lock()
	defer csrfStoreMu.Unlock()
	if len(csrfStore) >= csrfStoreMaxSize {
		return false
	}
	csrfStore[state] = csrfEntry{createdAt: time.Now()}
	return true
}

// ValidateState validates a CSRF state token. Removes the token from the store after successful validation.
func ValidateState(state string) bool {
	csrfStoreMu.Lock()
	defer csrfStoreMu.Unlock()
	entry, ok := csrfStore[state]
	if !ok {
		return false
	}

	if time.Since(entry.createdAt) > csrfStateTTL {
		delete(csrfStore, state)
		return false
	}
	delete(csrfStore, state)
	return true
}

type stateResponse struct {
	URL   string `json:"url,omitempty"`   // URL to redirect to after successful authentication
	Token string `json:"token,omitempty"` // JWT token
	Email string `json:"email,omitempty"` // Email of the authenticated user
	Name  string `json:"name,omitempty"`  // Name of the authenticated user
}

type authErrorResponse struct {
	Error   string `json:"error"`   // Error type
	Message string `json:"message"` // Error message
}

// WriteAuthError writes an authentication error response to the client.
func writeAuthError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(authErrorResponse{
		Error:   "auth_error",
		Message: msg,
	})
}
