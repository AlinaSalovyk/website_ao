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
	
	// List returns all registered admin users.
	List(ctx context.Context) ([]AdminUser, error)
	
	// Add creates a new admin record and returns it.
	Add(ctx context.Context, email, addedBy string) (*AdminUser, error)
	
	// Delete removes an admin by email.
	Delete(ctx context.Context, email string) error
	
	// Exists checks if an admin with the given email is registered.
	Exists(ctx context.Context, email string) (bool, error)
}
