package slugify_test

import (
	"context"
	"testing"

	"university-chatbot/backend/internal/infrastructure/slugify"
)

func TestGenerate(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "pure Ukrainian title",
			input: "Міжнародна Конференція з Науки",
			want:  "mizhnarodna-konferentsiia-z-nauky",
		},
		{
			name:  "pure English title",
			input: "International Science Conference",
			want:  "international-science-conference",
		},
		{
			name:  "mixed Ukrainian and numbers",
			input: "Топ 10 Досягнень 2024",
			want:  "top-10-dosiahnen-2024",
		},
		{
			name:  "title with special chars",
			input: "Наука & Технології: що нового?",
			want:  "nauka-tekhnolohii-shcho-novoho",
		},
		{
			name:  "title with extra spaces",
			input: "  Новини   Університету  ",
			want:  "novyny-universytetu",
		},
		{
			name:  "already latin",
			input: "hello-world",
			want:  "hello-world",
		},
		{
			name:  "ї і є letters",
			input: "їжак і єнот",
			want:  "izhak-i-ienot",
		},
		{
			name:  "empty input",
			input: "",
			want:  "",
		},
		{
			name:  "UK long title with soft token truncation",
			input: "Першокурсникам Острозької академії розповіли про бібліотечно-інформаційні ресурси й сервіси університетської бібліотеки",
			want:  "pershokursnykam-ostrozkoi-akademii-rozpovily-pro-bibliotechno-informatsiini-resursy-i-servisy",
		},
		{
			name:  "EN long title with soft token truncation",
			input: "The freshmen of the Ostrom Academy told me about library information and university library services",
			want:  "the-freshmen-of-the-ostrom-academy-told-me-about-library-information-and-university-library-services",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := slugify.Generate(tt.input)
			if tt.input == "" {
				if got != "" {
					t.Errorf("Generate(%q) = %q, want empty string", tt.input, got)
				}
				return
			}

			if got != tt.want {
				t.Errorf("Generate(%q)\n  got  %q\n  want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestGenerate_MaxLength(t *testing.T) {
	// Build a title that will produce a very long slug.
	long := "слово-" // 6 chars input → ~5 latin + 1 hyphen
	title := ""
	for i := 0; i < 20; i++ {
		title += long
	}
	got := slugify.Generate(title)
	if len(got) > 100 {
		t.Errorf("slug length %d exceeds 100 chars: %q", len(got), got)
	}
}

func TestGenerate_NoLeadingOrTrailingHyphens(t *testing.T) {
	cases := []string{
		"!!! заголовок !!!",
		"  ---  test  ---  ",
		"???",
	}
	for _, c := range cases {
		got := slugify.Generate(c)
		if len(got) > 0 {
			if got[0] == '-' || got[len(got)-1] == '-' {
				t.Errorf("Generate(%q) = %q has leading/trailing hyphen", c, got)
			}
		}
	}
}

func TestUnique_NoConflict(t *testing.T) {
	checker := func(_ context.Context, slug, _ string) (bool, error) {
		return false, nil // always available
	}
	got, err := slugify.Unique(context.Background(), "Моя Новина", "", checker)
	if err != nil {
		t.Fatal(err)
	}
	if got != "moia-novyna" {
		t.Errorf("Unique() = %q, want %q", got, "moia-novyna")
	}
}

func TestUnique_WithCollisions(t *testing.T) {
	taken := map[string]bool{
		"moia-novyna":   true,
		"moia-novyna-2": true,
	}
	checker := func(_ context.Context, slug, _ string) (bool, error) {
		return taken[slug], nil
	}
	got, err := slugify.Unique(context.Background(), "Моя Новина", "", checker)
	if err != nil {
		t.Fatal(err)
	}
	if got != "moia-novyna-3" {
		t.Errorf("Unique() = %q, want %q", got, "moia-novyna-3")
	}
}

func TestUnique_ExcludesOwnID(t *testing.T) {
	const ownSlug = "my-article"
	const ownID = "article-uuid-123"

	checker := func(_ context.Context, slug, excludeID string) (bool, error) {
		if slug == ownSlug && excludeID == ownID {
			return false, nil // own slug is not a conflict
		}
		return slug == ownSlug, nil
	}
	got, err := slugify.Unique(context.Background(), "my article", ownID, checker)
	if err != nil {
		t.Fatal(err)
	}
	if got != "my-article" {
		t.Errorf("Unique() = %q, want %q (should reuse own slug)", got, "my-article")
	}
}

func TestUnique_EmptyTitle_UsesDefault(t *testing.T) {
	checker := func(_ context.Context, slug, _ string) (bool, error) {
		return false, nil
	}
	got, err := slugify.Unique(context.Background(), "", "", checker)
	if err != nil {
		t.Fatal(err)
	}
	if got != "article" {
		t.Errorf("Unique() with empty title = %q, want %q", got, "article")
	}
}
