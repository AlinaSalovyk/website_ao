package http

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"university-chatbot/backend/internal/domain"
)

type mockMailer struct {
	lastTo string
	lastURL string
}

func (m *mockMailer) SendInvitation(ctx context.Context, to string, role domain.Role, inviteURL string, expiresAt time.Time) error {
	m.lastTo = to
	m.lastURL = inviteURL
	return nil
}

func TestRequireRole_RBACMatrix(t *testing.T) {
	tests := []struct {
		name         string
		role         domain.Role
		allowedRoles []domain.Role
		wantStatus   int
	}{
		{"SuperAdmin on News", domain.RoleSuperAdmin, []domain.Role{domain.RoleNewsEditor}, http.StatusOK},
		{"SuperAdmin on Chatbot", domain.RoleSuperAdmin, []domain.Role{domain.RoleChatbotAdmin}, http.StatusOK},
		{"SuperAdmin on Admins", domain.RoleSuperAdmin, []domain.Role{domain.RoleSuperAdmin}, http.StatusOK},

		{"NewsEditor on News", domain.RoleNewsEditor, []domain.Role{domain.RoleNewsEditor}, http.StatusOK},
		{"NewsEditor on Chatbot", domain.RoleNewsEditor, []domain.Role{domain.RoleChatbotAdmin}, http.StatusForbidden},
		{"NewsEditor on Admins", domain.RoleNewsEditor, []domain.Role{domain.RoleSuperAdmin}, http.StatusForbidden},

		{"ChatbotAdmin on Chatbot", domain.RoleChatbotAdmin, []domain.Role{domain.RoleChatbotAdmin}, http.StatusOK},
		{"ChatbotAdmin on News", domain.RoleChatbotAdmin, []domain.Role{domain.RoleNewsEditor}, http.StatusForbidden},
		{"ChatbotAdmin on Admins", domain.RoleChatbotAdmin, []domain.Role{domain.RoleSuperAdmin}, http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := RequireRole(tt.allowedRoles...)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest("GET", "/test", nil)
			user := &domain.AdminUser{
				Email:  "test@example.com",
				Role:   tt.role,
				Status: domain.AdminStatusActive,
			}
			ctx := context.WithValue(req.Context(), adminUserKey, user)
			req = req.WithContext(ctx)

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if rr.Code != tt.wantStatus {
				t.Errorf("Role %s on allowed %v got status %d, want %d", tt.role, tt.allowedRoles, rr.Code, tt.wantStatus)
			}
		})
	}
}

func TestTokenGenerationAndHashing(t *testing.T) {
	raw1 := generateSecureToken()
	raw2 := generateSecureToken()

	if len(raw1) < 32 {
		t.Errorf("Expected token entropy length >= 32, got %d", len(raw1))
	}
	if raw1 == raw2 {
		t.Errorf("Tokens must be unique and non-deterministic")
	}

	hash1 := hashToken(raw1)
	hash2 := hashToken(raw1)
	if hash1 != hash2 {
		t.Errorf("Token hash must be deterministic for same token")
	}
	if hash1 == raw1 {
		t.Errorf("Token hash must not match raw token")
	}
}
