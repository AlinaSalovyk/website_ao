// Package commands implements the write-side use cases (CQRS commands) for the chat feature.
package commands

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"

	"university-chatbot/backend/internal/domain"
)

// SubmitFeedbackCommand is the inbound payload for submitting user feedback.
type SubmitFeedbackCommand struct {
	QueryHash string          `json:"query_hash"` // SHA-256 prefix identifying the query.
	Feedback  domain.Feedback `json:"feedback"`    // +1 (positive) or -1 (negative).
}

// SubmitFeedbackHandler processes user feedback for a chat response.
type SubmitFeedbackHandler struct {
	analytics domain.AnalyticsRepo
}

// NewSubmitFeedbackHandler creates a new feedback handler.
func NewSubmitFeedbackHandler(ar domain.AnalyticsRepo) *SubmitFeedbackHandler {
	return &SubmitFeedbackHandler{analytics: ar}
}

// Handle validates and persists user feedback.
//
// Returns:
//   - error: if query_hash is empty, feedback is invalid, or DB write fails
func (h *SubmitFeedbackHandler) Handle(ctx context.Context, cmd SubmitFeedbackCommand) error {
	if strings.TrimSpace(cmd.QueryHash) == "" {
		return fmt.Errorf("query_hash must not be empty")
	}
	if cmd.Feedback != domain.FeedbackPositive && cmd.Feedback != domain.FeedbackNegative {
		return fmt.Errorf("feedback must be 1 (positive) or -1 (negative)")
	}
	return h.analytics.UpdateFeedback(ctx, cmd.QueryHash, cmd.Feedback)
}

// HashMessage computes a deterministic SHA-256 prefix hash for a message.
// Used to generate query_hash values for analytics and feedback correlation.
func HashMessage(msg string) string {
	hash := sha256.Sum256([]byte(strings.TrimSpace(msg)))
	return fmt.Sprintf("%x", hash[:8])
}
