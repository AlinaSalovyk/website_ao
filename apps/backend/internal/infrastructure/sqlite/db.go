// Package sqlite provides SQLite-backed implementations of all domain
// repository interfaces (AnalyticsRepo, DocumentRepo, AuditRepo, PromptRepo,
// SuggestionsRepo, AdminUsersRepo) plus the versioned migration system.
package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	_ "modernc.org/sqlite"
)

// InitDB opens a SQLite database at the given DSN, configures WAL mode,
// busy timeout, and foreign keys, then runs all pending migrations.
// Returns an *sql.DB with MaxOpenConns=1 (SQLite serialization).
func InitDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("sqlite open: %w", err)
	}

	pragmas := []string{
		"PRAGMA journal_mode=WAL;",
		"PRAGMA busy_timeout=5000;",
		"PRAGMA synchronous=NORMAL;",
		"PRAGMA foreign_keys=ON;",
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			slog.Warn("SQLite PRAGMA failed", "pragma", p, "error", err)
		}
	}

	db.SetMaxOpenConns(1)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("sqlite ping: %w", err)
	}

	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("sqlite migrate: %w", err)
	}

	return db, nil
}

// migration describes a single versioned database schema change.
// Applied in order by runMigrations; already-applied versions are skipped.
type migration struct {
	Version     int    // Monotonically increasing version number.
	Description string // Human-readable summary written to schema_version.
	SQL         string // DDL statements to execute inside a transaction.
}

// migrations is the ordered list of all schema migrations.
// Add new entries at the end; never modify existing versions.
var migrations = []migration{
	{
		Version:     1,
		Description: "upload_jobs table",
		SQL: `
		CREATE TABLE IF NOT EXISTS upload_jobs (
			id TEXT PRIMARY KEY,
			filename TEXT NOT NULL,
			status TEXT NOT NULL,
			error TEXT,
			progress INTEGER NOT NULL DEFAULT 0,
			current_step TEXT NOT NULL DEFAULT '',
			chunks_count INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		);`,
	},
	{
		Version:     2,
		Description: "documents table for knowledge base management",
		SQL: `
		CREATE TABLE IF NOT EXISTS documents (
			id TEXT PRIMARY KEY,
			filename TEXT NOT NULL,
			doc_type TEXT NOT NULL DEFAULT 'general',
			language TEXT CHECK(language IN ('uk', 'en')) DEFAULT 'uk',
			chunk_count INTEGER NOT NULL DEFAULT 0,
			summary TEXT DEFAULT '',
			uploaded_by TEXT NOT NULL DEFAULT 'system',
			uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);`,
	},
	{
		Version:     3,
		Description: "audit_log table for admin action tracking",
		SQL: `
		CREATE TABLE IF NOT EXISTS audit_log (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			admin_email TEXT NOT NULL,
			action TEXT NOT NULL,
			target TEXT DEFAULT '',
			details TEXT DEFAULT '',
			ip TEXT DEFAULT '',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
		CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_log(admin_email);`,
	},
	{
		Version:     4,
		Description: "prompt_variants table for A/B testing",
		SQL: `
		CREATE TABLE IF NOT EXISTS prompt_variants (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			language TEXT CHECK(language IN ('uk', 'en')) DEFAULT 'uk',
			prompt_text TEXT NOT NULL,
			is_active INTEGER NOT NULL DEFAULT 1,
			usage_count INTEGER NOT NULL DEFAULT 0,
			total_score REAL NOT NULL DEFAULT 0,
			score_count INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`,
	},
	{
		Version:     5,
		Description: "suggested_questions table",
		SQL: `
		CREATE TABLE IF NOT EXISTS suggested_questions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			question TEXT NOT NULL,
			language TEXT CHECK(language IN ('uk', 'en')) DEFAULT 'uk',
			is_auto INTEGER NOT NULL DEFAULT 0,
			priority INTEGER NOT NULL DEFAULT 100,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_suggestions_lang ON suggested_questions(language, priority);`,
	},
	{
		Version:     6,
		Description: "queries table for analytics (moved from analytics_repo inline schema)",
		SQL: `
		CREATE TABLE IF NOT EXISTS queries (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			query_hash  TEXT    NOT NULL,
			query_text  TEXT    NOT NULL DEFAULT '',
			language    TEXT    CHECK(language IN ('uk', 'en')) DEFAULT 'uk',
			response_ms INTEGER NOT NULL DEFAULT 0,
			sources_cnt INTEGER DEFAULT 0,
			feedback    INTEGER DEFAULT 0,
			is_blocked  INTEGER DEFAULT 0,
			created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_created_at ON queries(created_at);
		CREATE INDEX IF NOT EXISTS idx_query_hash  ON queries(query_hash);
		CREATE INDEX IF NOT EXISTS idx_feedback    ON queries(feedback);`,
	},
	{
		Version:     7,
		Description: "admin_settings table for auto-admin first user",
		SQL: `
		CREATE TABLE IF NOT EXISTS admin_settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL DEFAULT '',
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`,
	},
	{
		Version:     8,
		Description: "admin_users table for multi-admin management",
		SQL: `
		CREATE TABLE IF NOT EXISTS admin_users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			added_by TEXT NOT NULL DEFAULT 'system',
			added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);`,
	},
}

// runMigrations creates the schema_version table if absent, then iterates
// migrations in order, applying each inside its own transaction.
// Rolls back and returns an error on any failure.
func runMigrations(db *sql.DB) error {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_version (
		version INTEGER PRIMARY KEY,
		description TEXT NOT NULL,
		applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return fmt.Errorf("create schema_version table: %w", err)
	}

	for _, m := range migrations {
		var count int
		err := db.QueryRow(`SELECT COUNT(*) FROM schema_version WHERE version = ?`, m.Version).Scan(&count)
		if err != nil {
			return fmt.Errorf("check migration v%d: %w", m.Version, err)
		}
		if count > 0 {
			continue
		}

		slog.Info("Applying migration", "version", m.Version, "description", m.Description)
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("begin tx for migration v%d: %w", m.Version, err)
		}

		if _, err := tx.Exec(m.SQL); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("migration v%d (%s): %w", m.Version, m.Description, err)
		}

		if _, err := tx.Exec(
			"INSERT OR IGNORE INTO schema_version (version, description) VALUES (?, ?)",
			m.Version, m.Description,
		); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("record migration v%d: %w", m.Version, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration v%d: %w", m.Version, err)
		}
	}

	return nil
}
