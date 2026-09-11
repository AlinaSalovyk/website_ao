package http

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/imageproc"
	"university-chatbot/backend/internal/infrastructure/slugify"
	"university-chatbot/backend/internal/infrastructure/storage"
)

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
// POST /admin-.../news/upload-video
func (h *NewsHandler) HandleUploadVideo(w http.ResponseWriter, r *http.Request) {
	if h.storage == nil {
		jsonError(w, "not_configured", "Video storage is not configured", http.StatusNotImplemented)
		return
	}

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

// Attachment helpers & handlers

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

// ValidateAttachmentFile validates an uploaded attachment: enforces size limit,
// extension allowlist/rejectlist, and content-signature checks for selected formats.
// maxBytes is the caller-supplied size limit (typically h.attachmentMaxBytes).
func ValidateAttachmentFile(filename string, content []byte, maxBytes int64) (ext string, mimeType string, err error) {
	if int64(len(content)) > maxBytes {
		return "", "", fmt.Errorf("file size %d exceeds maximum limit of %d bytes", len(content), maxBytes)
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

	if ext == ".pdf" {
		if len(content) < 5 || !bytes.HasPrefix(content, []byte("%PDF-")) {
			return "", "", fmt.Errorf("invalid PDF content signature")
		}
	} else if ext == ".docx" || ext == ".xlsx" || ext == ".pptx" || ext == ".odt" || ext == ".ods" || ext == ".odp" {
		if len(content) < 4 || !bytes.HasPrefix(content, []byte("PK\x03\x04")) {
			return "", "", fmt.Errorf("invalid Office container format")
		}
	}

	return ext, expectedMIME, nil
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

	_, err := h.repo.GetByID(r.Context(), newsID)
	if errors.Is(err, domain.ErrNewsNotFound) {
		jsonError(w, "not_found", "Article not found", http.StatusNotFound)
		return
	}

	maxSize := h.attachmentMaxBytes
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

	ext, mimeType, err := ValidateAttachmentFile(header.Filename, src, h.attachmentMaxBytes)
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

	h.resolveAttachmentURL(att, newsID)

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
		h.resolveAttachmentURL(&atts[i], atts[i].NewsID)
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

// Gallery helpers & handlers

var allowedGalleryImageExts = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
}



// ValidateGalleryImageFile validates an uploaded gallery image: enforces size limit,
// extension allowlist, and content-signature checks.
// maxBytes is the caller-supplied size limit (typically h.galleryMaxBytes).
func ValidateGalleryImageFile(filename string, content []byte, maxBytes int64) (ext string, mimeType string, width int, height int, err error) {
	if int64(len(content)) > maxBytes {
		return "", "", 0, 0, fmt.Errorf("file size %d exceeds maximum limit of %d bytes", len(content), maxBytes)
	}

	ext = strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		ext = ".jpg"
	}

	expectedMIME, allowed := allowedGalleryImageExts[ext]
	if !allowed {
		return "", "", 0, 0, fmt.Errorf("image extension %s is not allowed (only JPG, PNG, WebP supported)", ext)
	}

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

	maxSize := h.galleryMaxBytes
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

	ext, mimeType, width, height, err := ValidateGalleryImageFile(header.Filename, src, h.galleryMaxBytes)
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

	h.resolveGalleryImageURLs(img, newsID)

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
		h.resolveGalleryImageURLs(&imgs[i], imgs[i].NewsID)
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
