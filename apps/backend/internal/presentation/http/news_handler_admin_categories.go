package http

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/imageproc"
)

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

var coverPositionRegex = regexp.MustCompile(`^((100|[1-9]?\d)%\s(100|[1-9]?\d)%|top|bottom|center|left|right)$`)

func isValidCoverPosition(pos string) bool {
	if pos == "" {
		return true
	}
	return coverPositionRegex.MatchString(pos)
}
