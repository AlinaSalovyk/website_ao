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
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
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
// Body: NewsArticle JSON (both locales required).
func (h *NewsHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
	var article domain.NewsArticle
	if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := article.Validate(); err != nil {
		jsonError(w, "validation_error", err.Error(), http.StatusBadRequest)
		return
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
		if errors.Is(err, domain.ErrNewsSlugConflict) {
			jsonError(w, "slug_conflict", "Slug already taken — change the title or slug", http.StatusConflict)
			return
		}
		slog.Error("HandleCreate: db failed", "error", err)
		jsonError(w, "db_error", "Failed to create article", http.StatusInternalServerError)
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
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}
	article.ID = id

	if err := article.Validate(); err != nil {
		jsonError(w, "validation_error", err.Error(), http.StatusBadRequest)
		return
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
			jsonError(w, "not_found", "Article not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, domain.ErrNewsSlugConflict) {
			jsonError(w, "slug_conflict", "Slug already taken", http.StatusConflict)
			return
		}
		slog.Error("HandleUpdate: failed", "id", id, "error", err)
		jsonError(w, "db_error", "Failed to update article", http.StatusInternalServerError)
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
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}
	if req.Status != domain.NewsStatusDraft && req.Status != domain.NewsStatusPublished {
		jsonError(w, "validation_error", "status must be 'draft' or 'published'", http.StatusBadRequest)
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
	_, err := h.repo.GetByID(r.Context(), id)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
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

	ts := time.Now().Unix()
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
		jsonError(w, "db_error", "Failed to persist image URL", http.StatusInternalServerError)
		return
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
