package sqlite

import (
	"context"
	"database/sql"
	"fmt"

	"university-chatbot/backend/internal/domain"
)

// AuditRepo implements domain.AuditRepo using SQLite.
// Records admin actions (login, upload, delete, etc.) in the "audit_log" table.
type AuditRepo struct {
	db *sql.DB
}

// NewAuditRepo creates a new AuditRepo.
func NewAuditRepo(db *sql.DB) *AuditRepo {
	return &AuditRepo{db: db}
}

// Record inserts a new audit log entry for the given admin action.
// Returns a wrapped error with "audit record:" prefix on failure.
func (r *AuditRepo) Record(ctx context.Context, entry domain.AuditEntry) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO audit_log (admin_email, action, target, details, ip) VALUES (?, ?, ?, ?, ?)`,
		entry.AdminEmail, string(entry.Action), entry.Target, entry.Details, entry.IP,
	)
	if err != nil {
		return fmt.Errorf("audit record: %w", err)
	}
	return nil
}

// List returns paginated audit entries ordered by created_at DESC,
// along with the total row count across all pages.
// Clamps limit to [1, 500] and offset to >= 0.
func (r *AuditRepo) List(ctx context.Context, offset, limit int) ([]domain.AuditEntry, int, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}
	if offset < 0 {
		offset = 0
	}

	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM audit_log").Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("audit count: %w", err)
	}

	rows, err := r.db.QueryContext(ctx,
		`SELECT id, admin_email, action, target, details, ip, created_at
		 FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("audit list: %w", err)
	}
	defer rows.Close()

	var entries []domain.AuditEntry
	for rows.Next() {
		var e domain.AuditEntry
		var action string
		if err := rows.Scan(&e.ID, &e.AdminEmail, &action, &e.Target, &e.Details, &e.IP, &e.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("audit scan: %w", err)
		}
		e.Action = domain.AdminAction(action)
		entries = append(entries, e)
	}

	return entries, total, rows.Err()
}
