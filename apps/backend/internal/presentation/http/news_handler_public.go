package http

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/storage"
)

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

	if h.resolver != nil {
		http.Redirect(w, r, h.resolver.Resolve(storageKey), http.StatusFound)
		return
	}

	jsonError(w, "not_implemented", "Attachment serving for remote storage drivers is not configured", http.StatusNotImplemented)
}

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

	if h.resolver != nil {
		http.Redirect(w, r, h.resolver.Resolve(storageKey), http.StatusFound)
		return
	}

	jsonError(w, "not_implemented", "Gallery image serving for remote storage drivers is not configured", http.StatusNotImplemented)
}
