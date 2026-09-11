package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"university-chatbot/backend/internal/domain"
)

// AdminUsersRepo implements domain.AdminUsersRepo using SQLite.
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
		`SELECT id, email, role, status, added_by, added_at, updated_at, last_login_at, password_hash
		 FROM admin_users ORDER BY added_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var admins []domain.AdminUser
	for rows.Next() {
		var a domain.AdminUser
		var roleStr, statusStr string
		var lastLoginStr sql.NullString
		if err := rows.Scan(
			&a.ID, &a.Email, &roleStr, &statusStr, &a.AddedBy,
			&a.AddedAt, &a.UpdatedAt, &lastLoginStr, &a.PasswordHash,
		); err != nil {
			return nil, err
		}
		a.Role = domain.Role(roleStr)
		a.Status = domain.AdminStatus(statusStr)
		if lastLoginStr.Valid {
			t := parseSQLTime(lastLoginStr.String)
			a.LastLoginAt = t
		}
		admins = append(admins, a)
	}
	return admins, rows.Err()
}

// GetByEmail retrieves an admin user by email (case-insensitive).
func (r *AdminUsersRepo) GetByEmail(ctx context.Context, email string) (*domain.AdminUser, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	var a domain.AdminUser
	var roleStr, statusStr string
	var lastLoginStr sql.NullString
	err := r.db.QueryRowContext(ctx,
		`SELECT id, email, role, status, added_by, added_at, updated_at, last_login_at, password_hash
		 FROM admin_users WHERE LOWER(email) = ?`, email,
	).Scan(
		&a.ID, &a.Email, &roleStr, &statusStr, &a.AddedBy,
		&a.AddedAt, &a.UpdatedAt, &lastLoginStr, &a.PasswordHash,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrAdminNotFound
	}
	if err != nil {
		return nil, err
	}
	a.Role = domain.Role(roleStr)
	a.Status = domain.AdminStatus(statusStr)
	if lastLoginStr.Valid {
		a.LastLoginAt = parseSQLTime(lastLoginStr.String)
	}
	return &a, nil
}

// Add inserts a new admin user.
func (r *AdminUsersRepo) Add(ctx context.Context, email string, role domain.Role, status domain.AdminStatus, addedBy string) (*domain.AdminUser, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if role == "" {
		role = domain.RoleNewsEditor
	}
	if status == "" {
		status = domain.AdminStatusActive
	}
	now := time.Now().UTC()
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO admin_users (email, role, status, added_by, added_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
		email, string(role), string(status), addedBy, now, now,
	)
	if err != nil {
		if isUniqueConstraintError(err) {
			return nil, domain.ErrAdminAlreadyExists
		}
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &domain.AdminUser{
		ID:        id,
		Email:     email,
		Role:      role,
		Status:    status,
		AddedBy:   addedBy,
		AddedAt:   now,
		UpdatedAt: now,
	}, nil
}

// UpdateRole updates the administrative role of an admin.
func (r *AdminUsersRepo) UpdateRole(ctx context.Context, email string, role domain.Role) error {
	email = strings.ToLower(strings.TrimSpace(email))
	res, err := r.db.ExecContext(ctx,
		`UPDATE admin_users SET role = ?, updated_at = ? WHERE LOWER(email) = ?`,
		string(role), time.Now().UTC(), email,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrAdminNotFound
	}
	return nil
}

// UpdateStatus updates the status (active/disabled) of an admin account.
func (r *AdminUsersRepo) UpdateStatus(ctx context.Context, email string, status domain.AdminStatus) error {
	email = strings.ToLower(strings.TrimSpace(email))
	res, err := r.db.ExecContext(ctx,
		`UPDATE admin_users SET status = ?, updated_at = ? WHERE LOWER(email) = ?`,
		string(status), time.Now().UTC(), email,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return domain.ErrAdminNotFound
	}
	return nil
}

// UpdateLastLogin updates the last login timestamp for the given admin.
func (r *AdminUsersRepo) UpdateLastLogin(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	now := time.Now().UTC()
	_, err := r.db.ExecContext(ctx,
		`UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE LOWER(email) = ?`,
		now, now, email,
	)
	return err
}

// CountTotal returns the total number of admin users in the table.
func (r *AdminUsersRepo) CountTotal(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM admin_users`).Scan(&count)
	return count, err
}

// Delete removes an admin by email.
func (r *AdminUsersRepo) Delete(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	res, err := r.db.ExecContext(ctx,
		`DELETE FROM admin_users WHERE LOWER(email) = ?`, email,
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
	email = strings.ToLower(strings.TrimSpace(email))
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM admin_users WHERE LOWER(email) = ?`, email,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CountActiveSuperAdmins returns the number of active super_admin accounts.
func (r *AdminUsersRepo) CountActiveSuperAdmins(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin' AND status = 'active'`,
	).Scan(&count)
	return count, err
}

func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return len(msg) > 0 && strings.Contains(msg, "UNIQUE constraint failed")
}
