package utils

import "testing"

// Tests that the language detection works correctly for various inputs.
func TestDetectLanguage(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		expected string
	}{
		{"ukrainian_question", "Які документи потрібні для вступу?", "uk"},
		{"english_question", "What documents are needed for admission?", "en"},
		{"mixed_mostly_uk", "Розклад занять on Monday", "uk"},
		{"mixed_mostly_en", "Schedule for Monday and Tuesday розклад", "en"},
		{"empty_string", "", "uk"},
		{"numbers_only", "12345", "uk"},
		{"ukrainian_specific_chars", "Їжа для їжачка", "uk"},
		{"short_english", "Hi", "en"},
		{"short_ukrainian", "Привіт", "uk"},
		{"special_chars", "!@#$%^&*()", "uk"},
		{"question_with_i", "Що таке інформатика?", "uk"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := DetectLanguage(tt.text)
			if result != tt.expected {
				t.Errorf("DetectLanguage(%q) = %q, want %q", tt.text, result, tt.expected)
			}
		})
	}
}
