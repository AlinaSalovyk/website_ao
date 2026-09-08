package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"university-chatbot/backend/internal/domain"

	"github.com/google/uuid"
)

// NewsRepo implements domain.NewsRepo using SQLite via database/sql.
// All write operations are executed inside explicit transactions.
// Query patterns follow the flat-SQL style of sibling repos (document_repo.go, audit_repo.go).
type NewsRepo struct {
	db *sql.DB
}

// NewNewsRepo creates a new NewsRepo.
func NewNewsRepo(db *sql.DB) *NewsRepo {
	return &NewsRepo{db: db}
}

// ─── Write Operations ─────────────────────────────────────────────────────────

// Create inserts a new article, its two locale translations, and its tags
// inside a single transaction.  A random preview_token and UUID id are assigned
// if not already set.
func (r *NewsRepo) Create(ctx context.Context, article *domain.NewsArticle) error {
	if article.ID == "" {
		article.ID = uuid.New().String()
	}
	if article.PreviewToken == "" {
		article.PreviewToken = uuid.New().String()
	}
	now := time.Now().UTC()
	if article.CreatedAt.IsZero() {
		article.CreatedAt = now
	}
	article.UpdatedAt = now
	if article.Status == domain.NewsStatusPublished && (article.PublishedAt == nil || article.PublishedAt.IsZero() || article.PublishedAt.Year() <= 1) {
		article.PublishedAt = &now
	}

	// Pre-check slug uniqueness for both locales before opening the transaction.
	for lang, loc := range article.Locales {
		exists, err := r.SlugExists(ctx, lang, loc.Slug, "")
		if err != nil {
			return fmt.Errorf("news create: slug check: %w", err)
		}
		if exists {
			return domain.ErrNewsSlugConflict
		}
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("news create: begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	galleryJSON, _ := json.Marshal(article.Gallery)
	if len(article.Gallery) == 0 {
		galleryJSON = []byte("[]")
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO news_articles
			(id, status, category_id, author_name, author_avatar, author_position,
			 image_url, cover_position, gallery, video_url, video_poster, is_pinned, preview_token, publish_at, published_at,
			 created_by, created_at, updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		article.ID,
		string(article.Status),
		article.CategoryID,
		article.Author.Name,
		article.Author.Avatar,
		article.Author.Position,
		article.ImageURL,
		article.CoverPosition,
		string(galleryJSON),
		article.VideoURL,
		article.VideoPoster,
		boolToInt(article.IsPinned),
		article.PreviewToken,
		nullTime(article.PublishAt),
		nullTime(article.PublishedAt),
		article.CreatedBy,
		article.CreatedAt,
		article.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("news create: insert article: %w", err)
	}

	if err := insertTranslations(ctx, tx, article.ID, article.Locales); err != nil {
		return fmt.Errorf("news create: %w", err)
	}

	if err := syncTags(ctx, tx, article.ID, article.Tags); err != nil {
		return fmt.Errorf("news create: %w", err)
	}

	if err := syncFTS(ctx, tx, article.ID, article.Locales); err != nil {
		return fmt.Errorf("news create: %w", err)
	}

	return tx.Commit()
}

// Update replaces article metadata, translations, and tags.
// Old slugs that differ from the new ones are written to news_slug_history.
func (r *NewsRepo) Update(ctx context.Context, article *domain.NewsArticle) error {
	now := time.Now().UTC()
	article.UpdatedAt = now

	// Load current slugs before overwriting (for slug history).
	old, err := r.GetByID(ctx, article.ID)
	if err != nil {
		return fmt.Errorf("news update: fetch old: %w", err)
	}

	if article.Status == domain.NewsStatusPublished {
		if article.PublishedAt == nil || article.PublishedAt.IsZero() || article.PublishedAt.Year() <= 1 {
			if old.PublishedAt != nil && !old.PublishedAt.IsZero() && old.PublishedAt.Year() > 1 {
				article.PublishedAt = old.PublishedAt
			} else {
				article.PublishedAt = &now
			}
		}
	}

	// Uniqueness check for changed slugs.
	for lang, newLoc := range article.Locales {
		oldLoc := old.Locales[lang]
		if newLoc.Slug != oldLoc.Slug {
			exists, err := r.SlugExists(ctx, lang, newLoc.Slug, article.ID)
			if err != nil {
				return fmt.Errorf("news update: slug check: %w", err)
			}
			if exists {
				return domain.ErrNewsSlugConflict
			}
		}
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("news update: begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	galleryJSON, _ := json.Marshal(article.Gallery)
	if len(article.Gallery) == 0 {
		galleryJSON = []byte("[]")
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE news_articles SET
			status=?, category_id=?,
			author_name=?, author_avatar=?, author_position=?,
			image_url=?, cover_position=?, gallery=?, video_url=?, video_poster=?, is_pinned=?, publish_at=?,
			published_at=COALESCE(published_at, ?),
			updated_at=?
		WHERE id=? AND deleted_at IS NULL`,
		string(article.Status),
		article.CategoryID,
		article.Author.Name,
		article.Author.Avatar,
		article.Author.Position,
		article.ImageURL,
		article.CoverPosition,
		string(galleryJSON),
		article.VideoURL,
		article.VideoPoster,
		boolToInt(article.IsPinned),
		nullTime(article.PublishAt),
		nullTime(article.PublishedAt),
		article.UpdatedAt,
		article.ID,
	)
	if err != nil {
		return fmt.Errorf("news update: update article: %w", err)
	}

	// Save slug history for changed slugs.
	for lang, newLoc := range article.Locales {
		oldLoc := old.Locales[lang]
		if newLoc.Slug != oldLoc.Slug && oldLoc.Slug != "" {
			if err := insertSlugHistory(ctx, tx, article.ID, lang, oldLoc.Slug); err != nil {
				return fmt.Errorf("news update: slug history: %w", err)
			}
		}
	}

	// Replace translations.
	if _, err := tx.ExecContext(ctx, "DELETE FROM news_translations WHERE article_id=?", article.ID); err != nil {
		return fmt.Errorf("news update: delete translations: %w", err)
	}
	if err := insertTranslations(ctx, tx, article.ID, article.Locales); err != nil {
		return fmt.Errorf("news update: %w", err)
	}

	// Replace tags.
	if _, err := tx.ExecContext(ctx, "DELETE FROM news_article_tags WHERE article_id=?", article.ID); err != nil {
		return fmt.Errorf("news update: delete tags: %w", err)
	}
	if err := syncTags(ctx, tx, article.ID, article.Tags); err != nil {
		return fmt.Errorf("news update: %w", err)
	}

	// Re-index FTS.
	if _, err := tx.ExecContext(ctx, "DELETE FROM news_fts WHERE article_id=?", article.ID); err != nil {
		slog.Warn("FTS delete failed, rebuilding FTS index", "error", err)
		_, _ = tx.ExecContext(ctx, "INSERT INTO news_fts(news_fts) VALUES('rebuild')")
		if _, err2 := tx.ExecContext(ctx, "DELETE FROM news_fts WHERE article_id=?", article.ID); err2 != nil {
			slog.Warn("FTS delete retry failed after rebuild, dropping and recreating news_fts table", "error", err2)
			_, _ = tx.ExecContext(ctx, "DROP TABLE IF EXISTS news_fts")
			_, _ = tx.ExecContext(ctx, `CREATE VIRTUAL TABLE IF NOT EXISTS news_fts USING fts5(
				title, description, content, locale UNINDEXED, article_id UNINDEXED, content='news_translations', content_rowid='rowid'
			)`)
		}
	}
	if err := syncFTS(ctx, tx, article.ID, article.Locales); err != nil {
		slog.Warn("FTS sync warning", "error", err)
	}

	return tx.Commit()
}

// SetStatus transitions the article status. Sets published_at on first publish.
func (r *NewsRepo) SetStatus(ctx context.Context, id string, status domain.NewsStatus) error {
	now := time.Now().UTC()
	var q string
	var args []interface{}
	if status == domain.NewsStatusPublished {
		q = `UPDATE news_articles SET status=?, updated_at=?,
			published_at=COALESCE(published_at, ?)
			WHERE id=? AND deleted_at IS NULL`
		args = []interface{}{string(status), now, now, id}
	} else {
		q = `UPDATE news_articles SET status=?, updated_at=? WHERE id=? AND deleted_at IS NULL`
		args = []interface{}{string(status), now, id}
	}
	res, err := r.db.ExecContext(ctx, q, args...)
	if err != nil {
		return fmt.Errorf("news set status: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return domain.ErrNewsNotFound
	}
	return nil
}

// Delete performs a soft delete by setting deleted_at to UTC now.
func (r *NewsRepo) Delete(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx,
		"UPDATE news_articles SET deleted_at=?, updated_at=? WHERE id=? AND deleted_at IS NULL",
		time.Now().UTC(), time.Now().UTC(), id,
	)
	if err != nil {
		return fmt.Errorf("news delete: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return domain.ErrNewsNotFound
	}
	return nil
}

// Restore clears deleted_at.
func (r *NewsRepo) Restore(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx,
		"UPDATE news_articles SET deleted_at=NULL, updated_at=? WHERE id=?",
		time.Now().UTC(), id,
	)
	if err != nil {
		return fmt.Errorf("news restore: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return domain.ErrNewsNotFound
	}
	return nil
}

// ─── Read Operations ──────────────────────────────────────────────────────────

// GetByID returns the full article (with locales, category, tags).
// Excludes soft-deleted articles.
func (r *NewsRepo) GetByID(ctx context.Context, id string) (*domain.NewsArticle, error) {
	row := r.db.QueryRowContext(ctx, articleBaseQuery+` WHERE a.id=? AND a.deleted_at IS NULL`, id)
	article, err := scanArticleRow(row)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNewsNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("news get by id: %w", err)
	}
	if err := r.loadLocales(ctx, article); err != nil {
		return nil, fmt.Errorf("news get by id: %w", err)
	}
	if err := r.loadTags(ctx, article); err != nil {
		return nil, fmt.Errorf("news get by id: %w", err)
	}
	return article, nil
}

// GetBySlug finds an article by its locale-specific slug.
// Returns wasRedirected=true when the slug was found in news_slug_history or matched another locale's slug.
func (r *NewsRepo) GetBySlug(ctx context.Context, locale domain.Language, slug string) (*domain.NewsArticle, bool, error) {
	slug = strings.TrimSpace(slug)
	// Try current slug with exact locale first.
	row := r.db.QueryRowContext(ctx,
		articleBaseQuery+`
		JOIN news_translations t ON t.article_id=a.id
		WHERE t.locale=? AND t.slug=? AND a.deleted_at IS NULL`,
		string(locale), slug,
	)
	article, err := scanArticleRow(row)
	if err == nil {
		if err := r.loadLocales(ctx, article); err != nil {
			return nil, false, fmt.Errorf("news get by slug: %w", err)
		}
		if err := r.loadTags(ctx, article); err != nil {
			return nil, false, fmt.Errorf("news get by slug: %w", err)
		}
		return article, false, nil
	}
	if err != sql.ErrNoRows {
		return nil, false, fmt.Errorf("news get by slug: %w", err)
	}

	// Try current slug across ANY locale for active articles.
	rowAny := r.db.QueryRowContext(ctx,
		articleBaseQuery+`
		JOIN news_translations t ON t.article_id=a.id
		WHERE t.slug=? AND a.deleted_at IS NULL`,
		slug,
	)
	article, err = scanArticleRow(rowAny)
	if err == nil {
		if err := r.loadLocales(ctx, article); err != nil {
			return nil, false, fmt.Errorf("news get by slug (any locale): %w", err)
		}
		if err := r.loadTags(ctx, article); err != nil {
			return nil, false, fmt.Errorf("news get by slug (any locale): %w", err)
		}
		wasRedirected := false
		if targetLoc, ok := article.Locales[locale]; ok && targetLoc.Slug != "" && targetLoc.Slug != slug {
			wasRedirected = true
		}
		return article, wasRedirected, nil
	}
	if err != sql.ErrNoRows {
		return nil, false, fmt.Errorf("news get by slug (any locale): %w", err)
	}

	// Fall back to slug history for requested locale first.
	var articleID string
	err = r.db.QueryRowContext(ctx,
		"SELECT article_id FROM news_slug_history WHERE locale=? AND old_slug=?",
		string(locale), slug,
	).Scan(&articleID)
	if err == sql.ErrNoRows {
		// Fall back to slug history for ANY locale.
		err = r.db.QueryRowContext(ctx,
			"SELECT article_id FROM news_slug_history WHERE old_slug=?",
			slug,
		).Scan(&articleID)
	}
	if err == sql.ErrNoRows {
		return nil, false, domain.ErrNewsNotFound
	}
	if err != nil {
		return nil, false, fmt.Errorf("news get by slug (history): %w", err)
	}

	article, err = r.GetByID(ctx, articleID)
	if err != nil {
		return nil, false, err
	}
	return article, true, nil
}

// GetByPreviewToken finds an article by preview token (includes soft-deleted).
func (r *NewsRepo) GetByPreviewToken(ctx context.Context, token string) (*domain.NewsArticle, error) {
	row := r.db.QueryRowContext(ctx, articleBaseQuery+` WHERE a.preview_token=?`, token)
	article, err := scanArticleRow(row)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNewsNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("news get by preview token: %w", err)
	}
	if err := r.loadLocales(ctx, article); err != nil {
		return nil, fmt.Errorf("news get by preview token: %w", err)
	}
	if err := r.loadTags(ctx, article); err != nil {
		return nil, fmt.Errorf("news get by preview token: %w", err)
	}
	return article, nil
}

// List returns a page of articles matching opts plus the total count.
func (r *NewsRepo) List(ctx context.Context, opts domain.NewsListOptions) ([]domain.NewsArticle, int, error) {
	if opts.Limit <= 0 {
		opts.Limit = 12
	}
	if opts.SortBy == "" {
		opts.SortBy = "published_at"
	}
	if opts.SortDir == "" {
		opts.SortDir = "desc"
	}
	// Whitelist sort fields to prevent SQL injection.
	allowedSort := map[string]string{
		"published_at": "a.published_at",
		"created_at":   "a.created_at",
	}
	sortCol, ok := allowedSort[opts.SortBy]
	if !ok {
		sortCol = "a.published_at"
	}
	if opts.SortDir != "asc" {
		opts.SortDir = "desc"
	}

	var where []string
	var args []interface{}

	if !opts.IncludeDeleted {
		where = append(where, "a.deleted_at IS NULL")
	}
	if opts.Status != "" {
		where = append(where, "a.status=?")
		args = append(args, string(opts.Status))
		if opts.Status == domain.NewsStatusPublished {
			where = append(where, "(a.publish_at IS NULL OR a.publish_at <= datetime('now'))")
		}
	}
	if opts.CategoryID != "" {
		where = append(where, "a.category_id=?")
		args = append(args, opts.CategoryID)
	}
	if opts.IsPinned != nil {
		where = append(where, "a.is_pinned=?")
		args = append(args, boolToInt(*opts.IsPinned))
	}

	// FTS5 search when a query is provided.
	if opts.Search != "" {
		where = append(where, "a.id IN (SELECT article_id FROM news_fts WHERE news_fts MATCH ?)")
		args = append(args, opts.Search+"*")
	}

	// Tag filter: article must have at least one of the requested tags.
	if len(opts.Tags) > 0 {
		placeholders := strings.Repeat("?,", len(opts.Tags))
		placeholders = placeholders[:len(placeholders)-1]
		where = append(where,
			"EXISTS (SELECT 1 FROM news_article_tags nat JOIN news_tags nt ON nt.id=nat.tag_id "+
				"WHERE nat.article_id=a.id AND nt.slug IN ("+placeholders+"))",
		)
		for _, t := range opts.Tags {
			args = append(args, t)
		}
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = " WHERE " + strings.Join(where, " AND ")
	}

	// Count query.
	var total int
	countQ := "SELECT COUNT(*) FROM news_articles a" + whereClause
	if err := r.db.QueryRowContext(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("news list count: %w", err)
	}

	// Data query.
	dataQ := articleBaseQuery + whereClause +
		" ORDER BY a.is_pinned DESC, " + sortCol + " " + opts.SortDir +
		", a.created_at DESC" +
		" LIMIT ? OFFSET ?"
	dataArgs := append(args, opts.Limit, opts.Offset)

	rows, err := r.db.QueryContext(ctx, dataQ, dataArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("news list query: %w", err)
	}
	defer rows.Close()

	var articles []domain.NewsArticle
	for rows.Next() {
		a, err := scanArticleRow(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("news list scan: %w", err)
		}
		articles = append(articles, *a)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("news list rows: %w", err)
	}

	// Batch-load locales and tags to avoid N+1.
	if len(articles) > 0 {
		if err := r.batchLoadLocales(ctx, articles); err != nil {
			return nil, 0, fmt.Errorf("news list locales: %w", err)
		}
		if err := r.batchLoadTags(ctx, articles); err != nil {
			return nil, 0, fmt.Errorf("news list tags: %w", err)
		}
	}

	if articles == nil {
		articles = []domain.NewsArticle{}
	}
	return articles, total, nil
}

// GetAllPublishedSlugs returns slim entries for sitemap and RSS.
func (r *NewsRepo) GetAllPublishedSlugs(ctx context.Context) ([]domain.NewsSlugEntry, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.id, t.locale, t.slug, t.title, a.updated_at
		FROM news_articles a
		JOIN news_translations t ON t.article_id=a.id
		WHERE a.status='published'
		  AND a.deleted_at IS NULL
		  AND (a.publish_at IS NULL OR a.publish_at <= datetime('now'))
		ORDER BY a.published_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("news get all slugs: %w", err)
	}
	defer rows.Close()

	var entries []domain.NewsSlugEntry
	for rows.Next() {
		var e domain.NewsSlugEntry
		var locale string
		var updatedAt string
		if err := rows.Scan(&e.ArticleID, &locale, &e.Slug, &e.Title, &updatedAt); err != nil {
			return nil, fmt.Errorf("news get all slugs scan: %w", err)
		}
		e.Locale = domain.Language(locale)
		e.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []domain.NewsSlugEntry{}
	}
	return entries, rows.Err()
}

// SlugExists reports whether the given locale+slug is taken by any article except excludeID.
func (r *NewsRepo) SlugExists(ctx context.Context, locale domain.Language, slug string, excludeID string) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM news_translations WHERE locale=? AND slug=? AND article_id!=?",
		string(locale), slug, excludeID,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("news slug exists: %w", err)
	}
	return count > 0, nil
}

// SaveSlugHistory inserts an old slug into news_slug_history.
// Uses INSERT OR IGNORE to handle the UNIQUE(locale, old_slug) constraint gracefully.
func (r *NewsRepo) SaveSlugHistory(ctx context.Context, articleID string, locale domain.Language, oldSlug string) error {
	_, err := r.db.ExecContext(ctx,
		"INSERT OR IGNORE INTO news_slug_history (id, article_id, locale, old_slug, replaced_at) VALUES (?,?,?,?,?)",
		uuid.New().String(), articleID, string(locale), oldSlug, time.Now().UTC(),
	)
	if err != nil {
		return fmt.Errorf("news save slug history: %w", err)
	}
	return nil
}

// SetImageURL atomically updates the image_url column of an article.
// Avoids a GetByID+Update round-trip when only the cover image changes.
func (r *NewsRepo) SetImageURL(ctx context.Context, id string, imageURL string) error {
	res, err := r.db.ExecContext(ctx,
		"UPDATE news_articles SET image_url=?, updated_at=? WHERE id=? AND deleted_at IS NULL",
		imageURL, time.Now().UTC(), id,
	)
	if err != nil {
		return fmt.Errorf("news set image url: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return domain.ErrNewsNotFound
	}
	return nil
}

// GetCategories returns all categories, including their localized data and article count.
// Excludes soft-deleted categories.
func (r *NewsRepo) GetCategories(ctx context.Context) ([]domain.NewsCategory, error) {
	query := `
		SELECT
			c.id, c.color, c.icon, c.cover_image, COALESCE(c.cover_position, 'center'), c.sort_order, c.status,
			c.created_at, c.updated_at,
			(SELECT COUNT(*) FROM news_articles WHERE category_id = c.id AND deleted_at IS NULL) as articles_count,
			t.locale, t.name, t.slug, t.description, t.seo_title, t.seo_description
		FROM news_categories c
		LEFT JOIN news_category_translations t ON t.category_id = c.id
		WHERE c.deleted_at IS NULL
		ORDER BY c.sort_order ASC, c.created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("news get categories: %w", err)
	}
	defer rows.Close()

	catMap := make(map[string]*domain.NewsCategory)
	var orderedIDs []string

	for rows.Next() {
		var id, color, icon, coverImage, coverPosition, statusStr, createdAtStr, updatedAtStr string
		var sortOrder, articlesCount int
		var locale, name, slug, desc, seoTitle, seoDesc sql.NullString

		if err := rows.Scan(
			&id, &color, &icon, &coverImage, &coverPosition, &sortOrder, &statusStr,
			&createdAtStr, &updatedAtStr, &articlesCount,
			&locale, &name, &slug, &desc, &seoTitle, &seoDesc,
		); err != nil {
			return nil, fmt.Errorf("news get categories scan: %w", err)
		}

		cat, ok := catMap[id]
		if !ok {
			ca, _ := time.Parse("2006-01-02 15:04:05", createdAtStr)
			ua, _ := time.Parse("2006-01-02 15:04:05", updatedAtStr)
			if coverPosition == "" {
				coverPosition = "center"
			}
			cat = &domain.NewsCategory{
				ID:            id,
				Color:         color,
				Icon:          icon,
				CoverImage:    coverImage,
				CoverPosition: coverPosition,
				SortOrder:     sortOrder,
				Status:        domain.CategoryStatus(statusStr),
				CreatedAt:     ca,
				UpdatedAt:     ua,
				ArticlesCount: articlesCount,
				Locales:       make(map[domain.Language]domain.CategoryLocale),
			}
			catMap[id] = cat
			orderedIDs = append(orderedIDs, id)
		}

		if locale.Valid {
			cat.Locales[domain.Language(locale.String)] = domain.CategoryLocale{
				Locale:         domain.Language(locale.String),
				Name:           name.String,
				Slug:           slug.String,
				Description:    desc.String,
				SEOTitle:       seoTitle.String,
				SEODescription: seoDesc.String,
			}
		}
	}

	cats := make([]domain.NewsCategory, 0, len(orderedIDs))
	for _, id := range orderedIDs {
		cats = append(cats, *catMap[id])
	}
	return cats, rows.Err()
}

// GetCategoryBySlug finds a category by its localized slug.
func (r *NewsRepo) GetCategoryBySlug(ctx context.Context, locale domain.Language, slug string) (*domain.NewsCategory, error) {
	// 1. Find category ID by slug
	var id string
	err := r.db.QueryRowContext(ctx, `
		SELECT c.id
		FROM news_categories c
		JOIN news_category_translations t ON t.category_id = c.id
		WHERE t.locale = ? AND t.slug = ? AND c.deleted_at IS NULL
	`, string(locale), slug).Scan(&id)

	if err == sql.ErrNoRows {
		// Check slug history for 301
		errHistory := r.db.QueryRowContext(ctx, `
			SELECT category_id FROM category_slug_history WHERE locale = ? AND old_slug = ?
		`, string(locale), slug).Scan(&id)
		if errHistory == sql.ErrNoRows {
			return nil, domain.ErrNewsNotFound
		}
		if errHistory != nil {
			return nil, fmt.Errorf("news get category slug history check: %w", errHistory)
		}
		// If found in history, we still return the category (handler should ideally 301, but this allows fetching it)
	} else if err != nil {
		return nil, fmt.Errorf("news get category by slug: %w", err)
	}

	return r.GetCategoryByID(ctx, id)
}

// GetCategoryByID fetches a single category.
func (r *NewsRepo) GetCategoryByID(ctx context.Context, id string) (*domain.NewsCategory, error) {
	query := `
		SELECT
			c.id, c.color, c.icon, c.cover_image, COALESCE(c.cover_position, 'center'), c.sort_order, c.status,
			c.created_at, c.updated_at,
			(SELECT COUNT(*) FROM news_articles WHERE category_id = c.id AND deleted_at IS NULL) as articles_count,
			t.locale, t.name, t.slug, t.description, t.seo_title, t.seo_description
		FROM news_categories c
		LEFT JOIN news_category_translations t ON t.category_id = c.id
		WHERE c.id = ? AND c.deleted_at IS NULL
	`
	rows, err := r.db.QueryContext(ctx, query, id)
	if err != nil {
		return nil, fmt.Errorf("news get category by id: %w", err)
	}
	defer rows.Close()

	var cat *domain.NewsCategory

	for rows.Next() {
		var color, icon, coverImage, coverPosition, statusStr, createdAtStr, updatedAtStr string
		var sortOrder, articlesCount int
		var locale, name, slug, desc, seoTitle, seoDesc sql.NullString

		if err := rows.Scan(
			&id, &color, &icon, &coverImage, &coverPosition, &sortOrder, &statusStr,
			&createdAtStr, &updatedAtStr, &articlesCount,
			&locale, &name, &slug, &desc, &seoTitle, &seoDesc,
		); err != nil {
			return nil, fmt.Errorf("news get category scan: %w", err)
		}

		if cat == nil {
			ca, _ := time.Parse("2006-01-02 15:04:05", createdAtStr)
			ua, _ := time.Parse("2006-01-02 15:04:05", updatedAtStr)
			if coverPosition == "" {
				coverPosition = "center"
			}
			cat = &domain.NewsCategory{
				ID:            id,
				Color:         color,
				Icon:          icon,
				CoverImage:    coverImage,
				CoverPosition: coverPosition,
				SortOrder:     sortOrder,
				Status:        domain.CategoryStatus(statusStr),
				CreatedAt:     ca,
				UpdatedAt:     ua,
				ArticlesCount: articlesCount,
				Locales:       make(map[domain.Language]domain.CategoryLocale),
			}
		}

		if locale.Valid {
			cat.Locales[domain.Language(locale.String)] = domain.CategoryLocale{
				Locale:         domain.Language(locale.String),
				Name:           name.String,
				Slug:           slug.String,
				Description:    desc.String,
				SEOTitle:       seoTitle.String,
				SEODescription: seoDesc.String,
			}
		}
	}

	if cat == nil {
		return nil, domain.ErrNewsNotFound
	}
	return cat, nil
}

// CreateCategory inserts a new dynamic category.
func (r *NewsRepo) CreateCategory(ctx context.Context, cat *domain.NewsCategory) error {
	if cat.ID == "" {
		cat.ID = uuid.New().String()
	}
	now := time.Now().UTC()
	if cat.CreatedAt.IsZero() {
		cat.CreatedAt = now
	}
	cat.UpdatedAt = now
	if cat.CoverPosition == "" {
		cat.CoverPosition = "center"
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("category create tx: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO news_categories (id, color, icon, cover_image, cover_position, sort_order, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, cat.ID, cat.Color, cat.Icon, cat.CoverImage, cat.CoverPosition, cat.SortOrder, string(cat.Status), cat.CreatedAt, cat.UpdatedAt)
	if err != nil {
		return fmt.Errorf("category insert: %w", err)
	}

	for lang, loc := range cat.Locales {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO news_category_translations (category_id, locale, name, slug, description, seo_title, seo_description)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, cat.ID, string(lang), loc.Name, loc.Slug, loc.Description, loc.SEOTitle, loc.SEODescription)
		if err != nil {
			return fmt.Errorf("category translate insert: %w", err)
		}
	}

	return tx.Commit()
}

// UpdateCategory updates an existing dynamic category.
func (r *NewsRepo) UpdateCategory(ctx context.Context, cat *domain.NewsCategory) error {
	cat.UpdatedAt = time.Now().UTC()
	if cat.CoverPosition == "" {
		cat.CoverPosition = "center"
	}

	// Handle slug history
	oldCat, err := r.GetCategoryByID(ctx, cat.ID)
	if err != nil {
		return fmt.Errorf("category update fetch old: %w", err)
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("category update tx: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		UPDATE news_categories SET
			color=?, icon=?, cover_image=?, cover_position=?, status=?, updated_at=?
		WHERE id=? AND deleted_at IS NULL
	`, cat.Color, cat.Icon, cat.CoverImage, cat.CoverPosition, string(cat.Status), cat.UpdatedAt, cat.ID)
	if err != nil {
		return fmt.Errorf("category update fields: %w", err)
	}

	for lang, loc := range cat.Locales {
		oldLoc := oldCat.Locales[lang]
		if oldLoc.Slug != "" && oldLoc.Slug != loc.Slug {
			_, err = tx.ExecContext(ctx,
				"INSERT OR IGNORE INTO category_slug_history (id, category_id, locale, old_slug, replaced_at) VALUES (?,?,?,?,?)",
				uuid.New().String(), cat.ID, string(lang), oldLoc.Slug, time.Now().UTC(),
			)
			if err != nil {
				return fmt.Errorf("category save old slug: %w", err)
			}
		}

		_, err = tx.ExecContext(ctx, `
			INSERT INTO news_category_translations (category_id, locale, name, slug, description, seo_title, seo_description)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(category_id, locale) DO UPDATE SET
				name=excluded.name, slug=excluded.slug, description=excluded.description,
				seo_title=excluded.seo_title, seo_description=excluded.seo_description
		`, cat.ID, string(lang), loc.Name, loc.Slug, loc.Description, loc.SEOTitle, loc.SEODescription)
		if err != nil {
			return fmt.Errorf("category update translation: %w", err)
		}
	}

	return tx.Commit()
}

// SoftDeleteCategory marks a category as deleted and optionally transfers articles.
func (r *NewsRepo) SoftDeleteCategory(ctx context.Context, id string, transferToID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("category delete tx: %w", err)
	}
	defer tx.Rollback()

	if transferToID != "" {
		_, err = tx.ExecContext(ctx, "UPDATE news_articles SET category_id = ? WHERE category_id = ?", transferToID, id)
		if err != nil {
			return fmt.Errorf("category transfer articles: %w", err)
		}
	} else {
		// Ensure it's empty
		var count int
		err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM news_articles WHERE category_id = ? AND deleted_at IS NULL", id).Scan(&count)
		if err != nil {
			return err
		}
		if count > 0 {
			return fmt.Errorf("category in use by %d articles", count)
		}
	}

	_, err = tx.ExecContext(ctx, "UPDATE news_categories SET deleted_at = ? WHERE id = ?", time.Now().UTC(), id)
	if err != nil {
		return fmt.Errorf("category soft delete: %w", err)
	}

	return tx.Commit()
}

// RestoreCategory un-deletes a soft-deleted category.
func (r *NewsRepo) RestoreCategory(ctx context.Context, id string) error {
	res, err := r.db.ExecContext(ctx, "UPDATE news_categories SET deleted_at = NULL, updated_at = ? WHERE id = ?", time.Now().UTC(), id)
	if err != nil {
		return fmt.Errorf("category restore: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return domain.ErrNewsNotFound
	}
	return nil
}

// SetCategoryCover atomically updates ONLY the cover_image column of a category.
func (r *NewsRepo) SetCategoryCover(ctx context.Context, id string, coverImage string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE news_categories SET cover_image = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
		coverImage, time.Now().UTC(), id,
	)
	return err
}

// ReorderCategories bulk updates the sort_order based on array indices.
func (r *NewsRepo) ReorderCategories(ctx context.Context, ids []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("category reorder tx: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, "UPDATE news_categories SET sort_order = ? WHERE id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for i, id := range ids {
		if _, err := stmt.ExecContext(ctx, i, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// GetTags returns all news_tags rows.
func (r *NewsRepo) GetTags(ctx context.Context) ([]domain.Tag, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, slug, name FROM news_tags ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("news get tags: %w", err)
	}
	defer rows.Close()

	var tags []domain.Tag
	for rows.Next() {
		var t domain.Tag
		if err := rows.Scan(&t.ID, &t.Slug, &t.Name); err != nil {
			return nil, fmt.Errorf("news get tags scan: %w", err)
		}
		tags = append(tags, t)
	}
	if tags == nil {
		tags = []domain.Tag{}
	}
	return tags, rows.Err()
}

// EnsureTag finds or creates a tag by slug.
func (r *NewsRepo) EnsureTag(ctx context.Context, slug, name string) (domain.Tag, error) {
	var t domain.Tag
	err := r.db.QueryRowContext(ctx, "SELECT id, slug, name FROM news_tags WHERE slug=?", slug).
		Scan(&t.ID, &t.Slug, &t.Name)
	if err == sql.ErrNoRows {
		t = domain.Tag{ID: uuid.New().String(), Slug: slug, Name: name}
		_, err = r.db.ExecContext(ctx,
			"INSERT OR IGNORE INTO news_tags (id, slug, name) VALUES (?,?,?)",
			t.ID, t.Slug, t.Name,
		)
		if err != nil {
			return domain.Tag{}, fmt.Errorf("news ensure tag: %w", err)
		}
		// Re-read in case INSERT OR IGNORE silently skipped (concurrent insert).
		_ = r.db.QueryRowContext(ctx, "SELECT id, slug, name FROM news_tags WHERE slug=?", slug).
			Scan(&t.ID, &t.Slug, &t.Name)
	} else if err != nil {
		return domain.Tag{}, fmt.Errorf("news ensure tag: %w", err)
	}
	return t, nil
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

// articleBaseQuery is the SELECT for news_articles joined with its category.
// WHERE / ORDER BY / LIMIT clauses are appended by each caller.
const articleBaseQuery = `
	SELECT
		a.id, a.status, a.category_id,
		COALESCE(c.color, ''), COALESCE(c.icon, ''),
		COALESCE(uk.name, ''), COALESCE(uk.slug, ''),
		COALESCE(en.name, ''), COALESCE(en.slug, ''),
		a.author_name, a.author_avatar, a.author_position,
		a.image_url, COALESCE(a.cover_position, 'center'), COALESCE(a.gallery, '[]'), COALESCE(a.video_url, ''), COALESCE(a.video_poster, ''),
		a.is_pinned, a.preview_token,
		a.publish_at, a.published_at,
		a.created_by, a.created_at, a.updated_at, a.deleted_at
	FROM news_articles a
	LEFT JOIN news_categories c ON c.id=a.category_id
	LEFT JOIN news_category_translations uk ON uk.category_id = c.id AND uk.locale = 'uk'
	LEFT JOIN news_category_translations en ON en.category_id = c.id AND en.locale = 'en'`

// rowScanner abstracts *sql.Row and *sql.Rows so a single scan helper covers both.
type rowScanner interface {
	Scan(dest ...any) error
}

// scanArticleRow scans one row from articleBaseQuery into a *NewsArticle.
// Works with both *sql.Row (GetByID, GetBySlug) and *sql.Rows (List).
func scanArticleRow(r rowScanner) (*domain.NewsArticle, error) {
	var a domain.NewsArticle
	var catColor, catIcon string
	var ukName, ukSlug string
	var enName, enSlug string
	var coverPos, galleryStr, videoURL, videoPoster sql.NullString
	var publishAt, publishedAt, deletedAt sql.NullString
	var isPinned int
	err := r.Scan(
		&a.ID, &a.Status, &a.CategoryID,
		&catColor, &catIcon,
		&ukName, &ukSlug,
		&enName, &enSlug,
		&a.Author.Name, &a.Author.Avatar, &a.Author.Position,
		&a.ImageURL, &coverPos, &galleryStr, &videoURL, &videoPoster,
		&isPinned, &a.PreviewToken,
		&publishAt, &publishedAt,
		&a.CreatedBy, &a.CreatedAt, &a.UpdatedAt, &deletedAt,
	)
	if err != nil {
		return nil, err
	}
	a.IsPinned = isPinned == 1
	a.Category = &domain.NewsCategory{
		ID:    a.CategoryID,
		Color: catColor,
		Icon:  catIcon,
		Locales: map[domain.Language]domain.CategoryLocale{
			domain.LangUk: {Locale: domain.LangUk, Name: ukName, Slug: ukSlug},
			domain.LangEn: {Locale: domain.LangEn, Name: enName, Slug: enSlug},
		},
	}
	if coverPos.Valid {
		a.CoverPosition = coverPos.String
	}
	if galleryStr.Valid && galleryStr.String != "" {
		if err := json.Unmarshal([]byte(galleryStr.String), &a.Gallery); err != nil {
			a.Gallery = []string{}
		}
	} else {
		a.Gallery = []string{}
	}
	if videoURL.Valid {
		a.VideoURL = videoURL.String
	}
	if videoPoster.Valid {
		a.VideoPoster = videoPoster.String
	}
	if publishAt.Valid {
		a.PublishAt = parseSQLTime(publishAt.String)
	}
	if publishedAt.Valid {
		a.PublishedAt = parseSQLTime(publishedAt.String)
	}
	if deletedAt.Valid {
		a.DeletedAt = parseSQLTime(deletedAt.String)
	}
	if a.Status == domain.NewsStatusPublished && (a.PublishedAt == nil || a.PublishedAt.IsZero() || a.PublishedAt.Year() <= 1) {
		a.PublishedAt = &a.CreatedAt
	}
	return &a, nil
}

// loadLocales loads both locale translations into article.Locales.
func (r *NewsRepo) loadLocales(ctx context.Context, article *domain.NewsArticle) error {
	rows, err := r.db.QueryContext(ctx,
		`SELECT locale, title, slug, description, content, seo_title, seo_description, keywords
		 FROM news_translations WHERE article_id=?`, article.ID,
	)
	if err != nil {
		return fmt.Errorf("load locales: %w", err)
	}
	defer rows.Close()

	article.Locales = make(map[domain.Language]domain.NewsLocale)
	for rows.Next() {
		var loc domain.NewsLocale
		var locale string
		if err := rows.Scan(&locale, &loc.Title, &loc.Slug, &loc.Description,
			&loc.Content, &loc.SEOTitle, &loc.SEODescription, &loc.Keywords); err != nil {
			return fmt.Errorf("load locales scan: %w", err)
		}
		loc.Locale = domain.Language(locale)
		article.Locales[loc.Locale] = loc
	}
	return rows.Err()
}

// loadTags loads the tags for a single article.
func (r *NewsRepo) loadTags(ctx context.Context, article *domain.NewsArticle) error {
	rows, err := r.db.QueryContext(ctx,
		`SELECT t.id, t.slug, t.name
		 FROM news_tags t
		 JOIN news_article_tags nat ON nat.tag_id=t.id
		 WHERE nat.article_id=? ORDER BY t.name`, article.ID,
	)
	if err != nil {
		return fmt.Errorf("load tags: %w", err)
	}
	defer rows.Close()

	var tags []domain.Tag
	for rows.Next() {
		var tag domain.Tag
		if err := rows.Scan(&tag.ID, &tag.Slug, &tag.Name); err != nil {
			return fmt.Errorf("load tags scan: %w", err)
		}
		tags = append(tags, tag)
	}
	if tags == nil {
		tags = []domain.Tag{}
	}
	article.Tags = tags
	return rows.Err()
}

// batchLoadLocales loads locales for multiple articles in two queries (no N+1).
func (r *NewsRepo) batchLoadLocales(ctx context.Context, articles []domain.NewsArticle) error {
	ids := make([]interface{}, len(articles))
	for i, a := range articles {
		ids[i] = a.ID
	}
	ph := strings.Repeat("?,", len(ids))
	ph = ph[:len(ph)-1]

	rows, err := r.db.QueryContext(ctx,
		`SELECT article_id, locale, title, slug, description, content, seo_title, seo_description, keywords
		 FROM news_translations WHERE article_id IN (`+ph+`)`, ids...)
	if err != nil {
		return fmt.Errorf("batch load locales: %w", err)
	}
	defer rows.Close()

	byID := make(map[string]map[domain.Language]domain.NewsLocale, len(articles))
	for _, a := range articles {
		byID[a.ID] = make(map[domain.Language]domain.NewsLocale)
	}
	for rows.Next() {
		var articleID, locale string
		var loc domain.NewsLocale
		if err := rows.Scan(&articleID, &locale, &loc.Title, &loc.Slug, &loc.Description,
			&loc.Content, &loc.SEOTitle, &loc.SEODescription, &loc.Keywords); err != nil {
			return fmt.Errorf("batch load locales scan: %w", err)
		}
		loc.Locale = domain.Language(locale)
		byID[articleID][loc.Locale] = loc
	}
	for i := range articles {
		articles[i].Locales = byID[articles[i].ID]
	}
	return rows.Err()
}

// batchLoadTags loads tags for multiple articles (no N+1).
func (r *NewsRepo) batchLoadTags(ctx context.Context, articles []domain.NewsArticle) error {
	ids := make([]interface{}, len(articles))
	for i, a := range articles {
		ids[i] = a.ID
	}
	ph := strings.Repeat("?,", len(ids))
	ph = ph[:len(ph)-1]

	rows, err := r.db.QueryContext(ctx,
		`SELECT nat.article_id, t.id, t.slug, t.name
		 FROM news_tags t
		 JOIN news_article_tags nat ON nat.tag_id=t.id
		 WHERE nat.article_id IN (`+ph+`) ORDER BY t.name`, ids...)
	if err != nil {
		return fmt.Errorf("batch load tags: %w", err)
	}
	defer rows.Close()

	byID := make(map[string][]domain.Tag, len(articles))
	for rows.Next() {
		var articleID string
		var tag domain.Tag
		if err := rows.Scan(&articleID, &tag.ID, &tag.Slug, &tag.Name); err != nil {
			return fmt.Errorf("batch load tags scan: %w", err)
		}
		byID[articleID] = append(byID[articleID], tag)
	}
	for i := range articles {
		if tags, ok := byID[articles[i].ID]; ok {
			articles[i].Tags = tags
		} else {
			articles[i].Tags = []domain.Tag{}
		}
	}
	return rows.Err()
}

// insertTranslations inserts the uk and en locale rows for an article in one transaction scope.
func insertTranslations(ctx context.Context, tx *sql.Tx, articleID string, locales map[domain.Language]domain.NewsLocale) error {
	for lang, loc := range locales {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO news_translations
				(article_id, locale, title, slug, description, content, seo_title, seo_description, keywords)
			VALUES (?,?,?,?,?,?,?,?,?)`,
			articleID, string(lang),
			loc.Title, strings.TrimSpace(loc.Slug), loc.Description, loc.Content,
			loc.SEOTitle, loc.SEODescription, loc.Keywords,
		)
		if err != nil {
			return fmt.Errorf("insert translation %s: %w", lang, err)
		}
	}
	return nil
}

// syncTags ensures all tags exist in news_tags and links them to the article.
func syncTags(ctx context.Context, tx *sql.Tx, articleID string, tags []domain.Tag) error {
	for _, tag := range tags {
		if tag.ID == "" {
			tag.ID = uuid.New().String()
		}
		// Upsert the tag (slug is the natural key).
		_, err := tx.ExecContext(ctx,
			"INSERT OR IGNORE INTO news_tags (id, slug, name) VALUES (?,?,?)",
			tag.ID, tag.Slug, tag.Name,
		)
		if err != nil {
			return fmt.Errorf("sync tag %q: %w", tag.Slug, err)
		}
		// Resolve the canonical ID (in case INSERT OR IGNORE skipped).
		var resolvedID string
		_ = tx.QueryRowContext(ctx, "SELECT id FROM news_tags WHERE slug=?", tag.Slug).Scan(&resolvedID)
		if resolvedID == "" {
			resolvedID = tag.ID
		}
		_, err = tx.ExecContext(ctx,
			"INSERT OR IGNORE INTO news_article_tags (article_id, tag_id) VALUES (?,?)",
			articleID, resolvedID,
		)
		if err != nil {
			return fmt.Errorf("link tag %q: %w", tag.Slug, err)
		}
	}
	return nil
}

// syncFTS inserts FTS5 entries for the article's translations.
func syncFTS(ctx context.Context, tx *sql.Tx, articleID string, locales map[domain.Language]domain.NewsLocale) error {
	for lang, loc := range locales {
		_, err := tx.ExecContext(ctx,
			"INSERT INTO news_fts (article_id, locale, title, description, content) VALUES (?,?,?,?,?)",
			articleID, string(lang), loc.Title, loc.Description, loc.Content,
		)
		if err != nil {
			slog.Warn("syncFTS insert warning", "article_id", articleID, "lang", lang, "error", err)
		}
	}
	return nil
}

// insertSlugHistory inserts a slug history entry inside an open transaction.
func insertSlugHistory(ctx context.Context, tx *sql.Tx, articleID string, locale domain.Language, oldSlug string) error {
	_, err := tx.ExecContext(ctx,
		"INSERT OR IGNORE INTO news_slug_history (id, article_id, locale, old_slug, replaced_at) VALUES (?,?,?,?,?)",
		uuid.New().String(), articleID, string(locale), oldSlug, time.Now().UTC(),
	)
	return err
}


