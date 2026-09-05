package http

import (
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

// ─── Drafts Handlers (Live Preview) ──────────────────────────────────────────

// HandleSaveDraft stores a live preview draft in Redis.
// POST /api/v1/admin-{hash}/news/drafts/{session_id}
func (h *NewsHandler) HandleSaveDraft(w http.ResponseWriter, r *http.Request) {
	if h.cache == nil {
		jsonError(w, "not_implemented", "Cache store not configured", http.StatusNotImplemented)
		return
	}

	sessionID := chi.URLParam(r, "session_id")
	if sessionID == "" {
		jsonError(w, "invalid_request", "Missing session ID", http.StatusBadRequest)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		jsonError(w, "invalid_request", "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	key := "preview:draft:" + sessionID
	// 1 hour TTL
	if err := h.cache.Set(r.Context(), key, string(body), time.Hour); err != nil {
		slog.Error("HandleSaveDraft: failed to save to cache", "error", err, "session", sessionID)
		jsonError(w, "internal_error", "Failed to save draft", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

// HandleGetDraft retrieves a live preview draft from Redis.
// GET /api/v1/admin-{hash}/news/drafts/{session_id}
func (h *NewsHandler) HandleGetDraft(w http.ResponseWriter, r *http.Request) {
	if h.cache == nil {
		jsonError(w, "not_implemented", "Cache store not configured", http.StatusNotImplemented)
		return
	}

	sessionID := chi.URLParam(r, "session_id")
	if sessionID == "" {
		jsonError(w, "invalid_request", "Missing session ID", http.StatusBadRequest)
		return
	}

	key := "preview:draft:" + sessionID
	data, err := h.cache.Get(r.Context(), key)
	if err != nil {
		slog.Error("HandleGetDraft: failed to get from cache", "error", err, "session", sessionID)
		jsonError(w, "internal_error", "Failed to get draft", http.StatusInternalServerError)
		return
	}

	if data == "" {
		jsonError(w, "not_found", "Draft not found or expired", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(data))
}
