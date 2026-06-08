package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"
)

// AdminSettingsRepo provides key-value storage via the "admin_settings" table.
// Used for first-admin registration (race-safe), refresh token revocation,
// and JTI-based granular token invalidation.
type AdminSettingsRepo struct {
	db *sql.DB
}

// NewAdminSettingsRepo creates an AdminSettingsRepo backed by the given SQLite connection.
func NewAdminSettingsRepo(db *sql.DB) *AdminSettingsRepo {
	return &AdminSettingsRepo{db: db}
}

// Get retrieves a value from the admin_settings table by key.
// Returns an empty string (no error) when the key does not exist.
func (r *AdminSettingsRepo) Get(ctx context.Context, key string) (string, error) {
	var value string
	err := r.db.QueryRowContext(ctx, `SELECT value FROM admin_settings WHERE key = ?`, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return value, nil
}

// Set inserts or updates a key-value pair in admin_settings (UPSERT).
func (r *AdminSettingsRepo) Set(ctx context.Context, key, value string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
		key, value,
	)
	return err
}

// IsFirstAdmin returns true if no first-admin email has been registered yet.
// Logs and returns false on database errors.
func (r *AdminSettingsRepo) IsFirstAdmin(ctx context.Context) bool {
	val, err := r.Get(ctx, "first_admin_email")
	if err != nil {
		slog.Error("Failed to check first admin", "error", err)
		return false
	}
	return val == ""
}

// SetFirstAdmin stores the first-admin email non-atomically.
// Prefer SetFirstAdminAtomic in concurrent environments.
func (r *AdminSettingsRepo) SetFirstAdmin(ctx context.Context, email string) error {
	return r.Set(ctx, "first_admin_email", email)
}

// SetFirstAdminAtomic attempts to register email as the first admin using
// INSERT OR IGNORE within a transaction. Returns (wonRace=true, email) if
// this call won the race, or (false, actualAdmin) if someone else already registered.
func (r *AdminSettingsRepo) SetFirstAdminAtomic(ctx context.Context, email string) (wonRace bool, actualAdmin string, err error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, "", err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	_, err = tx.ExecContext(ctx,
		`INSERT OR IGNORE INTO admin_settings (key, value, updated_at)
		 VALUES ('first_admin_email', ?, CURRENT_TIMESTAMP)`,
		email,
	)
	if err != nil {
		return false, "", err
	}

	var stored string
	err = tx.QueryRowContext(ctx,
		`SELECT value FROM admin_settings WHERE key = 'first_admin_email'`,
	).Scan(&stored)
	if err != nil {
		return false, "", err
	}

	if err = tx.Commit(); err != nil {
		return false, "", err
	}

	won := stored == email
	return won, stored, nil
}

// RevokeRefreshTokens invalidates all refresh tokens issued before now for
// the given admin email by storing the current Unix timestamp as a revocation fence.
func (r *AdminSettingsRepo) RevokeRefreshTokens(ctx context.Context, email string) error {
	return r.Set(ctx, revokeKey(email), fmt.Sprintf("%d", time.Now().Unix()))
}

// IsRefreshTokenValid checks whether a refresh token (identified by its issuedAt
// Unix timestamp) has been revoked for the given admin email.
// Returns true if no revocation fence exists or if issuedAt is after the fence.
func (r *AdminSettingsRepo) IsRefreshTokenValid(ctx context.Context, email string, issuedAt int64) (bool, error) {
	val, err := r.Get(ctx, revokeKey(email))
	if err != nil {
		return false, err
	}
	if val == "" {
		return true, nil
	}
	var revokeUnix int64
	if _, err := fmt.Sscanf(val, "%d", &revokeUnix); err != nil {
		return false, fmt.Errorf("corrupt revoke timestamp for %q: %w", email, err)
	}
	return issuedAt > revokeUnix, nil
}

// RevokeJTI marks a specific JWT token ID as revoked (stored until exp).
func (r *AdminSettingsRepo) RevokeJTI(ctx context.Context, jti string, exp int64) error {
	return r.Set(ctx, "revoked_jti_"+jti, fmt.Sprintf("%d", exp))
}
// IsJTIRevoked returns true if the given JTI has been explicitly revoked.
// An empty JTI is treated as not-revoked (returns false, nil).
func (r *AdminSettingsRepo) IsJTIRevoked(ctx context.Context, jti string) (bool, error) {
	if jti == "" {
		return false, nil 
	}
	val, err := r.Get(ctx, "revoked_jti_"+jti)
	if err != nil {
		return false, err
	}
	return val != "", nil
}

// CleanupExpiredJTIs removes revoked JTI entries whose expiry timestamp
// has passed. Called periodically (every 12h) from main.go.
func (r *AdminSettingsRepo) CleanupExpiredJTIs(ctx context.Context) error {
	now := time.Now().Unix()
	
	query := `
		DELETE FROM admin_settings 
		WHERE key LIKE 'revoked_jti_%' 
		AND CAST(value AS INTEGER) < ?
	`
	_, err := r.db.ExecContext(ctx, query, now)
	return err
}

// revokeKey returns the admin_settings key used to store the revocation fence
// for a given admin email's refresh tokens.
func revokeKey(email string) string {
	return "refresh_revoke:" + email
}
