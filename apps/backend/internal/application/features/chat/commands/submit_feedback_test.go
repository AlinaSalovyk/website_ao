package commands

import (
	"context"
	"testing"

	"university-chatbot/backend/internal/domain"
)

// mockAnalyticsRepo implements the AnalyticsRepo interface with storage
// for testing purposes. It records the last hash and feedback it receives.
type mockAnalyticsRepo struct {
	lastHash     string
	lastFeedback domain.Feedback
}

// Record is a no-op implementation for testing.
func (m *mockAnalyticsRepo) Record(_ context.Context, _ domain.QueryRecord) error { return nil }

// UpdateFeedback records the given hash and feedback for later inspection.
func (m *mockAnalyticsRepo) UpdateFeedback(_ context.Context, hash string, fb domain.Feedback) error {
	m.lastHash = hash
	m.lastFeedback = fb
	return nil
}

// Summary is a no-op implementation for testing.
func (m *mockAnalyticsRepo) Summary(_ context.Context, _ int) (*domain.AnalyticsSummary, error) {
	return &domain.AnalyticsSummary{}, nil
}

// TopQueries is a no-op implementation for testing.
func (m *mockAnalyticsRepo) TopQueries(_ context.Context, _, _ int) ([]domain.TopQuery, error) {
	return nil, nil
}

// DailyStats is a no-op implementation for testing.
func (m *mockAnalyticsRepo) DailyStats(_ context.Context, _ int) ([]domain.DailyStat, error) {
	return nil, nil
}

// FeedbackStats is a no-op implementation for testing.
func (m *mockAnalyticsRepo) FeedbackStats(_ context.Context, _ int) (*domain.FeedbackStat, error) {
	return &domain.FeedbackStat{}, nil
}

// RecentQueries is a no-op implementation for testing.
func (m *mockAnalyticsRepo) RecentQueries(_ context.Context, _, _ int) ([]domain.QueryRow, error) {
	return nil, nil
}

// TestSubmitFeedback_ValidPositive verifies that the handler correctly records
// positive feedback for a valid query hash.
func TestSubmitFeedback_ValidPositive(t *testing.T) {
	repo := &mockAnalyticsRepo{}
	h := NewSubmitFeedbackHandler(repo)

	err := h.Handle(context.Background(), SubmitFeedbackCommand{
		QueryHash: "abc123",
		Feedback:  domain.FeedbackPositive,
	})
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if repo.lastHash != "abc123" {
		t.Errorf("expected hash=abc123, got %s", repo.lastHash)
	}
	if repo.lastFeedback != domain.FeedbackPositive {
		t.Errorf("expected positive feedback, got %d", repo.lastFeedback)
	}
}

// TestSubmitFeedback_ValidNegative verifies that the handler correctly records
// negative feedback for a valid query hash.
func TestSubmitFeedback_ValidNegative(t *testing.T) {
	repo := &mockAnalyticsRepo{}
	h := NewSubmitFeedbackHandler(repo)

	err := h.Handle(context.Background(), SubmitFeedbackCommand{
		QueryHash: "def456",
		Feedback:  domain.FeedbackNegative,
	})
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
}

// TestSubmitFeedback_EmptyHash verifies that the handler returns an error
// when the query hash is an empty string.
func TestSubmitFeedback_EmptyHash(t *testing.T) {
	repo := &mockAnalyticsRepo{}
	h := NewSubmitFeedbackHandler(repo)

	err := h.Handle(context.Background(), SubmitFeedbackCommand{
		QueryHash: "",
		Feedback:  domain.FeedbackPositive,
	})
	if err == nil {
		t.Error("expected error for empty query hash")
	}
}

// TestSubmitFeedback_WhitespaceHash verifies that the handler returns an error
// when the query hash consists only of whitespace characters.
func TestSubmitFeedback_WhitespaceHash(t *testing.T) {
	repo := &mockAnalyticsRepo{}
	h := NewSubmitFeedbackHandler(repo)

	err := h.Handle(context.Background(), SubmitFeedbackCommand{
		QueryHash: "   ",
		Feedback:  domain.FeedbackPositive,
	})
	if err == nil {
		t.Error("expected error for whitespace-only query hash")
	}
}

// TestSubmitFeedback_InvalidFeedbackValue verifies that the handler returns an error
// for invalid feedback values, such as 0 (neutral).
func TestSubmitFeedback_InvalidFeedbackValue(t *testing.T) {
	repo := &mockAnalyticsRepo{}
	h := NewSubmitFeedbackHandler(repo)

	err := h.Handle(context.Background(), SubmitFeedbackCommand{
		QueryHash: "ghi789",
		Feedback:  domain.Feedback(0), 
	})
	if err == nil {
		t.Error("expected error for neutral feedback (0)")
	}
}

// TestSubmitFeedback_InvalidFeedbackNumber verifies that the handler returns an error
// for feedback values outside the valid range [FeedbackPositive, FeedbackNegative].
func TestSubmitFeedback_InvalidFeedbackNumber(t *testing.T) {
	repo := &mockAnalyticsRepo{}
	h := NewSubmitFeedbackHandler(repo)

	err := h.Handle(context.Background(), SubmitFeedbackCommand{
		QueryHash: "abc",
		Feedback:  domain.Feedback(5),
	})
	if err == nil {
		t.Error("expected error for feedback=5")
	}
}

// TestHashMessage verifies that HashMessage produces consistent, deterministic
// 16-character hex hashes for the same input and different hashes for different inputs.
func TestHashMessage(t *testing.T) {
	h1 := HashMessage("test message")
	h2 := HashMessage("test message")
	h3 := HashMessage("different message")

	if h1 != h2 {
		t.Error("same input should produce same hash")
	}
	if h1 == h3 {
		t.Error("different input should produce different hash")
	}
	if len(h1) != 16 {
		t.Errorf("expected 16-char hex hash, got %d chars: %s", len(h1), h1)
	}
}
