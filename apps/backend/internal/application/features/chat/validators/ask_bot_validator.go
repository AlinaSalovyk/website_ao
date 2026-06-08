// Package validators provides input validation for chat feature use cases.
package validators

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/security"
)

// ValidationError wraps multiple field-level validation errors into a single error.
type ValidationError struct {
	Errors []FieldError `json:"errors"`
}

// Error implements the error interface, producing a semicolon-delimited
// list of field: message pairs suitable for HTTP JSON error responses.
func (e *ValidationError) Error() string {
	msgs := make([]string, 0, len(e.Errors))
	for _, fe := range e.Errors {
		msgs = append(msgs, fe.Field+": "+fe.Message)
	}
	return strings.Join(msgs, "; ")
}


// FieldError describes a single field-level validation failure.
type FieldError struct {
	Field   string `json:"field"`   // JSON field name that failed validation.
	Message string `json:"message"` // Validator tag name (e.g. "required", "max").
}
// AskBotValidator validates and sanitizes inbound ChatRequest payloads.
// It enforces:
//   - Language normalization (defaults to UK if invalid)
//   - XSS payload detection (rejects malicious input)
//   - HTML entity escaping via SanitizeInput
//   - Struct tag validation (required fields, max length)
type AskBotValidator struct {
	validate *validator.Validate
}

// NewAskBotValidator creates a new validator instance.
func NewAskBotValidator() *AskBotValidator {
	return &AskBotValidator{validate: validator.New()}
}

// Validate checks and sanitizes a ChatRequest.
// Returns ValidationError for struct tag violations, or a plain error for XSS detection.
func (v *AskBotValidator) Validate(req *domain.ChatRequest) error {
	if req.Language != domain.LangUk && req.Language != domain.LangEn {
		req.Language = domain.LangUk
	}
	if security.DetectXSSPayload(req.Message) {
		return fmt.Errorf("message contains potentially malicious content")
	}
	req.Message = security.SanitizeInput(req.Message)

	err := v.validate.Struct(req)
	if err != nil {
		var errs []FieldError
		for _, err := range err.(validator.ValidationErrors) {
			errs = append(errs, FieldError{
				Field:   strings.ToLower(err.Field()),
				Message: err.Tag(),
			})
		}
		return &ValidationError{Errors: errs}
	}
	return nil
}
