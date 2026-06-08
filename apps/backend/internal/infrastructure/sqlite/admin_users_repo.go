package sqlite

import (
	"context"
	"database/sql"
	"time"

	"university-chatbot/backend/internal/domain"
)

// AdminUsersRepo implements domain.AdminUsersRepo using SQLite.
// Manages the "admin_users" table for multi-admin access control.
type AdminUsersRepo struct {
	db *sql.DB
}

// NewAdminUsersRepo creates a new AdminUsersRepo backed by the given SQLite connection.
func NewAdminUsersRepo(db *sql.DB) *AdminUsersRepo {
	return &AdminUsersRepo{db: db}
}

// List returns all admin users ordered by registration date (newest first).
func (r *AdminUsersRepo) List(ctx context.Context) ([]domain.AdminUser, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, email, added_by, added_at FROM admin_users ORDER BY added_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var admins []domain.AdminUser
	for rows.Next() {
		var a domain.AdminUser
		if err := rows.Scan(&a.ID, &a.Email, &a.AddedBy, &a.AddedAt); err != nil {
			return nil, err
		}
		admins = append(admins, a)
	}
	return admins, rows.Err()
}

// Add inserts a new admin user. Returns domain.ErrAdminAlreadyExists if the
// email is already registered (UNIQUE constraint violation).
func (r *AdminUsersRepo) Add(ctx context.Context, email, addedBy string) (*domain.AdminUser, error) {
	now := time.Now().UTC()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO admin_users (email, added_by, added_at) VALUES (?, ?, ?)`,
		email, addedBy, now,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			return nil, domain.ErrAdminAlreadyExists
		}
		return nil, err
	}
	return &domain.AdminUser{
		Email:   email,
		AddedBy: addedBy,
		AddedAt: now,
	}, nil
}

// Delete removes an admin by email. Returns domain.ErrAdminNotFound if
// no row matched the given email.
func (r *AdminUsersRepo) Delete(ctx context.Context, email string) error {
	res, err := r.db.ExecContext(ctx,
		`DELETE FROM admin_users WHERE email = ?`, email,
	)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return domain.ErrAdminNotFound
	}
	return nil
}

// Exists returns true if an admin with the given email is present in the table.
func (r *AdminUsersRepo) Exists(ctx context.Context, email string) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM admin_users WHERE email = ?`, email,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// isUniqueConstraintError detects SQLite UNIQUE constraint violation errors
// by inspecting the error message string.
func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return len(msg) > 0 && (contains(msg, "UNIQUE constraint failed") || contains(msg, "constraint failed"))
}

// contains reports whether s contains the substring sub.
// Used to avoid importing "strings" for a single call.
func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && containsStr(s, sub))
}

// containsStr is a naive substring search used by contains.
func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
