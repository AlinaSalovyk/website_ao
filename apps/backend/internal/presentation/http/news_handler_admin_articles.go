package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"university-chatbot/backend/internal/domain"
)

func mapValidationError(err error) (code string, msg string, field string) {
	switch {
	case errors.Is(err, domain.ErrNewsStatusInvalid):
		return "NEWS_STATUS_INVALID", domain.ErrNewsStatusInvalid.Error(), "status"
	case errors.Is(err, domain.ErrNewsCategoryRequired):
		return "NEWS_CATEGORY_REQUIRED", domain.ErrNewsCategoryRequired.Error(), "category_id"
	case errors.Is(err, domain.ErrNewsCategoryNotFound):
		return "NEWS_CATEGORY_NOT_FOUND", domain.ErrNewsCategoryNotFound.Error(), "category_id"
	case errors.Is(err, domain.ErrNewsUkTitleRequired):
		return "NEWS_TITLE_REQUIRED", domain.ErrNewsUkTitleRequired.Error(), "title_uk"
	case errors.Is(err, domain.ErrNewsUkContentRequired):
		return "NEWS_CONTENT_REQUIRED", domain.ErrNewsUkContentRequired.Error(), "content_uk"
	case errors.Is(err, domain.ErrNewsEnLocaleRequiredForPublish):
		return "NEWS_EN_LOCALE_REQUIRED", domain.ErrNewsEnLocaleRequiredForPublish.Error(), "title_en"
	case errors.Is(err, domain.ErrNewsSlugConflict):
		return "NEWS_SLUG_CONFLICT", "Новина з такою адресою (Slug) вже існує. Змініть Slug.", "slug_uk"
	default:
		return "VALIDATION_ERROR", err.Error(), ""
	}
}

type APIErrorResponse struct {
	Code        string            `json:"code,omitempty"`
	Message     string            `json:"message"`
	Field       string            `json:"field,omitempty"`
	FieldErrors map[string]string `json:"field_errors,omitempty"`
}

func jsonFieldError(w http.ResponseWriter, code, msg, field string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	fieldErrors := make(map[string]string)
	if field != "" && msg != "" {
		fieldErrors[field] = msg
	}
	json.NewEncoder(w).Encode(APIErrorResponse{
		Code:        code,
		Message:     msg,
		Field:       field,
		FieldErrors: fieldErrors,
	})
}

// HandleAdminList returns all articles (all statuses, optional include-deleted).
// GET /admin-.../news?status=&category=&search=&include_deleted=true&page=1&limit=20
func (h *NewsHandler) HandleAdminList(w http.ResponseWriter, r *http.Request) {
	page := queryInt(r, "page", 1)
	limit := queryInt(r, "limit", 20)
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	opts := domain.NewsListOptions{
		Status:         domain.NewsStatus(r.URL.Query().Get("status")),
		CategoryID:     r.URL.Query().Get("category"),
		Search:         r.URL.Query().Get("search"),
		IncludeDeleted: r.URL.Query().Get("include_deleted") == "true",
		Offset:         offset,
		Limit:          limit,
	}
	if tag := r.URL.Query().Get("tag"); tag != "" {
		opts.Tags = []string{tag}
	}

	articles, total, err := h.repo.List(r.Context(), opts)
	if err != nil {
		slog.Error("HandleAdminList: failed", "error", err)
		jsonError(w, "db_error", "Failed to list articles", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"articles": articles,
		"total":    total,
		"offset":   offset,
		"limit":    limit,
		"page":     page,
	})
}

// HandleCreate creates a new news article.
// POST /admin-.../news
// Body: NewsArticle JSON (both locales required).
func (h *NewsHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
	var article domain.NewsArticle
	if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
		jsonError(w, "invalid_request", "Некоректний формат даних запиту.", http.StatusBadRequest)
		return
	}

	if err := article.Validate(); err != nil {
		code, msg, field := mapValidationError(err)
		jsonFieldError(w, code, msg, field, http.StatusBadRequest)
		return
	}

	if article.CategoryID != "" {
		if _, err := h.repo.GetCategoryByID(r.Context(), article.CategoryID); err != nil {
			code, msg, field := mapValidationError(domain.ErrNewsCategoryNotFound)
			jsonFieldError(w, code, msg, field, http.StatusBadRequest)
			return
		}
	}

	// Sanitize HTML content for all locales.
	article.Locales = h.sanitizeLocales(article.Locales)

	if article.VideoURL != "" {
		article.VideoURL = NormalizeVideoURL(article.VideoURL)
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	article.CreatedBy = adminEmail

	if article.ID == "" {
		article.ID = uuid.New().String()
	}

	// Auto-generate slugs for any locale that has a title but no slug.
	if err := h.autoGenerateSlugs(r.Context(), &article, ""); err != nil {
		slog.Error("HandleCreate: slug generation failed", "error", err)
		jsonError(w, "slug_error", "Failed to generate unique slug", http.StatusInternalServerError)
		return
	}

	if err := h.repo.Create(r.Context(), &article); err != nil {
		if errors.Is(err, domain.ErrNewsSlugConflict) || strings.Contains(err.Error(), "news_translations.slug") {
			code, msg, field := mapValidationError(domain.ErrNewsSlugConflict)
			jsonFieldError(w, code, msg, field, http.StatusConflict)
			return
		}
		if strings.Contains(err.Error(), "FOREIGN KEY") && strings.Contains(err.Error(), "category_id") {
			code, msg, field := mapValidationError(domain.ErrNewsCategoryNotFound)
			jsonFieldError(w, code, msg, field, http.StatusBadRequest)
			return
		}
		if strings.Contains(err.Error(), "database is locked") || strings.Contains(err.Error(), "SQLITE_BUSY") {
			jsonError(w, "db_locked", "Не вдалося зберегти зміни через тимчасову зайнятість системи. Спробуйте ще раз за кілька секунд.", http.StatusServiceUnavailable)
			return
		}
		slog.Error("HandleCreate: db failed", "error", err)
		jsonError(w, "db_error", "Сталася внутрішня помилка під час збереження новини. Спробуйте ще раз.", http.StatusInternalServerError)
		return
	}

	h.recordAudit(r.Context(), adminEmail, domain.ActionCreateNews, article.ID, realIP(r))
	slog.Info("News article created", "id", article.ID, "by", adminEmail)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(&article)
}

// HandleGetByID returns a single article by ID (admin view, includes deleted).
// GET /admin-.../news/{id}
func (h *NewsHandler) HandleGetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	article, err := h.repo.GetByID(r.Context(), id)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
	}
	if err != nil {
		slog.Error("HandleGetByID: failed", "id", id, "error", err)
		jsonError(w, "db_error", "Failed to get article", http.StatusInternalServerError)
		return
	}
	h.resolveArticleMedia(article)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(article)
}

// HandleUpdate replaces an article's full content.
// PUT /admin-.../news/{id}
func (h *NewsHandler) HandleUpdate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var article domain.NewsArticle
	if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
		jsonError(w, "invalid_request", "Некоректний формат даних запиту.", http.StatusBadRequest)
		return
	}
	article.ID = id

	if err := article.Validate(); err != nil {
		code, msg, field := mapValidationError(err)
		jsonFieldError(w, code, msg, field, http.StatusBadRequest)
		return
	}

	if article.CategoryID != "" {
		if _, err := h.repo.GetCategoryByID(r.Context(), article.CategoryID); err != nil {
			code, msg, field := mapValidationError(domain.ErrNewsCategoryNotFound)
			jsonFieldError(w, code, msg, field, http.StatusBadRequest)
			return
		}
	}

	article.Locales = h.sanitizeLocales(article.Locales)

	if article.VideoURL != "" {
		article.VideoURL = NormalizeVideoURL(article.VideoURL)
	}

	if err := h.autoGenerateSlugs(r.Context(), &article, id); err != nil {
		jsonError(w, "slug_error", "Failed to generate unique slug", http.StatusInternalServerError)
		return
	}

	if err := h.repo.Update(r.Context(), &article); err != nil {
		if errors.Is(err, domain.ErrNewsNotFound) {
			jsonError(w, "not_found", "Новину не знайдено. Можливо, її було видалено іншим користувачем.", http.StatusNotFound)
			return
		}
		if errors.Is(err, domain.ErrNewsSlugConflict) || strings.Contains(err.Error(), "news_translations.slug") {
			code, msg, field := mapValidationError(domain.ErrNewsSlugConflict)
			jsonFieldError(w, code, msg, field, http.StatusConflict)
			return
		}
		if strings.Contains(err.Error(), "FOREIGN KEY") && strings.Contains(err.Error(), "category_id") {
			code, msg, field := mapValidationError(domain.ErrNewsCategoryNotFound)
			jsonFieldError(w, code, msg, field, http.StatusBadRequest)
			return
		}
		if strings.Contains(err.Error(), "database is locked") || strings.Contains(err.Error(), "SQLITE_BUSY") {
			jsonError(w, "db_locked", "Не вдалося зберегти зміни через тимчасову зайнятість системи. Спробуйте ще раз за кілька секунд.", http.StatusServiceUnavailable)
			return
		}
		slog.Error("HandleUpdate: failed", "id", id, "error", err)
		jsonError(w, "db_error", "Сталася внутрішня помилка під час збереження новини. Спробуйте ще раз.", http.StatusInternalServerError)
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionUpdateNews, id, realIP(r))
	slog.Info("News article updated", "id", id, "by", adminEmail)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// HandleSetStatus changes the publication status.
// PATCH /admin-.../news/{id}/status
// Body: {"status": "published"}
func (h *NewsHandler) HandleSetStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status domain.NewsStatus `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Некоректний формат даних запиту.", http.StatusBadRequest)
		return
	}
	if req.Status != domain.NewsStatusDraft && req.Status != domain.NewsStatusPublished {
		jsonFieldError(w, "NEWS_STATUS_INVALID", "Оберіть коректний статус новини.", "status", http.StatusBadRequest)
		return
	}

	if err := h.repo.SetStatus(r.Context(), id, req.Status); err != nil {
		if errors.Is(err, domain.ErrNewsNotFound) {
			jsonError(w, "not_found", "Article not found", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to update status", http.StatusInternalServerError)
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	action := domain.ActionPublishNews
	if req.Status == domain.NewsStatusDraft {
		action = domain.ActionUnpublishNews
	}
	h.recordAudit(r.Context(), adminEmail, action, id, realIP(r))
	slog.Info("News status changed", "id", id, "status", req.Status, "by", adminEmail)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// HandleDelete soft-deletes an article.
// DELETE /admin-.../news/{id}
func (h *NewsHandler) HandleDelete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.repo.Delete(r.Context(), id); err != nil {
		if errors.Is(err, domain.ErrNewsNotFound) {
			jsonError(w, "not_found", "Article not found", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to delete article", http.StatusInternalServerError)
		return
	}
	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionDeleteNews, id, realIP(r))
	slog.Info("News article soft-deleted", "id", id, "by", adminEmail)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// HandleRestore restores a soft-deleted article.
// POST /admin-.../news/{id}/restore
func (h *NewsHandler) HandleRestore(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.repo.Restore(r.Context(), id); err != nil {
		if errors.Is(err, domain.ErrNewsNotFound) {
			jsonError(w, "not_found", "Article not found", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to restore article", http.StatusInternalServerError)
		return
	}
	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionRestoreNews, id, realIP(r))
	slog.Info("News article restored", "id", id, "by", adminEmail)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "restored"})
}

func (h *NewsHandler) HandleSlugCheck(w http.ResponseWriter, r *http.Request) {
	locale := domain.Language(r.URL.Query().Get("locale"))
	if locale != domain.LangUk && locale != domain.LangEn {
		locale = domain.LangUk
	}
	slug := r.URL.Query().Get("slug")
	if slug == "" {
		jsonError(w, "bad_request", "slug query param required", http.StatusBadRequest)
		return
	}
	excludeID := r.URL.Query().Get("exclude")

	exists, err := h.repo.SlugExists(r.Context(), locale, slug, excludeID)
	if err != nil {
		jsonError(w, "db_error", "Failed to check slug", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"available": !exists})
}

// HandleAdminTags returns all tags.
// GET /admin-.../news/tags
func (h *NewsHandler) HandleAdminTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.repo.GetTags(r.Context())
	if err != nil {
		jsonError(w, "db_error", "Failed to get tags", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}
