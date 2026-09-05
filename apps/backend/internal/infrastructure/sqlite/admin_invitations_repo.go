package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"university-chatbot/backend/internal/domain"
)

// AdminInvitationsRepo implements domain.AdminInvitationsRepo using SQLite.
type AdminInvitationsRepo struct {
	db *sql.DB
}

// NewAdminInvitationsRepo creates a new AdminInvitationsRepo backed by SQLite.
func NewAdminInvitationsRepo(db *sql.DB) *AdminInvitationsRepo {
	return &AdminInvitationsRepo{db: db}
}

// Create inserts a new admin invitation record.
func (r *AdminInvitationsRepo) Create(ctx context.Context, inv *domain.AdminInvitation) error {
	inv.Email = strings.ToLower(strings.TrimSpace(inv.Email))
	now := time.Now().UTC()
	if inv.CreatedAt.IsZero() {
		inv.CreatedAt = now
	}
	if inv.DeliveryStatus == "" {
		inv.DeliveryStatus = domain.DeliveryStatusPending
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO admin_invitations (
			id, email, role, token_hash, invited_by_admin_id, created_at, expires_at, accepted_at, revoked_at, last_sent_at, delivery_status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		inv.ID, inv.Email, string(inv.Role), inv.TokenHash, inv.InvitedByAdminID,
		inv.CreatedAt, inv.ExpiresAt, inv.AcceptedAt, inv.RevokedAt, inv.LastSentAt, string(inv.DeliveryStatus),
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			return domain.ErrInvitePending
		}
		return err
	}
	return nil
}

// GetByID finds an invitation by its UUID ID.
func (r *AdminInvitationsRepo) GetByID(ctx context.Context, id string) (*domain.AdminInvitation, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, email, role, token_hash, invited_by_admin_id, created_at, expires_at, accepted_at, revoked_at, last_sent_at, delivery_status
		FROM admin_invitations WHERE id = ?`, id,
	)
	return scanInvitationRow(row)
}

// GetByTokenHash finds an invitation by its SHA-256 token hash.
func (r *AdminInvitationsRepo) GetByTokenHash(ctx context.Context, tokenHash string) (*domain.AdminInvitation, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, email, role, token_hash, invited_by_admin_id, created_at, expires_at, accepted_at, revoked_at, last_sent_at, delivery_status
		FROM admin_invitations WHERE token_hash = ?`, tokenHash,
	)
	return scanInvitationRow(row)
}

// GetPendingByEmail finds an active pending invitation for an email address.
func (r *AdminInvitationsRepo) GetPendingByEmail(ctx context.Context, email string) (*domain.AdminInvitation, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	now := time.Now().UTC()
	row := r.db.QueryRowContext(ctx, `
		SELECT id, email, role, token_hash, invited_by_admin_id, created_at, expires_at, accepted_at, revoked_at, last_sent_at, delivery_status
		FROM admin_invitations
		WHERE LOWER(email) = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?
		ORDER BY created_at DESC LIMIT 1`, email, now,
	)
	return scanInvitationRow(row)
}

// ListPending returns all non-accepted, non-revoked invitations where expires_at > now.
func (r *AdminInvitationsRepo) ListPending(ctx context.Context) ([]domain.AdminInvitation, error) {
	now := time.Now().UTC()
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, email, role, token_hash, invited_by_admin_id, created_at, expires_at, accepted_at, revoked_at, last_sent_at, delivery_status
		FROM admin_invitations
		WHERE accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?
		ORDER BY created_at DESC`, now,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invitations []domain.AdminInvitation
	for rows.Next() {
		inv, err := scanInvitationFromRows(rows)
		if err != nil {
			return nil, err
		}
		invitations = append(invitations, *inv)
	}
	return invitations, rows.Err()
}

// MarkAccepted updates accepted_at timestamp for an invitation.
func (r *AdminInvitationsRepo) MarkAccepted(ctx context.Context, id string) error {
	now := time.Now().UTC()
	res, err := r.db.ExecContext(ctx, `
		UPDATE admin_invitations SET accepted_at = ? WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
		now, id,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrInviteNotFound
	}
	return nil
}

// MarkRevoked updates revoked_at timestamp for an invitation.
func (r *AdminInvitationsRepo) MarkRevoked(ctx context.Context, id string) error {
	now := time.Now().UTC()
	res, err := r.db.ExecContext(ctx, `
		UPDATE admin_invitations SET revoked_at = ? WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
		now, id,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrInviteNotFound
	}
	return nil
}

// UpdateTokenAndExpiry replaces token hash, updates expires_at and delivery_status on resend (preserving last_sent_at).
func (r *AdminInvitationsRepo) UpdateTokenAndExpiry(ctx context.Context, id, newTokenHash string, expiresAt time.Time, status domain.DeliveryStatus) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE admin_invitations SET token_hash = ?, expires_at = ?, delivery_status = ?
		WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
		newTokenHash, expiresAt, string(status), id,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrInviteNotFound
	}
	return nil
}

// UpdateDeliveryStatus updates delivery_status and sets last_sent_at on SMTP success.
func (r *AdminInvitationsRepo) UpdateDeliveryStatus(ctx context.Context, id string, status domain.DeliveryStatus) error {
	var err error
	var res sql.Result
	if status == domain.DeliveryStatusSent {
		now := time.Now().UTC()
		res, err = r.db.ExecContext(ctx, `
			UPDATE admin_invitations SET delivery_status = ?, last_sent_at = ?
			WHERE id = ?`,
			string(status), now, id,
		)
	} else {
		res, err = r.db.ExecContext(ctx, `
			UPDATE admin_invitations SET delivery_status = ?
			WHERE id = ?`,
			string(status), id,
		)
	}
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrInviteNotFound
	}
	return nil
}

// RevokeByEmail marks all active pending invitations for an email address as revoked.
func (r *AdminInvitationsRepo) RevokeByEmail(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	now := time.Now().UTC()
	res, err := r.db.ExecContext(ctx, `
		UPDATE admin_invitations SET revoked_at = ?
		WHERE LOWER(email) = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
		now, email,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrInviteNotFound
	}
	return nil
}

func scanInvitationRow(row *sql.Row) (*domain.AdminInvitation, error) {
	var inv domain.AdminInvitation
	var roleStr, statusStr string
	var acceptedAt, revokedAt, lastSentAt sql.NullString

	err := row.Scan(
		&inv.ID, &inv.Email, &roleStr, &inv.TokenHash, &inv.InvitedByAdminID,
		&inv.CreatedAt, &inv.ExpiresAt, &acceptedAt, &revokedAt, &lastSentAt, &statusStr,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrInviteNotFound
	}
	if err != nil {
		return nil, err
	}
	inv.Role = domain.Role(roleStr)
	if statusStr == "" {
		statusStr = string(domain.DeliveryStatusSent)
	}
	inv.DeliveryStatus = domain.DeliveryStatus(statusStr)
	if acceptedAt.Valid {
		inv.AcceptedAt = parseSQLTime(acceptedAt.String)
	}
	if revokedAt.Valid {
		inv.RevokedAt = parseSQLTime(revokedAt.String)
	}
	if lastSentAt.Valid {
		inv.LastSentAt = parseSQLTime(lastSentAt.String)
	}
	return &inv, nil
}

func scanInvitationFromRows(rows *sql.Rows) (*domain.AdminInvitation, error) {
	var inv domain.AdminInvitation
	var roleStr, statusStr string
	var acceptedAt, revokedAt, lastSentAt sql.NullString

	err := rows.Scan(
		&inv.ID, &inv.Email, &roleStr, &inv.TokenHash, &inv.InvitedByAdminID,
		&inv.CreatedAt, &inv.ExpiresAt, &acceptedAt, &revokedAt, &lastSentAt, &statusStr,
	)
	if err != nil {
		return nil, err
	}
	inv.Role = domain.Role(roleStr)
	if statusStr == "" {
		statusStr = string(domain.DeliveryStatusSent)
	}
	inv.DeliveryStatus = domain.DeliveryStatus(statusStr)
	if acceptedAt.Valid {
		inv.AcceptedAt = parseSQLTime(acceptedAt.String)
	}
	if revokedAt.Valid {
		inv.RevokedAt = parseSQLTime(revokedAt.String)
	}
	if lastSentAt.Valid {
		inv.LastSentAt = parseSQLTime(lastSentAt.String)
	}
	return &inv, nil
}
