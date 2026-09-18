package domain

import (
	"context"
	"io"
	"time"
)

// VectorStore defines the contract for a vector database used to store
// and search document chunk embeddings. Implemented by qdrant.Client.
type VectorStore interface {
	// EnsureCollection ensures that the collection exists.
	EnsureCollection(ctx context.Context) error

	// UpsertChunks upserts chunks into the vector store.
	UpsertChunks(ctx context.Context, chunks []Chunk) error

	// HybridSearch performs a hybrid search.
	HybridSearch(ctx context.Context, query string, topK int) ([]SearchResult, error)

	// DeleteByDocumentID deletes points by documentID.
	DeleteByDocumentID(ctx context.Context, documentID string) error

	// Ping checks if the vector store is reachable.
	Ping(ctx context.Context) error

	// RenameDocumentPayload renames points by documentID.
	RenameDocumentPayload(ctx context.Context, documentID string, newName string) error
}

// LLMClient defines the contract for a large language model provider.
// Implemented by openrouter.Client.
type LLMClient interface {
	// Embed generates a dense vector embedding for the given text.
	Embed(ctx context.Context, text string) ([]float32, error)

	// StreamAnswer streams an LLM-generated answer token-by-token as SSE events.
	StreamAnswer(ctx context.Context, systemPrompt, userQuery, context string, lang Language, w io.Writer) error

	// GenerateJSON sends a prompt expecting a JSON response and unmarshals it into result.
	GenerateJSON(ctx context.Context, prompt string, result any) error
}

// AnalyticsRepo defines the contract for chat analytics persistence.
// Implemented by sqlite.AnalyticsRepo and sqlite.BatchAnalyticsWriter.
type AnalyticsRepo interface {
	// Record persists a single analytics event for a chat interaction.
	Record(ctx context.Context, rec QueryRecord) error

	// UpdateFeedback sets the feedback value for a query identified by hash.
	UpdateFeedback(ctx context.Context, queryHash string, fb Feedback) error

	// Summary returns aggregate analytics for the given number of past days.
	Summary(ctx context.Context, days int) (*AnalyticsSummary, error)

	// TopQueries returns the most frequently asked queries.
	TopQueries(ctx context.Context, days, limit int) ([]TopQuery, error)

	// DailyStats returns per-day aggregated statistics.
	DailyStats(ctx context.Context, days int) ([]DailyStat, error)

	// FeedbackStats returns aggregate feedback counts and positive ratio.
	FeedbackStats(ctx context.Context, days int) (*FeedbackStat, error)

	// RecentQueries returns the most recent queries with full metadata.
	RecentQueries(ctx context.Context, days, limit int) ([]QueryRow, error)

}


// ConversationMemory provides in-process session-scoped chat history storage.
// Implemented by memory.ChatMemory.
type ConversationMemory interface {
	// GetHistory retrieves the last N messages for a session.
	GetHistory(ctx context.Context, sessionID string, limit int) ([]Message, error)

	// AddMessage appends a message to the session's history.
	AddMessage(ctx context.Context, sessionID string, msg Message) error
}

// AnalyticsSummary is the aggregate analytics result for the given time range.
// Returned by AnalyticsRepo.Summary and displayed as KPI stat cards.
type AnalyticsSummary struct {
	TotalQueries     int     `json:"total_queries"` // total queries
	BlockedQueries   int     `json:"blocked_queries"` // total blocked queries
	PositiveFeedback int     `json:"positive_feedback"` // total positive feedback
	NegativeFeedback int     `json:"negative_feedback"` // total negative feedback
	AvgResponseMs    float64 `json:"avg_response_ms"` // average response time in ms
}



// AuditRepo persists and lists admin audit log entries.
// Implemented by sqlite.AuditRepo.
type AuditRepo interface {
	
	// Record writes a new audit entry to the database.
	Record(ctx context.Context, entry AuditEntry) error
	
	// List returns paginated audit entries (newest first) and the total count.
	List(ctx context.Context, offset, limit int) ([]AuditEntry, int, error)
}


// DocumentRepo manages the documents table in SQLite.
// Implemented by sqlite.DocumentRepo.
type DocumentRepo interface {
	// Create inserts a new document record.
	Create(ctx context.Context, doc *DocumentRecord) error
	
	// List returns all documents sorted by upload date descending.
	List(ctx context.Context) ([]DocumentRecord, error)
	
	// GetByID retrieves a document by its UUID.
	GetByID(ctx context.Context, id string) (*DocumentRecord, error)
	
	// Delete removes a document record by ID.
	Delete(ctx context.Context, id string) error
	
	// Rename updates the filename of a document.
	Rename(ctx context.Context, id string, newName string) error
	
	// UpdateChunkCount sets the chunk count after re-indexing.
	UpdateChunkCount(ctx context.Context, id string, count int) error
}


// CacheStore is the generic key-value cache interface.
// Implemented by cache.RedisCache (Upstash) and cache.NoopCache.
type CacheStore interface {
	
	// Get retrieves a cached value. Returns "" (no error) on cache miss.
	Get(ctx context.Context, key string) (string, error)
	
	// Set stores a value with an optional TTL (0 = no expiry).
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
	
	// Delete removes a cached key.
	Delete(ctx context.Context, key string) error
}

// PromptRepo manages system prompt variants for A/B testing.
// Implemented by sqlite.PromptRepo.
type PromptRepo interface {
	
	// ActiveVariants returns all active variants for a given language.
	ActiveVariants(ctx context.Context, lang Language) ([]PromptVariant, error)
	
	// IncrementUsage increments the usage counter for a variant.
	IncrementUsage(ctx context.Context, variantID int64) error
	
	// RecordScore updates the rolling average feedback score for a variant.
	RecordScore(ctx context.Context, variantID int64, score float64) error
	
	// List returns all variants regardless of active state.
	List(ctx context.Context) ([]PromptVariant, error)
	
	// Create inserts a new prompt variant.
	Create(ctx context.Context, variant *PromptVariant) error
	
	// SetActive toggles a variant's active state.
	SetActive(ctx context.Context, id int64, active bool) error
	
	// Update changes the prompt text of an existing variant.
	Update(ctx context.Context, id int64, text string) error
	
	// Delete removes a variant permanently.
	Delete(ctx context.Context, id int64) error
}



// SuggestionsRepo manages the suggested_questions table.
// Implemented by sqlite.SuggestionsRepo.
type SuggestionsRepo interface {
	
	// List returns up to limit suggestions for the given language.
	List(ctx context.Context, lang Language, limit int) ([]SuggestedQuestion, error)
	
	// Upsert inserts or updates a suggested question.
	Upsert(ctx context.Context, q *SuggestedQuestion) error
	
	// DeleteAuto removes all auto-generated suggestions for a language.
	DeleteAuto(ctx context.Context, lang Language) error
}

// AdminUsersRepo manages the admin_users table.
// Implemented by sqlite.AdminUsersRepo.
type AdminUsersRepo interface {
	List(ctx context.Context) ([]AdminUser, error)
	GetByEmail(ctx context.Context, email string) (*AdminUser, error)
	Add(ctx context.Context, email string, role Role, status AdminStatus, addedBy string) (*AdminUser, error)
	UpdateRole(ctx context.Context, email string, role Role) error
	UpdateStatus(ctx context.Context, email string, status AdminStatus) error
	UpdateLastLogin(ctx context.Context, email string) error
	Delete(ctx context.Context, email string) error
	Exists(ctx context.Context, email string) (bool, error)
	CountTotal(ctx context.Context) (int, error)
	CountActiveSuperAdmins(ctx context.Context) (int, error)
}

// AdminInvitationsRepo manages the admin_invitations table.
type AdminInvitationsRepo interface {
	Create(ctx context.Context, inv *AdminInvitation) error
	GetByID(ctx context.Context, id string) (*AdminInvitation, error)
	GetByTokenHash(ctx context.Context, tokenHash string) (*AdminInvitation, error)
	GetPendingByEmail(ctx context.Context, email string) (*AdminInvitation, error)
	ListPending(ctx context.Context) ([]AdminInvitation, error)
	MarkAccepted(ctx context.Context, id string) error
	MarkRevoked(ctx context.Context, id string) error
	UpdateTokenAndExpiry(ctx context.Context, id, newTokenHash string, expiresAt time.Time, status DeliveryStatus) error
	UpdateDeliveryStatus(ctx context.Context, id string, status DeliveryStatus) error
	RevokeByEmail(ctx context.Context, email string) error
}

// OAuthStateRecord represents a persistent OAuth continuation state record.
type OAuthStateRecord struct {
	StateHash    string     `json:"state_hash"`
	InvitationID string     `json:"invitation_id"`
	Purpose      string     `json:"purpose"`
	CreatedAt    time.Time  `json:"created_at"`
	ExpiresAt    time.Time  `json:"expires_at"`
	ConsumedAt   *time.Time `json:"consumed_at,omitempty"`
}

// AdminOAuthStateRepo manages the persistent admin_oauth_states table.
type AdminOAuthStateRepo interface {
	CreateState(ctx context.Context, stateHash, invitationID, purpose string, ttl time.Duration) error
	GetAndConsumeState(ctx context.Context, stateHash string) (*OAuthStateRecord, error)
	CleanupExpired(ctx context.Context) error
}

// Mailer defines the email delivery contract.
type Mailer interface {
	SendInvitation(ctx context.Context, toEmail string, role Role, inviteURL string, expiresAt time.Time) error
}


// NewsRepo manages news_articles and all related tables (news_translations,
// news_categories, news_tags, news_article_tags, news_slug_history, news_fts).
// All write operations are transactional. Implementations must be DB-agnostic
// to allow migration from SQLite to PostgreSQL without changing the domain layer.
// Implemented by sqlite.NewsRepo.
type NewsRepo interface {

	// Create inserts a new article with both locale translations and tags.
	// Sets CreatedAt/UpdatedAt to UTC now if zero.
	// Returns ErrNewsSlugConflict if either locale slug is already taken.
	Create(ctx context.Context, article *NewsArticle) error

	// Update replaces article metadata and re-inserts translations and tags.
	// Saves old slugs to news_slug_history before overwriting.
	// Returns ErrNewsNotFound if the article does not exist.
	// Returns ErrNewsSlugConflict if the new slug collides with another article.
	Update(ctx context.Context, article *NewsArticle) error

	// SetStatus transitions the article to the given status.
	// On first transition to NewsStatusPublished, sets PublishedAt to UTC now.
	// Returns ErrNewsNotFound if the article does not exist.
	SetStatus(ctx context.Context, id string, status NewsStatus) error

	// Delete performs a soft delete by setting deleted_at to UTC now.
	// Returns ErrNewsNotFound if the article is not found or already deleted.
	Delete(ctx context.Context, id string) error

	// Restore clears deleted_at, making the article active again.
	// Returns ErrNewsNotFound if the article does not exist.
	Restore(ctx context.Context, id string) error

	// GetByID returns the full article with locales, category, and tags populated.
	// By default excludes soft-deleted articles; pass IncludeDeleted via ListOptions instead.
	GetByID(ctx context.Context, id string) (*NewsArticle, error)

	// GetBySlug finds an article by its locale-specific slug.
	// If the slug matches a historic entry in news_slug_history, wasRedirected is true
	// and the handler must issue a 301 to the article's current slug.
	// Returns ErrNewsNotFound if neither current nor historic slug matches.
	GetBySlug(ctx context.Context, locale Language, slug string) (article *NewsArticle, wasRedirected bool, err error)

	// GetByPreviewToken finds an article by its secret preview token.
	// Intentionally includes soft-deleted articles — preview is an admin-only capability.
	// Returns ErrNewsNotFound if no article matches the token.
	GetByPreviewToken(ctx context.Context, token string) (*NewsArticle, error)

	// List returns a page of articles matching opts and the total matching count.
	// When Status is NewsStatusPublished, only articles with publish_at <= now() are included.
	List(ctx context.Context, opts NewsListOptions) ([]NewsArticle, int, error)

	// GetAllPublishedSlugs returns slim entries for all published, non-deleted articles.
	// Used for sitemap.xml and RSS feed generation.
	GetAllPublishedSlugs(ctx context.Context) ([]NewsSlugEntry, error)

	// SlugExists reports whether the given locale+slug is already in use by any article.
	// Pass excludeID (article UUID) to allow a slug to match the article being updated.
	SlugExists(ctx context.Context, locale Language, slug string, excludeID string) (bool, error)

	// SaveSlugHistory records an old slug so that incoming requests can be 301-redirected.
	// Called automatically by Update when a slug changes.
	SaveSlugHistory(ctx context.Context, articleID string, locale Language, oldSlug string) error

	// GetCategories returns all categories.
	GetCategories(ctx context.Context) ([]NewsCategory, error)

	GetCategoryByID(ctx context.Context, id string) (*NewsCategory, error)
	GetCategoryBySlug(ctx context.Context, locale Language, slug string) (*NewsCategory, error)
	CreateCategory(ctx context.Context, cat *NewsCategory) error
	UpdateCategory(ctx context.Context, cat *NewsCategory) error
	SoftDeleteCategory(ctx context.Context, id string, transferToID string) error
	RestoreCategory(ctx context.Context, id string) error
	ReorderCategories(ctx context.Context, ids []string) error

	// GetTags returns all rows from news_tags.
	GetTags(ctx context.Context) ([]Tag, error)

	// EnsureTag finds an existing tag by slug or creates a new one.
	// Returns the persisted Tag record (with ID assigned).
	EnsureTag(ctx context.Context, slug, name string) (Tag, error)

	// SetImageURL atomically updates the cover image URL of an article.
	// Preferred over Update when only the image_url column needs to change.
	SetImageURL(ctx context.Context, id string, imageURL string) error

	// SetCategoryCover atomically updates ONLY the cover_image column of a category.
	SetCategoryCover(ctx context.Context, id string, coverImage string) error

	// Attachments management
	AddAttachment(ctx context.Context, att *NewsAttachment) error
	GetAttachmentByID(ctx context.Context, id string) (*NewsAttachment, error)
	GetAttachmentsByNewsID(ctx context.Context, newsID string) ([]NewsAttachment, error)
	UpdateAttachment(ctx context.Context, id string, titleUK, titleEN string, sortOrder int) error
	DeleteAttachment(ctx context.Context, id string) error
	ReorderAttachments(ctx context.Context, newsID string, attachmentIDs []string) error

	// Photo Gallery management
	AddGalleryImage(ctx context.Context, img *NewsGalleryImage) error
	GetGalleryImageByID(ctx context.Context, id string) (*NewsGalleryImage, error)
	GetGalleryImagesByNewsID(ctx context.Context, newsID string) ([]NewsGalleryImage, error)
	UpdateGalleryImage(ctx context.Context, id string, altUK, altEN, captionUK, captionEN string, sortOrder int) error
	DeleteGalleryImage(ctx context.Context, id string) error
	ReorderGalleryImages(ctx context.Context, newsID string, imageIDs []string) error

	// PurgeExpiredDeleted hard-deletes articles that have been in the trash for
	// longer than retentionDays. Returns storage keys of media files that the
	// caller must delete from MediaStorage, and the count of purged articles.
	PurgeExpiredDeleted(ctx context.Context, retentionDays int) (storageKeys []string, purged int, err error)
}
