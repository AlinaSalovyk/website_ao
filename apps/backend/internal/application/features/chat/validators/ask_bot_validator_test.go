package validators

import (
	"testing"

	"university-chatbot/backend/internal/domain"
)

// TestValidate_ValidRequest tests the case where the request is valid.
func TestValidate_ValidRequest(t *testing.T) {
	v := NewAskBotValidator()

	req := &domain.ChatRequest{
		SessionID: "sess-123",
		Message:   "Які документи потрібні для вступу?",
		Language:  domain.LangUk,
	}
	if err := v.Validate(req); err != nil {
		t.Errorf("expected no error, got %v", err)
	}
}
// TestValidate_EmptyMessage tests the case where the message is empty.
func TestValidate_EmptyMessage(t *testing.T) {
	v := NewAskBotValidator()

	req := &domain.ChatRequest{
		SessionID: "sess-123",
		Message:   "",
		Language:  domain.LangUk,
	}
	if err := v.Validate(req); err == nil {
		t.Error("expected validation error for empty message")
	}
}
// TestValidate_TooLongMessage tests the case where the message is too long.
func TestValidate_TooLongMessage(t *testing.T) {
	v := NewAskBotValidator()

	longMsg := ""
	for i := 0; i < 501; i++ {
		longMsg += "a"
	}

	req := &domain.ChatRequest{
		SessionID: "sess-123",
		Message:   longMsg,
		Language:  domain.LangUk,
	}
	if err := v.Validate(req); err == nil {
		t.Error("expected validation error for message > 500 chars")
	}
}

// TestValidate_EmptySessionID tests the case where the session ID is empty.
func TestValidate_EmptySessionID(t *testing.T) {
	v := NewAskBotValidator()

	req := &domain.ChatRequest{
		SessionID: "",
		Message:   "test",
		Language:  domain.LangUk,
	}
	if err := v.Validate(req); err == nil {
		t.Error("expected validation error for empty session_id")
	}
}
// TestValidate_UnsupportedLanguageFallback tests the fallback to English when no context is found.
func TestValidate_UnsupportedLanguageFallback(t *testing.T) {
	v := NewAskBotValidator()

	req := &domain.ChatRequest{
		SessionID: "sess-123",
		Message:   "test message",
		Language:  domain.Language("fr"),
	}
	err := v.Validate(req)
	if err != nil {
		t.Errorf("expected no error after language fallback, got %v", err)
	}
	if req.Language != domain.LangUk {
		t.Errorf("expected language fallback to 'uk', got %s", req.Language)
	}
}
// TestValidate_EnglishLanguage tests the case where the language is English.
func TestValidate_EnglishLanguage(t *testing.T) {
	v := NewAskBotValidator()

	req := &domain.ChatRequest{
		SessionID: "sess-456",
		Message:   "What courses are available?",
		Language:  domain.LangEn,
	}
	if err := v.Validate(req); err != nil {
		t.Errorf("expected no error for English request, got %v", err)
	}
}
// TestValidationError_ErrorString tests the Error method of ValidationError.
func TestValidationError_ErrorString(t *testing.T) {
	ve := &ValidationError{
		Errors: []FieldError{
			{Field: "message", Message: "required"},
			{Field: "session_id", Message: "required"},
		},
	}
	errStr := ve.Error()
	if errStr == "" {
		t.Error("expected non-empty error string")
	}
}
