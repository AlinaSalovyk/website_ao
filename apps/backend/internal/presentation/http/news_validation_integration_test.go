package http_test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/sqlite"
	newshttp "university-chatbot/backend/internal/presentation/http"

	"github.com/go-chi/chi/v5"
)

type APIErrorResponse struct {
	Code        string            `json:"code"`
	ErrCode     string            `json:"error"`
	Message     string            `json:"message"`
	Field       string            `json:"field"`
	FieldErrors map[string]string `json:"field_errors"`
}

func (e APIErrorResponse) GetCode() string {
	if e.Code != "" {
		return e.Code
	}
	return e.ErrCode
}

// setupTestServer initializes a temporary SQLite DB with full migrations
// and returns a chi router configured with NewsHandler routes.
func setupTestServer(t *testing.T) (*chi.Mux, *sqlite.NewsRepo, func()) {
	t.Helper()
	f, err := os.CreateTemp("", "news_val_test_*.db")
	if err != nil {
		t.Fatalf("create temp file: %v", err)
	}
	f.Close()

	db, err := sqlite.InitDB(f.Name())
	if err != nil {
		os.Remove(f.Name())
		t.Fatalf("InitDB: %v", err)
	}

	repo := sqlite.NewNewsRepo(db)
	handler := newshttp.NewNewsHandler(repo, nil, nil, nil, nil, nil)

	r := chi.NewRouter()
	r.Post("/admin/news", handler.HandleCreate)
	r.Get("/admin/news/{id}", handler.HandleGetByID)
	r.Put("/admin/news/{id}", handler.HandleUpdate)

	cleanup := func() {
		db.Close()
		os.Remove(f.Name())
	}
	return r, repo, cleanup
}

func makeValidPayload() map[string]interface{} {
	return map[string]interface{}{
		"status":      "draft",
		"category_id": "cat-news",
		"author": map[string]interface{}{
			"name": "Автор Тесту",
		},
		"locales": map[string]interface{}{
			"uk": map[string]interface{}{
				"locale":      "uk",
				"title":       "Тестова новина",
				"slug":        "testova-novyna",
				"description": "Опис новини",
				"content":     "<p>Текст новини</p>",
			},
			"en": map[string]interface{}{
				"locale":      "en",
				"title":       "Test News",
				"slug":        "test-news",
				"description": "News description",
				"content":     "<p>News content</p>",
			},
		},
	}
}

func assertNoRawErrorLeaks(t *testing.T, body string) {
	t.Helper()
	leaks := []string{
		"SQLITE",
		"SQLITE_CONSTRAINT",
		"UNIQUE constraint failed",
		"FOREIGN KEY constraint failed",
		"NOT NULL constraint failed",
		"database is locked",
		"sql:",
		"tx.Exec",
		"panic",
		"stack trace",
		"runtime/",
		"github.com/",
		"modernc.org/",
		"Failed to create article",
		"Failed to update article",
		"synthetic database failure",
	}

	for _, leak := range leaks {
		if strings.Contains(body, leak) {
			t.Errorf("SECURITY/UX DEFECT: Response body leaked raw/generic error %q: %s", leak, body)
		}
	}
}

// ─── CATEGORY TESTS ──────────────────────────────────────────────────────────

func TestCreateNews_CategoryEmpty_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	payload := makeValidPayload()
	payload["category_id"] = ""
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
		t.Fatalf("failed to parse JSON error response: %v", err)
	}

	if errResp.GetCode() != "NEWS_CATEGORY_REQUIRED" {
		t.Errorf("Code: got %q, want NEWS_CATEGORY_REQUIRED", errResp.GetCode())
	}
	if errResp.Field != "category_id" {
		t.Errorf("Field: got %q, want category_id", errResp.Field)
	}
	wantMsg := "Оберіть категорію новини."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}
	if errResp.FieldErrors["category_id"] != wantMsg {
		t.Errorf("FieldErrors[category_id]: got %q, want %q", errResp.FieldErrors["category_id"], wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

func TestUpdateNews_CategoryEmpty_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	art := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Початкова Новина", Slug: "initial-uk"},
			domain.LangEn: {Locale: domain.LangEn, Title: "Initial News", Slug: "initial-en"},
		},
	}
	if err := repo.Create(context.Background(), art); err != nil {
		t.Fatalf("seed article: %v", err)
	}

	payload := makeValidPayload()
	payload["category_id"] = ""
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("PUT", "/admin/news/"+art.ID, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_CATEGORY_REQUIRED" || errResp.Field != "category_id" || errResp.Message != "Оберіть категорію новини." {
		t.Errorf("unexpected error response on update: %+v", errResp)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

func TestCreateNews_CategoryNonExistent_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	payload := makeValidPayload()
	payload["category_id"] = "cat-nonexistent-99999"
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_CATEGORY_NOT_FOUND" {
		t.Errorf("Code: got %q, want NEWS_CATEGORY_NOT_FOUND", errResp.GetCode())
	}
	if errResp.Field != "category_id" {
		t.Errorf("Field: got %q, want category_id", errResp.Field)
	}
	wantMsg := "Обрана категорія не існує або була видалена. Оберіть іншу категорію."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

func TestUpdateNews_CategoryNonExistent_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	art := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Початкова Новина", Slug: "initial-uk-2"},
			domain.LangEn: {Locale: domain.LangEn, Title: "Initial News 2", Slug: "initial-en-2"},
		},
	}
	repo.Create(context.Background(), art)

	payload := makeValidPayload()
	payload["category_id"] = "cat-deleted-uuid"
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("PUT", "/admin/news/"+art.ID, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_CATEGORY_NOT_FOUND" || errResp.Field != "category_id" {
		t.Errorf("unexpected error response: %+v", errResp)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── STATUS ENUM TESTS ───────────────────────────────────────────────────────

func TestCreateNews_InvalidStatus_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	payload := makeValidPayload()
	payload["status"] = "whatever"
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request for invalid status, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_STATUS_INVALID" {
		t.Errorf("Code: got %q, want NEWS_STATUS_INVALID", errResp.GetCode())
	}
	if errResp.Field != "status" {
		t.Errorf("Field: got %q, want status", errResp.Field)
	}
	wantMsg := "Оберіть коректний статус новини."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── UK TITLE TESTS ──────────────────────────────────────────────────────────

func TestCreateNews_MissingUkTitle_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	testCases := []struct {
		name  string
		title string
	}{
		{"empty string", ""},
		{"spaces only", "   "},
		{"tabs and newlines", "\t \n "},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			router, _, cleanup := setupTestServer(t)
			defer cleanup()

			payload := makeValidPayload()
			locales := payload["locales"].(map[string]interface{})
			ukLoc := locales["uk"].(map[string]interface{})
			ukLoc["title"] = tc.title
			bodyBytes, _ := json.Marshal(payload)

			req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected HTTP 400, got %d. Body: %s", rec.Code, rec.Body.String())
			}

			var errResp APIErrorResponse
			json.Unmarshal(rec.Body.Bytes(), &errResp)

			if errResp.GetCode() != "NEWS_TITLE_REQUIRED" {
				t.Errorf("Code: got %q, want NEWS_TITLE_REQUIRED", errResp.GetCode())
			}
			if errResp.Field != "title_uk" {
				t.Errorf("Field: got %q, want title_uk", errResp.Field)
			}
			wantMsg := "Введіть заголовок новини."
			if errResp.Message != wantMsg {
				t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
			}

			assertNoRawErrorLeaks(t, rec.Body.String())
		})
	}
}

func TestUpdateNews_MissingUkTitle_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	art := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Початкова Новина", Slug: "initial-uk-title"},
			domain.LangEn: {Locale: domain.LangEn, Title: "Initial News", Slug: "initial-en-title"},
		},
	}
	repo.Create(context.Background(), art)

	payload := makeValidPayload()
	locales := payload["locales"].(map[string]interface{})
	ukLoc := locales["uk"].(map[string]interface{})
	ukLoc["title"] = "   "
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("PUT", "/admin/news/"+art.ID, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_TITLE_REQUIRED" || errResp.Field != "title_uk" || errResp.Message != "Введіть заголовок новини." {
		t.Errorf("unexpected error response on update title: %+v", errResp)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── UK CONTENT TESTS ────────────────────────────────────────────────────────

func TestCreateNews_EmptyUkContent_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	emptyHTMLs := []struct {
		name string
		html string
	}{
		{"empty string", ""},
		{"spaces only", "   "},
		{"empty paragraph", "<p></p>"},
		{"paragraph with break", "<p><br></p>"},
		{"paragraph with nbsp", "<p>&nbsp;</p>"},
		{"paragraph with break and nbsp", "<p><br>&nbsp;</p>"},
	}

	for _, tc := range emptyHTMLs {
		t.Run(tc.name, func(t *testing.T) {
			router, _, cleanup := setupTestServer(t)
			defer cleanup()

			payload := makeValidPayload()
			locales := payload["locales"].(map[string]interface{})
			ukLoc := locales["uk"].(map[string]interface{})
			ukLoc["content"] = tc.html
			bodyBytes, _ := json.Marshal(payload)

			req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected HTTP 400, got %d. Body: %s", rec.Code, rec.Body.String())
			}

			var errResp APIErrorResponse
			json.Unmarshal(rec.Body.Bytes(), &errResp)

			if errResp.GetCode() != "NEWS_CONTENT_REQUIRED" {
				t.Errorf("Code: got %q, want NEWS_CONTENT_REQUIRED", errResp.GetCode())
			}
			if errResp.Field != "content_uk" {
				t.Errorf("Field: got %q, want content_uk", errResp.Field)
			}
			wantMsg := "Додайте текст новини."
			if errResp.Message != wantMsg {
				t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
			}

			assertNoRawErrorLeaks(t, rec.Body.String())
		})
	}
}

func TestUpdateNews_EmptyUkContent_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	art := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Початкова Новина", Slug: "initial-uk-cnt", Content: "<p>Початковий текст</p>"},
			domain.LangEn: {Locale: domain.LangEn, Title: "Initial News", Slug: "initial-en-cnt"},
		},
	}
	repo.Create(context.Background(), art)

	payload := makeValidPayload()
	locales := payload["locales"].(map[string]interface{})
	ukLoc := locales["uk"].(map[string]interface{})
	ukLoc["content"] = "<p><br>&nbsp;</p>"
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("PUT", "/admin/news/"+art.ID, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_CONTENT_REQUIRED" || errResp.Field != "content_uk" || errResp.Message != "Додайте текст новини." {
		t.Errorf("unexpected error response on update content: %+v", errResp)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── EN PUBLISHING RULE TESTS ────────────────────────────────────────────────

func TestCreateNews_PublishWithoutEN_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	payload := makeValidPayload()
	payload["status"] = "published"
	locales := payload["locales"].(map[string]interface{})
	delete(locales, "en") // Remove EN locale

	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_EN_LOCALE_REQUIRED" {
		t.Errorf("Code: got %q, want NEWS_EN_LOCALE_REQUIRED", errResp.GetCode())
	}
	if errResp.Field != "title_en" {
		t.Errorf("Field: got %q, want title_en", errResp.Field)
	}
	wantMsg := "Перед публікацією заповніть англійську версію новини."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	// Verify manual-only wording (NO mentions of automatic translation)
	forbiddenWording := []string{"перекладіть", "автоматичний переклад", "translation"}
	for _, word := range forbiddenWording {
		if strings.Contains(strings.ToLower(errResp.Message), word) {
			t.Errorf("Wording defect: response contains forbidden word %q: %s", word, errResp.Message)
		}
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

func TestUpdateNews_PublishWithoutEN_ReturnsPreciseUkrainianValidationError(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	art := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Чернетка", Slug: "draft-uk-en"},
		},
	}
	repo.Create(context.Background(), art)

	payload := makeValidPayload()
	payload["status"] = "published"
	locales := payload["locales"].(map[string]interface{})
	delete(locales, "en") // Missing EN title on publish update

	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("PUT", "/admin/news/"+art.ID, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_EN_LOCALE_REQUIRED" || errResp.Field != "title_en" || errResp.Message != "Перед публікацією заповніть англійську версію новини." {
		t.Errorf("unexpected error response on update publish without EN: %+v", errResp)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

func TestCreateNews_DraftWithoutEN_Succeeds(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	payload := makeValidPayload()
	payload["status"] = "draft"
	locales := payload["locales"].(map[string]interface{})
	delete(locales, "en") // Drafts allow missing EN

	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected HTTP 201 Created for draft without EN, got %d. Body: %s", rec.Code, rec.Body.String())
	}
}

// ─── SLUG CONFLICT TESTS ─────────────────────────────────────────────────────

func TestCreateNews_DuplicateSlug_ReturnsConflictWithoutSQLiteDetails(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	art := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Перша Новина", Slug: "duplicate-slug"},
			domain.LangEn: {Locale: domain.LangEn, Title: "First News", Slug: "first-en-slug"},
		},
	}
	if err := repo.Create(context.Background(), art); err != nil {
		t.Fatalf("seed article: %v", err)
	}

	payload := makeValidPayload()
	locales := payload["locales"].(map[string]interface{})
	ukLoc := locales["uk"].(map[string]interface{})
	ukLoc["slug"] = "duplicate-slug"

	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected HTTP 409 Conflict, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_SLUG_CONFLICT" {
		t.Errorf("Code: got %q, want NEWS_SLUG_CONFLICT", errResp.GetCode())
	}
	if errResp.Field != "slug_uk" {
		t.Errorf("Field: got %q, want slug_uk", errResp.Field)
	}
	wantMsg := "Новина з такою адресою (Slug) вже існує. Змініть Slug."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

func TestUpdateNews_DuplicateSlug_ReturnsConflictWithoutSQLiteDetails(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	// Seed Article 1 with slug 'existing-slug'
	art1 := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Стаття 1", Slug: "existing-slug"},
			domain.LangEn: {Locale: domain.LangEn, Title: "Article 1", Slug: "existing-slug-en"},
		},
	}
	repo.Create(context.Background(), art1)

	// Seed Article 2 with slug 'other-slug'
	art2 := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Стаття 2", Slug: "other-slug"},
			domain.LangEn: {Locale: domain.LangEn, Title: "Article 2", Slug: "other-slug-en"},
		},
	}
	repo.Create(context.Background(), art2)

	// Try updating Article 2 with Article 1's slug 'existing-slug'
	payload := makeValidPayload()
	locales := payload["locales"].(map[string]interface{})
	ukLoc := locales["uk"].(map[string]interface{})
	ukLoc["slug"] = "existing-slug"

	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("PUT", "/admin/news/"+art2.ID, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected HTTP 409 Conflict on update duplicate slug, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "NEWS_SLUG_CONFLICT" || errResp.Field != "slug_uk" || errResp.Message != "Новина з такою адресою (Slug) вже існує. Змініть Slug." {
		t.Errorf("unexpected error response on update slug conflict: %+v", errResp)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── MULTIPLE FIELD ERRORS TEST ─────────────────────────────────────────────

func TestCreateNews_MultipleFieldErrors_ReturnsFirstValidationError(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	payload := makeValidPayload()
	payload["category_id"] = ""
	locales := payload["locales"].(map[string]interface{})
	ukLoc := locales["uk"].(map[string]interface{})
	ukLoc["title"] = ""
	ukLoc["content"] = "<p><br></p>"

	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	// Backend domain validation evaluates sequentially: Category -> Title -> Content.
	// Primary field returned by backend is 'category_id'.
	if errResp.GetCode() != "NEWS_CATEGORY_REQUIRED" || errResp.Field != "category_id" {
		t.Errorf("unexpected primary validation error: %+v", errResp)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── INTERNAL 500 FALLBACK MOCK TEST ────────────────────────────────────────

type failingNewsRepo struct {
	domain.NewsRepo
}

func (m *failingNewsRepo) Create(ctx context.Context, article *domain.NewsArticle) error {
	return errors.New("synthetic database failure")
}

func (m *failingNewsRepo) GetCategoryByID(ctx context.Context, id string) (*domain.NewsCategory, error) {
	return &domain.NewsCategory{ID: id}, nil
}

func TestCreateNews_InternalServerError_Returns500SafeUkrainianMessage(t *testing.T) {
	handler := newshttp.NewNewsHandler(&failingNewsRepo{}, nil, nil, nil, nil, nil)
	r := chi.NewRouter()
	r.Post("/admin/news", handler.HandleCreate)

	payload := makeValidPayload()
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected HTTP 500 Internal Server Error, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "db_error" {
		t.Errorf("Code: got %q, want db_error", errResp.GetCode())
	}
	wantMsg := "Сталася внутрішня помилка під час збереження новини. Спробуйте ще раз."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── ARTICLE NOT FOUND TEST ──────────────────────────────────────────────────

func TestUpdateNews_NonExistentArticle_Returns404(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	payload := makeValidPayload()
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("PUT", "/admin/news/non-existent-uuid-12345", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected HTTP 404 Not Found, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "not_found" {
		t.Errorf("Code: got %q, want not_found", errResp.GetCode())
	}
	wantMsg := "Новину не знайдено. Можливо, її було видалено іншим користувачем."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── MALFORMED JSON TEST ────────────────────────────────────────────────────

func TestCreateNews_MalformedJSON_Returns400WithLocalizedUkrainianMessage(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	req := httptest.NewRequest("POST", "/admin/news", strings.NewReader("{ invalid json content: "))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected HTTP 400 Bad Request, got %d", rec.Code)
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "invalid_request" {
		t.Errorf("Code: got %q, want invalid_request", errResp.GetCode())
	}
	wantMsg := "Некоректний формат даних запиту."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

// ─── FULL SUCCESS REGRESSION AND MEDIA PRESERVATION ──────────────────────────

func TestCreateAndUpdateNews_FullSuccess_AndMediaPreservation(t *testing.T) {
	router, repo, cleanup := setupTestServer(t)
	defer cleanup()

	// 1. Create Valid Draft
	payload := makeValidPayload()
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var created domain.NewsArticle
	json.Unmarshal(rec.Body.Bytes(), &created)
	if created.ID == "" {
		t.Fatal("Created article ID is empty")
	}

	// 2. Set Media Fields directly in DB
	ctx := context.Background()
	created.CoverPosition = "50% 35%"
	created.Gallery = []string{"/news-images/g1.webp", "/news-images/g2.webp"}
	created.VideoURL = "https://www.youtube.com/embed/dQw4w9WgXcQ"
	created.VideoPoster = "/news-images/poster.webp"
	if err := repo.Update(ctx, &created); err != nil {
		t.Fatalf("update media fields: %v", err)
	}

	// 3. Perform HTTP Update with new Title and Content
	updatePayload := makeValidPayload()
	updatePayload["cover_position"] = "50% 35%"
	updatePayload["gallery"] = []string{"/news-images/g1.webp", "/news-images/g2.webp"}
	updatePayload["video_url"] = "https://www.youtube.com/embed/dQw4w9WgXcQ"
	updatePayload["video_poster"] = "/news-images/poster.webp"

	ukLoc := updatePayload["locales"].(map[string]interface{})["uk"].(map[string]interface{})
	ukLoc["title"] = "Оновлений Заголовок"
	ukLoc["content"] = "<p>Оновлений Текст</p>"

	updateBytes, _ := json.Marshal(updatePayload)
	reqUpdate := httptest.NewRequest("PUT", "/admin/news/"+created.ID, bytes.NewReader(updateBytes))
	reqUpdate.Header.Set("Content-Type", "application/json")
	recUpdate := httptest.NewRecorder()

	router.ServeHTTP(recUpdate, reqUpdate)

	if recUpdate.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 OK on update, got %d. Body: %s", recUpdate.Code, recUpdate.Body.String())
	}

	// 4. Verify in DB that media fields were preserved and text was updated
	fetched, err := repo.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("GetByID after update: %v", err)
	}

	if fetched.Locales[domain.LangUk].Title != "Оновлений Заголовок" {
		t.Errorf("Title: got %q, want 'Оновлений Заголовок'", fetched.Locales[domain.LangUk].Title)
	}
	if fetched.CoverPosition != "50% 35%" {
		t.Errorf("CoverPosition: got %q, want '50%% 35%%'", fetched.CoverPosition)
	}
	if len(fetched.Gallery) != 2 || fetched.Gallery[0] != "/news-images/g1.webp" {
		t.Errorf("Gallery: got %v", fetched.Gallery)
	}
	if fetched.VideoURL != "https://www.youtube.com/embed/dQw4w9WgXcQ" {
		t.Errorf("VideoURL: got %q", fetched.VideoURL)
	}
}

// ─── SQLITE BUSY / DATABASE LOCK TEST ────────────────────────────────────────

func TestCreateNews_SQLiteBusy_Returns503SafeUkrainianMessage(t *testing.T) {
	f, err := os.CreateTemp("", "news_lock_test_*.db")
	if err != nil {
		t.Fatalf("create temp file: %v", err)
	}
	f.Close()
	defer os.Remove(f.Name())

	// Initialize primary DB connection and repository
	db, err := sqlite.InitDB(f.Name())
	if err != nil {
		t.Fatalf("InitDB: %v", err)
	}
	defer db.Close()

	// Disable busy timeout on the primary connection so write conflicts fail immediately with SQLITE_BUSY
	if _, err := db.Exec("PRAGMA busy_timeout=0;"); err != nil {
		t.Fatalf("set busy_timeout 0: %v", err)
	}

	repo := sqlite.NewNewsRepo(db)
	handler := newshttp.NewNewsHandler(repo, nil, nil, nil, nil, nil)
	r := chi.NewRouter()
	r.Post("/admin/news", handler.HandleCreate)

	// Open a secondary connection and acquire an exclusive transaction lock on the database file
	lockDB, err := sql.Open("sqlite", f.Name())
	if err != nil {
		t.Fatalf("open lockDB: %v", err)
	}
	defer lockDB.Close()

	lockTx, err := lockDB.Begin()
	if err != nil {
		t.Fatalf("begin lockTx: %v", err)
	}
	if _, err := lockTx.Exec("UPDATE schema_version SET description='locked' WHERE version=1"); err != nil {
		t.Fatalf("lockTx exec: %v", err)
	}
	defer lockTx.Rollback()

	payload := makeValidPayload()
	bodyBytes, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/admin/news", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected HTTP 503 Service Unavailable, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var errResp APIErrorResponse
	json.Unmarshal(rec.Body.Bytes(), &errResp)

	if errResp.GetCode() != "db_locked" {
		t.Errorf("Code: got %q, want db_locked", errResp.GetCode())
	}
	wantMsg := "Не вдалося зберегти зміни через тимчасову зайнятість системи. Спробуйте ще раз за кілька секунд."
	if errResp.Message != wantMsg {
		t.Errorf("Message: got %q, want %q", errResp.Message, wantMsg)
	}

	assertNoRawErrorLeaks(t, rec.Body.String())
}

