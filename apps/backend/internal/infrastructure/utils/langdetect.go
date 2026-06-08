package utils

import (
	"strings"
)


// DetectLanguage performs heuristic language detection on the given text.
// Returns "uk" for Ukrainian (default), "en" for English.
// Detection is based on the ratio of Cyrillic vs Latin characters,
// with Ukrainian-specific letters (і, ї, є, ґ) boosting the "uk" signal.
func DetectLanguage(text string) string {
	text = strings.TrimSpace(text)
	if text == "" {
		return "uk" // default
	}

	var cyrillic, latin, ukrainian int

	for _, r := range text {
		switch {
		case r >= 'а' && r <= 'я' || r >= 'А' && r <= 'Я':
			cyrillic++
		case r == 'і' || r == 'І' || r == 'ї' || r == 'Ї' ||
			r == 'є' || r == 'Є' || r == 'ґ' || r == 'Ґ':
			cyrillic++
			ukrainian++ 
		case r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z':
			latin++
		}
	}

	total := cyrillic + latin
	if total == 0 {
		return "uk" 
	}

	if ukrainian > 0 {
		return "uk"
	}
	if float64(latin)/float64(total) > 0.6 {
		return "en"
	}

	return "uk"
}
