package queries

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"university-chatbot/backend/internal/domain"
)

// Reranker uses the LLM to re-score vector search results based on
// semantic relevance to the user's query. This adds ~200ms latency
// but significantly improves answer quality for ambiguous queries.
// Controlled via the ENABLE_RERANKING feature flag.
type Reranker struct {
	llm     domain.LLMClient
	enabled bool
}

// NewReranker creates a Reranker. If enabled is false, Rerank() is a no-op passthrough.
func NewReranker(llm domain.LLMClient, enabled bool) *Reranker {
	return &Reranker{llm: llm, enabled: enabled}
}

// rerankResult holds the LLM's relevance score for a single document excerpt.
type rerankResult struct {
	Index int     `json:"index"` // Original position in the results slice.
	Score float64 `json:"score"` // Relevance score 0.0 (irrelevant) – 1.0 (perfect match).
}

// rerankResponse is the JSON envelope returned by the LLM's reranking prompt.
type rerankResponse struct {
	Rankings []rerankResult `json:"rankings"`
}

// Rerank sends document excerpts to the LLM for relevance scoring, then
// sorts results by the LLM's scores using insertion sort.
// Falls back to the original order if the LLM call fails.
//
// Params:
//   - query: the user's search query
//   - results: vector search results to rerank
//
// Returns:
//   - []domain.SearchResult: reranked results (same slice, different order)
func (r *Reranker) Rerank(ctx context.Context, query string, results []domain.SearchResult) []domain.SearchResult {
	if !r.enabled || r.llm == nil || len(results) <= 1 {
		return results
	}
	var sb strings.Builder
	sb.WriteString("Rate the relevance of each document excerpt to the user's question.\n")
	sb.WriteString("Return JSON: {\"rankings\": [{\"index\": 0, \"score\": 0.95}, ...]}\n")
	sb.WriteString("Score 0.0 = irrelevant, 1.0 = perfectly relevant.\n\n")
	sb.WriteString(fmt.Sprintf("Question: %s\n\n", query))

	for i, res := range results {
		excerpt := res.Chunk.Text
		if len(excerpt) > 500 {
			excerpt = excerpt[:500] + "..."
		}
		sb.WriteString(fmt.Sprintf("--- Document %d: %s ---\n%s\n\n", i, res.Chunk.DocumentName, excerpt))
	}

	var response rerankResponse
	if err := r.llm.GenerateJSON(ctx, sb.String(), &response); err != nil {
		slog.Warn("Reranking failed, using original order", "error", err)
		return results
	}

	if len(response.Rankings) == 0 {
		return results
	}

	scores := make(map[int]float64)
	for _, rr := range response.Rankings {
		if rr.Index >= 0 && rr.Index < len(results) {
			scores[rr.Index] = rr.Score
		}
	}

	reranked := make([]domain.SearchResult, len(results))
	copy(reranked, results)

	for i := 1; i < len(reranked); i++ {
		for j := i; j > 0; j-- {
			scoreJ := scores[j]
			scoreJM1 := scores[j-1]
			if scoreJ > scoreJM1 {
				reranked[j], reranked[j-1] = reranked[j-1], reranked[j]
				scores[j], scores[j-1] = scores[j-1], scores[j]
			}
		}
	}

	slog.Debug("Reranking complete", "original_top", results[0].Chunk.DocumentName,
		"reranked_top", reranked[0].Chunk.DocumentName)

	return reranked
}
