// Package chunker splits extracted document text into overlapping chunks
// suitable for embedding and vector storage. Uses a paragraph-aware strategy
// with configurable target size (~1400 chars) and overlap (~200 chars).
package chunker

import (
	"crypto/sha256"
	"fmt"
	"strings"
	"unicode"

	"university-chatbot/backend/internal/domain"
)

const (
	TargetChunkChars = 1400
	OverlapChars     = 200
	MinChunkChars    = 100
)

// Chunker splits document text into overlapping chunks for vector indexing.
type Chunker struct{}

// NewChunker creates a new Chunker instance.
func NewChunker() *Chunker { return &Chunker{} }

// Chunk splits the given text into overlapping domain.Chunk slices.
// Each chunk gets a deterministic SHA-256-based ID from (documentID + text).
// Chunks smaller than MinChunkChars (100) are discarded.
//
// Params:
//   - documentID: UUID of the parent document
//   - documentName: human-readable filename
//   - docType: one of "rules", "syllabus", "schedule", "faq", "order", "general"
//   - language: "uk" or "en"
//   - text: full extracted text to split
func (c *Chunker) Chunk(documentID, documentName, docType, language, text string) []domain.Chunk {
	text = strings.Join(strings.FieldsFunc(text, func(r rune) bool {
		return r == '\r'
	}), "")
	paragraphs := splitParagraphs(text)
	chunks := buildChunks(paragraphs, TargetChunkChars, OverlapChars)

	result := make([]domain.Chunk, 0, len(chunks))
	for i, chunkText := range chunks {
		chunkText = strings.TrimSpace(chunkText)
		if len(chunkText) < MinChunkChars {
			continue
		}

		hash := sha256.Sum256([]byte(documentID + chunkText))
		id := fmt.Sprintf("%x", hash[:16])

		result = append(result, domain.Chunk{
			ID:           id,
			DocumentID:   documentID,
			DocumentName: documentName,
			Text:         chunkText,
			PageNumber:   i + 1,
			Metadata: map[string]string{
				"doc_type": docType,
				"language": language,
			},
		})
	}
	return result
}

// splitParagraphs splits text on blank lines ("\n\n"), trims whitespace,
// and removes empty segments.
func splitParagraphs(text string) []string {
	raw := strings.Split(text, "\n\n")
	var out []string
	for _, p := range raw {
		p = strings.TrimFunc(p, unicode.IsSpace)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// buildChunks accumulates paragraphs into chunks up to targetSize bytes,
// prepending an overlap window from the previous chunk to maintain context.
func buildChunks(paragraphs []string, targetSize, overlapSize int) []string {
	var chunks []string
	var current strings.Builder

	flush := func() {
		if current.Len() > 0 {
			chunks = append(chunks, current.String())
		}
	}

	for _, para := range paragraphs {
		if current.Len()+len(para)+2 > targetSize && current.Len() > 0 {
			flush()
			overlap := current.String()
			if len(overlap) > overlapSize {
				overlap = overlap[len(overlap)-overlapSize:]
				if idx := strings.Index(overlap, " "); idx >= 0 {
					overlap = overlap[idx+1:]
				}
			}
			current.Reset()
			current.WriteString(overlap)
			if current.Len() > 0 {
				current.WriteString("\n\n")
			}
		}

		if current.Len() > 0 {
			current.WriteString("\n\n")
		}
		current.WriteString(para)
	}
	flush()
	return chunks
}
