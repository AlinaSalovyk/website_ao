package queries

import (
	"context"
	"log/slog"

	"university-chatbot/backend/internal/domain"
)

// SuggestedQuestionsHandler manages the suggested questions shown to users
// before they type their first message. Supports both manually curated and
// auto-generated suggestions based on top analytics queries.
type SuggestedQuestionsHandler struct {
	suggestRepo   domain.SuggestionsRepo
	analyticsRepo domain.AnalyticsRepo
}

// NewSuggestedQuestionsHandler creates a new handler with the required repos.
func NewSuggestedQuestionsHandler(sr domain.SuggestionsRepo, ar domain.AnalyticsRepo) *SuggestedQuestionsHandler {
	return &SuggestedQuestionsHandler{suggestRepo: sr, analyticsRepo: ar}
}

// Handle retrieves suggested questions for the given language, capped at limit.
func (h *SuggestedQuestionsHandler) Handle(ctx context.Context, lang domain.Language, limit int) ([]domain.SuggestedQuestion, error) {
	if limit <= 0 {
		limit = 5
	}

	questions, err := h.suggestRepo.List(ctx, lang, limit)
	if err != nil {
		return nil, err
	}

	return questions, nil
}

// RefreshAutoSuggestions rebuilds the auto-generated suggestions by
// pulling top queries from analytics (last 30 days, min 3 occurrences)
// and inserting them as auto-suggestions with ascending priority.
func (h *SuggestedQuestionsHandler) RefreshAutoSuggestions(ctx context.Context, lang domain.Language) error {
	topQueries, err := h.analyticsRepo.TopQueries(ctx, 30, 10)
	if err != nil {
		return err
	}

	if err := h.suggestRepo.DeleteAuto(ctx, lang); err != nil {
		slog.Warn("Failed to delete old auto-suggestions", "error", err)
	}
	for i, q := range topQueries {
		if q.Count < 3 {
			continue
		}
		suggestion := &domain.SuggestedQuestion{
			Question: q.QueryText,
			Language: lang,
			IsAuto:   true,
			Priority: 100 + i,
		}
		if err := h.suggestRepo.Upsert(ctx, suggestion); err != nil {
			slog.Warn("Failed to create auto-suggestion", "error", err)
		}
	}

	return nil
}
