package openrouter

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"university-chatbot/backend/internal/domain"
)

// DocumentMetadata holds the LLM-extracted metadata for a document.
type DocumentMetadata struct {
	Language string `json:"language"` // "uk" or "en".
	DocType  string `json:"doc_type"` // One of: rules, syllabus, schedule, faq, order, general.
	Summary  string `json:"summary"`  // Short summary of the document content.
}

// MetadataExtractor uses the LLM to classify uploaded documents, detecting
// language, document type, and generating a brief summary. Falls back to
// heuristic defaults if the LLM call fails.
type MetadataExtractor struct {
	client *Client
}

// NewMetadataExtractor creates a new MetadataExtractor.
func NewMetadataExtractor(client *Client) *MetadataExtractor {
	return &MetadataExtractor{client: client}
}

// ExtractMetadata sends the first 2000 chars of document text to the LLM
// for classification. Returns heuristic defaults on LLM failure.
func (m *MetadataExtractor) ExtractMetadata(ctx context.Context, text string) (*DocumentMetadata, error) {
	excerpt := text
	if len(excerpt) > 2000 {
		excerpt = excerpt[:2000]
	}

	prompt := fmt.Sprintf(domain.MetadataExtractionPrompt, excerpt)

	var meta DocumentMetadata
	err := m.client.GenerateJSON(ctx, prompt, &meta)
	if err != nil {
		slog.Warn("OpenRouter metadata extraction failed, using defaults", "error", err)
		return defaultMetadata(text), nil
	}

	meta.Language = normalizeLanguage(meta.Language)
	meta.DocType = normalizeDocType(meta.DocType)
	return &meta, nil
}

func defaultMetadata(text string) *DocumentMetadata {
	lang := "uk"
	cyrillic, latin := 0, 0
	for _, r := range text {
		if r >= 'а' && r <= 'я' || r >= 'А' && r <= 'Я' || r == 'і' || r == 'ї' || r == 'є' || r == 'ґ' {
			cyrillic++
		} else if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' {
			latin++
		}
	}
	if latin > cyrillic {
		lang = "en"
	}

	return &DocumentMetadata{
		Language: lang,
		DocType:  "general",
		Summary:  "",
	}
}

func normalizeLanguage(lang string) string {
	lang = strings.ToLower(strings.TrimSpace(lang))
	if lang == "en" || lang == "english" {
		return "en"
	}
	return "uk"
}

func normalizeDocType(dt string) string {
	dt = strings.ToLower(strings.TrimSpace(dt))
	validTypes := map[string]bool{
		"rules": true, "syllabus": true, "schedule": true,
		"faq": true, "order": true, "general": true,
	}
	if validTypes[dt] {
		return dt
	}
	return "general"
}
