package translation_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"university-chatbot/backend/internal/infrastructure/translation"
)

func TestLibreTranslateProvider_Suite(t *testing.T) {
	// 1. Text vs HTML format request verification
	t.Run("Text vs HTML Request Format Modes", func(t *testing.T) {
		var receivedFormats []string
		mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var req struct {
				Q      []string `json:"q"`
				Format string   `json:"format"`
			}
			json.NewDecoder(r.Body).Decode(&req)
			receivedFormats = append(receivedFormats, req.Format)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"translatedText": []string{"Translated"},
			})
		}))
		defer mockServer.Close()

		provider := translation.NewLibreTranslateProvider(mockServer.URL)
		
		// Plain text mode
		_, err := provider.TranslateBatch(context.Background(), []string{"Title"}, "uk", "en", "text")
		if err != nil {
			t.Fatalf("TranslateBatch text failed: %v", err)
		}

		// HTML mode
		_, err = provider.TranslateBatch(context.Background(), []string{"<p>Content</p>"}, "uk", "en", "html")
		if err != nil {
			t.Fatalf("TranslateBatch html failed: %v", err)
		}

		if len(receivedFormats) != 2 {
			t.Fatalf("expected 2 requests, got %d", len(receivedFormats))
		}
		if receivedFormats[0] != "text" {
			t.Errorf("expected first format=text, got %s", receivedFormats[0])
		}
		if receivedFormats[1] != "html" {
			t.Errorf("expected second format=html, got %s", receivedFormats[1])
		}
	})

	// 2. Valid HTML translation + Structure preservation
	t.Run("Valid HTML Batch Structure", func(t *testing.T) {
		mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var req struct {
				Q      []string `json:"q"`
				Source string   `json:"source"`
				Target string   `json:"target"`
				Format string   `json:"format"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				t.Fatalf("decode request: %v", err)
			}

			if req.Format != "html" {
				t.Errorf("expected format=html, got %s", req.Format)
			}

			translated := make([]string, len(req.Q))
			for i, txt := range req.Q {
				tr := txt
				tr = strings.ReplaceAll(tr, "Заголовок", "Headline")
				tr = strings.ReplaceAll(tr, "Це <strong>важливий</strong> текст із <a href=\"https://example.com/news?id=15\">посиланням</a>.", "This is <strong>important</strong> text with a <a href=\"https://example.com/news?id=15\">link</a>.")
				tr = strings.ReplaceAll(tr, "Перший пункт", "First item")
				tr = strings.ReplaceAll(tr, "Другий <em>пункт</em>", "Second <em>item</em>")
				tr = strings.ReplaceAll(tr, "Перший крок", "First step")
				tr = strings.ReplaceAll(tr, "Другий крок", "Second step")
				tr = strings.ReplaceAll(tr, "Українська цитата", "Ukrainian quote")
				translated[i] = tr
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"translatedText": translated,
			})
		}))
		defer mockServer.Close()

		provider := translation.NewLibreTranslateProvider(mockServer.URL)
		inputHTML := []string{
			"<h2>Заголовок</h2>",
			"<p>Це <strong>важливий</strong> текст із <a href=\"https://example.com/news?id=15\">посиланням</a>.</p>",
			"<ul><li>Перший пункт</li><li>Другий <em>пункт</em></li></ul>",
			"<ol><li>Перший крок</li><li>Другий крок</li></ol>",
			"<blockquote>Українська цитата</blockquote>",
			`<img src="/news-images/example.webp" alt="опис">`,
			`<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>`,
		}

		res, err := provider.TranslateHTMLBatch(context.Background(), inputHTML, "uk", "en")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if len(res) != len(inputHTML) {
			t.Fatalf("expected %d results, got %d", len(inputHTML), len(res))
		}

		if res[0] != "<h2>Headline</h2>" {
			t.Errorf("Heading: got %q, want <h2>Headline</h2>", res[0])
		}
		if !strings.Contains(res[1], `href="https://example.com/news?id=15"`) || !strings.Contains(res[1], "<strong>important</strong>") {
			t.Errorf("Paragraph link href lost: got %q", res[1])
		}
		if !strings.Contains(res[2], "<ul><li>First item</li><li>Second <em>item</em></li></ul>") {
			t.Errorf("Unordered list got %q", res[2])
		}
		if !strings.Contains(res[3], "<ol><li>First step</li><li>Second step</li></ol>") {
			t.Errorf("Ordered list got %q", res[3])
		}
		if res[4] != "<blockquote>Ukrainian quote</blockquote>" {
			t.Errorf("Blockquote got %q", res[4])
		}
		if !strings.Contains(res[5], `src="/news-images/example.webp"`) {
			t.Errorf("Img src lost: got %q", res[5])
		}
		if !strings.Contains(res[6], `src="https://www.youtube.com/embed/dQw4w9WgXcQ"`) {
			t.Errorf("Iframe src lost: got %q", res[6])
		}
	})

	// 3. Provider timeout
	t.Run("Provider Timeout Error", func(t *testing.T) {
		mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(100 * time.Millisecond)
			w.WriteHeader(http.StatusOK)
		}))
		defer mockServer.Close()

		provider := translation.NewLibreTranslateProvider(mockServer.URL)
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
		defer cancel()

		_, err := provider.TranslateHTMLBatch(ctx, []string{"Тест"}, "uk", "en")
		if err == nil {
			t.Fatal("expected timeout error, got nil")
		}
		if !errors.Is(err, translation.ErrServiceUnavailable) {
			t.Errorf("expected ErrServiceUnavailable, got %v", err)
		}
	})

	// 4. Connection Error
	t.Run("Connection Error", func(t *testing.T) {
		provider := translation.NewLibreTranslateProvider("http://127.0.0.1:59999") // Unreachable port
		_, err := provider.TranslateHTMLBatch(context.Background(), []string{"Тест"}, "uk", "en")
		if err == nil {
			t.Fatal("expected connection error, got nil")
		}
		if !errors.Is(err, translation.ErrServiceUnavailable) {
			t.Errorf("expected ErrServiceUnavailable, got %v", err)
		}
	})

	// 5 & 9. HTTP 4xx & Unsupported Language Pair
	t.Run("HTTP 4xx Unsupported Language Pair", func(t *testing.T) {
		mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Target language 'xx' is not supported",
			})
		}))
		defer mockServer.Close()

		provider := translation.NewLibreTranslateProvider(mockServer.URL)
		_, err := provider.TranslateHTMLBatch(context.Background(), []string{"Тест"}, "uk", "xx")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if !errors.Is(err, translation.ErrLanguageUnavailable) {
			t.Errorf("expected ErrLanguageUnavailable, got %v", err)
		}
	})

	// 6. HTTP 5xx Server Error
	t.Run("HTTP 5xx Server Error", func(t *testing.T) {
		mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Internal translation error",
			})
		}))
		defer mockServer.Close()

		provider := translation.NewLibreTranslateProvider(mockServer.URL)
		_, err := provider.TranslateHTMLBatch(context.Background(), []string{"Тест"}, "uk", "en")
		if err == nil {
			t.Fatal("expected 500 error, got nil")
		}
		if !errors.Is(err, translation.ErrTranslationFailed) {
			t.Errorf("expected ErrTranslationFailed, got %v", err)
		}
	})

	// 7. Malformed JSON
	t.Run("Malformed JSON Response", func(t *testing.T) {
		mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("{invalid-json"))
		}))
		defer mockServer.Close()

		provider := translation.NewLibreTranslateProvider(mockServer.URL)
		_, err := provider.TranslateHTMLBatch(context.Background(), []string{"Тест"}, "uk", "en")
		if err == nil {
			t.Fatal("expected decode error, got nil")
		}
		if !errors.Is(err, translation.ErrTranslationFailed) {
			t.Errorf("expected ErrTranslationFailed, got %v", err)
		}
	})

	// 8. Missing translatedText
	t.Run("Missing translatedText Field", func(t *testing.T) {
		mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{})
		}))
		defer mockServer.Close()

		provider := translation.NewLibreTranslateProvider(mockServer.URL)
		_, err := provider.TranslateHTMLBatch(context.Background(), []string{"Тест"}, "uk", "en")
		if err == nil {
			t.Fatal("expected missing translatedText error, got nil")
		}
		if !errors.Is(err, translation.ErrTranslationFailed) {
			t.Errorf("expected ErrTranslationFailed, got %v", err)
		}
	})
}

func TestRestoreProtectedAttributes_Hardening(t *testing.T) {
	// Test 1: Mangled href restored
	orig := `<a href="https://example.com/news?id=100">Посилання</a>`
	mangled := `<a href="https://example.com/news?id=100_translated">Link</a>`
	restored := translation.RestoreProtectedAttributes(orig, mangled)
	if !strings.Contains(restored, `href="https://example.com/news?id=100"`) {
		t.Errorf("href not restored: %s", restored)
	}
	if !strings.Contains(restored, "Link") {
		t.Errorf("translated text overwritten: %s", restored)
	}

	// Test 2: Mangled src restored
	origSrc := `<img src="/news-images/uuid-1234.webp" alt="опис">`
	mangledSrc := `<img src="/news-images/uuid-1234-translated.webp" alt="description">`
	restoredSrc := translation.RestoreProtectedAttributes(origSrc, mangledSrc)
	if !strings.Contains(restoredSrc, `src="/news-images/uuid-1234.webp"`) {
		t.Errorf("src not restored: %s", restoredSrc)
	}
	if !strings.Contains(restoredSrc, `alt="description"`) {
		t.Errorf("translated alt text lost: %s", restoredSrc)
	}

	// Test 3: YouTube embed URL restored
	origVid := `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>`
	mangledVid := `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ_mangled" width="560" height="315"></iframe>`
	restoredVid := translation.RestoreProtectedAttributes(origVid, mangledVid)
	if !strings.Contains(restoredVid, `src="https://www.youtube.com/embed/dQw4w9WgXcQ"`) {
		t.Errorf("youtube src not restored: %s", restoredVid)
	}
}
