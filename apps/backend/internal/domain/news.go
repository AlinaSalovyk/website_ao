// Package domain — news.go defines all domain types, value objects, sentinel
// errors, and repository contracts for the News module.
//
// This file has zero infrastructure dependencies — only the standard library.
// Language and AdminAction types come from entities.go in the same package.
package domain

import (
	"errors"
	"strings"
	"time"
)

// ─── Value Objects ────────────────────────────────────────────────────────────

// NewsStatus represents the publication lifecycle state of a news article.
type NewsStatus string

const (
	// NewsStatusDraft is the default state — the article is not publicly visible.
	NewsStatusDraft NewsStatus = "draft"
	// NewsStatusPublished means the article is publicly visible (subject to PublishAt).
	NewsStatusPublished NewsStatus = "published"
)

// ─── Entities ─────────────────────────────────────────────────────────────────

// CategoryStatus represents the visibility state of a category.
type CategoryStatus string

const (
	CategoryStatusVisible  CategoryStatus = "visible"
	CategoryStatusHidden   CategoryStatus = "hidden"
	CategoryStatusArchived CategoryStatus = "archived"
)

// CategoryLocale holds localized fields for a category.
type CategoryLocale struct {
	Locale         Language `json:"locale"`
	Name           string   `json:"name"`
	Slug           string   `json:"slug"`
	Description    string   `json:"description"`
	SEOTitle       string   `json:"seo_title"`
	SEODescription string   `json:"seo_description"`
}

// NewsCategory represents a dynamic category for news articles.
type NewsCategory struct {
	ID            string                    `json:"id"`
	Color         string                    `json:"color"`
	Icon          string                    `json:"icon"`
	CoverImage    string                    `json:"cover_image"`
	CoverPosition string                    `json:"cover_position,omitempty"` // "top" | "center" | "bottom"
	SortOrder     int                       `json:"sort_order"`
	Status        CategoryStatus            `json:"status"`
	CreatedAt     time.Time                 `json:"created_at"`
	UpdatedAt     time.Time                 `json:"updated_at"`
	DeletedAt     *time.Time                `json:"deleted_at,omitempty"`
	ArticlesCount int                       `json:"articles_count"` // Computed from articles table
	Locales       map[Language]CategoryLocale `json:"locales"`
}

// Tag is a flat, reusable label attached to articles via a many-to-many relation
// (news_article_tags join table). Tags are language-neutral.
type Tag struct {
	ID   string `json:"id"`   // UUID v4.
	Slug string `json:"slug"` // URL-safe identifier, e.g. "olympiad".
	Name string `json:"name"` // Display name.
}

// NewsAuthor holds embedded author metadata for a single news article.
// Stored as inline columns in news_articles (no separate authors table),
// consistent with the project's flat-data convention in other repositories.
type NewsAuthor struct {
	Name     string `json:"name"`               // Author display name.
	Avatar   string `json:"avatar,omitempty"`   // URL to author avatar image (optional).
	Position string `json:"position,omitempty"` // Job title or role (optional).
}

// NewsLocale holds the locale-specific content for a single language variant.
// Each article always has exactly two rows in news_translations: uk and en.
// Slugs are per-locale: Ukrainian titles get ДСТУ 9112:2021 transliteration,
// English titles are slugified directly.
type NewsLocale struct {
	Locale         Language `json:"locale"`          // "uk" or "en".
	Title          string   `json:"title"`           // Article headline.
	Slug           string   `json:"slug"`            // Per-locale URL slug.
	Description    string   `json:"description"`     // Short excerpt shown in listings.
	Content        string   `json:"content"`         // Full article body (sanitized HTML).
	SEOTitle       string   `json:"seo_title"`       // <title> override; empty falls back to Title.
	SEODescription string   `json:"seo_description"` // <meta name="description">.
}

// NewsArticle is the root aggregate for the News domain.
// It contains embedded author data, lazily-populated Category and Tags,
// and a map of locale-specific content keyed by Language constant.
type NewsArticle struct {
	ID           string               `json:"id"`                      // UUID v4, assigned at creation.
	Status       NewsStatus           `json:"status"`                  // Current publication state.
	CategoryID   string               `json:"category_id"`             // FK → news_categories.id.
	Category     *NewsCategory        `json:"category,omitempty"`      // Populated on read; nil on write input.
	Tags         []Tag                `json:"tags"`                    // Populated on read; used for write via tag slugs.
	Author       NewsAuthor           `json:"author"`                  // Embedded author metadata.
	ImageURL      string               `json:"image_url,omitempty"`     // Base image path; width suffix appended by frontend.
	CoverPosition string               `json:"cover_position,omitempty"`// Focal point position e.g. "50% 35%".
	Gallery       []string             `json:"gallery,omitempty"`       // Additional photo URLs for gallery.
	VideoURL      string               `json:"video_url,omitempty"`      // YouTube embed URL or uploaded MP4 path.
	VideoPoster   string               `json:"video_poster,omitempty"`   // Preview poster image URL for video.
	VideoType     VideoType            `json:"video_type,omitempty"`     // Explicit discriminator: "external" or "uploaded".
	IsPinned      bool                 `json:"is_pinned"`               // Featured / pinned article flag.
	PreviewToken  string               `json:"preview_token,omitempty"` // Secret token for sharing draft previews.
	PublishAt    *time.Time           `json:"publish_at,omitempty"`    // Scheduled publish time; nil = publish immediately.
	PublishedAt  *time.Time           `json:"published_at,omitempty"`  // Actual timestamp of first publish.
	CreatedBy    string               `json:"created_by"`              // Admin email of the creator.
	CreatedAt    time.Time            `json:"created_at"`
	UpdatedAt    time.Time            `json:"updated_at"`
	DeletedAt    *time.Time           `json:"deleted_at,omitempty"` // Soft-delete marker; nil = active.
	Locales      map[Language]NewsLocale `json:"locales"`           // Keyed by LangUk / LangEn. Both always present after Validate().
	Attachments  []NewsAttachment     `json:"attachments"`          // Document file attachments.
}

// NewsAttachment represents a document attachment linked to a news article.
type NewsAttachment struct {
	ID           string    `json:"id"`
	NewsID       string    `json:"news_id"`
	OriginalName string    `json:"original_name"`
	StoredName   string    `json:"stored_name"`
	MIMEType     string    `json:"mime_type"`
	Extension    string    `json:"extension"`
	SizeBytes    int64     `json:"size_bytes"`
	SortOrder    int       `json:"sort_order"`
	TitleUK      string    `json:"title_uk"`
	TitleEN      string    `json:"title_en"`
	URL          string    `json:"url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type VideoType string

const (
	VideoTypeExternal VideoType = "external"
	VideoTypeUploaded VideoType = "uploaded"
)

// GetVideoType returns the explicit semantic video classification.
func (a *NewsArticle) GetVideoType() VideoType {
	if a.VideoURL == "" {
		return ""
	}
	if strings.HasPrefix(a.VideoURL, "news/articles/") || strings.HasPrefix(a.VideoURL, "/news-images/") {
		return VideoTypeUploaded
	}
	return VideoTypeExternal
}

// IsPubliclyVisible reports whether the article should appear to anonymous users.
// An article is visible when: published, not soft-deleted, and its scheduled
// publish time (if set) is in the past.
func (a *NewsArticle) IsPubliclyVisible() bool {
	if a.Status != NewsStatusPublished || a.DeletedAt != nil {
		return false
	}
	if a.PublishAt != nil && a.PublishAt.After(time.Now()) {
		return false
	}
	return true
}

func (a *NewsArticle) Validate() error {
	ukLoc, hasUk := a.Locales[LangUk]
	if !hasUk || strings.TrimSpace(ukLoc.Title) == "" {
		return ErrNewsUkTitleRequired
	}

	if a.Status == NewsStatusPublished {
		enLoc, hasEn := a.Locales[LangEn]
		if !hasEn || strings.TrimSpace(enLoc.Title) == "" {
			return ErrNewsEnLocaleRequiredForPublish
		}
	}
	return nil
}

// NewsListOptions controls filtering, sorting, and pagination for NewsRepo.List.
// Zero values mean "no filter" or "use default", so the struct can be composed
// selectively for public vs. admin queries without conditional branches at the call site.
type NewsListOptions struct {
	Locale         Language   // Filter translations by locale ("uk" or "en"). Required for public queries.
	Status         NewsStatus // "" = all; NewsStatusPublished = published + publish_at <= now().
	CategoryID     string     // Filter by category_id; "" = all categories.
	Tags           []string   // Filter by tag slugs (OR semantics: any match); nil = all.
	Search         string     // Full-text search via FTS5; "" = no search applied.
	IsPinned       *bool      // nil = no filter; &true / &false = filter by is_pinned.
	IncludeDeleted bool       // When true, includes soft-deleted articles (admin-only use).
	Offset         int        // Pagination offset.
	Limit          int        // Pagination limit; 0 = repository default (12).
	SortBy         string     // "published_at" | "created_at" (default: "published_at").
	SortDir        string     // "asc" | "desc" (default: "desc").
}

// NewsSlugEntry is a lightweight read model used for sitemap and RSS feed generation.
// Only the fields required by those two consumers are included.
type NewsSlugEntry struct {
	ArticleID string    `json:"article_id"` // Article UUID.
	Locale    Language  `json:"locale"`     // Language of this slug.
	Slug      string    `json:"slug"`       // Current canonical slug.
	Title     string    `json:"title"`      // Article title (for RSS item title).
	UpdatedAt time.Time `json:"updated_at"` // Last modification time (for sitemap <lastmod>).
}

// ─── Sentinel Errors ──────────────────────────────────────────────────────────

var (
	// ErrNewsNotFound is returned when an article lookup by ID, slug, or token yields no result.
	ErrNewsNotFound = errors.New("news article not found")

	// ErrNewsSlugConflict is returned when the requested locale+slug already belongs to another article.
	ErrNewsSlugConflict = errors.New("news slug already exists")

	// ErrNewsUkTitleRequired is returned when UK title is missing.
	ErrNewsUkTitleRequired = errors.New("Вкажіть заголовок української версії.")

	// ErrNewsEnLocaleRequiredForPublish is returned when EN title/slug is missing on publish.
	ErrNewsEnLocaleRequiredForPublish = errors.New("Перед публікацією заповніть або перекладіть англійську версію.")

	// ErrNewsLocaleMissing is returned when a required locale (uk or en) is absent or its
	// mandatory fields (Title, Slug) are empty. Both locales must be provided even for drafts.
	ErrNewsLocaleMissing = errors.New("both uk and en locales with non-empty title and slug are required")
)

// ─── Audit Action Constants ────────────────────────────────────────────────────

// News-specific audit actions extend the AdminAction type defined in entities.go.
const (
	ActionCreateNews      AdminAction = "create_news"
	ActionUpdateNews      AdminAction = "update_news"
	ActionDeleteNews      AdminAction = "delete_news"      // Soft delete.
	ActionRestoreNews     AdminAction = "restore_news"     // Restore from soft delete.
	ActionPublishNews     AdminAction = "publish_news"
	ActionUnpublishNews   AdminAction = "unpublish_news"
	ActionUploadNewsImage AdminAction = "upload_news_image"
	ActionRegenerateSlug  AdminAction = "regenerate_slug"
)
