package http

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/microcosm-cc/bluemonday"
	"golang.org/x/net/html"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/imageproc"
	"university-chatbot/backend/internal/infrastructure/slugify"
	"university-chatbot/backend/internal/infrastructure/storage"
)

// NewsHandler serves both the public news API and the admin news management API.
// Public endpoints require no authentication. Admin endpoints are protected by
// the existing DualAuthMiddleware applied at the router level.
type NewsHandler struct {
	repo       domain.NewsRepo                // Repository for all news persistence.
	audit      domain.AuditRepo               // Audit log; may be nil (audit calls no-op).
	imgProc    *imageproc.Processor           // Image processing pipeline; may be nil.
	storage    storage.MediaStorage           // Binary file storage backend; may be nil.
	resolver   storage.MediaURLResolver       // Public media URL resolver; may be nil.
	sanitize   func(string) string            // HTML sanitizer for article content.
	cache      domain.CacheStore              // Cache for Live Preview Drafts.
}

// NewNewsHandler creates a NewsHandler with required dependencies.
func NewNewsHandler(
	repo domain.NewsRepo,
	audit domain.AuditRepo,
	imgProc *imageproc.Processor,
	store storage.MediaStorage,
	resolver storage.MediaURLResolver,
	cache domain.CacheStore,
) *NewsHandler {
	policy := bluemonday.UGCPolicy()
	policy.AllowURLSchemes("http", "https", "mailto")
	policy.AllowElements("iframe", "video", "source", "figure", "figcaption", "u", "s", "sub", "sup")
	iframeRegex := regexp.MustCompile(`^https://(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com)/`)
	policy.AllowAttrs("src").Matching(iframeRegex).OnElements("iframe")
	policy.AllowAttrs("width", "height", "frameborder", "allow", "allowfullscreen", "class", "style", "title", "aria-label", "aria-hidden").OnElements("iframe")
	policy.AllowAttrs("src", "controls", "autoplay", "muted", "loop", "poster", "preload", "playsinline", "class", "style", "type").OnElements("video", "source")
	policy.AllowAttrs("data-media-key", "class", "alt", "title", "src", "width", "height", "loading", "decoding").OnElements("img")
	policy.AllowAttrs("href", "target", "rel", "class", "title").OnElements("a")
	policy.AllowAttrs("class", "style", "data-youtube-video").OnElements("p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "li", "span", "div", "figure", "figcaption")
	policy.RequireNoFollowOnLinks(false)

	if resolver == nil {
		mediaBase := strings.TrimSpace(os.Getenv("MEDIA_PUBLIC_BASE_URL"))
		if mediaBase != "" {
			resolver = storage.NewMediaURLResolver(mediaBase)
		}
	}

	return &NewsHandler{
		repo:       repo,
		audit:      audit,
		imgProc:    imgProc,
		storage:    store,
		resolver:   resolver,
		cache:      cache,
		sanitize: func(html string) string {
			return policy.Sanitize(html)
		},
	}
}

// ─── Public Handlers ─────────────────────────────────────────────────────────

// HandlePublicList returns a paginated list of published articles.
// GET /api/v1/news?locale=uk&category=&tag=&search=&page=1&limit=12
func (h *NewsHandler) HandlePublicList(w http.ResponseWriter, r *http.Request) {
	locale := localeFromQuery(r)
	page := queryInt(r, "page", 1)
	limit := queryInt(r, "limit", 12)
	if limit > 50 {
		limit = 50
	}
	offset := (page - 1) * limit

	opts := domain.NewsListOptions{
		Locale: locale,
		Status: domain.NewsStatusPublished,
		Offset: offset,
		Limit:  limit,
	}
	if cat := r.URL.Query().Get("category"); cat != "" {
		opts.CategoryID = cat
	}
	if tag := r.URL.Query().Get("tag"); tag != "" {
		opts.Tags = []string{tag}
	}
	if q := r.URL.Query().Get("search"); q != "" {
		opts.Search = q
	}

	articles, total, err := h.repo.List(r.Context(), opts)
	if err != nil {
		slog.Error("HandlePublicList: list failed", "error", err)
		jsonError(w, "db_error", "Failed to list news articles", http.StatusInternalServerError)
		return
	}

	setCacheHeaders(w, 60, 300)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"articles": articles,
		"total":    total,
		"offset":   offset,
		"limit":    limit,
		"page":     page,
	})
}

// HandlePublicBySlug returns a single published article by its locale-specific slug.
// Issues 301 when the slug was found in slug history.
// GET /api/v1/news/{slug}?locale=uk
func (h *NewsHandler) HandlePublicBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	locale := localeFromQuery(r)

	article, wasRedirected, err := h.repo.GetBySlug(r.Context(), locale, slug)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
	}
	if err != nil {
		slog.Error("HandlePublicBySlug: get failed", "slug", slug, "error", err)
		jsonError(w, "db_error", "Failed to get article", http.StatusInternalServerError)
		return
	}

	if !article.IsPubliclyVisible() {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
	}

	if wasRedirected {
		newSlug := slug
		if targetLoc, ok := article.Locales[locale]; ok && targetLoc.Slug != "" {
			newSlug = targetLoc.Slug
		}
		if newSlug != "" && newSlug != slug {
			newURL := r.URL
			newURL.Path = strings.Replace(r.URL.Path, slug, newSlug, 1)
			http.Redirect(w, r, newURL.String(), http.StatusMovedPermanently)
			return
		}
	}

	h.resolveArticleMedia(article)
	setCacheHeaders(w, 60, 300)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(article)
}

// HandlePreview serves a draft article by its preview token.
// No authentication required — token is the credential.
// GET /api/v1/news/preview/{token}
func (h *NewsHandler) HandlePreview(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	article, err := h.repo.GetByPreviewToken(r.Context(), token)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Preview not found", http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, "db_error", "Failed to load preview", http.StatusInternalServerError)
		return
	}
	h.resolveArticleMedia(article)
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(article)
}

// HandlePublicSitemap returns slim slug entries for sitemap and RSS generation.
// GET /api/v1/news/sitemap
func (h *NewsHandler) HandlePublicSitemap(w http.ResponseWriter, r *http.Request) {
	entries, err := h.repo.GetAllPublishedSlugs(r.Context())
	if err != nil {
		slog.Error("HandlePublicSitemap: failed", "error", err)
		jsonError(w, "db_error", "Failed to get sitemap data", http.StatusInternalServerError)
		return
	}
	setCacheHeaders(w, 300, 600)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

// HandlePublicCategories returns visible categories list.
// GET /api/v1/news/categories
func (h *NewsHandler) HandlePublicCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.repo.GetCategories(r.Context())
	if err != nil {
		jsonError(w, "db_error", "Failed to get categories", http.StatusInternalServerError)
		return
	}
	visible := make([]domain.NewsCategory, 0, len(cats))
	for _, c := range cats {
		if c.Status == "" || c.Status == domain.CategoryStatusVisible {
			visible = append(visible, c)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	json.NewEncoder(w).Encode(visible)
}

// ─── Admin Handlers ──────────────────────────────────────────────────────────

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

// HandleUploadImage processes and stores a cover image for an article.
// POST /admin-.../news/{id}/image
// Multipart form: field "image", max 10 MB.
func (h *NewsHandler) HandleUploadImage(w http.ResponseWriter, r *http.Request) {
	if h.imgProc == nil || h.storage == nil {
		jsonError(w, "not_configured", "Image upload is not configured", http.StatusNotImplemented)
		return
	}

	id := chi.URLParam(r, "id")

	// Ensure article exists before processing the image.
	existingArt, err := h.repo.GetByID(r.Context(), id)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, "db_error", "Failed to fetch article", http.StatusInternalServerError)
		return
	}
	oldCoverKey := ""
	if existingArt != nil {
		oldCoverKey = existingArt.ImageURL
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		jsonError(w, "invalid_form", "Cannot parse multipart form (max 10 MB)", http.StatusBadRequest)
		return
	}
	file, _, err := r.FormFile("image")
	if err != nil {
		jsonError(w, "missing_file", "No 'image' field in request", http.StatusBadRequest)
		return
	}
	defer file.Close()

	src, err := io.ReadAll(io.LimitReader(file, 10<<20))
	if err != nil {
		jsonError(w, "read_error", "Cannot read uploaded file", http.StatusInternalServerError)
		return
	}

	data, err := h.imgProc.ProcessSingle(src)
	if errors.Is(err, imageproc.ErrUnsupportedFormat) {
		jsonError(w, "invalid_format", err.Error(), http.StatusBadRequest)
		return
	}
	if err != nil {
		slog.Error("HandleUploadImage: process failed", "id", id, "error", err)
		jsonError(w, "process_error", "Failed to process image", http.StatusInternalServerError)
		return
	}

	ts := time.Now().UnixNano()
	storageKey := fmt.Sprintf("news/articles/%s/cover/%d.webp", id, ts)
	if err := h.storage.Put(r.Context(), storageKey, data, "image/webp"); err != nil {
		slog.Error("HandleUploadImage: save failed", "id", id, "error", err)
		jsonError(w, "storage_error", "Failed to save image", http.StatusInternalServerError)
		return
	}
	resolvedURL := h.resolver.Resolve(storageKey)

	// Atomic single-column UPDATE — persists the canonical storage key in DB.
	if err := h.repo.SetImageURL(r.Context(), id, storageKey); err != nil {
		slog.Error("HandleUploadImage: persist image_url failed", "id", id, "error", err)
		// Clean up newly uploaded object to prevent creating an orphan if DB update fails
		_ = h.storage.Delete(r.Context(), storageKey)
		jsonError(w, "db_error", "Failed to persist image URL", http.StatusInternalServerError)
		return
	}

	// Delete previous cover object from storage if it exists and is different
	if oldCoverKey != "" && oldCoverKey != storageKey && !strings.HasPrefix(oldCoverKey, "http://") && !strings.HasPrefix(oldCoverKey, "https://") && !strings.HasPrefix(oldCoverKey, "blob:") {
		if delErr := h.storage.Delete(r.Context(), oldCoverKey); delErr != nil {
			slog.Warn("HandleUploadImage: failed to delete previous cover image", "id", id, "old_key", oldCoverKey, "error", delErr)
		}
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionUploadNewsImage, id, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"storage_key": storageKey,
		"image_url":   resolvedURL,
	})
}

// HandleUploadInlineImage processes and stores an inline image for WYSIWYG or gallery.
// POST /admin-.../news/upload-image
func (h *NewsHandler) HandleUploadInlineImage(w http.ResponseWriter, r *http.Request) {
	if h.imgProc == nil || h.storage == nil {
		jsonError(w, "not_configured", "Image upload is not configured", http.StatusNotImplemented)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		jsonError(w, "invalid_form", "Cannot parse multipart form (max 10 MB)", http.StatusBadRequest)
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		file, header, err = r.FormFile("file")
		if err != nil {
			jsonError(w, "missing_file", "No 'image' or 'file' field in request", http.StatusBadRequest)
			return
		}
	}
	defer file.Close()

	src, err := io.ReadAll(io.LimitReader(file, 10<<20))
	if err != nil {
		jsonError(w, "read_error", "Cannot read uploaded file", http.StatusInternalServerError)
		return
	}

	data, err := h.imgProc.ProcessSingle(src)
	if errors.Is(err, imageproc.ErrUnsupportedFormat) {
		jsonError(w, "invalid_format", err.Error(), http.StatusBadRequest)
		return
	}
	if err != nil {
		slog.Error("HandleUploadInlineImage: process failed", "error", err)
		jsonError(w, "process_error", "Failed to process image", http.StatusInternalServerError)
		return
	}

	ts := time.Now().UnixNano()
	filename := fmt.Sprintf("inline-%d.webp", ts)
	if header != nil && header.Filename != "" {
		ext := filepath.Ext(header.Filename)
		base := strings.TrimSuffix(header.Filename, ext)
		filename = fmt.Sprintf("%s-%d.webp", slugify.Generate(base), ts)
	}

	storageKey := fmt.Sprintf("news/articles/inline/%s", filename)
	if err := h.storage.Put(r.Context(), storageKey, data, "image/webp"); err != nil {
		slog.Error("HandleUploadInlineImage: save failed", "error", err)
		jsonError(w, "storage_error", "Failed to save image", http.StatusInternalServerError)
		return
	}

	resolvedURL := h.resolver.Resolve(storageKey)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"storage_key": storageKey,
		"image_url":   resolvedURL,
		"url":         resolvedURL,
	})
}

// HandleUploadVideo processes and stores a large video file (MP4/WebM/MOV) up to 2 GB.
// Streams directly to storage and supports HTTP Range Requests for instant 0.1s web streaming.
// POST /admin-.../news/upload-video
func (h *NewsHandler) HandleUploadVideo(w http.ResponseWriter, r *http.Request) {
	if h.storage == nil {
		jsonError(w, "not_configured", "Video storage is not configured", http.StatusNotImplemented)
		return
	}

	// 2 GB max video upload limit
	if err := r.ParseMultipartForm(2048 << 20); err != nil {
		jsonError(w, "invalid_form", "Cannot parse form or video exceeds 2 GB limit", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("video")
	if err != nil {
		file, header, err = r.FormFile("file")
		if err != nil {
			jsonError(w, "missing_file", "No 'video' or 'file' field in request", http.StatusBadRequest)
			return
		}
	}
	defer file.Close()

	src, err := io.ReadAll(io.LimitReader(file, 2048<<20))
	if err != nil {
		jsonError(w, "read_error", "Cannot read uploaded video file", http.StatusInternalServerError)
		return
	}

	ts := time.Now().UnixNano()
	ext := ".mp4"
	if header != nil && header.Filename != "" {
		ext = filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".mp4"
		}
	}

	baseName := "video"
	if header != nil && header.Filename != "" {
		baseName = slugify.Generate(strings.TrimSuffix(header.Filename, ext))
		if baseName == "" {
			baseName = "video"
		}
	}
	storageKey := fmt.Sprintf("news/articles/videos/%s-%d%s", baseName, ts, ext)
	if err := h.storage.Put(r.Context(), storageKey, src, "video/mp4"); err != nil {
		slog.Error("HandleUploadVideo: save failed", "error", err)
		jsonError(w, "storage_error", "Failed to save video file", http.StatusInternalServerError)
		return
	}

	resolvedURL := h.resolver.Resolve(storageKey)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"storage_key": storageKey,
		"video_url":   resolvedURL,
		"url":         resolvedURL,
	})
}

// HandlePresignVideoUpload generates a short-lived presigned PUT URL for client direct upload to S3/R2.
// POST /admin-.../news/video-upload-url
func (h *NewsHandler) HandlePresignVideoUpload(w http.ResponseWriter, r *http.Request) {
	if h.storage == nil {
		jsonError(w, "not_configured", "Storage is not configured", http.StatusNotImplemented)
		return
	}

	var req struct {
		ArticleID   string `json:"article_id"`
		Filename    string `json:"filename"`
		ContentType string `json:"content_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.ArticleID == "" {
		req.ArticleID = "temp-draft"
	}
	if req.ContentType == "" {
		req.ContentType = "video/mp4"
	}

	ts := time.Now().UnixNano()
	ext := filepath.Ext(req.Filename)
	if ext == "" {
		ext = ".mp4"
	}
	storageKey := fmt.Sprintf("news/articles/%s/videos/%d%s", req.ArticleID, ts, ext)

	presignedURL, err := h.storage.PresignPut(r.Context(), storageKey, req.ContentType, 15*time.Minute)
	if err != nil {
		if errors.Is(err, storage.ErrPresignNotSupported) {
			jsonError(w, "presign_not_supported", "Presigned upload URLs are only supported in s3 storage mode", http.StatusBadRequest)
			return
		}
		slog.Error("HandlePresignVideoUpload: presign failed", "error", err)
		jsonError(w, "presign_error", "Failed to generate presigned upload URL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"upload_url":  presignedURL,
		"storage_key": storageKey,
		"video_url":   h.resolver.Resolve(storageKey),
	})
}

// HandleConfirmVideoUpload confirms that a presigned uploaded video exists in storage.
// POST /admin-.../news/video-confirm
func (h *NewsHandler) HandleConfirmVideoUpload(w http.ResponseWriter, r *http.Request) {
	if h.storage == nil {
		jsonError(w, "not_configured", "Storage is not configured", http.StatusNotImplemented)
		return
	}

	var req struct {
		ArticleID  string `json:"article_id"`
		StorageKey string `json:"storage_key"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.StorageKey == "" {
		jsonError(w, "validation_error", "storage_key is required", http.StatusBadRequest)
		return
	}

	exists, err := h.storage.Exists(r.Context(), req.StorageKey)
	if err != nil || !exists {
		jsonError(w, "not_found", "Video file not found in storage", http.StatusNotFound)
		return
	}

	resolvedURL := h.resolver.Resolve(req.StorageKey)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":      "ok",
		"storage_key": req.StorageKey,
		"video_url":   resolvedURL,
	})
}

// HandleSlugCheck reports whether a slug is available.
// GET /admin-.../news/slug-check?locale=uk&slug=moia-novyna&exclude=article-id
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

// HandleAdminCategories returns all categories (admin view).
// GET /admin-.../news/categories
func (h *NewsHandler) HandleAdminCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.repo.GetCategories(r.Context())
	if err != nil {
		jsonError(w, "db_error", "Failed to get categories", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cats)
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

// ─── Private Helpers ──────────────────────────────────────────────────────────

// localeFromQuery reads the ?locale= query param and returns LangUk as default.
func localeFromQuery(r *http.Request) domain.Language {
	l := domain.Language(r.URL.Query().Get("locale"))
	if l != domain.LangUk && l != domain.LangEn {
		return domain.LangUk
	}
	return l
}

// setCacheHeaders sets Cache-Control with s-maxage and stale-while-revalidate.
func setCacheHeaders(w http.ResponseWriter, sMaxAge, swr int) {
	w.Header().Set("Cache-Control", fmt.Sprintf(
		"public, s-maxage=%d, stale-while-revalidate=%d", sMaxAge, swr,
	))
}

// resolveArticleMedia enriches the article with resolved public URLs and explicit video_type.
func (h *NewsHandler) resolveArticleMedia(article *domain.NewsArticle) {
	if article == nil {
		return
	}
	if article.VideoURL != "" {
		article.VideoType = article.GetVideoType()
	}
	if h.resolver != nil {
		if article.ImageURL != "" {
			article.ImageURL = h.resolver.Resolve(article.ImageURL)
		}
		if len(article.Gallery) > 0 {
			resolvedGallery := make([]string, len(article.Gallery))
			for i, g := range article.Gallery {
				resolvedGallery[i] = h.resolver.Resolve(g)
			}
			article.Gallery = resolvedGallery
		}
		if article.VideoType == domain.VideoTypeUploaded && article.VideoURL != "" {
			article.VideoURL = h.resolver.Resolve(article.VideoURL)
		}
		article.Locales = h.sanitizeLocales(article.Locales)
	}
	if len(article.Attachments) > 0 {
		for i := range article.Attachments {
			fileRoute := fmt.Sprintf("/api/v1/news/%s/attachments/%s/file", article.ID, article.Attachments[i].ID)
			if h.resolver != nil {
				article.Attachments[i].URL = h.resolver.Resolve(fileRoute)
			} else {
				article.Attachments[i].URL = fileRoute
			}
		}
	}
	if len(article.GalleryImages) > 0 {
		for i := range article.GalleryImages {
			fileRoute := fmt.Sprintf("/api/v1/news/%s/gallery/%s/file", article.ID, article.GalleryImages[i].ID)
			if h.resolver != nil {
				article.GalleryImages[i].URL = h.resolver.Resolve(fileRoute)
				article.GalleryImages[i].ThumbnailURL = h.resolver.Resolve(fileRoute + "?variant=thumb")
				article.GalleryImages[i].LargeURL = h.resolver.Resolve(fileRoute + "?variant=large")
			} else {
				article.GalleryImages[i].URL = fileRoute
				article.GalleryImages[i].ThumbnailURL = fileRoute + "?variant=thumb"
				article.GalleryImages[i].LargeURL = fileRoute + "?variant=large"
			}
		}
	}
}

// sanitizeLocales runs the HTML sanitizer over the Content field of all locales.
func (h *NewsHandler) sanitizeLocales(locales map[domain.Language]domain.NewsLocale) map[domain.Language]domain.NewsLocale {
	out := make(map[domain.Language]domain.NewsLocale, len(locales))
	for lang, loc := range locales {
		loc.Content = h.sanitize(loc.Content)
		if h.resolver != nil {
			loc.Content = ResolveMediaKeysInHTML(loc.Content, h.resolver)
		}
		out[lang] = loc
	}
	return out
}

// ResolveMediaKeysInHTML parses raw HTML with a DOM parser and updates <img> src attributes using data-media-key.
func ResolveMediaKeysInHTML(rawHTML string, resolver storage.MediaURLResolver) string {
	if rawHTML == "" || resolver == nil {
		return rawHTML
	}

	doc, err := html.Parse(strings.NewReader(rawHTML))
	if err != nil {
		return rawHTML
	}

	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode && strings.EqualFold(n.Data, "img") {
			var mediaKey string
			srcIdx := -1

			for i, attr := range n.Attr {
				if attr.Key == "data-media-key" {
					mediaKey = attr.Val
				} else if attr.Key == "src" {
					srcIdx = i
				}
			}

			if mediaKey != "" {
				resolvedURL := resolver.Resolve(mediaKey)
				if srcIdx >= 0 {
					n.Attr[srcIdx].Val = resolvedURL
				} else {
					n.Attr = append(n.Attr, html.Attribute{Key: "src", Val: resolvedURL})
				}
			} else if srcIdx >= 0 {
				// Backward-compatible legacy resolution for images without data-media-key
				n.Attr[srcIdx].Val = resolver.Resolve(n.Attr[srcIdx].Val)
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)

	var buf bytes.Buffer
	if doc.FirstChild != nil && doc.FirstChild.Type == html.ElementNode && doc.FirstChild.Data == "html" {
		for c := doc.FirstChild.FirstChild; c != nil; c = c.NextSibling {
			if c.Type == html.ElementNode && c.Data == "body" {
				for child := c.FirstChild; child != nil; child = child.NextSibling {
					_ = html.Render(&buf, child)
				}
				return buf.String()
			}
		}
	}

	_ = html.Render(&buf, doc)
	return buf.String()
}

// autoGenerateSlugs generates a unique slug for any locale whose slug is empty.
// When excludeID is non-empty, the article's own current slug is not treated as a conflict.
func (h *NewsHandler) autoGenerateSlugs(ctx context.Context, article *domain.NewsArticle, excludeID string) error {
	locales := article.Locales
	updated := make(map[domain.Language]domain.NewsLocale, len(locales))
	for lang, loc := range locales {
		if loc.Slug == "" && loc.Title != "" {
			slug, err := slugify.Unique(ctx, loc.Title, excludeID, func(ctx context.Context, s, ex string) (bool, error) {
				return h.repo.SlugExists(ctx, lang, s, ex)
			})
			if err != nil {
				return err
			}
			loc.Slug = slug
		}
		updated[lang] = loc
	}
	article.Locales = updated
	return nil
}

// recordAudit fires an audit entry in a goroutine (non-blocking).
func (h *NewsHandler) recordAudit(ctx context.Context, adminEmail string, action domain.AdminAction, target, ip string) {
	if h.audit == nil {
		return
	}
	go func() {
		_ = h.audit.Record(context.Background(), domain.AuditEntry{
			AdminEmail: adminEmail,
			Action:     action,
			Target:     target,
			IP:         ip,
			CreatedAt:  time.Now(),
		})
	}()
}

// ─── Category Handlers (Admin) ────────────────────────────────────────────────

// HandleAdminCreateCategory creates a new dynamic category.
// POST /admin-.../news/categories
func (h *NewsHandler) HandleAdminCreateCategory(w http.ResponseWriter, r *http.Request) {
	var cat domain.NewsCategory
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		jsonError(w, "bad_request", "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if cat.Icon != "" && !isValidLucideIcon(cat.Icon) {
		jsonError(w, "bad_request", "Invalid Lucide icon name", http.StatusBadRequest)
		return
	}

	if cat.CoverPosition != "" && !isValidCoverPosition(cat.CoverPosition) {
		jsonError(w, "bad_request", "Invalid cover_position format", http.StatusBadRequest)
		return
	}

	if err := h.repo.CreateCategory(r.Context(), &cat); err != nil {
		slog.Error("HandleAdminCreateCategory: failed", "error", err)
		jsonError(w, "db_error", "Failed to create category", http.StatusInternalServerError)
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionCreateCategory, cat.ID, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cat)
}

// HandleAdminUpdateCategory updates an existing category.
// PUT /admin-.../news/categories/{id}
func (h *NewsHandler) HandleAdminUpdateCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var cat domain.NewsCategory
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		jsonError(w, "bad_request", "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	cat.ID = id

	if cat.Icon != "" && !isValidLucideIcon(cat.Icon) {
		jsonError(w, "bad_request", "Invalid Lucide icon name", http.StatusBadRequest)
		return
	}

	if cat.CoverPosition != "" && !isValidCoverPosition(cat.CoverPosition) {
		jsonError(w, "bad_request", "Invalid cover_position format", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateCategory(r.Context(), &cat); err != nil {
		slog.Error("HandleAdminUpdateCategory: failed", "id", id, "error", err)
		jsonError(w, "db_error", "Failed to update category", http.StatusInternalServerError)
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionUpdateCategory, id, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cat)
}

// HandleAdminDeleteCategory soft-deletes a category. Optionally transfers articles.
// DELETE /admin-.../news/categories/{id}?transfer_to=NEW_CAT_ID
func (h *NewsHandler) HandleAdminDeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	transferTo := r.URL.Query().Get("transfer_to")

	err := h.repo.SoftDeleteCategory(r.Context(), id, transferTo)
	if err != nil {
		slog.Error("HandleAdminDeleteCategory: failed", "id", id, "error", err)
		// Usually if count > 0 it returns an error we could surface nicely
		msg := err.Error()
		if strings.Contains(msg, "in use") {
			jsonError(w, "in_use", msg, http.StatusConflict)
		} else {
			jsonError(w, "db_error", "Failed to delete category", http.StatusInternalServerError)
		}
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionDeleteCategory, id, realIP(r))

	w.WriteHeader(http.StatusNoContent)
}

// HandleAdminRestoreCategory restores a soft-deleted category.
// POST /admin-.../news/categories/{id}/restore
func (h *NewsHandler) HandleAdminRestoreCategory(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.repo.RestoreCategory(r.Context(), id); err != nil {
		if errors.Is(err, domain.ErrNewsNotFound) {
			jsonError(w, "not_found", "Category not found", http.StatusNotFound)
			return
		}
		slog.Error("HandleAdminRestoreCategory: failed", "id", id, "error", err)
		jsonError(w, "db_error", "Failed to restore category", http.StatusInternalServerError)
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionRestoreCategory, id, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "restored"})
}

// HandleAdminReorderCategories reorders categories via Drag & Drop.
// PATCH /admin-.../news/categories/reorder
func (h *NewsHandler) HandleAdminReorderCategories(w http.ResponseWriter, r *http.Request) {
	var ids []string
	if err := json.NewDecoder(r.Body).Decode(&ids); err != nil {
		jsonError(w, "bad_request", "Expected JSON array of category IDs", http.StatusBadRequest)
		return
	}

	if err := h.repo.ReorderCategories(r.Context(), ids); err != nil {
		slog.Error("HandleAdminReorderCategories: failed", "error", err)
		jsonError(w, "db_error", "Failed to reorder categories", http.StatusInternalServerError)
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionReorderCategories, fmt.Sprintf("%d items", len(ids)), realIP(r))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "reordered"})
}

// HandleAdminCategoryUploadImage handles category cover image uploads.
// POST /admin-.../news/categories/{id}/image
func (h *NewsHandler) HandleAdminCategoryUploadImage(w http.ResponseWriter, r *http.Request) {
	if h.imgProc == nil || h.storage == nil {
		jsonError(w, "not_implemented", "Image upload is not configured on this server", http.StatusNotImplemented)
		return
	}

	id := chi.URLParam(r, "id")
	
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		jsonError(w, "invalid_form", "Cannot parse form", http.StatusBadRequest)
		return
	}
	file, _, err := r.FormFile("image")
	if err != nil {
		jsonError(w, "missing_file", "No 'image' field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	src, err := io.ReadAll(io.LimitReader(file, 10<<20))
	if err != nil {
		jsonError(w, "read_error", "Cannot read uploaded file", http.StatusInternalServerError)
		return
	}

	data, err := h.imgProc.ProcessSingle(src)
	if errors.Is(err, imageproc.ErrUnsupportedFormat) {
		jsonError(w, "invalid_format", err.Error(), http.StatusBadRequest)
		return
	}
	if err != nil {
		slog.Error("HandleAdminCategoryUploadImage: process failed", "id", id, "error", err)
		jsonError(w, "process_error", "Failed to process image", http.StatusInternalServerError)
		return
	}

	ts := time.Now().Unix()
	storageKey := fmt.Sprintf("news/categories/%s/cover/%d.webp", id, ts)
	if err := h.storage.Put(r.Context(), storageKey, data, "image/webp"); err != nil {
		slog.Error("HandleAdminCategoryUploadImage: save failed", "id", id, "error", err)
		jsonError(w, "storage_error", "Failed to save image", http.StatusInternalServerError)
		return
	}
	resolvedURL := h.resolver.Resolve(storageKey)

	// Update DB record atomically for cover_image column only
	if err := h.repo.SetCategoryCover(r.Context(), id, storageKey); err != nil {
		slog.Error("HandleAdminCategoryUploadImage: set cover image failed", "id", id, "error", err)
		jsonError(w, "db_error", "Failed to update category cover image URL", http.StatusInternalServerError)
		return
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, domain.ActionUploadCategoryCover, id, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"storage_key": storageKey,
		"cover_image": resolvedURL,
	})
}

// isValidLucideIcon checks against a small curated list of valid icons.
func isValidLucideIcon(icon string) bool {
	valid := map[string]bool{
		"newspaper": true, "award": true, "graduation-cap": true, "brain": true, 
		"sparkles": true, "megaphone": true, "book-open": true, "microscope": true,
		"calendar": true, "briefcase": true, "globe": true, "users": true, 
		"rocket": true, "lightbulb": true, "zap": true, "star": true, 
		"trending-up": true, "medal": true, "folder": true, "building": true,
		"camera": true, "code": true, "coffee": true, "flask-conical": true,
		"heart": true, "laptop": true, "map": true, "music": true, "palette": true,
		"shield": true, "target": true, "tent": true, "trophy": true, "video": true,
	}
	return valid[icon]
}

// WARNING: KEEP IN SYNC WITH FRONTEND!
// 🔴 TRUTH: must stay exactly identical to COVER_POSITION_REGEX in:
// e:\website_ao\src\lib\cover-position.ts
var coverPositionRegex = regexp.MustCompile(`^((100|[1-9]?\d)%\s(100|[1-9]?\d)%|top|bottom|center|left|right)$`)

func isValidCoverPosition(pos string) bool {
	if pos == "" {
		return true // defaults to center later
	}
	return coverPositionRegex.MatchString(pos)
}

// NormalizeVideoURL converts YouTube links to canonical embed format
func NormalizeVideoURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.Contains(raw, "youtube.com/embed/") {
		return raw
	}
	re := regexp.MustCompile(`(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})`)
	matches := re.FindStringSubmatch(raw)
	if len(matches) > 1 {
		return "https://www.youtube.com/embed/" + matches[1]
	}
	return raw
}

// ─── Attachment Handlers ─────────────────────────────────────────────────────

var allowedAttachmentExts = map[string]string{
	".pdf":  "application/pdf",
	".doc":  "application/msword",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".xls":  "application/vnd.ms-excel",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".ppt":  "application/vnd.ms-powerpoint",
	".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".odt":  "application/vnd.oasis.opendocument.text",
	".ods":  "application/vnd.oasis.opendocument.spreadsheet",
	".odp":  "application/vnd.oasis.opendocument.presentation",
	".txt":  "text/plain",
	".csv":  "text/csv",
	".rtf":  "application/rtf",
}

var rejectedAttachmentExts = map[string]bool{
	".exe": true, ".bat": true, ".cmd": true, ".ps1": true, ".sh": true,
	".dll": true, ".so": true, ".js": true, ".html": true, ".htm": true,
	".php": true, ".jar": true, ".apk": true, ".msi": true, ".scr": true,
	".com": true, ".vbs": true, ".py": true, ".rb": true,
}

func ValidateAttachmentFile(filename string, content []byte) (ext string, mimeType string, err error) {
	maxSize := getMaxAttachmentSize()
	if int64(len(content)) > maxSize {
		return "", "", fmt.Errorf("file size %d exceeds maximum limit of %d bytes", len(content), maxSize)
	}

	ext = strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return "", "", fmt.Errorf("extension is required")
	}

	if rejectedAttachmentExts[ext] {
		return "", "", fmt.Errorf("file extension %s is not allowed for security reasons", ext)
	}

	expectedMIME, allowed := allowedAttachmentExts[ext]
	if !allowed {
		return "", "", fmt.Errorf("file extension %s is not supported", ext)
	}

	// Content sniffing / magic bytes check
	if ext == ".pdf" {
		if len(content) < 5 || !bytes.HasPrefix(content, []byte("%PDF-")) {
			return "", "", fmt.Errorf("invalid PDF content signature")
		}
	} else if ext == ".docx" || ext == ".xlsx" || ext == ".pptx" || ext == ".odt" || ext == ".ods" || ext == ".odp" {
		// Office OpenXML and OpenDocument containers are ZIP files
		if len(content) < 4 || !bytes.HasPrefix(content, []byte("PK\x03\x04")) {
			return "", "", fmt.Errorf("invalid Office container format")
		}
	}

	return ext, expectedMIME, nil
}

func getMaxAttachmentSize() int64 {
	if s := os.Getenv("NEWS_ATTACHMENT_MAX_SIZE"); s != "" {
		if val, err := strconv.ParseInt(s, 10, 64); err == nil && val > 0 {
			return val
		}
	}
	return 25 * 1024 * 1024 // 25 MB default
}

// HandleUploadAttachment uploads a document file attachment for a news article.
// POST /admin-.../news/{id}/attachments
func (h *NewsHandler) HandleUploadAttachment(w http.ResponseWriter, r *http.Request) {
	if h.storage == nil {
		jsonError(w, "not_configured", "Storage is not configured", http.StatusNotImplemented)
		return
	}

	newsID := chi.URLParam(r, "id")
	if newsID == "" {
		jsonError(w, "bad_request", "news id is required", http.StatusBadRequest)
		return
	}

	// Check article exists
	_, err := h.repo.GetByID(r.Context(), newsID)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
	}

	maxSize := getMaxAttachmentSize()
	if err := r.ParseMultipartForm(maxSize); err != nil {
		jsonError(w, "invalid_form", fmt.Sprintf("File size exceeds limit (%d MB)", maxSize/(1024*1024)), http.StatusBadRequest)
		return
	}

	existingAtts, _ := h.repo.GetAttachmentsByNewsID(r.Context(), newsID)
	if len(existingAtts) >= 20 {
		jsonError(w, "limit_exceeded", "Maximum 20 attachments per article allowed", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		file, header, err = r.FormFile("attachment")
		if err != nil {
			jsonError(w, "missing_file", "No 'file' or 'attachment' field in multipart request", http.StatusBadRequest)
			return
		}
	}
	defer file.Close()

	if header.Size > maxSize {
		jsonError(w, "size_limit", fmt.Sprintf("File exceeds maximum allowed size of %d MB", maxSize/(1024*1024)), http.StatusBadRequest)
		return
	}

	src, err := io.ReadAll(io.LimitReader(file, maxSize+1))
	if err != nil {
		jsonError(w, "read_error", "Cannot read uploaded file", http.StatusInternalServerError)
		return
	}
	if int64(len(src)) > maxSize {
		jsonError(w, "size_limit", fmt.Sprintf("File exceeds maximum allowed size of %d MB", maxSize/(1024*1024)), http.StatusBadRequest)
		return
	}

	ext, mimeType, err := ValidateAttachmentFile(header.Filename, src)
	if err != nil {
		jsonError(w, "invalid_file", err.Error(), http.StatusBadRequest)
		return
	}

	cleanOrigName := filepath.Base(strings.ReplaceAll(header.Filename, "\x00", ""))

	attID := uuid.New().String()
	storedName := fmt.Sprintf("%s%s", attID, ext)
	storageKey := fmt.Sprintf("news/articles/%s/attachments/%s", newsID, storedName)

	if err := h.storage.Put(r.Context(), storageKey, src, mimeType); err != nil {
		slog.Error("HandleUploadAttachment: storage save failed", "error", err)
		jsonError(w, "storage_error", "Failed to save file binary to storage", http.StatusInternalServerError)
		return
	}

	titleUK := r.FormValue("title_uk")
	titleEN := r.FormValue("title_en")

	att := &domain.NewsAttachment{
		ID:           attID,
		NewsID:       newsID,
		OriginalName: cleanOrigName,
		StoredName:   storedName,
		MIMEType:     mimeType,
		Extension:    ext,
		SizeBytes:    int64(len(src)),
		SortOrder:    len(existingAtts),
		TitleUK:      titleUK,
		TitleEN:      titleEN,
		CreatedAt:    time.Now().UTC(),
	}

	if err := h.repo.AddAttachment(r.Context(), att); err != nil {
		_ = h.storage.Delete(r.Context(), storageKey)
		slog.Error("HandleUploadAttachment: db insert failed", "error", err)
		jsonError(w, "db_error", "Failed to record attachment metadata", http.StatusInternalServerError)
		return
	}

	fileRoute := fmt.Sprintf("/api/v1/news/%s/attachments/%s/file", newsID, att.ID)
	if h.resolver != nil {
		att.URL = h.resolver.Resolve(fileRoute)
	} else {
		att.URL = fileRoute
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, "upload_news_attachment", att.ID, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(att)
}

// HandleGetAttachments returns attachments for an article.
// GET /admin-.../news/{id}/attachments
func (h *NewsHandler) HandleGetAttachments(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	targetID := newsID
	if article, err := h.repo.GetByID(r.Context(), newsID); err == nil && article != nil {
		targetID = article.ID
	} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangUk, newsID); err == nil && article != nil {
		targetID = article.ID
	} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangEn, newsID); err == nil && article != nil {
		targetID = article.ID
	}

	atts, err := h.repo.GetAttachmentsByNewsID(r.Context(), targetID)
	if err != nil {
		jsonError(w, "db_error", "Failed to fetch attachments", http.StatusInternalServerError)
		return
	}
	if atts == nil {
		atts = []domain.NewsAttachment{}
	}
	for i := range atts {
		fileRoute := fmt.Sprintf("/api/v1/news/%s/attachments/%s/file", atts[i].NewsID, atts[i].ID)
		if h.resolver != nil {
			atts[i].URL = h.resolver.Resolve(fileRoute)
		} else {
			atts[i].URL = fileRoute
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(atts)
}

// HandleUpdateAttachment updates display title and sort_order of an attachment.
// PATCH /admin-.../news/{id}/attachments/{attachmentId}
func (h *NewsHandler) HandleUpdateAttachment(w http.ResponseWriter, r *http.Request) {
	attID := chi.URLParam(r, "attachmentId")
	var req struct {
		TitleUK   string `json:"title_uk"`
		TitleEN   string `json:"title_en"`
		SortOrder int    `json:"sort_order"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateAttachment(r.Context(), attID, req.TitleUK, req.TitleEN, req.SortOrder); err != nil {
		if errors.Is(err, domain.ErrNewsNotFound) {
			jsonError(w, "not_found", "Attachment not found", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to update attachment metadata", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// HandleDeleteAttachment deletes an attachment record and physical storage file.
// DELETE /admin-.../news/{id}/attachments/{attachmentId}
func (h *NewsHandler) HandleDeleteAttachment(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	attID := chi.URLParam(r, "attachmentId")

	att, err := h.repo.GetAttachmentByID(r.Context(), attID)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Attachment not found", http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, "db_error", "Failed to get attachment", http.StatusInternalServerError)
		return
	}

	if err := h.repo.DeleteAttachment(r.Context(), attID); err != nil {
		jsonError(w, "db_error", "Failed to delete attachment from DB", http.StatusInternalServerError)
		return
	}

	if h.storage != nil {
		storageKey := fmt.Sprintf("news/articles/%s/attachments/%s", newsID, att.StoredName)
		_ = h.storage.Delete(r.Context(), storageKey)
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, "delete_news_attachment", attID, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// HandleReorderAttachments updates sort_order for attachments of an article.
// PATCH /admin-.../news/{id}/attachments/reorder
func (h *NewsHandler) HandleReorderAttachments(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	var ids []string
	if err := json.NewDecoder(r.Body).Decode(&ids); err != nil {
		jsonError(w, "invalid_request", "Expected array of attachment IDs", http.StatusBadRequest)
		return
	}

	if err := h.repo.ReorderAttachments(r.Context(), newsID, ids); err != nil {
		jsonError(w, "db_error", "Failed to reorder attachments", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "reordered"})
}

// HandlePublicServeAttachment serves attachment file (inline preview or forced download).
// GET /api/v1/news/{id}/attachments/{attachmentId}/file
// GET /api/v1/news/{id}/attachments/{attachmentId}/download
func (h *NewsHandler) HandlePublicServeAttachment(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	attID := chi.URLParam(r, "attachmentId")
	if attID == "" {
		attID = chi.URLParam(r, "id")
	}

	att, err := h.repo.GetAttachmentByID(r.Context(), attID)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Attachment not found", http.StatusNotFound)
		return
	}
	if err != nil {
		slog.Error("HandlePublicServeAttachment: error", "id", attID, "error", err)
		jsonError(w, "db_error", "Failed to retrieve attachment", http.StatusInternalServerError)
		return
	}

	// If newsId is present in route, verify that the attachment belongs to this news article
	if newsID != "" {
		targetID := newsID
		if article, err := h.repo.GetByID(r.Context(), newsID); err == nil && article != nil {
			targetID = article.ID
		} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangUk, newsID); err == nil && article != nil {
			targetID = article.ID
		} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangEn, newsID); err == nil && article != nil {
			targetID = article.ID
		}
		if att.NewsID != targetID {
			jsonError(w, "not_found", "Attachment not found for specified news article", http.StatusNotFound)
			return
		}
	}

	storageKey := fmt.Sprintf("news/articles/%s/attachments/%s", att.NewsID, att.StoredName)
	if h.storage != nil {
		exists, err := h.storage.Exists(r.Context(), storageKey)
		if err != nil || !exists {
			jsonError(w, "not_found", "File not found in storage", http.StatusNotFound)
			return
		}
	}

	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "public, max-age=86400, s-maxage=86400")

	downloadParam := r.URL.Query().Get("download")
	isDownloadRoute := strings.HasSuffix(r.URL.Path, "/download") ||
		downloadParam == "1" ||
		downloadParam == "true"

	extLower := strings.ToLower(att.Extension)
	dispType := "attachment"
	if !isDownloadRoute && (extLower == ".pdf" || extLower == ".txt") {
		dispType = "inline"
	}

	encodedFilename := url.PathEscape(att.OriginalName)
	sanitizedBaseFilename := strings.ReplaceAll(filepath.Base(att.OriginalName), "\"", "\\\"")

	w.Header().Set("Content-Type", att.MIMEType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("%s; filename=\"%s\"; filename*=UTF-8''%s", dispType, sanitizedBaseFilename, encodedFilename))

	if localStorage, ok := h.storage.(*storage.LocalStorage); ok {
		cleanKey := strings.TrimPrefix(filepath.ToSlash(storageKey), "/")
		filePath := filepath.Join(localStorage.BaseDir(), filepath.FromSlash(cleanKey))
		http.ServeFile(w, r, filePath)
		return
	}

	jsonError(w, "not_implemented", "Attachment serving for remote storage drivers is not configured", http.StatusNotImplemented)
}

// ─── News Gallery Image Handlers ─────────────────────────────────────────────

var allowedGalleryImageExts = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
}

func getMaxGalleryImageSize() int64 {
	if s := os.Getenv("NEWS_GALLERY_IMAGE_MAX_SIZE"); s != "" {
		if val, err := strconv.ParseInt(s, 10, 64); err == nil && val > 0 {
			return val
		}
	}
	return 15 * 1024 * 1024 // 15 MB default
}

func ValidateGalleryImageFile(filename string, content []byte) (ext string, mimeType string, width int, height int, err error) {
	maxSize := getMaxGalleryImageSize()
	if int64(len(content)) > maxSize {
		return "", "", 0, 0, fmt.Errorf("file size %d exceeds maximum limit of %d bytes", len(content), maxSize)
	}

	ext = strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		ext = ".jpg"
	}

	expectedMIME, allowed := allowedGalleryImageExts[ext]
	if !allowed {
		return "", "", 0, 0, fmt.Errorf("image extension %s is not allowed (only JPG, PNG, WebP supported)", ext)
	}

	// Signature verification
	if ext == ".jpg" || ext == ".jpeg" {
		if len(content) < 3 || !bytes.HasPrefix(content, []byte("\xFF\xD8\xFF")) {
			return "", "", 0, 0, fmt.Errorf("invalid JPEG content signature")
		}
	} else if ext == ".png" {
		if len(content) < 8 || !bytes.HasPrefix(content, []byte("\x89PNG\r\n\x1a\n")) {
			return "", "", 0, 0, fmt.Errorf("invalid PNG content signature")
		}
	} else if ext == ".webp" {
		if len(content) < 12 || !bytes.HasPrefix(content, []byte("RIFF")) || !bytes.Equal(content[8:12], []byte("WEBP")) {
			return "", "", 0, 0, fmt.Errorf("invalid WebP content signature")
		}
	}

	return ext, expectedMIME, width, height, nil
}

// HandleUploadGalleryImage processes and saves photo gallery images.
// POST /admin/.../news/{id}/gallery
func (h *NewsHandler) HandleUploadGalleryImage(w http.ResponseWriter, r *http.Request) {
	if h.storage == nil {
		jsonError(w, "not_configured", "Storage is not configured", http.StatusNotImplemented)
		return
	}

	newsID := chi.URLParam(r, "id")
	if newsID == "" {
		jsonError(w, "bad_request", "news id is required", http.StatusBadRequest)
		return
	}

	_, err := h.repo.GetByID(r.Context(), newsID)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
	}

	maxSize := getMaxGalleryImageSize()
	if err := r.ParseMultipartForm(maxSize); err != nil {
		jsonError(w, "invalid_form", fmt.Sprintf("File size exceeds limit (%d MB)", maxSize/(1024*1024)), http.StatusBadRequest)
		return
	}

	existingImgs, _ := h.repo.GetGalleryImagesByNewsID(r.Context(), newsID)
	if len(existingImgs) >= 30 {
		jsonError(w, "limit_exceeded", "Maximum 30 gallery images per article allowed", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		file, header, err = r.FormFile("image")
		if err != nil {
			jsonError(w, "missing_file", "No 'file' or 'image' field in request", http.StatusBadRequest)
			return
		}
	}
	defer file.Close()

	if header.Size > maxSize {
		jsonError(w, "size_limit", fmt.Sprintf("File exceeds maximum allowed size of %d MB", maxSize/(1024*1024)), http.StatusBadRequest)
		return
	}

	src, err := io.ReadAll(io.LimitReader(file, maxSize+1))
	if err != nil {
		jsonError(w, "read_error", "Cannot read uploaded file", http.StatusInternalServerError)
		return
	}
	if int64(len(src)) > maxSize {
		jsonError(w, "size_limit", fmt.Sprintf("File exceeds maximum allowed size of %d MB", maxSize/(1024*1024)), http.StatusBadRequest)
		return
	}

	ext, mimeType, width, height, err := ValidateGalleryImageFile(header.Filename, src)
	if err != nil {
		jsonError(w, "invalid_file", err.Error(), http.StatusBadRequest)
		return
	}

	processedData := src
	storedExt := ext
	storedMIME := mimeType

	if h.imgProc != nil {
		if proc, errProc := h.imgProc.ProcessSingle(src); errProc == nil && len(proc) > 0 {
			processedData = proc
			storedExt = ".webp"
			storedMIME = "image/webp"
		}
	}

	cleanOrigName := filepath.Base(strings.ReplaceAll(header.Filename, "\x00", ""))
	imgID := uuid.New().String()
	storedName := fmt.Sprintf("%s%s", imgID, storedExt)
	storageKey := fmt.Sprintf("news/articles/%s/gallery/%s", newsID, storedName)

	if err := h.storage.Put(r.Context(), storageKey, processedData, storedMIME); err != nil {
		slog.Error("HandleUploadGalleryImage: storage save failed", "error", err)
		jsonError(w, "storage_error", "Failed to save gallery image to storage", http.StatusInternalServerError)
		return
	}

	altUK := r.FormValue("alt_uk")
	altEN := r.FormValue("alt_en")
	captionUK := r.FormValue("caption_uk")
	captionEN := r.FormValue("caption_en")

	img := &domain.NewsGalleryImage{
		ID:           imgID,
		NewsID:       newsID,
		OriginalName: cleanOrigName,
		StoredName:   storedName,
		MIMEType:     storedMIME,
		Extension:    storedExt,
		SizeBytes:    int64(len(processedData)),
		Width:        width,
		Height:       height,
		SortOrder:    len(existingImgs),
		AltUK:        altUK,
		AltEN:        altEN,
		CaptionUK:    captionUK,
		CaptionEN:    captionEN,
		CreatedAt:    time.Now().UTC(),
	}

	if err := h.repo.AddGalleryImage(r.Context(), img); err != nil {
		_ = h.storage.Delete(r.Context(), storageKey)
		slog.Error("HandleUploadGalleryImage: db insert failed", "error", err)
		jsonError(w, "db_error", "Failed to record gallery image metadata", http.StatusInternalServerError)
		return
	}

	fileRoute := fmt.Sprintf("/api/v1/news/%s/gallery/%s/file", newsID, img.ID)
	if h.resolver != nil {
		img.URL = h.resolver.Resolve(fileRoute)
		img.ThumbnailURL = h.resolver.Resolve(fileRoute + "?variant=thumb")
		img.LargeURL = h.resolver.Resolve(fileRoute + "?variant=large")
	} else {
		img.URL = fileRoute
		img.ThumbnailURL = fileRoute + "?variant=thumb"
		img.LargeURL = fileRoute + "?variant=large"
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, "upload_news_gallery_image", img.ID, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(img)
}

// HandleGetGalleryImages returns all gallery images for a news article.
// GET /admin/.../news/{id}/gallery
// GET /api/v1/news/{id}/gallery
func (h *NewsHandler) HandleGetGalleryImages(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	targetID := newsID
	if article, err := h.repo.GetByID(r.Context(), newsID); err == nil && article != nil {
		targetID = article.ID
	} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangUk, newsID); err == nil && article != nil {
		targetID = article.ID
	} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangEn, newsID); err == nil && article != nil {
		targetID = article.ID
	}

	imgs, err := h.repo.GetGalleryImagesByNewsID(r.Context(), targetID)
	if err != nil {
		jsonError(w, "db_error", "Failed to fetch gallery images", http.StatusInternalServerError)
		return
	}
	if imgs == nil {
		imgs = []domain.NewsGalleryImage{}
	}
	for i := range imgs {
		fileRoute := fmt.Sprintf("/api/v1/news/%s/gallery/%s/file", imgs[i].NewsID, imgs[i].ID)
		if h.resolver != nil {
			imgs[i].URL = h.resolver.Resolve(fileRoute)
			imgs[i].ThumbnailURL = h.resolver.Resolve(fileRoute + "?variant=thumb")
			imgs[i].LargeURL = h.resolver.Resolve(fileRoute + "?variant=large")
		} else {
			imgs[i].URL = fileRoute
			imgs[i].ThumbnailURL = fileRoute + "?variant=thumb"
			imgs[i].LargeURL = fileRoute + "?variant=large"
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(imgs)
}

// HandleUpdateGalleryImage updates localized alt/caption and sort_order of a gallery image.
// PATCH /admin/.../news/{id}/gallery/{imageId}
func (h *NewsHandler) HandleUpdateGalleryImage(w http.ResponseWriter, r *http.Request) {
	imgID := chi.URLParam(r, "imageId")
	var req struct {
		AltUK     string `json:"alt_uk"`
		AltEN     string `json:"alt_en"`
		CaptionUK string `json:"caption_uk"`
		CaptionEN string `json:"caption_en"`
		SortOrder int    `json:"sort_order"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateGalleryImage(r.Context(), imgID, req.AltUK, req.AltEN, req.CaptionUK, req.CaptionEN, req.SortOrder); err != nil {
		if errors.Is(err, domain.ErrNewsNotFound) {
			jsonError(w, "not_found", "Gallery image not found", http.StatusNotFound)
			return
		}
		jsonError(w, "db_error", "Failed to update gallery image metadata", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// HandleDeleteGalleryImage deletes a gallery image record and physical file.
// DELETE /admin/.../news/{id}/gallery/{imageId}
func (h *NewsHandler) HandleDeleteGalleryImage(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	imgID := chi.URLParam(r, "imageId")

	img, err := h.repo.GetGalleryImageByID(r.Context(), imgID)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Gallery image not found", http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, "db_error", "Failed to get gallery image", http.StatusInternalServerError)
		return
	}

	if err := h.repo.DeleteGalleryImage(r.Context(), imgID); err != nil {
		jsonError(w, "db_error", "Failed to delete gallery image from DB", http.StatusInternalServerError)
		return
	}

	if h.storage != nil {
		storageKey := fmt.Sprintf("news/articles/%s/gallery/%s", newsID, img.StoredName)
		_ = h.storage.Delete(r.Context(), storageKey)
	}

	adminEmail := AdminEmailFromCtx(r.Context())
	h.recordAudit(r.Context(), adminEmail, "delete_news_gallery_image", imgID, realIP(r))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// HandleReorderGalleryImages updates sort_order for gallery images of an article.
// PATCH /admin/.../news/{id}/gallery/reorder
func (h *NewsHandler) HandleReorderGalleryImages(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	var ids []string
	if err := json.NewDecoder(r.Body).Decode(&ids); err != nil {
		jsonError(w, "invalid_request", "Expected array of gallery image IDs", http.StatusBadRequest)
		return
	}

	if err := h.repo.ReorderGalleryImages(r.Context(), newsID, ids); err != nil {
		jsonError(w, "db_error", "Failed to reorder gallery images", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "reordered"})
}

// HandlePublicServeGalleryImage serves the physical gallery image binary.
// GET /api/v1/news/{id}/gallery/{imageId}/file
func (h *NewsHandler) HandlePublicServeGalleryImage(w http.ResponseWriter, r *http.Request) {
	newsID := chi.URLParam(r, "id")
	imgID := chi.URLParam(r, "imageId")
	if imgID == "" {
		imgID = chi.URLParam(r, "id")
	}

	img, err := h.repo.GetGalleryImageByID(r.Context(), imgID)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Gallery image not found", http.StatusNotFound)
		return
	}
	if err != nil {
		jsonError(w, "db_error", "Failed to retrieve gallery image", http.StatusInternalServerError)
		return
	}

	if newsID != "" {
		targetID := newsID
		if article, err := h.repo.GetByID(r.Context(), newsID); err == nil && article != nil {
			targetID = article.ID
		} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangUk, newsID); err == nil && article != nil {
			targetID = article.ID
		} else if article, _, err := h.repo.GetBySlug(r.Context(), domain.LangEn, newsID); err == nil && article != nil {
			targetID = article.ID
		}
		if img.NewsID != targetID {
			jsonError(w, "not_found", "Gallery image not found for specified news article", http.StatusNotFound)
			return
		}
	}

	storageKey := fmt.Sprintf("news/articles/%s/gallery/%s", img.NewsID, img.StoredName)
	if h.storage != nil {
		exists, err := h.storage.Exists(r.Context(), storageKey)
		if err != nil || !exists {
			jsonError(w, "not_found", "File not found in storage", http.StatusNotFound)
			return
		}
	}

	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "public, max-age=86400, s-maxage=86400")
	w.Header().Set("Content-Type", img.MIMEType)

	if localStorage, ok := h.storage.(*storage.LocalStorage); ok {
		cleanKey := strings.TrimPrefix(filepath.ToSlash(storageKey), "/")
		filePath := filepath.Join(localStorage.BaseDir(), filepath.FromSlash(cleanKey))
		http.ServeFile(w, r, filePath)
		return
	}

	jsonError(w, "not_implemented", "Gallery image serving for remote storage drivers is not configured", http.StatusNotImplemented)
}
