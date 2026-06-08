package queries_test

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"testing"
	"time"

	"university-chatbot/backend/internal/application/features/chat/queries"
	"university-chatbot/backend/internal/domain"
)

// TestAskBotHandler_EmptyContext verifies that the handler correctly handles
// cases where no relevant context is found in the vector store. It should
// avoid calling the LLM and return an appropriate fallback response.
type mockVectorStore struct {
	results []domain.SearchResult
	err     error
}

// EnsureCollection ensures that the collection exists in the vector store.
func (m *mockVectorStore) EnsureCollection(_ context.Context) error { return nil }

// UpsertChunks uploads chunks to the vector store.
func (m *mockVectorStore) UpsertChunks(_ context.Context, _ []domain.Chunk) error { return nil }

// DeleteByDocumentID deletes chunks by document ID.
func (m *mockVectorStore) DeleteByDocumentID(_ context.Context, _ string) error       { return nil }

// RenameDocumentPayload renames a document payload.
func (m *mockVectorStore) RenameDocumentPayload(_ context.Context, _, _ string) error { return nil }

// Ping checks the health of the vector store.
func (m *mockVectorStore) Ping(_ context.Context) error                               { return nil }

// HybridSearch performs a hybrid search in the vector store.
func (m *mockVectorStore) HybridSearch(_ context.Context, _ string, _ int) ([]domain.SearchResult, error) {
	return m.results, m.err
}

// mockLLM implements the LLM interface for testing purposes.
// It can return a list of tokens or an error.
type mockLLM struct {
	tokens []string
	err    error
}

// Embed embeds a string into a vector.
func (m *mockLLM) Embed(_ context.Context, _ string) ([]float32, error)  { return nil, nil }
// GenerateJSON generates JSON from a string.
func (m *mockLLM) GenerateJSON(_ context.Context, _ string, _ any) error { return nil }
// StreamAnswer streams the answer to a writer.
func (m *mockLLM) StreamAnswer(_ context.Context, _, _, _ string, _ domain.Language, w io.Writer) error {
	if m.err != nil {
		return m.err
	}
	for _, t := range m.tokens {
		fmt.Fprintf(w, "data: %s\n\n", t)
	}
	return nil
}

// mockAnalyticsRepo implements the AnalyticsRepository interface for testing purposes.
type mockAnalyticsRepo struct {
	Recorded []domain.QueryRecord
}

// Record records a query. 
func (r *mockAnalyticsRepo) Record(_ context.Context, rec domain.QueryRecord) error {
	r.Recorded = append(r.Recorded, rec)
	return nil
}

// UpdateFeedback updates feedback for a query.
func (r *mockAnalyticsRepo) UpdateFeedback(_ context.Context, _ string, _ domain.Feedback) error {
	return nil
}

// Summary returns analytics summary.
func (r *mockAnalyticsRepo) Summary(_ context.Context, _ int) (*domain.AnalyticsSummary, error) {
	return &domain.AnalyticsSummary{}, nil
}

// TopQueries returns top queries.
func (r *mockAnalyticsRepo) TopQueries(_ context.Context, _, _ int) ([]domain.TopQuery, error) {
	return nil, nil
}

// DailyStats returns daily stats.
func (r *mockAnalyticsRepo) DailyStats(_ context.Context, _ int) ([]domain.DailyStat, error) {
	return nil, nil
}

// FeedbackStats returns feedback stats.
func (r *mockAnalyticsRepo) FeedbackStats(_ context.Context, _ int) (*domain.FeedbackStat, error) {
	return &domain.FeedbackStat{}, nil
}

// RecentQueries returns recent queries.
func (r *mockAnalyticsRepo) RecentQueries(_ context.Context, _, _ int) ([]domain.QueryRow, error) {
	return nil, nil
}

// newReq creates a new chat request.
func newReq(msg string, lang domain.Language) *domain.ChatRequest {
	return &domain.ChatRequest{
		SessionID: "test-session",
		Message:   msg,
		Language:  lang,
	}
}

// goodChunk creates a good chunk for testing purposes.
func goodChunk(score float32) domain.SearchResult {
	return domain.SearchResult{
		Score: score,
		Chunk: domain.Chunk{
			DocumentName: "test_doc.pdf",
			Text:         "Для вступу потрібен атестат та паспорт.",
			PageNumber:   1,
		},
	}
}

// TestHandle_SuccessPath tests the success path of the AskBotHandler.
func TestHandle_SuccessPath(t *testing.T) {
	analytics := &mockAnalyticsRepo{}
	vs := &mockVectorStore{results: []domain.SearchResult{goodChunk(0.85)}}
	llm := &mockLLM{tokens: []string{"Привіт", " з", " документів"}}

	h := queries.NewAskBotHandler(vs, llm, analytics)

	var buf bytes.Buffer
	result, err := h.Handle(context.Background(), queries.AskBotQuery{Request: newReq("Що потрібно для вступу?", domain.LangUk)}, &buf)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result == nil {
		t.Fatal("result is nil")
	}
	if result.QueryHash == "" {
		t.Error("query hash must not be empty")
	}
	if len(result.Sources) == 0 {
		t.Error("expected at least one source")
	}

	out := buf.String()
	if !strings.Contains(out, "data: ") {
		t.Errorf("expected SSE tokens in output, got: %q", out)
	}

	time.Sleep(50 * time.Millisecond)
	if len(analytics.Recorded) == 0 {
		t.Error("expected analytics to be recorded")
	}
	if analytics.Recorded[0].IsBlocked {
		t.Error("analytics IsBlocked should be false for successful query")
	}
}

// TestHandle_EmptyContext tests the case where no relevant context is found in the vector store.
func TestHandle_EmptyContext(t *testing.T) {
	analytics := &mockAnalyticsRepo{}

	vs := &mockVectorStore{results: []domain.SearchResult{
		{Score: 0.10, Chunk: domain.Chunk{Text: "irrelevant"}},
	}}
	llmCalled := false
	llm := &mockLLM{}
	llm.err = nil

	h := queries.NewAskBotHandler(vs, &spyLLM{called: &llmCalled}, analytics)

	var buf bytes.Buffer
	result, err := h.Handle(context.Background(), queries.AskBotQuery{Request: newReq("Яка температура сонця?", domain.LangUk)}, &buf)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if llmCalled {
		t.Error("LLM must NOT be called when context is empty — this would cause hallucinations")
	}
	out := buf.String()
	if !strings.Contains(out, "data: ") {
		t.Errorf("expected fallback SSE token, got: %q", out)
	}
	if len(result.Sources) != 0 {
		t.Errorf("expected empty sources for no-context result, got %d", len(result.Sources))
	}
}

// TestHandle_VectorSearchError tests the case where the vector search fails.
func TestHandle_VectorSearchError(t *testing.T) {
	analytics := &mockAnalyticsRepo{}
	vs := &mockVectorStore{err: errors.New("qdrant timeout")}
	llm := &mockLLM{}

	h := queries.NewAskBotHandler(vs, llm, analytics)

	_, err := h.Handle(context.Background(), queries.AskBotQuery{Request: newReq("query", domain.LangUk)}, &bytes.Buffer{})
	if err == nil {
		t.Fatal("expected error from vector search failure")
	}
	if !strings.Contains(err.Error(), "vector search") {
		t.Errorf("error should mention vector search, got: %v", err)
	}
}

// TestHandle_LLMError tests the case where the LLM fails.
func TestHandle_LLMError(t *testing.T) {
	analytics := &mockAnalyticsRepo{}
	vs := &mockVectorStore{results: []domain.SearchResult{goodChunk(0.9)}}
	llm := &mockLLM{err: errors.New("llm 503")}

	h := queries.NewAskBotHandler(vs, llm, analytics)

	_, err := h.Handle(context.Background(), queries.AskBotQuery{Request: newReq("query", domain.LangEn)}, &bytes.Buffer{})
	if err == nil {
		t.Fatal("expected error from LLM failure")
	}
	if !strings.Contains(err.Error(), "llm stream") {
		t.Errorf("error should mention llm stream, got: %v", err)
	}
}

// TestHandle_QueryHashDeterminism tests that the query hash is deterministic.
func TestHandle_QueryHashDeterminism(t *testing.T) {
	vs := &mockVectorStore{results: []domain.SearchResult{goodChunk(0.8)}}
	llm := &mockLLM{tokens: []string{"ok"}}
	ar := &mockAnalyticsRepo{}

	h := queries.NewAskBotHandler(vs, llm, ar)

	msg := "Які спеціальності є на кафедрі?"
	r1, _ := h.Handle(context.Background(), queries.AskBotQuery{Request: newReq(msg, domain.LangUk)}, &bytes.Buffer{})
	r2, _ := h.Handle(context.Background(), queries.AskBotQuery{Request: newReq(msg, domain.LangUk)}, &bytes.Buffer{})

	if r1.QueryHash != r2.QueryHash {
		t.Errorf("hash must be deterministic: %q != %q", r1.QueryHash, r2.QueryHash)
	}
}

// TestHandle_EnglishFallback tests the fallback to English when no context is found.
func TestHandle_EnglishFallback(t *testing.T) {
	vs := &mockVectorStore{}
	ar := &mockAnalyticsRepo{}
	llmCalled := false

	h := queries.NewAskBotHandler(vs, &spyLLM{called: &llmCalled}, ar)

	var buf bytes.Buffer
	_, err := h.Handle(context.Background(), queries.AskBotQuery{Request: newReq("What is the weather?", domain.LangEn)}, &buf)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	out := buf.String()
	if strings.Contains(out, "На жаль") {
		t.Error("expected English fallback but got Ukrainian text")
	}
	if !strings.Contains(out, "data: ") {
		t.Error("expected SSE data line in output")
	}
}

// spyLLM is a spy LLM for testing purposes.
type spyLLM struct {
	called *bool
}

// Embed embeds a string into a vector.
func (s *spyLLM) Embed(_ context.Context, _ string) ([]float32, error)  { return nil, nil }
// GenerateJSON generates JSON from a string.
func (s *spyLLM) GenerateJSON(_ context.Context, _ string, _ any) error { return nil }
// StreamAnswer streams the answer to a writer.
func (s *spyLLM) StreamAnswer(_ context.Context, _, _, _ string, _ domain.Language, _ io.Writer) error {
	*s.called = true
	return nil
}
