// Package slugify provides Ukrainian-aware URL slug generation following
// ДСТУ 9112:2021 transliteration rules for the Cyrillic-to-Latin conversion,
// followed by kebab-case normalization and uniqueness enforcement.
//
// All functions in this package are pure and have no I/O dependencies.
// The uniqueness check (Unique) requires a SlugChecker to hit the database.
package slugify

import (
	"context"
	"fmt"
	"strings"
	"unicode"
)

// SlugChecker is the minimal interface needed to verify slug uniqueness.
// Implemented by domain.NewsRepo.SlugExists in production and by a test stub in tests.
type SlugChecker func(ctx context.Context, slug string, excludeID string) (bool, error)

// maxAutoSlugLength is the maximum byte length of an auto-generated slug.
const maxAutoSlugLength = 100

// cyrillic is the ДСТУ 9112:2021 Cyrillic → Latin transliteration table.
// Covers lowercase Ukrainian alphabet plus shared Ukrainian/Russian letters.
// Uppercase is handled by running ToLower first.
var cyrillic = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "h", 'ґ': "g",
	'д': "d", 'е': "e", 'є': "ie", 'ж': "zh", 'з': "z",
	'и': "y", 'і': "i", 'ї': "i", 'й': "i", 'к': "k",
	'л': "l", 'м': "m", 'н': "n", 'о': "o", 'п': "p",
	'р': "r", 'с': "s", 'т': "t", 'у': "u", 'ф': "f",
	'х': "kh", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "shch",
	'ь': "", 'ю': "iu", 'я': "ia",
}

// Generate converts title into a URL-safe kebab-case slug:
//  1. Lowercase all characters.
//  2. Transliterate Cyrillic via ДСТУ 9112:2021 (Ukrainian-first table).
//  3. Replace any non-alphanumeric ASCII character with a hyphen.
//  4. Collapse runs of hyphens into one.
//  5. Trim leading/trailing hyphens.
//  6. Truncate to maxSlugLen bytes.
//
// Returns an empty string if title contains no transliterable or ASCII characters.
func Generate(title string) string {
	title = strings.ToLower(title)

	var b strings.Builder
	b.Grow(len(title) * 2)

	for _, r := range title {
		if lat, ok := cyrillic[r]; ok {
			b.WriteString(lat)
		} else if r <= unicode.MaxASCII && (unicode.IsLetter(r) || unicode.IsDigit(r)) {
			b.WriteRune(r)
		} else {
			b.WriteByte('-')
		}
	}

	// Collapse consecutive hyphens.
	slug := b.String()
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")

	return wordBoundaryTruncate(slug, maxAutoSlugLength)
}

func wordBoundaryTruncate(slug string, limit int) string {
	if len(slug) <= limit {
		return slug
	}

	tokens := strings.Split(slug, "-")
	var finalSlug string

	for _, token := range tokens {
		additionLength := len(token)
		if len(finalSlug) > 0 {
			additionLength += 1 // For the hyphen
		}
		if len(finalSlug)+additionLength > limit {
			break
		}
		if len(finalSlug) == 0 {
			finalSlug = token
		} else {
			finalSlug += "-" + token
		}
	}

	if len(finalSlug) == 0 && len(tokens) > 0 {
		finalSlug = tokens[0]
		if len(finalSlug) > limit {
			finalSlug = finalSlug[:limit]
		}
	}

	return finalSlug
}

// Unique returns a slug that is guaranteed to be unique according to checker.
// It starts with Generate(title) and appends "-2", "-3", … until the checker
// confirms the slug is available or returns an error.
//
// excludeID is passed through to checker unchanged — pass the article's own UUID
// when updating an existing article so its current slug is not treated as a conflict.
func Unique(ctx context.Context, title string, excludeID string, checker SlugChecker) (string, error) {
	base := Generate(title)
	if base == "" {
		base = "article"
	}

	candidate := base
	for i := 2; i <= 100; i++ {
		exists, err := checker(ctx, candidate, excludeID)
		if err != nil {
			return "", fmt.Errorf("slugify unique check: %w", err)
		}
		if !exists {
			return candidate, nil
		}
		
		suffix := fmt.Sprintf("-%d", i)
		allowedBaseLen := maxAutoSlugLength - len(suffix)
		if allowedBaseLen < 1 {
			allowedBaseLen = 1
		}
		candidate = wordBoundaryTruncate(base, allowedBaseLen) + suffix
	}

	return "", fmt.Errorf("slugify: could not find unique slug for %q after 100 attempts", base)
}
