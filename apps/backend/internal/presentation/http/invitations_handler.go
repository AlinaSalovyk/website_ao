package http

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"university-chatbot/backend/internal/domain"
)

// HandleGetMe returns the authenticated admin profile.
// GET /admin/me
func (h *AdminHandler) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	user := AdminUserFromCtx(r.Context())
	if user == nil {
		jsonError(w, "unauthorized", "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// HandleListInvitations returns pending admin invitations.
// GET /admin/invitations
func (h *AdminHandler) HandleListInvitations(w http.ResponseWriter, r *http.Request) {
	if h.invitationsRepo == nil {
		jsonError(w, "not_configured", "Invitations system not available", http.StatusInternalServerError)
		return
	}

	invites, err := h.invitationsRepo.ListPending(r.Context())
	if err != nil {
		slog.Error("List pending invitations failed", "error", err)
		jsonError(w, "db_error", "Failed to list invitations", http.StatusInternalServerError)
		return
	}
	if invites == nil {
		invites = []domain.AdminInvitation{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invites)
}

// HandleCreateInvitation creates a secure invitation and dispatches the invitation email.
// POST /admin/invitations
// Body: {"email": "user@example.com", "role": "news_editor"}
func (h *AdminHandler) HandleCreateInvitation(w http.ResponseWriter, r *http.Request) {
	if h.invitationsRepo == nil || h.mailer == nil {
		jsonError(w, "not_configured", "Invitations system not available", http.StatusInternalServerError)
		return
	}

	var req struct {
		Email string      `json:"email"`
		Role  domain.Role `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || !strings.Contains(req.Email, "@") {
		jsonError(w, "validation_error", "Вкажіть коректну електронну адресу", http.StatusBadRequest)
		return
	}

	if !strings.HasSuffix(req.Email, "@oa.edu.ua") {
		jsonError(w, "validation_error", "Запрошення дозволені тільки для електронних адрес домену @oa.edu.ua", http.StatusBadRequest)
		return
	}

	if req.Role != domain.RoleNewsEditor && req.Role != domain.RoleChatbotAdmin {
		jsonError(w, "validation_error", "Запрошення ролі super_admin заборонено. Дозволено лише news_editor або chatbot_admin", http.StatusBadRequest)
		return
	}

	// 1. Check if email is already an active admin user
	if h.adminUsersRepo != nil {
		existing, err := h.adminUsersRepo.GetByEmail(r.Context(), req.Email)
		if err == nil && existing != nil {
			if existing.Status == domain.AdminStatusActive {
				jsonError(w, "already_exists", "Адміністратор з цією електронною адресою вже існує.", http.StatusConflict)
				return
			}
		}
	}

	// 2. Check if active pending invitation already exists
	pending, err := h.invitationsRepo.GetPendingByEmail(r.Context(), req.Email)
	if err == nil && pending != nil {
		jsonError(w, "invite_pending", "Для цієї адреси вже є активне запрошення.", http.StatusConflict)
		return
	}

	callerEmail := AdminEmailFromCtx(r.Context())
	rawToken := generateSecureToken()
	tokenHash := hashToken(rawToken)

	ttl := h.invitationTTL
	if ttl <= 0 {
		jsonError(w, "server_error", "ADMIN_INVITATION_TTL is not configured", http.StatusInternalServerError)
		return
	}
	now := time.Now().UTC()
	expiresAt := now.Add(ttl)

	inv := &domain.AdminInvitation{
		ID:               uuid.NewString(),
		Email:            req.Email,
		Role:             req.Role,
		TokenHash:        tokenHash,
		InvitedByAdminID: callerEmail,
		CreatedAt:        now,
		ExpiresAt:        expiresAt,
		LastSentAt:       nil,
		DeliveryStatus:   domain.DeliveryStatusPending,
	}

	// 1. Persist invitation in DB FIRST with pending delivery status.
	if err := h.invitationsRepo.Create(r.Context(), inv); err != nil {
		if errors.Is(err, domain.ErrInvitePending) {
			jsonError(w, "invite_pending", "Для цієї адреси вже є активне запрошення.", http.StatusConflict)
			return
		}
		slog.Error("Create invitation record failed", "error", err, "email", req.Email)
		jsonError(w, "db_error", "Не вдалося створити запрошення", http.StatusInternalServerError)
		return
	}

	publicBase := strings.TrimRight(h.publicBaseURL, "/")
	inviteURL := fmt.Sprintf("%s/admin/invite/accept?token=%s", publicBase, rawToken)

	// 2. Dispatch email via SMTP after invitation DB record exists.
	if err := h.mailer.SendInvitation(r.Context(), req.Email, req.Role, inviteURL, expiresAt); err != nil {
		slog.Error("Failed to send invitation email via SMTP", "error", err, "to", req.Email)
		if updateErr := h.invitationsRepo.UpdateDeliveryStatus(r.Context(), inv.ID, domain.DeliveryStatusDeliveryFailed); updateErr != nil {
			slog.Error("Failed to update invitation status to delivery_failed", "error", updateErr, "id", inv.ID)
		}
		inv.DeliveryStatus = domain.DeliveryStatusDeliveryFailed
		jsonError(w, "invitation_email_delivery_failed", "Не вдалося надіслати лист із запрошенням. Перевірте налаштування поштового сервера.", http.StatusInternalServerError)
		return
	}

	// 3. Mark delivery status sent on SMTP acceptance and populate last_sent_at.
	nowSent := time.Now().UTC()
	if updateErr := h.invitationsRepo.UpdateDeliveryStatus(r.Context(), inv.ID, domain.DeliveryStatusSent); updateErr != nil {
		slog.Error("Failed to update invitation status to sent", "error", updateErr, "id", inv.ID)
	}
	inv.DeliveryStatus = domain.DeliveryStatusSent
	inv.LastSentAt = &nowSent

	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: callerEmail,
				Action:     domain.AdminAction("admin.invite.created"),
				Target:     req.Email,
				Details:    fmt.Sprintf("role=%s", req.Role),
				IP:         realIP(r),
			})
		}()
	}

	slog.Info("Invitation created and sent", "email", req.Email, "role", req.Role, "by", callerEmail)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"invitation": inv,
		"invite_url": inviteURL, // included for local developer convenience
	})
}

// HandleResendInvitation invalidates the old token, issues a new secure token, updates DB first, then resends email.
// POST /admin/invitations/{id}/resend
func (h *AdminHandler) HandleResendInvitation(w http.ResponseWriter, r *http.Request) {
	if h.invitationsRepo == nil || h.mailer == nil {
		jsonError(w, "not_configured", "Invitations system not available", http.StatusInternalServerError)
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		jsonError(w, "missing_id", "ID parameter is required", http.StatusBadRequest)
		return
	}

	inv, err := h.invitationsRepo.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrInviteNotFound) {
			jsonError(w, "not_found", "Запрошення не знайдено", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to fetch invitation", http.StatusInternalServerError)
		return
	}

	if inv.AcceptedAt != nil || inv.RevokedAt != nil {
		jsonError(w, "invalid_state", "Запрошення вже використане або анульоване", http.StatusBadRequest)
		return
	}

	callerEmail := AdminEmailFromCtx(r.Context())
	rawToken := generateSecureToken()
	tokenHash := hashToken(rawToken)

	ttl := h.invitationTTL
	if ttl <= 0 {
		jsonError(w, "server_error", "ADMIN_INVITATION_TTL is not configured", http.StatusInternalServerError)
		return
	}
	expiresAt := time.Now().UTC().Add(ttl)

	// 1. Update token, expiration, and status to pending in DB FIRST.
	if err := h.invitationsRepo.UpdateTokenAndExpiry(r.Context(), id, tokenHash, expiresAt, domain.DeliveryStatusPending); err != nil {
		slog.Error("Resend invitation update failed", "error", err, "id", id)
		jsonError(w, "db_error", "Failed to update invitation token", http.StatusInternalServerError)
		return
	}

	publicBase := strings.TrimRight(h.publicBaseURL, "/")
	inviteURL := fmt.Sprintf("%s/admin/invite/accept?token=%s", publicBase, rawToken)

	// 2. Dispatch email via SMTP after token replacement is persisted in DB.
	if err := h.mailer.SendInvitation(r.Context(), inv.Email, inv.Role, inviteURL, expiresAt); err != nil {
		slog.Error("Failed to resend invitation email via SMTP", "error", err, "to", inv.Email)
		if updateErr := h.invitationsRepo.UpdateDeliveryStatus(r.Context(), id, domain.DeliveryStatusDeliveryFailed); updateErr != nil {
			slog.Error("Failed to update invitation status to delivery_failed", "error", updateErr, "id", id)
		}
		jsonError(w, "invitation_email_delivery_failed", "Не вдалося надіслати повторне запрошення. Перевірте налаштування поштового сервера.", http.StatusInternalServerError)
		return
	}

	// 3. Update status to sent on SMTP acceptance.
	if updateErr := h.invitationsRepo.UpdateDeliveryStatus(r.Context(), id, domain.DeliveryStatusSent); updateErr != nil {
		slog.Error("Failed to update invitation status to sent", "error", updateErr, "id", id)
	}

	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: callerEmail,
				Action:     domain.AdminAction("admin.invite.resent"),
				Target:     inv.Email,
				IP:         realIP(r),
			})
		}()
	}

	slog.Info("Invitation resent", "email", inv.Email, "by", callerEmail)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":     "resent",
		"invite_url": inviteURL,
	})
}

// HandleRevokeInvitation revokes a pending invitation.
// POST /admin/invitations/{id}/revoke
func (h *AdminHandler) HandleRevokeInvitation(w http.ResponseWriter, r *http.Request) {
	if h.invitationsRepo == nil {
		jsonError(w, "not_configured", "Invitations system not available", http.StatusInternalServerError)
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		jsonError(w, "missing_id", "ID parameter is required", http.StatusBadRequest)
		return
	}

	callerEmail := AdminEmailFromCtx(r.Context())
	if err := h.invitationsRepo.MarkRevoked(r.Context(), id); err != nil {
		if errors.Is(err, domain.ErrInviteNotFound) {
			jsonError(w, "not_found", "Запрошення не знайдено або вже неактивне", http.StatusNotFound)
			return
		}
		slog.Error("Revoke invitation failed", "error", err, "id", id)
		jsonError(w, "db_error", "Failed to revoke invitation", http.StatusInternalServerError)
		return
	}

	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: callerEmail,
				Action:     domain.AdminAction("admin.invite.revoked"),
				Target:     id,
				IP:         realIP(r),
			})
		}()
	}

	slog.Info("Invitation revoked", "id", id, "by", callerEmail)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "revoked", "id": id})
}

// HandleUpdateAdminRole updates an existing admin user's role.
// PATCH /admin/admins/{email}/role
// Body: {"role": "news_editor"}
func (h *AdminHandler) HandleUpdateAdminRole(w http.ResponseWriter, r *http.Request) {
	if h.adminUsersRepo == nil {
		jsonError(w, "not_configured", "Admin management not available", http.StatusInternalServerError)
		return
	}

	rawEmail := chi.URLParam(r, "email")
	if rawEmail == "" {
		jsonError(w, "missing_email", "Email parameter is required", http.StatusBadRequest)
		return
	}
	targetEmail, _ := url.QueryUnescape(rawEmail)
	targetEmail = strings.ToLower(strings.TrimSpace(targetEmail))

	var req struct {
		Role domain.Role `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if req.Role != domain.RoleSuperAdmin && req.Role != domain.RoleNewsEditor && req.Role != domain.RoleChatbotAdmin {
		jsonError(w, "validation_error", "Недійсне значення ролі", http.StatusBadRequest)
		return
	}

	existing, err := h.adminUsersRepo.GetByEmail(r.Context(), targetEmail)
	if err != nil {
		if errors.Is(err, domain.ErrAdminNotFound) {
			jsonError(w, "not_found", "Адміністратора не знайдено", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to get admin user", http.StatusInternalServerError)
		return
	}

	// Invariant check: prevent demoting the last active super_admin
	if existing.Role == domain.RoleSuperAdmin && req.Role != domain.RoleSuperAdmin {
		count, err := h.adminUsersRepo.CountActiveSuperAdmins(r.Context())
		if err == nil && count <= 1 {
			jsonError(w, "last_super_admin", "Система повинна мати принаймні одного активного головного адміністратора (super_admin)", http.StatusBadRequest)
			return
		}
	}

	callerEmail := AdminEmailFromCtx(r.Context())
	if err := h.adminUsersRepo.UpdateRole(r.Context(), targetEmail, req.Role); err != nil {
		slog.Error("Update admin role failed", "error", err, "email", targetEmail)
		jsonError(w, "db_error", "Failed to update admin role", http.StatusInternalServerError)
		return
	}

	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: callerEmail,
				Action:     domain.AdminAction("admin.role.changed"),
				Target:     targetEmail,
				Details:    fmt.Sprintf("old_role=%s, new_role=%s", existing.Role, req.Role),
				IP:         realIP(r),
			})
		}()
	}

	existing.Role = req.Role
	slog.Info("Admin role updated", "email", targetEmail, "new_role", req.Role, "by", callerEmail)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existing)
}

// HandleUpdateAdminStatus enables or disables an admin account.
// PATCH /admin/admins/{email}/status
// Body: {"status": "disabled"}
func (h *AdminHandler) HandleUpdateAdminStatus(w http.ResponseWriter, r *http.Request) {
	if h.adminUsersRepo == nil {
		jsonError(w, "not_configured", "Admin management not available", http.StatusInternalServerError)
		return
	}

	rawEmail := chi.URLParam(r, "email")
	if rawEmail == "" {
		jsonError(w, "missing_email", "Email parameter is required", http.StatusBadRequest)
		return
	}
	targetEmail, _ := url.QueryUnescape(rawEmail)
	targetEmail = strings.ToLower(strings.TrimSpace(targetEmail))

	var req struct {
		Status domain.AdminStatus `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if req.Status != domain.AdminStatusActive && req.Status != domain.AdminStatusDisabled {
		jsonError(w, "validation_error", "Недійсне значення статусу (active або disabled)", http.StatusBadRequest)
		return
	}

	callerEmail := strings.ToLower(strings.TrimSpace(AdminEmailFromCtx(r.Context())))
	if req.Status == domain.AdminStatusDisabled && strings.EqualFold(targetEmail, callerEmail) {
		jsonError(w, "cannot_self_disable", "Ви не можете деактивувати власний обліковий запис", http.StatusBadRequest)
		return
	}

	existing, err := h.adminUsersRepo.GetByEmail(r.Context(), targetEmail)
	if err != nil {
		if errors.Is(err, domain.ErrAdminNotFound) {
			// Fallback: check if target is an invited admin
			if h.invitationsRepo != nil {
				pending, invErr := h.invitationsRepo.GetPendingByEmail(r.Context(), targetEmail)
				if invErr == nil && pending != nil {
					newAdmin, addErr := h.adminUsersRepo.Add(r.Context(), targetEmail, pending.Role, req.Status, pending.InvitedByAdminID)
					if addErr == nil {
						existing = newAdmin
						slog.Info("Admin user created from pending invitation with status", "email", targetEmail, "status", req.Status, "by", callerEmail)
						w.Header().Set("Content-Type", "application/json")
						json.NewEncoder(w).Encode(existing)
						return
					}
				}
			}
			jsonError(w, "not_found", "Адміністратора не знайдено", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to get admin user", http.StatusInternalServerError)
		return
	}

	if existing.Role == domain.RoleSuperAdmin && req.Status == domain.AdminStatusDisabled {
		count, err := h.adminUsersRepo.CountActiveSuperAdmins(r.Context())
		if err == nil && count <= 1 {
			jsonError(w, "last_super_admin", "Неможливо деактивувати єдиного активного головного адміністратора", http.StatusBadRequest)
			return
		}
	}

	if err := h.adminUsersRepo.UpdateStatus(r.Context(), targetEmail, req.Status); err != nil {
		slog.Error("Update admin status failed", "error", err, "email", targetEmail)
		jsonError(w, "db_error", "Failed to update admin status", http.StatusInternalServerError)
		return
	}

	action := domain.AdminAction("admin.enabled")
	if req.Status == domain.AdminStatusDisabled {
		action = domain.AdminAction("admin.disabled")
	}

	if h.auditRepo != nil {
		go func() {
			_ = h.auditRepo.Record(context.Background(), domain.AuditEntry{
				AdminEmail: callerEmail,
				Action:     action,
				Target:     targetEmail,
				IP:         realIP(r),
			})
		}()
	}

	existing.Status = req.Status
	slog.Info("Admin status updated", "email", targetEmail, "new_status", req.Status, "by", callerEmail)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existing)
}

// HandleValidateInviteToken checks public invitation validity.
// GET /api/v1/invitations/validate?token=...
func (h *AdminHandler) HandleValidateInviteToken(w http.ResponseWriter, r *http.Request) {
	if h.invitationsRepo == nil {
		jsonError(w, "not_configured", "Invitations system not available", http.StatusInternalServerError)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		jsonError(w, "missing_token", "Токен обов'язковий", http.StatusBadRequest)
		return
	}

	tokenHash := hashToken(token)
	inv, err := h.invitationsRepo.GetByTokenHash(r.Context(), tokenHash)
	if err != nil {
		if errors.Is(err, domain.ErrInviteNotFound) {
			jsonError(w, "invite_invalid", "Запрошення не знайдено або токен недійсний", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to validate invitation token", http.StatusInternalServerError)
		return
	}

	if inv.AcceptedAt != nil {
		jsonError(w, "invite_already_used", "Це запрошення вже було використано", http.StatusGone)
		return
	}
	if inv.RevokedAt != nil {
		jsonError(w, "invite_revoked", "Це запрошення було анульовано", http.StatusGone)
		return
	}
	if time.Now().UTC().After(inv.ExpiresAt) {
		jsonError(w, "invite_expired", "Термін дії запрошення закінчився", http.StatusGone)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"valid":      true,
		"email":      inv.Email,
		"role":       inv.Role,
		"expires_at": inv.ExpiresAt,
	})
}

// HandleAcceptInvite validates public invitation status and instructs caller to complete Google OAuth activation.
// POST /api/v1/invitations/accept
// Body: {"token": "..."}
func (h *AdminHandler) HandleAcceptInvite(w http.ResponseWriter, r *http.Request) {
	if h.invitationsRepo == nil {
		jsonError(w, "not_configured", "Auth system not fully configured", http.StatusInternalServerError)
		return
	}

	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	req.Token = strings.TrimSpace(req.Token)
	if req.Token == "" {
		jsonError(w, "validation_error", "Токен обов'язковий", http.StatusBadRequest)
		return
	}

	tokenHash := hashToken(req.Token)
	inv, err := h.invitationsRepo.GetByTokenHash(r.Context(), tokenHash)
	if err != nil {
		if errors.Is(err, domain.ErrInviteNotFound) {
			jsonError(w, "invite_invalid", "Запрошення не знайдено або токен недійсний", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to validate invitation", http.StatusInternalServerError)
		return
	}

	if inv.AcceptedAt != nil {
		jsonError(w, "invite_already_used", "Це запрошення вже було використано", http.StatusGone)
		return
	}
	if inv.RevokedAt != nil {
		jsonError(w, "invite_revoked", "Це запрошення було анульовано", http.StatusGone)
		return
	}
	if time.Now().UTC().After(inv.ExpiresAt) {
		jsonError(w, "invite_expired", "Термін дії запрошення закінчився", http.StatusGone)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"oauth_required": true,
		"email":          inv.Email,
		"role":           inv.Role,
		"message":        "Please complete activation by authenticating with Google OAuth using the invited email address.",
	})
}

// generateSecureToken creates a cryptographically secure 256-bit (32-byte) hex string.
func generateSecureToken() string {
	return uuid.NewString() + uuid.NewString()
}

// hashToken computes a SHA-256 hex digest of a raw token.
func hashToken(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}
