package utils

import (
	"testing"
)

// Tests that the function correctly handles valid JSON input.
func TestSanitizeLLMJSON_ValidJSON(t *testing.T) {
	input := `{"key": "value", "num": 42}`
	result, err := SanitizeLLMJSON(input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result != input {
		t.Errorf("expected pass-through, got %q", result)
	}
}

// Tests that the function correctly handles JSON wrapped in Markdown code blocks.
func TestSanitizeLLMJSON_MarkdownWrapped(t *testing.T) {
	input := "```json\n{\"key\": \"value\"}\n```"
	result, err := SanitizeLLMJSON(input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result != `{"key": "value"}` {
		t.Errorf("expected unwrapped JSON, got %q", result)
	}
}

// Tests that the function correctly handles JSON wrapped in Markdown code blocks without a language specifier.
func TestSanitizeLLMJSON_MarkdownWrappedNoLang(t *testing.T) {
	input := "```\n{\"key\": \"value\"}\n```"
	result, err := SanitizeLLMJSON(input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result != `{"key": "value"}` {
		t.Errorf("expected unwrapped JSON, got %q", result)
	}
}

// Tests that the function correctly handles JSON with trailing commas.
func TestSanitizeLLMJSON_TrailingCommas(t *testing.T) {
	input := `{"items": ["a", "b", ], "x": 1, }`
	result, err := SanitizeLLMJSON(input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result == "" {
		t.Error("expected non-empty result")
	}
}

// Tests that the function correctly handles JSON with surrounding prose.
func TestSanitizeLLMJSON_SurroundingProse(t *testing.T) {
	input := `Here is the result: {"language": "uk", "type": "rules"} I hope this helps!`
	result, err := SanitizeLLMJSON(input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result != `{"language": "uk", "type": "rules"}` {
		t.Errorf("expected extracted JSON, got %q", result)
	}
}

// Tests that the function returns an error for empty input.
func TestSanitizeLLMJSON_Empty(t *testing.T) {
	_, err := SanitizeLLMJSON("")
	if err == nil {
		t.Error("expected error for empty input")
	}
}

// Tests that the function returns an error for input that is not valid JSON.
func TestSanitizeLLMJSON_TotalGarbage(t *testing.T) {
	_, err := SanitizeLLMJSON("this is not json at all")
	if err == nil {
		t.Error("expected error for non-JSON input")
	}
}

// Tests that control characters within JSON strings are properly escaped.
func TestEscapeControlCharsInStrings(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "newline inside string",
			input:    "{\"text\": \"hello\nworld\"}",
			expected: "{\"text\": \"hello\\nworld\"}",
		},
		{
			name:     "tab inside string",
			input:    "{\"text\": \"hello\tworld\"}",
			expected: "{\"text\": \"hello\\tworld\"}",
		},
		{
			name:     "newline outside string preserved",
			input:    "{\n\"key\": \"value\"\n}",
			expected: "{\n\"key\": \"value\"\n}",
		},
		{
			name:     "already escaped stays same",
			input:    `{"text": "hello\\nworld"}`,
			expected: `{"text": "hello\\nworld"}`,
		},
		{
			name:     "carriage return inside string",
			input:    "{\"text\": \"hello\rworld\"}",
			expected: "{\"text\": \"hello\\rworld\"}",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := EscapeControlCharsInStrings(tt.input)
			if result != tt.expected {
				t.Errorf("got %q, want %q", result, tt.expected)
			}
		})
	}
}

// Tests that the function correctly unmarshals valid JSON.
func TestSafeJSONUnmarshal_ValidJSON(t *testing.T) {
	var target map[string]string
	err := SafeJSONUnmarshal([]byte(`{"key": "value"}`), &target)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if target["key"] != "value" {
		t.Errorf("expected key=value, got %s", target["key"])
	}
}

// Tests that the function can unmarshal JSON that requires fixing.
func TestSafeJSONUnmarshal_FixableJSON(t *testing.T) {
	var target map[string]string
	err := SafeJSONUnmarshal([]byte("```json\n{\"key\": \"value\"}\n```"), &target)
	if err != nil {
		t.Fatalf("expected no error after fix, got %v", err)
	}
	if target["key"] != "value" {
		t.Errorf("expected key=value, got %s", target["key"])
	}
}	
