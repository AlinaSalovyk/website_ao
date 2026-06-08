package testutil

import (
	"university-chatbot/backend/internal/domain"
)

// Sample Chat Requests

// SampleChatRequestUA returns a valid Ukrainian chat request for testing.
func SampleChatRequestUA() *domain.ChatRequest {
	return &domain.ChatRequest{
		SessionID: "test-session-001",
		Message:   "Які документи потрібні для вступу?",
		Language:  domain.LangUk,
	}
}

// SampleChatRequestEN returns a valid English chat request for testing.
func SampleChatRequestEN() *domain.ChatRequest {
	return &domain.ChatRequest{
		SessionID: "test-session-002",
		Message:   "What documents are needed for admission?",
		Language:  domain.LangEn,
	}
}

// SampleChunk returns a test chunk with given document name and text.
func SampleChunk(docName, text string) domain.Chunk {
	return domain.Chunk{
		ID:           "test-chunk-id-001",
		DocumentID:   "test-doc-id-001",
		DocumentName: docName,
		Text:         text,
		PageNumber:   1,
		Metadata: map[string]string{
			"doc_type": "rules",
			"language": "uk",
		},
	}
}

// SampleSearchResult returns a search result with the given score.
func SampleSearchResult(docName, text string, score float32) domain.SearchResult {
	return domain.SearchResult{
		Chunk: SampleChunk(docName, text),
		Score: score,
	}
}

// SampleUploadJob returns a test upload job with pending status.
func SampleUploadJob() *domain.UploadJob {
	return &domain.UploadJob{
		ID:       "test-job-001",
		Filename: "test_document.pdf",
		Status:   domain.JobStatusPending,
	}
}

// OffTopicMessages returns a set of messages that should trigger the off-topic filter.
func OffTopicMessages() []string {
	return []string{
		"яка погода завтра",
		"розкажи анекдот",
		"хто президент",
		"порахуй 2+2",
	}
}

// OnTopicMessages returns valid university-related questions.
func OnTopicMessages() []string {
	return []string{
		"Які документи потрібні для вступу?",
		"Коли починається навчальний рік?",
		"Які спеціальності доступні на кафедрі?",
		"Розклад занять на перший курс",
	}
}

// MalformedJSONSamples returns common malformed JSON patterns from LLM responses.
func MalformedJSONSamples() map[string]string {
	return map[string]string{
		"markdown_wrapped":  "```json\n{\"key\": \"value\"}\n```",
		"trailing_comma":    `{"items": ["a", "b",]}`,
		"with_prose":        `Here is the result: {"key": "value"} Hope this helps!`,
		"control_chars":     "{\"text\": \"line1\nline2\"}",
		"clean":             `{"key": "value"}`,
	}
}
