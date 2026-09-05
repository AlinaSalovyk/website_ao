package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"university-chatbot/backend/internal/domain"
)

// AdminOAuthStateRepo implements domain.AdminOAuthStateRepo using SQLite.
type AdminOAuthStateRepo struct {
	db *sql.DB
}

// NewAdminOAuthStateRepo creates a new AdminOAuthStateRepo.
func NewAdminOAuthStateRepo(db *sql.DB) *AdminOAuthStateRepo {
	return &AdminOAuthStateRepo{db: db}
}

// CreateState saves a new state hash record. Expired states are automatically pruned.
func (r *AdminOAuthStateRepo) CreateState(ctx context.Context, stateHash, invitationID, purpose string, ttl time.Duration) error {
	now := time.Now().UTC()
	expiresAt := now.Add(ttl)

	// Automatic lightweight cleanup of expired states
	_, _ = r.db.ExecContext(ctx, "DELETE FROM admin_oauth_states WHERE expires_at < ?", now)

	query := `INSERT INTO admin_oauth_states (state_hash, invitation_id, purpose, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, stateHash, invitationID, purpose, now, expiresAt)
	if err != nil {
		return fmt.Errorf("create oauth state: %w", err)
	}
	return nil
}

// GetAndConsumeState atomically validates and marks an OAuth state as consumed inside a transaction.
func (r *AdminOAuthStateRepo) GetAndConsumeState(ctx context.Context, stateHash string) (*domain.OAuthStateRecord, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	var rec domain.OAuthStateRecord
	var consumedAt sql.NullTime
	query := `SELECT state_hash, invitation_id, purpose, created_at, expires_at, consumed_at FROM admin_oauth_states WHERE state_hash = ?`
	err = tx.QueryRowContext(ctx, query, stateHash).Scan(
		&rec.StateHash,
		&rec.InvitationID,
		&rec.Purpose,
		&rec.CreatedAt,
		&rec.ExpiresAt,
		&consumedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrOAuthStateNotFound
		}
		return nil, fmt.Errorf("query oauth state: %w", err)
	}

	if consumedAt.Valid {
		return nil, domain.ErrOAuthStateConsumed
	}

	now := time.Now().UTC()
	if now.After(rec.ExpiresAt) {
		return nil, domain.ErrOAuthStateExpired
	}

	// Mark consumed atomically
	res, err := tx.ExecContext(ctx, "UPDATE admin_oauth_states SET consumed_at = ? WHERE state_hash = ? AND consumed_at IS NULL", now, stateHash)
	if err != nil {
		return nil, fmt.Errorf("mark oauth state consumed: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil || rows == 0 {
		return nil, domain.ErrOAuthStateConsumed
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	rec.ConsumedAt = &now
	return &rec, nil
}

// CleanupExpired deletes all expired OAuth states from the database.
func (r *AdminOAuthStateRepo) CleanupExpired(ctx context.Context) error {
	now := time.Now().UTC()
	_, err := r.db.ExecContext(ctx, "DELETE FROM admin_oauth_states WHERE expires_at < ?", now)
	return err
}
