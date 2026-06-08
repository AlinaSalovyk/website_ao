package http

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/auth"
	"university-chatbot/backend/internal/infrastructure/sqlite"
)

// AdminHandler manages all admin-facing HTTP endpoints:
//   - OAuth login/callback/refresh/logout
//   - Analytics dashboard (summary, top queries, daily stats, feedback)
//   - Document management (list, upload, delete, rename, reindex)
//   - Prompt variant A/B testing (CRUD + activation)
//   - Suggested questions management
//   - Admin user management (list, add, remove)
//   - Audit log viewing
//   - CSV export
type AdminHandler struct {
	oauthSvc           *auth.OAuthService // OAuth Service used for Google OAuth authentication
	jwtSvc             *auth.JWTService // JWT Service used for generating and validating JWT tokens
	analyticsRepo      domain.AnalyticsRepo // Analytics Repository used for storing and retrieving analytics data
	auditRepo          domain.AuditRepo // Audit Repository used for storing and retrieving audit data
	documentRepo       domain.DocumentRepo // Document Repository used for storing and retrieving document data
	promptRepo         domain.PromptRepo // Prompt Repository used for storing and retrieving prompt data
	suggestRepo        domain.SuggestionsRepo // Suggestions Repository used for storing and retrieving suggested questions
	adminUsersRepo     domain.AdminUsersRepo // Admin Users Repository used for storing and retrieving admin users
	vectorStore        domain.VectorStore // Vector Store used for storing and retrieving vector data
	allowedEmails      []string // Allowed Emails used for restricting admin access
	frontendURL        string // Frontend URL used for redirecting after OAuth login
	settingsRepo       *sqlite.AdminSettingsRepo // Admin Settings Repository used for storing and retrieving admin settings
	cookieSameSiteNone bool // Cookie SameSite None used for setting the SameSite attribute of the refresh token cookie
	refreshCookiePath  string // Refresh Cookie Path used for setting the Path attribute of the refresh token cookie
}

// NewAdminHandler creates an AdminHandler with all required dependencies.
func NewAdminHandler(
	oauthSvc *auth.OAuthService, 
	jwtSvc *auth.JWTService,
	analyticsRepo domain.AnalyticsRepo,
	auditRepo domain.AuditRepo,
	documentRepo domain.DocumentRepo,
	promptRepo domain.PromptRepo,
	suggestRepo domain.SuggestionsRepo,
	adminUsersRepo domain.AdminUsersRepo,
	vectorStore domain.VectorStore,
	allowedEmails []string,
	frontendURL string,
	settingsRepo *sqlite.AdminSettingsRepo,
	cookieSameSiteNone bool,
	refreshCookiePath string,
) *AdminHandler {
	if frontendURL == "" {
		frontendURL = "http://localhost:4321/admin"
	}
	return &AdminHandler{
		oauthSvc:           oauthSvc,
		jwtSvc:             jwtSvc,
		analyticsRepo:      analyticsRepo,
		auditRepo:          auditRepo,
		documentRepo:       documentRepo,
		promptRepo:         promptRepo,
		suggestRepo:        suggestRepo,
		adminUsersRepo:     adminUsersRepo,
		vectorStore:        vectorStore,
		allowedEmails:      allowedEmails,
		frontendURL:        frontendURL,
		settingsRepo:       settingsRepo,
		cookieSameSiteNone: cookieSameSiteNone,
		refreshCookiePath:  refreshCookiePath,
	}
}

// ─── Auth Endpoints ─────────────────────────────────────────────────────────

// HandleLogin redirects to Google OAuth consent screen.
// GET /admin/auth/login
func (h *AdminHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	state := GenerateState()
	if !StoreState(state) {
		jsonError(w, "service_unavailable", "Too many pending login attempts, please try again later", http.StatusServiceUnavailable)
		return
	}

	authURL := h.oauthSvc.GetAuthURL(state)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stateResponse{URL: authURL})
}

// HandleCallback processes the OAuth callback and issues a JWT.
// GET /admin/auth/callback
func (h *AdminHandler) HandleCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	if !ValidateState(state) {
		writeAuthError(w, "Invalid or expired OAuth state", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		writeAuthError(w, "Missing authorization code", http.StatusBadRequest)
		return
	}

	accessToken, err := h.oauthSvc.ExchangeCode(r.Context(), code)
	if err != nil {
		slog.Error("OAuth code exchange failed", "error", err)
		writeAuthError(w, "Failed to exchange authorization code", http.StatusInternalServerError)
		return
	}

	userInfo, err := h.oauthSvc.GetUserInfo(r.Context(), accessToken)
	if err != nil {
		slog.Error("OAuth get user info failed", "error", err)
		writeAuthError(w, "Failed to get user info", http.StatusInternalServerError)
		return
	}

	if !CheckAdminAccess(r.Context(), userInfo.Email, h.allowedEmails, h.settingsRepo) {
		slog.Warn("OAuth login rejected: email not authorized", "email", userInfo.Email)
		writeAuthError(w, "Access denied: email not authorized", http.StatusForbidden)
		return
	}

	token, err := h.jwtSvc.GenerateToken(userInfo)
	if err != nil {
		slog.Error("JWT generation failed", "error", err)
		writeAuthError(w, "Failed to generate access token", http.StatusInternalServerError)
		return
	}

	refreshToken, err := h.jwtSvc.GenerateRefreshToken(userInfo)
	if err != nil {
		slog.Error("Refresh token generation failed", "error", err)
	}
	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: userInfo.Email,
				Action:     domain.ActionLogin,
				Target:     "oauth",
				IP:         realIP(r),
			})
		}()
	}

	slog.Info("Admin login successful", "email", userInfo.Email)

	if refreshToken != "" {
		sameSiteMode := http.SameSiteLaxMode
		if h.cookieSameSiteNone {
			sameSiteMode = http.SameSiteNoneMode
		}

		cookiePath := h.refreshCookiePath
		if cookiePath == "" {
			cookiePath = "/admin"
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    refreshToken,
			Path:     cookiePath,
			MaxAge:   30 * 24 * 3600,
			HttpOnly: true,
			Secure:   true,
			SameSite: sameSiteMode,
		})
	}

	redirectURL, err := url.Parse(h.frontendURL)
	if err != nil {
		slog.Error("Invalid frontend URL", "url", h.frontendURL, "error", err)
		writeAuthError(w, "Invalid redirect URL configured", http.StatusInternalServerError)
		return
	}
	redirectURL.Fragment = "token=" + token

	http.Redirect(w, r, redirectURL.String(), http.StatusFound)
}

// HandleRefreshToken exchanges a valid refresh token for a new access token.
// POST /admin/auth/refresh
func (h *AdminHandler) HandleRefreshToken(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil || cookie.Value == "" {
		jsonError(w, "missing_refresh_token", "No refresh token provided", http.StatusUnauthorized)
		return
	}

	claims, err := h.jwtSvc.ValidateRefreshToken(cookie.Value)
	if err != nil {
		jsonError(w, "invalid_refresh_token", "Refresh token is invalid or expired", http.StatusUnauthorized)
		return
	}

	if h.settingsRepo != nil && claims.JTI != "" {
		revoked, err := h.settingsRepo.IsJTIRevoked(r.Context(), claims.JTI)
		if err != nil {
			slog.Error("Failed to check refresh token revocation", "jti", claims.JTI, "error", err)
			jsonError(w, "server_error", "Failed to validate refresh token", http.StatusInternalServerError)
			return
		}
		if revoked {
			jsonError(w, "token_revoked", "Refresh token has been revoked", http.StatusUnauthorized)
			return
		}
	}

	if !CheckAdminAccess(r.Context(), claims.Email, h.allowedEmails, h.settingsRepo) {
		jsonError(w, "forbidden", "Email no longer authorized", http.StatusForbidden)
		return
	}

	newToken, err := h.jwtSvc.GenerateToken(&auth.GoogleUserInfo{
		Email: claims.Email,
		Name:  claims.Name,
	})
	if err != nil {
		jsonError(w, "token_error", "Failed to generate new access token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token":      newToken,
		"expires_in": "86400",
	})
}

// HandleLogout revokes the refresh token and clears the cookie.
// POST /admin/auth/logout
func (h *AdminHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	adminEmail := AdminEmailFromCtx(r.Context())
	if h.settingsRepo != nil {
		cookie, err := r.Cookie("refresh_token")
		if err == nil && cookie.Value != "" {
			claims, _ := h.jwtSvc.ValidateRefreshToken(cookie.Value)
			if claims != nil && claims.JTI != "" {
				if err := h.settingsRepo.RevokeJTI(context.Background(), claims.JTI, claims.ExpiresAt); err != nil {
					slog.Error("Failed to revoke JTI on logout", "jti", claims.JTI, "error", err)
				}
			}
		}
	}

	cookiePath := h.refreshCookiePath
	if cookiePath == "" {
		cookiePath = "/admin"
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     cookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
	})
	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: adminEmail,
				Action:     domain.ActionLogout,
				Target:     "session",
				IP:         realIP(r),
			})
		}()
	}

	slog.Info("Admin logout", "email", adminEmail)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "logged_out"})
}

// ─── Analytics Endpoints ────────────────────────────────────────────────────

// HandleAnalyticsSummary returns aggregated stats.
// GET /admin/analytics/summary?days=30
func (h *AdminHandler) HandleAnalyticsSummary(w http.ResponseWriter, r *http.Request) {
	days := queryInt(r, "days", 30)

	summary, err := h.analyticsRepo.Summary(r.Context(), days)
	if err != nil {
		slog.Error("Analytics summary failed", "error", err)
		jsonError(w, "db_error", "Failed to get analytics summary", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

// HandleDailyStats returns per-day analytics for charting.
// GET /admin/analytics/daily?days=30
func (h *AdminHandler) HandleDailyStats(w http.ResponseWriter, r *http.Request) {
	days := queryInt(r, "days", 30)

	stats, err := h.analyticsRepo.DailyStats(r.Context(), days)
	if err != nil {
		slog.Error("Daily stats failed", "error", err)
		jsonError(w, "db_error", "Failed to get daily stats", http.StatusInternalServerError)
		return
	}

	if stats == nil {
		stats = []domain.DailyStat{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// HandleTopQueries returns the most frequent queries.
// GET /admin/analytics/top-queries?days=30&limit=20
func (h *AdminHandler) HandleTopQueries(w http.ResponseWriter, r *http.Request) {
	days := queryInt(r, "days", 30)
	limit := queryInt(r, "limit", 20)

	queries, err := h.analyticsRepo.TopQueries(r.Context(), days, limit)
	if err != nil {
		slog.Error("Top queries failed", "error", err)
		jsonError(w, "db_error", "Failed to get top queries", http.StatusInternalServerError)
		return
	}

	if queries == nil {
		queries = []domain.TopQuery{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(queries)
}

// HandleFeedbackStats returns feedback ratio and counts.
// GET /admin/analytics/feedback?days=30
func (h *AdminHandler) HandleFeedbackStats(w http.ResponseWriter, r *http.Request) {
	days := queryInt(r, "days", 30)

	stats, err := h.analyticsRepo.FeedbackStats(r.Context(), days)
	if err != nil {
		slog.Error("Feedback stats failed", "error", err)
		jsonError(w, "db_error", "Failed to get feedback stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// HandleExportCSV exports analytics data as CSV.
// GET /admin/analytics/export/csv?days=30
func (h *AdminHandler) HandleExportCSV(w http.ResponseWriter, r *http.Request) {
	days := queryInt(r, "days", 30)
	limit := queryInt(r, "limit", 1000)
	if limit > 10000 {
		limit = 10000
	}

	rows, err := h.analyticsRepo.RecentQueries(r.Context(), days, limit)
	if err != nil {
		slog.Error("CSV export failed", "error", err)
		jsonError(w, "db_error", "Failed to export analytics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="analytics_export.csv"`)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte{0xEF, 0xBB, 0xBF})
	fmt.Fprintf(w, "query_hash,language,response_ms,sources_cnt,feedback,is_blocked,created_at\n")

	for _, q := range rows {
		fmt.Fprintf(w, "%s,%s,%d,%d,%d,%d,%s\n",
			q.QueryHash, q.Language, q.ResponseMs, q.SourcesCnt, q.Feedback, q.IsBlocked, q.CreatedAt)
	}
}

// HandleRecentQueries returns individual query rows for admin inspection.
// GET /admin/queries?days=30&limit=50
func (h *AdminHandler) HandleRecentQueries(w http.ResponseWriter, r *http.Request) {
	days := queryInt(r, "days", 30)
	limit := queryInt(r, "limit", 50)
	if limit > 500 {
		limit = 500
	}

	queries, err := h.analyticsRepo.RecentQueries(r.Context(), days, limit)
	if err != nil {
		slog.Error("Recent queries failed", "error", err)
		jsonError(w, "db_error", "Failed to get recent queries", http.StatusInternalServerError)
		return
	}
	if queries == nil {
		queries = []domain.QueryRow{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(queries)
}

// ─── Document Endpoints ─────────────────────────────────────────────────────

// HandleListDocuments returns all knowledge base documents.
// GET /admin/documents
func (h *AdminHandler) HandleListDocuments(w http.ResponseWriter, r *http.Request) {
	docs, err := h.documentRepo.List(r.Context())
	if err != nil {
		slog.Error("List documents failed", "error", err)
		jsonError(w, "db_error", "Failed to list documents", http.StatusInternalServerError)
		return
	}

	if docs == nil {
		docs = []domain.DocumentRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docs)
}

// HandleDownloadDocument serves the raw document file.
// GET /admin/documents/{id}/download
func (h *AdminHandler) HandleDownloadDocument(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "id")
	doc, err := h.documentRepo.GetByID(r.Context(), docID)
	if err != nil {
		jsonError(w, "not_found", "Document not found", http.StatusNotFound)
		return
	}

	docsDir, err := filepath.Abs(filepath.Join(".", "data", "documents"))
	if err != nil {
		slog.Error("HandleDownloadDocument: cannot resolve docsDir", "error", err)
		jsonError(w, "server_error", "Internal server error", http.StatusInternalServerError)
		return
	}

	ext := filepath.Ext(doc.Filename)
	filePath := filepath.Clean(filepath.Join(docsDir, docID+strings.ToLower(ext)))

	if !strings.HasPrefix(filePath, docsDir+string(filepath.Separator)) {
		slog.Error("HandleDownloadDocument: path traversal attempt",
			"docID", docID, "filename", doc.Filename, "resolved", filePath)
		jsonError(w, "forbidden", "Invalid document path", http.StatusForbidden)
		return
	}

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		jsonError(w, "file_missing", "The raw file is not available on the server", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Disposition", `inline; filename="`+doc.Filename+`"`)
	http.ServeFile(w, r, filePath)
}

// HandleRenameDocument updates a document's filename.
// PATCH /admin/documents/{id}/rename
func (h *AdminHandler) HandleRenameDocument(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "id")

	var req struct {
		Filename string `json:"filename"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Filename == "" {
		jsonError(w, "bad_request", "Valid filename is required", http.StatusBadRequest)
		return
	}

	if err := h.documentRepo.Rename(r.Context(), docID, req.Filename); err != nil {
		slog.Error("Rename document failed", "error", err)
		jsonError(w, "db_error", "Failed to rename document", http.StatusInternalServerError)
		return
	}

	if h.vectorStore != nil {
		if err := h.vectorStore.RenameDocumentPayload(r.Context(), docID, req.Filename); err != nil {
			slog.Error("Qdrant rename payload failed", "error", err)
		}
	}

	if h.auditRepo != nil {
		adminEmail := AdminEmailFromCtx(r.Context())
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: adminEmail,
				Action:     domain.ActionRenameDocument,
				Target:     fmt.Sprintf("ID: %s, New Name: %s", docID, req.Filename),
				IP:         realIP(r),
			})
		}()
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// ─── Audit Log Endpoint ─────────────────────────────────────────────────────

// HandleAuditLog returns paginated admin audit entries.
// GET /admin/audit?offset=0&limit=50
func (h *AdminHandler) HandleAuditLog(w http.ResponseWriter, r *http.Request) {
	offset := queryInt(r, "offset", 0)
	limit := queryInt(r, "limit", 50)

	entries, total, err := h.auditRepo.List(r.Context(), offset, limit)
	if err != nil {
		slog.Error("Audit log failed", "error", err)
		jsonError(w, "db_error", "Failed to get audit log", http.StatusInternalServerError)
		return
	}

	if entries == nil {
		entries = []domain.AuditEntry{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"entries": entries,
		"total":   total,
		"offset":  offset,
		"limit":   limit,
	})
}

// ─── Prompt Variants Endpoints (A/B Testing) ────────────────────────────────

// HandleListPrompts returns all prompt variants.
// GET /admin/prompts
func (h *AdminHandler) HandleListPrompts(w http.ResponseWriter, r *http.Request) {
	variants, err := h.promptRepo.List(r.Context())
	if err != nil {
		jsonError(w, "db_error", "Failed to list prompt variants", http.StatusInternalServerError)
		return
	}
	if variants == nil {
		variants = []domain.PromptVariant{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(variants)
}

// HandleCreatePrompt creates a new prompt variant.
// POST /admin/prompts
func (h *AdminHandler) HandleCreatePrompt(w http.ResponseWriter, r *http.Request) {
	var variant domain.PromptVariant
	if err := json.NewDecoder(r.Body).Decode(&variant); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if variant.Name == "" || variant.PromptText == "" {
		jsonError(w, "validation_error", "name and prompt_text are required", http.StatusBadRequest)
		return
	}

	if variant.Language == "" {
		variant.Language = domain.LangUk
	}

	if err := h.promptRepo.Create(r.Context(), &variant); err != nil {
		jsonError(w, "db_error", "Failed to create prompt variant", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(variant)
}

// HandleTogglePromptActive toggles is_active for a prompt.
// PATCH /admin/prompts/{id}/active
func (h *AdminHandler) HandleTogglePromptActive(w http.ResponseWriter, r *http.Request) {
	promptID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		jsonError(w, "invalid_id", "Invalid prompt ID", http.StatusBadRequest)
		return
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := h.promptRepo.SetActive(r.Context(), promptID, req.IsActive); err != nil {
		jsonError(w, "db_error", "Failed to update prompt status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// HandleUpdatePrompt updates the prompt_text.
// PATCH /admin/prompts/{id}
func (h *AdminHandler) HandleUpdatePrompt(w http.ResponseWriter, r *http.Request) {
	promptID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		jsonError(w, "invalid_id", "Invalid prompt ID", http.StatusBadRequest)
		return
	}

	var req struct {
		PromptText string `json:"prompt_text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PromptText == "" {
		jsonError(w, "invalid_request", "Invalid JSON body or empty text", http.StatusBadRequest)
		return
	}

	if err := h.promptRepo.Update(r.Context(), promptID, req.PromptText); err != nil {
		jsonError(w, "db_error", "Failed to update prompt", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// HandleDeletePrompt deletes a prompt completely.
// DELETE /admin/prompts/{id}
func (h *AdminHandler) HandleDeletePrompt(w http.ResponseWriter, r *http.Request) {
	promptID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		jsonError(w, "invalid_id", "Invalid prompt ID", http.StatusBadRequest)
		return
	}

	if err := h.promptRepo.Delete(r.Context(), promptID); err != nil {
		jsonError(w, "db_error", "Failed to delete prompt", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// ─── Suggestions Endpoints ──────────────────────────────────────────────────

// HandleListSuggestions returns suggested questions for a language.
// GET /admin/suggestions?lang=uk&limit=5
// Also used publicly via /api/v1/suggestions
func (h *AdminHandler) HandleListSuggestions(w http.ResponseWriter, r *http.Request) {
	lang := domain.Language(r.URL.Query().Get("lang"))
	if lang != domain.LangUk && lang != domain.LangEn {
		lang = domain.LangUk
	}
	limit := queryInt(r, "limit", 5)

	questions, err := h.suggestRepo.List(r.Context(), lang, limit)
	if err != nil {
		jsonError(w, "db_error", "Failed to list suggestions", http.StatusInternalServerError)
		return
	}

	if len(questions) == 0 {
		if lang == domain.LangEn {
			questions = []domain.SuggestedQuestion{
				{ID: -1, Question: "What specialties are available?", Language: lang},
				{ID: -2, Question: "How much is the tuition?", Language: lang},
				{ID: -3, Question: "What documents are required?", Language: lang},
			}
		} else {
			questions = []domain.SuggestedQuestion{
				{ID: -1, Question: "Які спеціальності доступні?", Language: lang},
				{ID: -2, Question: "Яка вартість навчання?", Language: lang},
				{ID: -3, Question: "Які документи потрібні для вступу?", Language: lang},
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

// HandleCreateSuggestion creates a new suggested question.
// POST /admin/suggestions
func (h *AdminHandler) HandleCreateSuggestion(w http.ResponseWriter, r *http.Request) {
	var q domain.SuggestedQuestion
	if err := json.NewDecoder(r.Body).Decode(&q); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if q.Question == "" {
		jsonError(w, "validation_error", "question is required", http.StatusBadRequest)
		return
	}

	if q.Language == "" {
		q.Language = domain.LangUk
	}

	if err := h.suggestRepo.Upsert(r.Context(), &q); err != nil {
		jsonError(w, "db_error", "Failed to create suggestion", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(q)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

func queryInt(r *http.Request, key string, defaultVal int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil || v < 0 {
		return defaultVal
	}
	return v
}

// ─── Admin User Management Endpoints ────────────────────────────────────────
// HandleListAdmins returns the list of all registered administrators.
// GET /admin/admins
func (h *AdminHandler) HandleListAdmins(w http.ResponseWriter, r *http.Request) {
	if h.adminUsersRepo == nil {
		jsonError(w, "not_configured", "Admin management not available", http.StatusInternalServerError)
		return
	}

	admins, err := h.adminUsersRepo.List(r.Context())
	if err != nil {
		slog.Error("List admins failed", "error", err)
		jsonError(w, "db_error", "Failed to list admins", http.StatusInternalServerError)
		return
	}
	if admins == nil {
		admins = []domain.AdminUser{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(admins)
}

// HandleAddAdmin registers a new administrator.
// POST /admin/admins
// Body: {"email": "new@admin.com"}
func (h *AdminHandler) HandleAddAdmin(w http.ResponseWriter, r *http.Request) {
	if h.adminUsersRepo == nil {
		jsonError(w, "not_configured", "Admin management not available", http.StatusInternalServerError)
		return
	}

	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || !strings.Contains(req.Email, "@") || !strings.Contains(req.Email[strings.Index(req.Email, "@"):], ".") {
		jsonError(w, "validation_error", "Valid email is required", http.StatusBadRequest)
		return
	}

	callerEmail := AdminEmailFromCtx(r.Context())

	admin, err := h.adminUsersRepo.Add(r.Context(), req.Email, callerEmail)
	if err != nil {
		if err == domain.ErrAdminAlreadyExists {
			jsonError(w, "already_exists", "This email is already an administrator", http.StatusConflict)
			return
		}
		slog.Error("Add admin failed", "error", err, "email", req.Email)
		jsonError(w, "db_error", "Failed to add administrator", http.StatusInternalServerError)
		return
	}

	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: callerEmail,
				Action:     domain.ActionAddAdmin,
				Target:     req.Email,
				IP:         realIP(r),
			})
		}()
	}

	slog.Info("Admin added", "email", req.Email, "by", callerEmail)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(admin)
}

// HandleRemoveAdmin removes an administrator.
// DELETE /admin/admins/{email}
func (h *AdminHandler) HandleRemoveAdmin(w http.ResponseWriter, r *http.Request) {
	if h.adminUsersRepo == nil {
		jsonError(w, "not_configured", "Admin management not available", http.StatusInternalServerError)
		return
	}

	targetEmail := chi.URLParam(r, "email")
	if targetEmail == "" {
		jsonError(w, "missing_email", "Email parameter is required", http.StatusBadRequest)
		return
	}

	callerEmail := AdminEmailFromCtx(r.Context())

	if strings.EqualFold(targetEmail, callerEmail) {
		jsonError(w, "cannot_self_remove", "You cannot remove yourself from admins", http.StatusBadRequest)
		return
	}

	if err := h.adminUsersRepo.Delete(r.Context(), targetEmail); err != nil {
		if err == domain.ErrAdminNotFound {
			jsonError(w, "not_found", "Admin user not found", http.StatusNotFound)
			return
		}
		slog.Error("Remove admin failed", "error", err, "email", targetEmail)
		jsonError(w, "db_error", "Failed to remove administrator", http.StatusInternalServerError)
		return
	}

	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: callerEmail,
				Action:     domain.ActionRemoveAdmin,
				Target:     targetEmail,
				IP:         realIP(r),
			})
		}()
	}

	slog.Info("Admin removed", "email", targetEmail, "by", callerEmail)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "removed", "email": targetEmail})
}
