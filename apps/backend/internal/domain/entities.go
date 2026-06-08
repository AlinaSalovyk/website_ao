// Package domain defines the core business entities, value objects, sentinel
// errors, and port interfaces for the university chatbot system.
//
// This package has ZERO infrastructure dependencies — it is imported by every
// other layer but never imports anything outside the standard library.
package domain

import (
	"errors"
	"time"
)

// ErrLLMOverloaded is returned when the upstream LLM API responds with
// HTTP 429 (Too Many Requests) or 503 (Service Unavailable) after all
// retry attempts have been exhausted.
var ErrLLMOverloaded = errors.New("llm_overloaded")

// Language represents the ISO 639-1 language code used throughout the system
// for prompt selection, response formatting, and analytics segmentation.
type Language string

const (
	// LangUk is the Ukrainian language code.
	LangUk Language = "uk"
	// LangEn is the English language code.
	LangEn Language = "en"
)

// Feedback represents user satisfaction rating for a chatbot response.
type Feedback int

const (
	// FeedbackNone means no feedback was submitted.
	FeedbackNone Feedback = 0
	// FeedbackPositive means the user rated the response positively (thumbs up).
	FeedbackPositive Feedback = 1
	// FeedbackNegative means the user rated the response negatively (thumbs down).
	FeedbackNegative Feedback = -1
)

// Message represents a single message in a conversation session.
// Used by ConversationMemory to maintain multi-turn chat context.
type Message struct {
	ID       string    `json:"id"`                // Unique message identifier.
	Role     string    `json:"role"`              // "user" or "assistant".
	Content  string    `json:"content"`           // Raw text content of the message.
	Sources  []Source  `json:"sources,omitempty"` // Documents that sourced the answer.
	Language Language  `json:"language"`          // Language of the message.
	SentAt   time.Time `json:"sent_at"`           // Timestamp when the message was created.
}

// Source identifies a document chunk that was used as context for an answer.
type Source struct {
	DocumentName string  `json:"document_name"`         // Human-readable document filename.
	Score        float32 `json:"score"`                 // Cosine similarity score from vector search (0.0–1.0).
	PageNumber   int     `json:"page_number,omitempty"` // Chunk index within the document.
}

// JobStatus represents the lifecycle state of an asynchronous document upload job.
type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"    // Job created, waiting to be picked up.
	JobStatusProcessing JobStatus = "processing" // Text extraction / chunking in progress.
	JobStatusCompleted  JobStatus = "completed"  // Successfully indexed into vector store.
	JobStatusFailed     JobStatus = "failed"     // Processing failed; see UploadJob.Error.
)

// UploadJob tracks the state of an asynchronous document indexing pipeline.
// The frontend polls GET /api/v1/admin/documents/jobs/{id} to display real-time progress.
type UploadJob struct {
	ID          string    `json:"id"`                     // UUID v4 assigned at creation.
	Filename    string    `json:"filename"`               // Original uploaded filename.
	Status      JobStatus `json:"status"`                 // Current lifecycle state.
	Error       string    `json:"error,omitempty"`        // Human-readable error if Status==failed.
	Progress    int       `json:"progress"`               // 0–100 percentage completion.
	CurrentStep string    `json:"current_step,omitempty"` // Description of current pipeline stage.
	ChunksCount int       `json:"chunks_count,omitempty"` // Number of chunks produced after splitting.
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ChatRequest is the inbound payload for the streaming chat endpoint.
// Validated by AskBotValidator before reaching the handler.
type ChatRequest struct {
	SessionID string   `json:"session_id" validate:"required"`           // Client-generated UUID linking messages in a conversation.
	Message   string   `json:"message" validate:"required,max=500"`      // User's question text (max 500 chars).
	Language  Language `json:"language" validate:"required,oneof=uk en"` // Detected or user-selected UI language.
}

// QueryRecord is an analytics event recorded for every chat interaction.
// Written asynchronously via BatchAnalyticsWriter to avoid blocking the request path.
type QueryRecord struct {
	ID         int64     `json:"id"`          // Primary key for the query record.
	QueryHash  string    `json:"query_hash"`  // SHA-256 prefix (16 hex chars) of the trimmed query.
	QueryText  string    `json:"query_text"`  // Currently empty for privacy; reserved for future use.
	Language   Language  `json:"language"`    // Language of the query.
	ResponseMs int64     `json:"response_ms"` // End-to-end latency in milliseconds.
	SourcesCnt int       `json:"sources_cnt"` // Number of document sources used in the answer.
	Feedback   Feedback  `json:"feedback"`    // Post-response user feedback.
	IsBlocked  bool      `json:"is_blocked"`  // True if the query was rejected by OffTopicFilter.
	CreatedAt  time.Time `json:"created_at"`  // Timestamp when the query was created.
}

// QueryRow is the read model for the analytics query log, used by the Queries tab.
type QueryRow struct {
	QueryHash  string `json:"query_hash"`  // SHA-256 prefix (16 hex chars) of the trimmed query.
	QueryText  string `json:"query_text"`  // Currently empty for privacy; reserved for future use.
	Language   string `json:"language"`    // Language of the query.
	ResponseMs int64  `json:"response_ms"` // End-to-end latency in milliseconds.
	SourcesCnt int    `json:"sources_cnt"` // Number of document sources used in the answer.
	Feedback   int    `json:"feedback"`    // Post-response user feedback.
	IsBlocked  int    `json:"is_blocked"`  // True if the query was rejected by OffTopicFilter.
	CreatedAt  string `json:"created_at"`  // Timestamp when the query was created.
}

// Document is a lightweight read model for some admin list endpoints.
// Prefer DocumentRecord for full details including summary and uploader.
type Document struct {
	ID         string    `json:"id"`          // Unique document identifier.
	Filename   string    `json:"filename"`    // Document filename.
	DocType    string    `json:"doc_type"`    // Document type.
	Language   Language  `json:"language"`    // Document language.
	UploadedAt time.Time `json:"uploaded_at"` // Timestamp when the document was uploaded.
	ChunkCount int       `json:"chunk_count"` // Number of chunks in the document.
}

// Chunk represents a text segment of a document, suitable for embedding and vector storage.
type Chunk struct {
	ID           string            `json:"id"`            // Deterministic SHA-256-based ID.
	DocumentID   string            `json:"document_id"`   // Parent document UUID.
	DocumentName string            `json:"document_name"` // Human-readable document filename.
	Text         string            `json:"text"`          // Chunk text content (~1400 chars target).
	PageNumber   int               `json:"page_number"`   // Sequential chunk index (1-based).
	Metadata     map[string]string `json:"metadata"`      // Key-value pairs: doc_type, language.
}

// SearchResult pairs a Chunk with its cosine similarity score from vector search.
type SearchResult struct {
	Chunk Chunk   // The matched document chunk.
	Score float32 // Cosine similarity (0.0–1.0), higher is more relevant.
}

// Sentinel errors used across layers for typed error handling.
var (
	ErrOffTopic           = errors.New("query is off-topic")                      // Error for off-topic queries.
	ErrRateLimited        = errors.New("rate limit exceeded")                     // Error for rate-limited queries.
	ErrInputTooLong       = errors.New("input exceeds maximum length")            // Error for input that exceeds maximum length.
	ErrEmptyInput         = errors.New("input must not be empty")                 // Error for empty input.
	ErrNoContext          = errors.New("no relevant context found")               // Error for no relevant context found.
	ErrUnauthorized       = errors.New("unauthorized")                            // Error for unauthorized access.
	ErrForbidden          = errors.New("forbidden: email not in admin whitelist") // Error for forbidden access.
	ErrDocumentNotFound   = errors.New("document not found")                      // Error for document not found.
	ErrAdminAlreadyExists = errors.New("admin user already exists")               // Error for admin user already exists.
	ErrAdminNotFound      = errors.New("admin user not found")                    // Error for admin user not found.
)

// AdminAction is a typed string enumerating all auditable admin operations.
type AdminAction string

const (
	ActionLogin           AdminAction = "login"            // Admin login action.
	ActionLogout          AdminAction = "logout"           // Admin logout action.
	ActionUploadDocument  AdminAction = "upload_document"  // Admin upload document action.
	ActionDeleteDocument  AdminAction = "delete_document"  // Admin delete document action.
	ActionRenameDocument  AdminAction = "rename_document"  // Admin rename document action.
	ActionReindexDocument AdminAction = "reindex_document" // Admin reindex document action.
	ActionReindexAll      AdminAction = "reindex_all"      // Admin reindex all documents action.
	ActionExportCSV       AdminAction = "export_csv"       // Admin export CSV action.
	ActionViewAnalytics   AdminAction = "view_analytics"   // Admin view analytics action.
	ActionViewAuditLog    AdminAction = "view_audit_log"   // Admin view audit log action.
	ActionAddAdmin        AdminAction = "add_admin"        // Admin add admin action.
	ActionRemoveAdmin     AdminAction = "remove_admin"     // Admin remove admin action.
)

// AuditEntry records a single admin action for compliance and monitoring.
type AuditEntry struct {
	ID         int64       `json:"id"`                // Unique identifier for the audit entry.
	AdminEmail string      `json:"admin_email"`       // Email of the admin who performed the action.
	Action     AdminAction `json:"action"`            // Type of action performed.
	Target     string      `json:"target,omitempty"`  // Document ID, admin email, or URL path.
	Details    string      `json:"details,omitempty"` // Human-readable context.
	IP         string      `json:"ip,omitempty"`      // Client IP address.
	CreatedAt  time.Time   `json:"created_at"`        // Timestamp when the action was performed.
}

// DocumentRecord is the full document model with uploader identity and LLM-generated summary.
type DocumentRecord struct {
	ID         string    `json:"id"`                // Unique document identifier.
	Filename   string    `json:"filename"`          // Document filename.
	DocType    string    `json:"doc_type"`          // Document type.
	Language   Language  `json:"language"`          // Document language.
	ChunkCount int       `json:"chunk_count"`       // Number of chunks in the document.
	Summary    string    `json:"summary,omitempty"` // LLM-generated summary.
	UploadedBy string    `json:"uploaded_by"`       // Admin who uploaded the document.
	UploadedAt time.Time `json:"uploaded_at"`       // Timestamp when the document was uploaded.
}

// AdminUser represents a registered admin. TokenVersion is excluded from JSON.
type AdminUser struct {
	ID           int64     `json:"id"`       // Unique identifier for the admin user.
	Email        string    `json:"email"`    // Email of the admin user.
	AddedBy      string    `json:"added_by"` // Admin who added the admin user.
	AddedAt      time.Time `json:"added_at"` // Timestamp when the admin user was added.
	TokenVersion int       `json:"-"`        // Incremented on logout to invalidate tokens.
}

// TopQuery is a leaderboard entry for the most frequently asked questions.
type TopQuery struct {
	QueryText string `json:"query_text"` // Text of the query.
	Count     int    `json:"count"`      // Number of times the query was asked.
	Language  string `json:"language"`   // Language of the query.
	LastSeen  string `json:"last_seen"`  // Timestamp when the query was last seen.
}

// DailyStat is a per-day analytics aggregate used to render the bar chart.
type DailyStat struct {
	Date             string  `json:"date"`              // Date.
	TotalQueries     int     `json:"total_queries"`     // Total number of queries.
	BlockedQueries   int     `json:"blocked_queries"`   // Number of blocked queries.
	AvgResponseMs    float64 `json:"avg_response_ms"`   // Average response time.
	PositiveFeedback int     `json:"positive_feedback"` // Number of positive feedback.
	NegativeFeedback int     `json:"negative_feedback"` // Number of negative feedback.
}

// FeedbackStat summarises positive/negative feedback counts and their ratio.
type FeedbackStat struct {
	Total    int     `json:"total"`    // Total number of feedback.
	Positive int     `json:"positive"` // Number of positive feedback.
	Negative int     `json:"negative"` // Number of negative feedback.
	Ratio    float64 `json:"ratio"`    // Positive / Total (0.0–1.0).
}

// PromptVariant is a versioned system prompt for A/B testing via the Prompts tab.
type PromptVariant struct {
	ID         int64    `json:"id"`
	Name       string   `json:"name"`
	Language   Language `json:"language"`    // Language of the prompt.
	PromptText string   `json:"prompt_text"` // Prompt text.
	IsActive   bool     `json:"is_active"`   // Only active variants are picked by PromptSelector.
	UsageCount int64    `json:"usage_count"`
	AvgScore   float64  `json:"avg_score"` // Average feedback score (-1 to 1).
}

// SuggestedQuestion is a pre-populated question shown before the user types.
// IsAuto=true entries are refreshed nightly from top analytics queries.
type SuggestedQuestion struct {
	ID       int64    `json:"id"`       // Unique identifier for the suggested question.
	Question string   `json:"question"` // Text of the suggested question.
	Language Language `json:"language"` // Language of the suggested question.
	IsAuto   bool     `json:"is_auto"`  // True if generated from analytics.
	Priority int      `json:"priority"` // Lower = shown first.
}
