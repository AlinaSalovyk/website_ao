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
	{
		Version:     9,
		Description: "news module: categories, articles, translations, tags, slug history, FTS5",
		SQL: `
		CREATE TABLE IF NOT EXISTS news_categories (
			id      TEXT PRIMARY KEY,
			slug    TEXT NOT NULL UNIQUE,
			name_uk TEXT NOT NULL,
			name_en TEXT NOT NULL
		);

		INSERT OR IGNORE INTO news_categories (id, slug, name_uk, name_en) VALUES
			('cat-news',          'news',          'Новини',       'News'),
			('cat-events',        'events',        'Події',        'Events'),
			('cat-science',       'science',       'Наука',        'Science'),
			('cat-achievements',  'achievements',  'Досягнення',   'Achievements'),
			('cat-conferences',   'conferences',   'Конференції',  'Conferences');

		CREATE TABLE IF NOT EXISTS news_articles (
			id               TEXT PRIMARY KEY,
			status           TEXT NOT NULL DEFAULT 'draft'
			                      CHECK (status IN ('draft', 'published')),
			category_id      TEXT NOT NULL DEFAULT 'cat-news'
			                      REFERENCES news_categories(id),
			author_name      TEXT NOT NULL DEFAULT '',
			author_avatar    TEXT NOT NULL DEFAULT '',
			author_position  TEXT NOT NULL DEFAULT '',
			image_url        TEXT NOT NULL DEFAULT '',
			is_pinned        INTEGER NOT NULL DEFAULT 0,
			preview_token    TEXT UNIQUE,
			publish_at       DATETIME,
			published_at     DATETIME,
			created_by       TEXT NOT NULL DEFAULT 'system',
			created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at       DATETIME
		);
		CREATE INDEX IF NOT EXISTS idx_news_status      ON news_articles(status, publish_at DESC);
		CREATE INDEX IF NOT EXISTS idx_news_category    ON news_articles(category_id);
		CREATE INDEX IF NOT EXISTS idx_news_pinned      ON news_articles(is_pinned);
		CREATE INDEX IF NOT EXISTS idx_news_preview     ON news_articles(preview_token);
		CREATE INDEX IF NOT EXISTS idx_news_deleted     ON news_articles(deleted_at);
		CREATE INDEX IF NOT EXISTS idx_news_created     ON news_articles(created_at DESC);

		CREATE TABLE IF NOT EXISTS news_translations (
			article_id      TEXT    NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
			locale          TEXT    NOT NULL CHECK (locale IN ('uk', 'en')),
			title           TEXT    NOT NULL DEFAULT '',
			slug            TEXT    NOT NULL DEFAULT '',
			description     TEXT    NOT NULL DEFAULT '',
			content         TEXT    NOT NULL DEFAULT '',
			seo_title       TEXT    NOT NULL DEFAULT '',
			seo_description TEXT    NOT NULL DEFAULT '',
			keywords        TEXT    NOT NULL DEFAULT '',
			PRIMARY KEY (article_id, locale),
			UNIQUE (locale, slug)
		);
		CREATE INDEX IF NOT EXISTS idx_news_trans_slug ON news_translations(locale, slug);

		CREATE TABLE IF NOT EXISTS news_slug_history (
			id          TEXT NOT NULL PRIMARY KEY,
			article_id  TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
			locale      TEXT NOT NULL CHECK (locale IN ('uk', 'en')),
			old_slug    TEXT NOT NULL,
			replaced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (locale, old_slug)
		);
		CREATE INDEX IF NOT EXISTS idx_news_slug_hist ON news_slug_history(locale, old_slug);

		CREATE TABLE IF NOT EXISTS news_tags (
			id   TEXT PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS news_article_tags (
			article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
			tag_id     TEXT NOT NULL REFERENCES news_tags(id)     ON DELETE CASCADE,
			PRIMARY KEY (article_id, tag_id)
		);
		CREATE INDEX IF NOT EXISTS idx_news_art_tags ON news_article_tags(article_id);

		CREATE VIRTUAL TABLE IF NOT EXISTS news_fts USING fts5(
			title,
			description,
			content,
			locale   UNINDEXED,
			article_id UNINDEXED,
			content='news_translations',
			content_rowid='rowid'
		);`,
	},
	{
		Version:     10,
		Description: "news module: dynamic categories with translations, styling, soft delete, and slug history",
		SQL: `
		CREATE TABLE IF NOT EXISTS news_category_translations (
			category_id     TEXT    NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
			locale          TEXT    NOT NULL CHECK (locale IN ('uk', 'en')),
			name            TEXT    NOT NULL DEFAULT '',
			slug            TEXT    NOT NULL DEFAULT '',
			description     TEXT    NOT NULL DEFAULT '',
			seo_title       TEXT    NOT NULL DEFAULT '',
			seo_description TEXT    NOT NULL DEFAULT '',
			PRIMARY KEY (category_id, locale),
			UNIQUE (locale, slug)
		);
		CREATE INDEX IF NOT EXISTS idx_news_cat_trans_slug ON news_category_translations(locale, slug);

		-- Migrate existing names to translations
		INSERT OR IGNORE INTO news_category_translations (category_id, locale, name, slug)
		SELECT id, 'uk', name_uk, slug FROM news_categories;
		
		INSERT OR IGNORE INTO news_category_translations (category_id, locale, name, slug)
		SELECT id, 'en', name_en, slug || '-en' FROM news_categories;

		-- We do NOT drop name_uk, name_en, slug from news_categories to maintain compatibility with older SQLite versions,
		-- but we will no longer use them in the Go domain model.

		ALTER TABLE news_categories ADD COLUMN cover_image TEXT NOT NULL DEFAULT '';
		ALTER TABLE news_categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'folder';
		ALTER TABLE news_categories ADD COLUMN color TEXT NOT NULL DEFAULT 'primary';
		ALTER TABLE news_categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
		ALTER TABLE news_categories ADD COLUMN status TEXT NOT NULL DEFAULT 'visible';
		ALTER TABLE news_categories ADD COLUMN created_at DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00';
		ALTER TABLE news_categories ADD COLUMN updated_at DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00';
		ALTER TABLE news_categories ADD COLUMN deleted_at DATETIME;

		CREATE INDEX IF NOT EXISTS idx_news_cat_sort ON news_categories(sort_order);
		CREATE INDEX IF NOT EXISTS idx_news_cat_deleted ON news_categories(deleted_at);

		CREATE TABLE IF NOT EXISTS category_slug_history (
			id          TEXT NOT NULL PRIMARY KEY,
			category_id TEXT NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
			locale      TEXT NOT NULL CHECK (locale IN ('uk', 'en')),
			old_slug    TEXT NOT NULL,
			replaced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (locale, old_slug)
		);
		CREATE INDEX IF NOT EXISTS idx_cat_slug_hist ON category_slug_history(locale, old_slug);
		`,
	},
	{
		Version:     13,
		Description: "add cover_position to news_categories",
		SQL: `
		ALTER TABLE news_categories ADD COLUMN cover_position TEXT NOT NULL DEFAULT 'center';
		`,
	},
	{
		Version:     14,
		Description: "add cover_position, gallery, video_url, video_poster to news_articles",
		SQL: `
		ALTER TABLE news_articles ADD COLUMN cover_position TEXT NOT NULL DEFAULT 'center';
		ALTER TABLE news_articles ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]';
		ALTER TABLE news_articles ADD COLUMN video_url TEXT NOT NULL DEFAULT '';
		ALTER TABLE news_articles ADD COLUMN video_poster TEXT NOT NULL DEFAULT '';
		`,
	},
	{
		Version:     15,
		Description: "backfill published_at for published articles with missing or zero timestamps",
		SQL: `
		UPDATE news_articles
		SET published_at = created_at
		WHERE status = 'published' AND (published_at IS NULL OR published_at LIKE '0001%');
		`,
	},
	{
		Version:     16,
		Description: "admin invitations and RBAC roles support for admin_users",
		SQL: `
		CREATE TABLE IF NOT EXISTS admin_users_new (
			id            INTEGER PRIMARY KEY AUTOINCREMENT,
			email         TEXT NOT NULL UNIQUE,
			role          TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'news_editor', 'chatbot_admin')),
			status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending')),
			added_by      TEXT NOT NULL DEFAULT 'system',
			added_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_login_at DATETIME,
			password_hash TEXT NOT NULL DEFAULT ''
		);

		INSERT OR IGNORE INTO admin_users_new (id, email, added_by, added_at)
		SELECT id, LOWER(TRIM(email)), added_by, added_at FROM admin_users;

		DROP TABLE IF EXISTS admin_users;
		ALTER TABLE admin_users_new RENAME TO admin_users;
		CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

		CREATE TABLE IF NOT EXISTS admin_invitations (
			id                  TEXT PRIMARY KEY,
			email               TEXT NOT NULL,
			role                TEXT NOT NULL CHECK (role IN ('super_admin', 'news_editor', 'chatbot_admin')),
			token_hash          TEXT NOT NULL UNIQUE,
			invited_by_admin_id TEXT NOT NULL DEFAULT 'system',
			created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			expires_at          DATETIME NOT NULL,
			accepted_at         DATETIME,
			revoked_at          DATETIME,
			last_sent_at        DATETIME
		);
		CREATE INDEX IF NOT EXISTS idx_invitations_email ON admin_invitations(email);
		CREATE INDEX IF NOT EXISTS idx_invitations_token ON admin_invitations(token_hash);
		`,
	},
	{
		Version:     17,
		Description: "admin_oauth_states table for persistent OAuth state continuation",
		SQL: `
		CREATE TABLE IF NOT EXISTS admin_oauth_states (
			state_hash    TEXT PRIMARY KEY,
			invitation_id TEXT DEFAULT '',
			purpose       TEXT NOT NULL DEFAULT 'login',
			created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			expires_at    DATETIME NOT NULL,
			consumed_at   DATETIME
		);
		CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON admin_oauth_states(expires_at);
		`,
	},
	{
		Version:     18,
		Description: "add delivery_status column to admin_invitations table",
		SQL: `
		ALTER TABLE admin_invitations ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('pending', 'sent', 'delivery_failed'));
		`,
	},
	{
		Version:     19,
		Description: "recreate admin_invitations with nullable last_sent_at",
		SQL: `
		CREATE TABLE IF NOT EXISTS admin_invitations_new (
			id                  TEXT PRIMARY KEY,
			email               TEXT NOT NULL,
			role                TEXT NOT NULL CHECK (role IN ('super_admin', 'news_editor', 'chatbot_admin')),
			token_hash          TEXT NOT NULL UNIQUE,
			invited_by_admin_id TEXT NOT NULL DEFAULT 'system',
			created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			expires_at          DATETIME NOT NULL,
			accepted_at         DATETIME,
			revoked_at          DATETIME,
			last_sent_at        DATETIME,
			delivery_status     TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('pending', 'sent', 'delivery_failed'))
		);

		INSERT OR IGNORE INTO admin_invitations_new (
			id, email, role, token_hash, invited_by_admin_id, created_at, expires_at, accepted_at, revoked_at, last_sent_at, delivery_status
		) SELECT id, email, role, token_hash, invited_by_admin_id, created_at, expires_at, accepted_at, revoked_at, last_sent_at, COALESCE(delivery_status, 'sent') FROM admin_invitations;

		DROP TABLE IF EXISTS admin_invitations;
		ALTER TABLE admin_invitations_new RENAME TO admin_invitations;
		CREATE INDEX IF NOT EXISTS idx_invitations_email ON admin_invitations(email);
		CREATE INDEX IF NOT EXISTS idx_invitations_token ON admin_invitations(token_hash);
		`,
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
