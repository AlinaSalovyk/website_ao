package http

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
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

const (
	adminUserKey  contextKey = "admin_user"
	adminEmailKey contextKey = "admin_email"
)

// DualAuthMiddleware creates a chi middleware that authenticates admin requests
// using either JWT (Bearer token via Authorization header) or static admin token
// (X-Admin-Token header). Enforces account active status and attaches AdminUser to context.
func DualAuthMiddleware(jwtSvc *auth.JWTService, adminToken string, legacyTokenEnabled bool, allowedEmails []string, settings *sqlite.AdminSettingsRepo, adminUsersRepo domain.AdminUsersRepo) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var email string
			authed := false

			if authHeader := r.Header.Get("Authorization"); strings.HasPrefix(authHeader, "Bearer ") {
				tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
				claims, err := jwtSvc.ValidateToken(tokenStr)
				if err == nil {
					email = claims.Email
					authed = true
				} else {
					slog.Debug("JWT validation via header failed", "error", err)
				}
			} else {
				cookie, err := r.Cookie("admin_token")
				if err == nil && cookie.Value != "" {
					claims, err := jwtSvc.ValidateToken(cookie.Value)
					if err == nil {
						email = claims.Email
						authed = true
					} else {
						slog.Debug("JWT validation via cookie failed", "error", err)
					}
				}
			}

			if authed {
				email = strings.ToLower(strings.TrimSpace(email))
				var adminUser *domain.AdminUser

				if adminUsersRepo != nil {
					user, err := adminUsersRepo.GetByEmail(r.Context(), email)
					if err == nil {
						adminUser = user
					} else if errors.Is(err, domain.ErrAdminNotFound) {
						if CheckBootstrapAccess(r.Context(), email, allowedEmails, adminUsersRepo) {
							// Auto-bootstrap as initial super_admin on empty DB
							newAdmin, err := adminUsersRepo.Add(r.Context(), email, domain.RoleSuperAdmin, domain.AdminStatusActive, "system")
							if err == nil {
								adminUser = newAdmin
							}
						}
					}
				} else if isEmailAllowed(email, allowedEmails) {
					adminUser = &domain.AdminUser{
						Email:  email,
						Role:   domain.RoleSuperAdmin,
						Status: domain.AdminStatusActive,
					}
				}

				if adminUser == nil {
					jsonError(w, "forbidden", "Email not authorized", http.StatusForbidden)
					return
				}

				if adminUser.Status == domain.AdminStatusDisabled {
					jsonError(w, "forbidden", "Обліковий запис деактивовано", http.StatusForbidden)
					return
				}

				ctx := context.WithValue(r.Context(), adminEmailKey, email)
				ctx = context.WithValue(ctx, adminUserKey, adminUser)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			token := r.Header.Get("X-Admin-Token")
			if token != "" {
				if !legacyTokenEnabled {
					jsonError(w, "forbidden", "Legacy static token authentication is disabled", http.StatusForbidden)
					return
				}
				if adminToken != "" && subtle.ConstantTimeCompare([]byte(token), []byte(adminToken)) == 1 {
					systemEmail := "system@token-auth"
					if len(allowedEmails) > 0 && allowedEmails[0] != "" {
						systemEmail = allowedEmails[0]
					}

					var adminUser *domain.AdminUser
					if adminUsersRepo != nil {
						user, err := adminUsersRepo.GetByEmail(r.Context(), systemEmail)
						if err == nil {
							adminUser = user
						} else if errors.Is(err, domain.ErrAdminNotFound) {
							newAdmin, err := adminUsersRepo.Add(r.Context(), systemEmail, domain.RoleSuperAdmin, domain.AdminStatusActive, "system")
							if err == nil {
								adminUser = newAdmin
							}
						}
					}

					if adminUser == nil {
						adminUser = &domain.AdminUser{
							Email:  systemEmail,
							Role:   domain.RoleSuperAdmin,
							Status: domain.AdminStatusActive,
						}
					}

					if adminUser.Status == domain.AdminStatusDisabled {
						jsonError(w, "forbidden", "Обліковий запис деактивовано", http.StatusForbidden)
						return
					}

					ctx := context.WithValue(r.Context(), adminEmailKey, adminUser.Email)
					ctx = context.WithValue(ctx, adminUserKey, adminUser)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			jsonError(w, "unauthorized", "Valid JWT or Admin-Token required", http.StatusUnauthorized)
		})
	}
}

// AdminUserFromCtx extracts the AdminUser struct from request context.
func AdminUserFromCtx(ctx context.Context) *domain.AdminUser {
	if u, ok := ctx.Value(adminUserKey).(*domain.AdminUser); ok && u != nil {
		return u
	}
	return nil
}

// RequireRole creates a middleware enforcing that the authenticated admin possesses one of the allowed roles.
// super_admin always bypasses role checks.
func RequireRole(allowedRoles ...domain.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			u := AdminUserFromCtx(r.Context())
			if u == nil {
				jsonError(w, "unauthorized", "Авторизація обов'язкова", http.StatusUnauthorized)
				return
			}
			if u.Role == domain.RoleSuperAdmin {
				next.ServeHTTP(w, r)
				return
			}
			for _, role := range allowedRoles {
				if u.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			jsonError(w, "forbidden", "У вас немає доступу до цього розділу.", http.StatusForbidden)
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

// CheckBootstrapAccess verifies whether an email is permitted to initialize the initial super_admin.
// BOOTSTRAP ONLY semantics: allowed ONLY when the admin_users table is completely empty (0 users).
func CheckBootstrapAccess(ctx context.Context, email string, allowedEmails []string, adminUsersRepo domain.AdminUsersRepo) bool {
	if adminUsersRepo == nil || len(allowedEmails) == 0 {
		return false
	}
	count, err := adminUsersRepo.CountTotal(ctx)
	if err != nil || count > 0 {
		return false // Bootstrap complete or error — strictly reject auto-minting
	}
	return isEmailAllowed(email, allowedEmails)
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
	createdAt   time.Time // Time when the CSRF state token was created
	inviteToken string    // Optional invitation raw token
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

// StoreState stores a CSRF state token in the store with an optional invite token.
func StoreState(state string, inviteToken ...string) bool {
	csrfStoreMu.Lock()
	defer csrfStoreMu.Unlock()
	if len(csrfStore) >= csrfStoreMaxSize {
		return false
	}
	inv := ""
	if len(inviteToken) > 0 {
		inv = inviteToken[0]
	}
	csrfStore[state] = csrfEntry{createdAt: time.Now(), inviteToken: inv}
	return true
}

// ValidateStateWithInvite validates a CSRF state token and returns whether valid and its invite token.
func ValidateStateWithInvite(state string) (bool, string) {
	csrfStoreMu.Lock()
	defer csrfStoreMu.Unlock()
	entry, ok := csrfStore[state]
	if !ok {
		return false, ""
	}

	if time.Since(entry.createdAt) > csrfStateTTL {
		delete(csrfStore, state)
		return false, ""
	}
	delete(csrfStore, state)
	return true, entry.inviteToken
}

// ValidateState validates a CSRF state token.
func ValidateState(state string) bool {
	valid, _ := ValidateStateWithInvite(state)
	return valid
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
