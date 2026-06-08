package queries

import (
	"context"
	"log/slog"
	"math/rand"

	"university-chatbot/backend/internal/domain"
)

// PromptSelector implements weighted random selection of system prompt
// variants for A/B testing. When no custom variants exist in the database,
// it falls back to the hardcoded default prompts from domain.SystemPromptUA/EN.
type PromptSelector struct {
	repo domain.PromptRepo
}

// NewPromptSelector creates a PromptSelector backed by the given repository.
func NewPromptSelector(repo domain.PromptRepo) *PromptSelector {
	return &PromptSelector{repo: repo}
}

// PromptSelection holds the result of a prompt variant selection.
type PromptSelection struct {
	PromptText string // The full system prompt text to send to the LLM.
	VariantID  int64  // Database ID of the selected variant (0 = default).
}

// Select picks a random active prompt variant for the given language.
// It increments usage count asynchronously for analytics.
//
// Returns:
//   - PromptSelection: selected prompt text and variant ID
func (s *PromptSelector) Select(ctx context.Context, lang domain.Language) PromptSelection {
	if s.repo == nil {
		return defaultPrompt(lang)
	}

	variants, err := s.repo.ActiveVariants(ctx, lang)
	if err != nil {
		slog.Warn("Failed to fetch prompt variants, using default", "error", err)
		return defaultPrompt(lang)
	}

	if len(variants) == 0 {
		return defaultPrompt(lang)
	}

	chosen := variants[rand.Intn(len(variants))]

	go func() {
		if err := s.repo.IncrementUsage(context.Background(), chosen.ID); err != nil {
			slog.Warn("Failed to increment prompt usage", "variant_id", chosen.ID, "error", err)
		}
	}()

	return PromptSelection{
		PromptText: chosen.PromptText,
		VariantID:  chosen.ID,
	}
}

// RecordFeedback records a user feedback score against the prompt variant
// that was used for the interaction. This data drives A/B test analysis.
func (s *PromptSelector) RecordFeedback(ctx context.Context, variantID int64, feedback domain.Feedback) {
	if s.repo == nil || variantID == 0 {
		return
	}

	score := float64(feedback)
	if err := s.repo.RecordScore(ctx, variantID, score); err != nil {
		slog.Warn("Failed to record prompt score", "variant_id", variantID, "error", err)
	}
}

// defaultPrompt returns the hardcoded system prompt for the given language.
// Used as a fallback when the database contains no active prompt variants.
func defaultPrompt(lang domain.Language) PromptSelection {
	if lang == domain.LangEn {
		return PromptSelection{PromptText: domain.SystemPromptEN, VariantID: 0}
	}
	return PromptSelection{PromptText: domain.SystemPromptUA, VariantID: 0}
}
