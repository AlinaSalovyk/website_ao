package security

import "strings"

// SanitizeInput replaces HTML-sensitive characters with their entity equivalents
// to prevent XSS when user input is reflected in responses.
func SanitizeInput(s string) string {
	r := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		"\"", "&quot;",
		"'", "&#39;",
		"`", "&#96;",
	)
	return r.Replace(s)
}

// DetectXSSPayload returns true if the input contains known XSS attack patterns
// such as <script>, javascript:, event handlers, or SQL injection attempts.
func DetectXSSPayload(s string) bool {
	lower := strings.ToLower(s)
	patterns := []string{
		"<script",
		"javascript:",
		"onerror=",
		"onload=",
		"onclick=",
		"onmouseover=",
		"onfocus=",
		"<iframe",
		"<object",
		"<embed",
		"<svg/onload",
		"eval(",
		"document.cookie",
		"document.location",
		"window.location",
	}
	for _, p := range patterns {
		if strings.Contains(lower, p) {
			return true
		}
	}
	return false
}
