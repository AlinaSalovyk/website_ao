package security

import "testing"

// Tests that the input sanitizer correctly escapes potentially dangerous characters.
func TestSanitizeInput(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"plain text", "Як вступити?", "Як вступити?"},
		{"html tags", "<script>alert('xss')</script>", "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"},
		{"ampersand", "Tom & Jerry", "Tom &amp; Jerry"},
		{"quotes", `He said "hello"`, "He said &quot;hello&quot;"},
		{"backtick", "use `code`", "use &#96;code&#96;"},
		{"empty", "", ""},
		{"unicode safe", "Привіт 🇺🇦", "Привіт 🇺🇦"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := SanitizeInput(tc.input)
			if got != tc.expected {
				t.Errorf("SanitizeInput(%q) = %q, want %q", tc.input, got, tc.expected)
			}
		})
	}
}

// Tests that the XSS payload detector correctly identifies malicious inputs.
func TestDetectXSSPayload(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"Як вступити?", false},
		{"<script>alert(1)</script>", true},
		{"<SCRIPT>alert(1)</SCRIPT>", true},
		{"javascript:alert(1)", true},
		{"<img onerror=alert(1)>", true},
		{"<iframe src='evil'>", true},
		{"eval(document.cookie)", true},
		{"normal question about <admission>", false},
		{"What is the document.cookie policy?", true},
	}
	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			got := DetectXSSPayload(tc.input)
			if got != tc.expected {
				t.Errorf("DetectXSSPayload(%q) = %v, want %v", tc.input, got, tc.expected)
			}
		})
	}
}
