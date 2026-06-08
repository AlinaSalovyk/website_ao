// Package utils provides LLM output post-processing utilities:
// malformed JSON repair (SanitizeLLMJSON) and heuristic language detection.
package utils

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// Regular expressions to find trailing commas in arrays and objects.
var (
	trailingCommaArray  = regexp.MustCompile(`,\s*]`)
	trailingCommaObject = regexp.MustCompile(`,\s*}`)
)

// SanitizeLLMJSON attempts to repair malformed JSON commonly produced by LLMs.
// It applies the following repair strategies in order:
//  1. Validate as-is
//  2. Strip markdown ```json wrappers
//  3. Remove trailing commas
//  4. Escape unescaped control characters inside strings
//  5. Extract outermost JSON object/array
//
// Returns the repaired JSON string or an error if all strategies fail.
func SanitizeLLMJSON(raw string) (string, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return "", fmt.Errorf("empty JSON input")
	}

	if json.Valid([]byte(s)) {
		return s, nil
	}

	cleaned := stripMarkdownWrapper(s)
	cleaned = removeTrailingCommas(cleaned)

	if json.Valid([]byte(cleaned)) {
		return cleaned, nil
	}

	escaped := EscapeControlCharsInStrings(cleaned)
	if json.Valid([]byte(escaped)) {
		return escaped, nil
	}

	extracted := extractOuterJSON(escaped)
	if extracted != "" && json.Valid([]byte(extracted)) {
		return extracted, nil
	}

	return "", fmt.Errorf("unfixable JSON after all repair attempts, first 200 chars: %s", truncate(raw, 200))
}

// SafeJSONUnmarshal first tries standard json.Unmarshal, then falls back to
// SanitizeLLMJSON + Unmarshal if the initial attempt fails.
func SafeJSONUnmarshal(data []byte, target any) error {
	if err := json.Unmarshal(data, target); err == nil {
		return nil
	}

	fixed, fixErr := SanitizeLLMJSON(string(data))
	if fixErr != nil {
		return fmt.Errorf("JSON unmarshal failed and repair failed: %w", fixErr)
	}

	return json.Unmarshal([]byte(fixed), target)
}

// EscapeControlCharsInStrings escapes unescaped control characters (\n, \r, \t) within JSON strings.
func EscapeControlCharsInStrings(text string) string {
	var result strings.Builder
	result.Grow(len(text))

	inString := false
	escapeNext := false

	for _, ch := range text {
		if escapeNext {
			result.WriteRune(ch)
			escapeNext = false
			continue
		}

		if ch == '\\' && inString {
			escapeNext = true
			result.WriteRune(ch)
			continue
		}

		if ch == '"' {
			inString = !inString
			result.WriteRune(ch)
			continue
		}

		if inString {
			switch ch {
			case '\n':
				result.WriteString(`\n`)
				continue
			case '\r':
				result.WriteString(`\r`)
				continue
			case '\t':
				result.WriteString(`\t`)
				continue
			}
		}

		result.WriteRune(ch)
	}

	return result.String()
}

// stripMarkdownWrapper removes markdown ```json (or ```) code block markers from the string.
func stripMarkdownWrapper(s string) string {
	s = strings.TrimSpace(s)

	if strings.HasPrefix(s, "```json") {
		s = s[7:]
	} else if strings.HasPrefix(s, "```") {
		s = s[3:]
	}

	if strings.HasSuffix(s, "```") {
		s = s[:len(s)-3]
	}

	return strings.TrimSpace(s)
}

// removeTrailingCommas removes trailing commas in arrays and objects.
func removeTrailingCommas(s string) string {
	s = trailingCommaArray.ReplaceAllString(s, "]")
	s = trailingCommaObject.ReplaceAllString(s, "}")
	return s
}

// extractOuterJSON attempts to extract the outermost JSON object or array.
func extractOuterJSON(s string) string {
	firstBrace := strings.Index(s, "{")
	lastBrace := strings.LastIndex(s, "}")
	if firstBrace >= 0 && lastBrace > firstBrace {
		candidate := s[firstBrace : lastBrace+1]
		if json.Valid([]byte(candidate)) {
			return candidate
		}
	}

	firstBracket := strings.Index(s, "[")
	lastBracket := strings.LastIndex(s, "]")
	if firstBracket >= 0 && lastBracket > firstBracket {
		candidate := s[firstBracket : lastBracket+1]
		if json.Valid([]byte(candidate)) {
			return candidate
		}
	}

	return ""
}

// truncate returns the first maxLen characters of s, or s itself if shorter.
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
