package domain_test

import (
	"testing"
	"university-chatbot/backend/internal/domain"
)

func TestNewsArticle_Validate(t *testing.T) {
	t.Run("missing category_id fails validation", func(t *testing.T) {
		article := domain.NewsArticle{
			Status:     domain.NewsStatusPublished,
			CategoryID: "",
			Locales: map[domain.Language]domain.NewsLocale{
				domain.LangUk: {Title: "Заголовок новини", Content: "<p>Текст новини</p>"},
			},
		}
		err := article.Validate()
		if err != domain.ErrNewsCategoryRequired {
			t.Fatalf("expected ErrNewsCategoryRequired, got: %v", err)
		}
	})

	t.Run("missing uk title fails validation", func(t *testing.T) {
		article := domain.NewsArticle{
			CategoryID: "cat-123",
			Locales: map[domain.Language]domain.NewsLocale{
				domain.LangUk: {Title: "   ", Content: "<p>Текст новини</p>"},
			},
		}
		err := article.Validate()
		if err != domain.ErrNewsUkTitleRequired {
			t.Fatalf("expected ErrNewsUkTitleRequired, got: %v", err)
		}
	})

	t.Run("empty html content fails validation", func(t *testing.T) {
		article := domain.NewsArticle{
			Status:     domain.NewsStatusPublished,
			CategoryID: "cat-123",
			Locales: map[domain.Language]domain.NewsLocale{
				domain.LangUk: {Title: "Заголовок", Content: "<p><br>&nbsp;</p>"},
			},
		}
		err := article.Validate()
		if err != domain.ErrNewsUkContentRequired {
			t.Fatalf("expected ErrNewsUkContentRequired, got: %v", err)
		}
	})

	t.Run("published status without en title passes validation", func(t *testing.T) {
		article := domain.NewsArticle{
			Status:     domain.NewsStatusPublished,
			CategoryID: "cat-123",
			Locales: map[domain.Language]domain.NewsLocale{
				domain.LangUk: {Title: "Заголовок", Content: "<p>Текст новини</p>"},
				domain.LangEn: {Title: "   ", Content: "<p>Content</p>"},
			},
		}
		if err := article.Validate(); err != nil {
			t.Fatalf("expected publishing without EN title to pass validation, got: %v", err)
		}
	})

	t.Run("valid draft article passes validation", func(t *testing.T) {
		article := domain.NewsArticle{
			Status:     domain.NewsStatusDraft,
			CategoryID: "cat-123",
			Locales: map[domain.Language]domain.NewsLocale{
				domain.LangUk: {Title: "Заголовок новини", Content: "<p>Актуальний текст новини</p>"},
			},
		}
		if err := article.Validate(); err != nil {
			t.Fatalf("expected valid draft to pass, got error: %v", err)
		}
	})

	t.Run("valid published article passes validation", func(t *testing.T) {
		article := domain.NewsArticle{
			Status:     domain.NewsStatusPublished,
			CategoryID: "cat-123",
			Locales: map[domain.Language]domain.NewsLocale{
				domain.LangUk: {Title: "Заголовок", Content: "<p>Текст новини</p>"},
				domain.LangEn: {Title: "News Headline", Content: "<p>English body</p>"},
			},
		}
		if err := article.Validate(); err != nil {
			t.Fatalf("expected valid published article to pass, got error: %v", err)
		}
	})
}
