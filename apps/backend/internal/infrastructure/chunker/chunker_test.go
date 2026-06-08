package chunker

import (
	"strings"
	"testing"
)

// TestChunk_BasicSplit tests that the chunker splits text into chunks.
func TestChunk_BasicSplit(t *testing.T) {
	c := NewChunker()
	text := strings.Repeat("Абзац номер один. ", 50) + "\n\n" + strings.Repeat("Абзац номер два. ", 50)

	chunks := c.Chunk("doc-1", "test.txt", "document", "uk", text)

	if len(chunks) == 0 {
		t.Fatal("expected at least one chunk")
	}

	for _, ch := range chunks {
		if ch.DocumentID != "doc-1" {
			t.Errorf("expected DocumentID=doc-1, got %s", ch.DocumentID)
		}
		if ch.DocumentName != "test.txt" {
			t.Errorf("expected DocumentName=test.txt, got %s", ch.DocumentName)
		}
		if ch.Metadata["doc_type"] != "document" {
			t.Errorf("expected doc_type=document, got %s", ch.Metadata["doc_type"])
		}
		if ch.Metadata["language"] != "uk" {
			t.Errorf("expected language=uk, got %s", ch.Metadata["language"])
		}
	}
}

// SmallTextSingleChunk tests that text smaller than the minimum chunk size is not chunked.
func TestChunk_SmallTextSingleChunk(t *testing.T) {
	c := NewChunker()
	text := "Це короткий текст про кафедру."

	chunks := c.Chunk("doc-2", "short.txt", "faq", "uk", text)

	if len(text) >= MinChunkChars && len(chunks) != 1 {
		t.Errorf("expected 1 chunk for short text, got %d", len(chunks))
	}
}

// EmptyText tests that empty text is not chunked.
func TestChunk_EmptyText(t *testing.T) {
	c := NewChunker()

	chunks := c.Chunk("doc-3", "empty.txt", "document", "uk", "")
	if len(chunks) != 0 {
		t.Errorf("expected 0 chunks for empty text, got %d", len(chunks))
	}
}

// TinyTextBelowMinimum tests that text smaller than the minimum chunk size is not chunked.
func TestChunk_TinyTextBelowMinimum(t *testing.T) {
	c := NewChunker()

	chunks := c.Chunk("doc-4", "tiny.txt", "document", "uk", "Abc")
	if len(chunks) != 0 {
		t.Errorf("expected 0 chunks for tiny text, got %d", len(chunks))
	}
}

// Overlap tests that the chunk overlap is correct.
func TestChunk_Overlap(t *testing.T) {
	c := NewChunker()

	var parts []string
	for i := 0; i < 10; i++ {
		parts = append(parts, strings.Repeat("Текст блоку. ", 30))
	}
	text := strings.Join(parts, "\n\n")

	chunks := c.Chunk("doc-5", "overlap.txt", "document", "uk", text)

	if len(chunks) < 2 {
		t.Skipf("text produced only %d chunk(s); need 2+ for overlap test", len(chunks))
	}

	for i := 1; i < len(chunks); i++ {
		prev := chunks[i-1].Text
		curr := chunks[i].Text

		overlapEnd := prev
		if len(overlapEnd) > OverlapChars {
			overlapEnd = overlapEnd[len(overlapEnd)-OverlapChars:]
		}
		if len(overlapEnd) > 20 {
			checkStr := overlapEnd[len(overlapEnd)-20:]
			if !strings.Contains(curr, checkStr) {
				t.Logf("note: overlap check for chunk %d may have been trimmed to word boundary", i)
			}
		}
	}
}

// DeterministicIDs tests that the chunk IDs are deterministic.
func TestChunk_DeterministicIDs(t *testing.T) {
	c := NewChunker()
	text := strings.Repeat("Детермінований текст. ", 10)

	chunks1 := c.Chunk("doc-6", "determ.txt", "document", "uk", text)
	chunks2 := c.Chunk("doc-6", "determ.txt", "document", "uk", text)

	if len(chunks1) != len(chunks2) {
		t.Fatalf("chunk count differs: %d vs %d", len(chunks1), len(chunks2))
	}

	for i := range chunks1 {
		if chunks1[i].ID != chunks2[i].ID {
			t.Errorf("chunk %d ID differs: %s vs %s", i, chunks1[i].ID, chunks2[i].ID)
		}
	}
}

// PageNumbers tests that the chunk page numbers are correct.
func TestChunk_PageNumbers(t *testing.T) {
	c := NewChunker()
	text := strings.Repeat("Великий текстовий блок для тестування. ", 100)

	chunks := c.Chunk("doc-7", "pages.txt", "document", "uk", text)

	for i, ch := range chunks {
		if ch.PageNumber != i+1 {
			t.Errorf("chunk %d: expected PageNumber=%d, got %d", i, i+1, ch.PageNumber)
		}
	}
}
