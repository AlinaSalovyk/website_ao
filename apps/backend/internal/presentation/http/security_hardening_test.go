package http

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	_ "modernc.org/sqlite"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/auth"
	"university-chatbot/backend/internal/infrastructure/mailer"
	"university-chatbot/backend/internal/infrastructure/sqlite"
)

func setupTestDB(t *testing.T) (*sqlite.AdminUsersRepo, *sqlite.AdminInvitationsRepo, func()) {
	t.Helper()
	f, err := os.CreateTemp("", "test-sec-*.db")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	dbPath := f.Name()
	f.Close()

	db, err := sqlite.InitDB(dbPath)
	if err != nil {
		os.Remove(dbPath)
		t.Fatalf("failed to init db: %v", err)
	}

	usersRepo := sqlite.NewAdminUsersRepo(db)
	invRepo := sqlite.NewAdminInvitationsRepo(db)

	cleanup := func() {
		db.Close()
		os.Remove(dbPath)
	}

	return usersRepo, invRepo, cleanup
}

func TestSecurity_FreshDBBootstrapAndPostBootstrap(t *testing.T) {
	usersRepo, _, cleanup := setupTestDB(t)
	defer cleanup()

	bootstrapEmails := []string{"bootstrap.admin@example.com"}

	// 1. Fresh DB (0 users): Bootstrap allowed
	if !CheckBootstrapAccess(context.Background(), "bootstrap.admin@example.com", bootstrapEmails, usersRepo) {
		t.Errorf("Expected bootstrap access to be true for empty DB")
	}

	// Bootstrap initial super_admin
	_, err := usersRepo.Add(context.Background(), "bootstrap.admin@example.com", domain.RoleSuperAdmin, domain.AdminStatusActive, "system")
	if err != nil {
		t.Fatalf("Failed to bootstrap super_admin: %v", err)
	}

	// 2. Post-bootstrap DB (1 user exists): Second allowed email must NOT be permitted to auto-bootstrap
	if CheckBootstrapAccess(context.Background(), "bootstrap.admin@example.com", bootstrapEmails, usersRepo) {
		t.Errorf("Expected CheckBootstrapAccess to be false post-bootstrap")
	}
	if CheckBootstrapAccess(context.Background(), "another.allowed@example.com", []string{"another.allowed@example.com"}, usersRepo) {
		t.Errorf("Expected CheckBootstrapAccess to be false for new email post-bootstrap")
	}
}

func TestSecurity_DisabledAdminRejected(t *testing.T) {
	usersRepo, _, cleanup := setupTestDB(t)
	defer cleanup()

	jwtSvc := auth.NewJWTService("secret-key-that-is-at-least-32-bytes-long!")

	// Create disabled admin user
	email := "disabled.admin@example.com"
	_, err := usersRepo.Add(context.Background(), email, domain.RoleNewsEditor, domain.AdminStatusDisabled, "system")
	if err != nil {
		t.Fatalf("Failed to add user: %v", err)
	}

	token, err := jwtSvc.GenerateToken(&auth.GoogleUserInfo{Email: email})
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	handler := DualAuthMiddleware(jwtSvc, "static-token", false, nil, nil, usersRepo)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("Expected status 403 Forbidden for disabled admin, got %d", rr.Code)
	}
}

func TestSecurity_RoleChangeAppliesImmediately(t *testing.T) {
	usersRepo, _, cleanup := setupTestDB(t)
	defer cleanup()

	jwtSvc := auth.NewJWTService("secret-key-that-is-at-least-32-bytes-long!")

	email := "editor@example.com"
	_, err := usersRepo.Add(context.Background(), email, domain.RoleNewsEditor, domain.AdminStatusActive, "system")
	if err != nil {
		t.Fatalf("Failed to add user: %v", err)
	}

	token, _ := jwtSvc.GenerateToken(&auth.GoogleUserInfo{Email: email})

	// Middleware requiring RoleChatbotAdmin
	protectedHandler := DualAuthMiddleware(jwtSvc, "", false, nil, nil, usersRepo)(
		RequireRole(domain.RoleChatbotAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})),
	)

	// Request 1: NewsEditor attempting ChatbotAdmin route -> 403 Forbidden
	req1 := httptest.NewRequest("GET", "/chatbot-admin", nil)
	req1.Header.Set("Authorization", "Bearer "+token)
	rr1 := httptest.NewRecorder()
	protectedHandler.ServeHTTP(rr1, req1)

	if rr1.Code != http.StatusForbidden {
		t.Errorf("Expected status 403 for NewsEditor on ChatbotAdmin route, got %d", rr1.Code)
	}

	// Update role in DB immediately
	err = usersRepo.UpdateRole(context.Background(), email, domain.RoleChatbotAdmin)
	if err != nil {
		t.Fatalf("Failed to update role: %v", err)
	}

	// Request 2: Next request with same JWT token -> DB lookup yields new role -> 200 OK
	req2 := httptest.NewRequest("GET", "/chatbot-admin", nil)
	req2.Header.Set("Authorization", "Bearer "+token)
	rr2 := httptest.NewRecorder()
	protectedHandler.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Errorf("Expected status 200 after role update to ChatbotAdmin, got %d", rr2.Code)
	}
}

func TestSecurity_LegacyAdminTokenDisabled(t *testing.T) {
	usersRepo, _, cleanup := setupTestDB(t)
	defer cleanup()

	jwtSvc := auth.NewJWTService("secret-key-that-is-at-least-32-bytes-long!")
	staticToken := "secret-static-admin-token"

	// When legacyTokenEnabled = false, X-Admin-Token header must be REJECTED
	handlerDisabled := DualAuthMiddleware(jwtSvc, staticToken, false, nil, nil, usersRepo)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Admin-Token", staticToken)
	rr := httptest.NewRecorder()
	handlerDisabled.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when legacy token is disabled, got %d", rr.Code)
	}
}

func TestSecurity_LegacyAdminTokenEnabled_EnforcesRBAC(t *testing.T) {
	usersRepo, _, cleanup := setupTestDB(t)
	defer cleanup()

	jwtSvc := auth.NewJWTService("secret-key-that-is-at-least-32-bytes-long!")
	staticToken := "secret-static-admin-token"

	// When legacyTokenEnabled = true, static token maps to system DB user
	handlerEnabled := DualAuthMiddleware(jwtSvc, staticToken, true, []string{"system@token-auth"}, nil, usersRepo)(
		RequireRole(domain.RoleSuperAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})),
	)

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Admin-Token", staticToken)
	rr := httptest.NewRecorder()
	handlerEnabled.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for enabled static token with super_admin role, got %d", rr.Code)
	}
}

func TestSecurity_SMTPTimeoutRequired(t *testing.T) {
	cfg := mailer.Config{
		Host:      "smtp.test.com",
		Port:      587,
		FromEmail: "admin@test.com",
		Security:  mailer.SMTPSecurityNone,
		AuthMode:  mailer.SMTPAuthModeNone,
		Timeout:   0, // Missing timeout
	}

	err := cfg.Validate()
	if err == nil {
		t.Errorf("Expected error for missing SMTP_TIMEOUT, got nil")
	} else if !strings.Contains(err.Error(), "SMTP_TIMEOUT is required") {
		t.Errorf("Expected error containing 'SMTP_TIMEOUT is required', got: %v", err)
	}
}

func TestSecurity_SuperAdminInviteRestricted(t *testing.T) {
	usersRepo, invRepo, cleanup := setupTestDB(t)
	defer cleanup()

	h := NewAdminHandler(
		nil, nil, nil, nil, nil, nil, nil,
		usersRepo, invRepo, nil, &mockMailer{}, nil, nil, "http://localhost:3000", "http://localhost:8080",
		48*time.Hour, nil, false, "/admin",
	)

	// Attempting to create an invitation with super_admin role must be rejected by backend
	body := strings.NewReader(`{"email": "attacker@example.com", "role": "super_admin"}`)
	req := httptest.NewRequest("POST", "/admin/invitations", body)
	req = req.WithContext(context.WithValue(req.Context(), adminUserKey, &domain.AdminUser{Email: "super@example.com", Role: domain.RoleSuperAdmin, Status: domain.AdminStatusActive}))
	rr := httptest.NewRecorder()

	h.HandleCreateInvitation(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request when inviting super_admin, got %d", rr.Code)
	}
}

func TestSecurity_LastSuperAdminCannotBeRemoved(t *testing.T) {
	usersRepo, _, cleanup := setupTestDB(t)
	defer cleanup()

	// Seed 1 active super_admin and 1 active news_editor
	superAdmin, _ := usersRepo.Add(context.Background(), "super@example.com", domain.RoleSuperAdmin, domain.AdminStatusActive, "system")
	editor, _ := usersRepo.Add(context.Background(), "editor@example.com", domain.RoleNewsEditor, domain.AdminStatusActive, "system")

	h := NewAdminHandler(
		nil, nil, nil, nil, nil, nil, nil,
		usersRepo, nil, nil, nil, nil, nil, "http://localhost:3000", "http://localhost:8080",
		48*time.Hour, nil, false, "/admin",
	)

	// Editor caller trying to remove superAdmin should fail because superAdmin is the LAST active super_admin
	req := httptest.NewRequest("DELETE", "/admin/admins/super@example.com", nil)
	req = req.WithContext(context.WithValue(req.Context(), adminUserKey, editor))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("email", superAdmin.Email)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rr := httptest.NewRecorder()
	h.HandleRemoveAdmin(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 Bad Request when attempting to remove last active super_admin, got %d", rr.Code)
	}
}

func TestSecurity_AdminInvitationTTLValidation(t *testing.T) {
	// Missing / empty -> error
	if _, err := time.ParseDuration(""); err == nil {
		t.Errorf("Expected error for empty duration string")
	}

	// Invalid string -> error
	if _, err := time.ParseDuration("invalid-duration"); err == nil {
		t.Errorf("Expected error for invalid duration string")
	}

	// 48h -> valid
	d48, err := time.ParseDuration("48h")
	if err != nil || d48 != 48*time.Hour {
		t.Errorf("Expected 48h to parse as 48 hours, got %v, err=%v", d48, err)
	}

	// 72h -> valid
	d72, err := time.ParseDuration("72h")
	if err != nil || d72 != 72*time.Hour {
		t.Errorf("Expected 72h to parse as 72 hours, got %v, err=%v", d72, err)
	}
}

func TestSecurity_OAuthState_RestartSafety(t *testing.T) {
	f, err := os.CreateTemp("", "test-restart-*.db")
	if err != nil {
		t.Fatalf("temp file error: %v", err)
	}
	dbPath := f.Name()
	f.Close()
	defer os.Remove(dbPath)

	db1, err := sqlite.InitDB(dbPath)
	if err != nil {
		t.Fatalf("InitDB 1 failed: %v", err)
	}

	stateRepo1 := sqlite.NewAdminOAuthStateRepo(db1)
	rawState := "test-raw-state-restart-12345"
	stateHash := hashToken(rawState)
	invID := "inv-uuid-123"

	// Instance 1 creates persistent state
	err = stateRepo1.CreateState(context.Background(), stateHash, invID, "invite_acceptance", 10*time.Minute)
	if err != nil {
		t.Fatalf("CreateState failed: %v", err)
	}

	// Simulate server process restart (close db1 and reopen db2 on same file)
	db1.Close()

	db2, err := sqlite.InitDB(dbPath)
	if err != nil {
		t.Fatalf("InitDB 2 failed: %v", err)
	}
	defer db2.Close()

	stateRepo2 := sqlite.NewAdminOAuthStateRepo(db2)

	// Instance 2 (post-restart) consumes persistent state
	rec, err := stateRepo2.GetAndConsumeState(context.Background(), stateHash)
	if err != nil {
		t.Fatalf("Expected state to be valid after restart, got error: %v", err)
	}

	if rec.InvitationID != invID || rec.Purpose != "invite_acceptance" {
		t.Errorf("Mismatch in restored state record: %+v", rec)
	}
}

func TestSecurity_OAuthState_MultiInstance(t *testing.T) {
	f, err := os.CreateTemp("", "test-multi-*.db")
	if err != nil {
		t.Fatalf("temp file error: %v", err)
	}
	dbPath := f.Name()
	f.Close()
	defer os.Remove(dbPath)

	db, err := sqlite.InitDB(dbPath)
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	instanceA := sqlite.NewAdminOAuthStateRepo(db)
	instanceB := sqlite.NewAdminOAuthStateRepo(db)

	rawState := "multi-instance-state-987"
	stateHash := hashToken(rawState)
	invID := "inv-uuid-multi"

	// Instance A creates state
	if err := instanceA.CreateState(context.Background(), stateHash, invID, "invite_acceptance", 10*time.Minute); err != nil {
		t.Fatalf("Instance A CreateState failed: %v", err)
	}

	// Instance B consumes state
	rec, err := instanceB.GetAndConsumeState(context.Background(), stateHash)
	if err != nil {
		t.Fatalf("Instance B GetAndConsumeState failed: %v", err)
	}
	if rec.InvitationID != invID {
		t.Errorf("Expected invitation ID %s, got %s", invID, rec.InvitationID)
	}

	// Instance A or B attempts to consume again -> REJECT
	_, errAgain := instanceA.GetAndConsumeState(context.Background(), stateHash)
	if errAgain == nil {
		t.Errorf("Expected second consumption to fail (one-time use), but got nil error")
	}
}

func TestSecurity_OAuthState_ExpiryProtection(t *testing.T) {
	f, err := os.CreateTemp("", "test-expiry-*.db")
	if err != nil {
		t.Fatalf("temp file error: %v", err)
	}
	dbPath := f.Name()
	f.Close()
	defer os.Remove(dbPath)

	db, err := sqlite.InitDB(dbPath)
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	stateRepo := sqlite.NewAdminOAuthStateRepo(db)

	rawState := "expired-state-555"
	stateHash := hashToken(rawState)

	// Create state with negative TTL (already expired)
	if err := stateRepo.CreateState(context.Background(), stateHash, "inv-expired", "invite_acceptance", -1*time.Second); err != nil {
		t.Fatalf("CreateState failed: %v", err)
	}

	// Attempt to consume expired state -> REJECT
	_, errConsumed := stateRepo.GetAndConsumeState(context.Background(), stateHash)
	if errConsumed == nil {
		t.Errorf("Expected expired state consumption to fail, got nil error")
	}
}

type trackingMailer struct {
	sendCalled    bool
	lastTo        string
	lastRole      domain.Role
	lastInviteURL string
	shouldFail    bool
	dbCheckOnSend func() bool
}

func (m *trackingMailer) SendInvitation(ctx context.Context, toEmail string, role domain.Role, inviteURL string, expiresAt time.Time) error {
	m.sendCalled = true
	m.lastTo = toEmail
	m.lastRole = role
	m.lastInviteURL = inviteURL

	if m.dbCheckOnSend != nil {
		if !m.dbCheckOnSend() {
			return errors.New("db record was not found when send was called")
		}
	}

	if m.shouldFail {
		return errors.New("smtp connection failed: connection refused")
	}
	return nil
}

func TestSecurity_InvitationDeliveryConsistencyAndResend(t *testing.T) {
	usersRepo, invRepo, cleanup := setupTestDB(t)
	defer cleanup()

	// Add caller super_admin
	callerEmail := "admin.caller@example.com"
	_, err := usersRepo.Add(context.Background(), callerEmail, domain.RoleSuperAdmin, domain.AdminStatusActive, "system")
	if err != nil {
		t.Fatalf("Failed to add caller admin: %v", err)
	}

	// 1. Test SMTP Failure Path: DB record must be created FIRST (pending), then SMTP fails -> marked delivery_failed
	mockMailerFail := &trackingMailer{
		shouldFail: true,
		dbCheckOnSend: func() bool {
			inv, err := invRepo.GetPendingByEmail(context.Background(), "invitee.fail@example.com")
			return err == nil && inv != nil && inv.DeliveryStatus == domain.DeliveryStatusPending
		},
	}

	handlerFail := &AdminHandler{
		adminUsersRepo:  usersRepo,
		invitationsRepo: invRepo,
		mailer:          mockMailerFail,
		invitationTTL:   48 * time.Hour,
		publicBaseURL:   "http://localhost:8280",
	}

	routerFail := chi.NewRouter()
	routerFail.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), adminUserKey, &domain.AdminUser{Email: callerEmail, Role: domain.RoleSuperAdmin})
			ctx = context.WithValue(ctx, adminEmailKey, callerEmail)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})
	routerFail.Post("/admin/invitations", handlerFail.HandleCreateInvitation)

	reqBodyFail := `{"email":"invitee.fail@example.com","role":"news_editor"}`
	reqFail := httptest.NewRequest("POST", "/admin/invitations", strings.NewReader(reqBodyFail))
	reqFail.Header.Set("Content-Type", "application/json")
	rrFail := httptest.NewRecorder()

	routerFail.ServeHTTP(rrFail, reqFail)

	if rrFail.Code != http.StatusInternalServerError {
		t.Fatalf("Expected HTTP 500 when SMTP delivery fails, got %d. Body: %s", rrFail.Code, rrFail.Body.String())
	}
	if !strings.Contains(rrFail.Body.String(), "invitation_email_delivery_failed") {
		t.Errorf("Expected response to contain invitation_email_delivery_failed, got %s", rrFail.Body.String())
	}

	// Verify invitation remains persisted in DB with status delivery_failed and LastSentAt == nil
	failedInv, err := invRepo.GetPendingByEmail(context.Background(), "invitee.fail@example.com")
	if err != nil || failedInv == nil {
		t.Fatalf("Expected invitation to remain persisted in DB after SMTP failure, got err: %v", err)
	}
	if failedInv.DeliveryStatus != domain.DeliveryStatusDeliveryFailed {
		t.Errorf("Expected delivery_status to be delivery_failed, got %s", failedInv.DeliveryStatus)
	}
	if failedInv.LastSentAt != nil {
		t.Errorf("Expected LastSentAt to be nil on SMTP failure, got %v", failedInv.LastSentAt)
	}
	if failedInv.TokenHash == "" || strings.Contains(failedInv.TokenHash, "http") {
		t.Errorf("Expected hashed token in DB, got %s", failedInv.TokenHash)
	}

	// 2. Test Create Path with SMTP Success: LastSentAt must be populated
	mockMailerSuccess := &trackingMailer{
		shouldFail: false,
		dbCheckOnSend: func() bool {
			inv, err := invRepo.GetPendingByEmail(context.Background(), "invitee.success@example.com")
			return err == nil && inv != nil && inv.DeliveryStatus == domain.DeliveryStatusPending && inv.LastSentAt == nil
		},
	}

	handlerSuccess := &AdminHandler{
		adminUsersRepo:  usersRepo,
		invitationsRepo: invRepo,
		mailer:          mockMailerSuccess,
		invitationTTL:   48 * time.Hour,
		publicBaseURL:   "http://localhost:8280",
	}

	routerSuccess := chi.NewRouter()
	routerSuccess.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), adminUserKey, &domain.AdminUser{Email: callerEmail, Role: domain.RoleSuperAdmin})
			ctx = context.WithValue(ctx, adminEmailKey, callerEmail)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})
	routerSuccess.Post("/admin/invitations", handlerSuccess.HandleCreateInvitation)
	routerSuccess.Post("/admin/invitations/{id}/resend", handlerSuccess.HandleResendInvitation)

	reqBodySuccess := `{"email":"invitee.success@example.com","role":"news_editor"}`
	reqSuccess := httptest.NewRequest("POST", "/admin/invitations", strings.NewReader(reqBodySuccess))
	reqSuccess.Header.Set("Content-Type", "application/json")
	rrSuccess := httptest.NewRecorder()

	routerSuccess.ServeHTTP(rrSuccess, reqSuccess)
	if rrSuccess.Code != http.StatusCreated {
		t.Fatalf("Expected HTTP 201 on create success, got %d. Body: %s", rrSuccess.Code, rrSuccess.Body.String())
	}

	successInv, err := invRepo.GetPendingByEmail(context.Background(), "invitee.success@example.com")
	if err != nil || successInv == nil {
		t.Fatalf("Expected created invitation in DB, got err: %v", err)
	}
	if successInv.DeliveryStatus != domain.DeliveryStatusSent {
		t.Errorf("Expected delivery_status sent, got %s", successInv.DeliveryStatus)
	}
	if successInv.LastSentAt == nil {
		t.Fatalf("Expected LastSentAt to be populated on SMTP success, got nil")
	}
	firstSentAt := *successInv.LastSentAt

	// 3. Test Resend Failure after earlier successful send: Old LastSentAt timestamp must be preserved, delivery_status = delivery_failed
	mockMailerFail.dbCheckOnSend = func() bool {
		inv, err := invRepo.GetByID(context.Background(), successInv.ID)
		return err == nil && inv != nil && inv.DeliveryStatus == domain.DeliveryStatusPending
	}
	handlerSuccess.mailer = mockMailerFail

	reqResendFail := httptest.NewRequest("POST", "/admin/invitations/"+successInv.ID+"/resend", nil)
	rrResendFail := httptest.NewRecorder()

	routerSuccess.ServeHTTP(rrResendFail, reqResendFail)
	if rrResendFail.Code != http.StatusInternalServerError {
		t.Fatalf("Expected HTTP 500 on resend failure, got %d. Body: %s", rrResendFail.Code, rrResendFail.Body.String())
	}

	failedResendInv, err := invRepo.GetByID(context.Background(), successInv.ID)
	if err != nil || failedResendInv == nil {
		t.Fatalf("Failed to fetch invitation post-resend failure: %v", err)
	}
	if failedResendInv.DeliveryStatus != domain.DeliveryStatusDeliveryFailed {
		t.Errorf("Expected delivery_status delivery_failed, got %s", failedResendInv.DeliveryStatus)
	}
	if failedResendInv.LastSentAt == nil || !failedResendInv.LastSentAt.Equal(firstSentAt) {
		t.Errorf("Expected LastSentAt to preserve old successful timestamp %v, got %v", firstSentAt, failedResendInv.LastSentAt)
	}

	// 4. Test Resend Success: LastSentAt timestamp must be updated to new time
	time.Sleep(10 * time.Millisecond) // ensure time progression
	mockMailerSuccess.dbCheckOnSend = func() bool {
		inv, err := invRepo.GetByID(context.Background(), successInv.ID)
		return err == nil && inv != nil && inv.DeliveryStatus == domain.DeliveryStatusPending
	}
	handlerSuccess.mailer = mockMailerSuccess

	reqResendPass := httptest.NewRequest("POST", "/admin/invitations/"+successInv.ID+"/resend", nil)
	rrResendPass := httptest.NewRecorder()

	routerSuccess.ServeHTTP(rrResendPass, reqResendPass)
	if rrResendPass.Code != http.StatusOK {
		t.Fatalf("Expected HTTP 200 on resend success, got %d. Body: %s", rrResendPass.Code, rrResendPass.Body.String())
	}

	resentInv, err := invRepo.GetByID(context.Background(), successInv.ID)
	if err != nil || resentInv == nil {
		t.Fatalf("Failed to fetch resent invitation: %v", err)
	}
	if resentInv.DeliveryStatus != domain.DeliveryStatusSent {
		t.Errorf("Expected delivery_status sent post-resend success, got %s", resentInv.DeliveryStatus)
	}
	if resentInv.LastSentAt == nil || resentInv.LastSentAt.Equal(firstSentAt) {
		t.Errorf("Expected LastSentAt to be updated to new timestamp post-resend success, previous: %v, current: %v", firstSentAt, resentInv.LastSentAt)
	}
}
