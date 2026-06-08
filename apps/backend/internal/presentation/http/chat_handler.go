package http

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"

	"university-chatbot/backend/internal/application/features/chat/commands"
	"university-chatbot/backend/internal/application/features/chat/queries"
	"university-chatbot/backend/internal/application/features/chat/validators"
	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/metrics"
	"university-chatbot/backend/internal/infrastructure/security"
)


// AskBotUseCase abstracts the AskBotHandler for testability.
type AskBotUseCase interface {
	Handle(ctx context.Context, q queries.AskBotQuery, w io.Writer) (*queries.AskBotResult, error)
}

// ChatHandler handles public chat HTTP endpoints:
//   - POST /api/v1/chat/stream  — SSE streaming chat
//   - POST /api/v1/chat/feedback — thumbs up/down feedback
//   - GET  /api/v1/chat/suggestions — suggested starter questions
type ChatHandler struct {
	askBot       AskBotUseCase
	feedback     *commands.SubmitFeedbackHandler
	rateBan      func(ip string)
	offTopic     *security.OffTopicFilter
	validator    *validators.AskBotValidator
	analyticsRepo domain.AnalyticsRepo
}

// NewChatHandler creates a ChatHandler with all required dependencies.
func NewChatHandler(
	askBot AskBotUseCase,
	feedback *commands.SubmitFeedbackHandler,
	banFunc func(ip string),
	otf *security.OffTopicFilter,
	analyticsRepo domain.AnalyticsRepo,
) *ChatHandler {
	return &ChatHandler{
		askBot:        askBot,
		feedback:      feedback,
		rateBan:       banFunc,
		offTopic:      otf,
		validator:     validators.NewAskBotValidator(),
		analyticsRepo: analyticsRepo,
	}
}

// ─── POST /api/v1/chat/stream ─────────────────────────────────────────────────

// StreamChat handles SSE streaming chat requests.
func (h *ChatHandler) StreamChat(w http.ResponseWriter, r *http.Request) {
	reqID := middleware.GetReqID(r.Context())
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	var req domain.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sseError(w, flusher, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := h.validator.Validate(&req); err != nil {
		metrics.ChatRequestsTotal.WithLabelValues(string(req.Language), "blocked").Inc()
		metrics.ChatBlockedTotal.WithLabelValues("xss").Inc()
		sseError(w, flusher, "validation_error", err.Error(), http.StatusBadRequest)
		return
	}

	if containsCyrillic(req.Message) {
		req.Language = domain.LangUk
	} else {
		req.Language = domain.LangEn
	}

	chatStart := time.Now()

	if h.offTopic.IsOffTopic(req.Message) {
		metrics.ChatRequestsTotal.WithLabelValues(string(req.Language), "blocked").Inc()
		metrics.ChatBlockedTotal.WithLabelValues("offtopic").Inc()
		h.rateBan(realIP(r))

		if h.analyticsRepo != nil {
			go func() {
				hash := sha256.Sum256([]byte(strings.TrimSpace(req.Message)))
				queryHash := fmt.Sprintf("%x", hash[:8])
				_ = h.analyticsRepo.Record(context.Background(), domain.QueryRecord{
					QueryHash:  queryHash,
					QueryText:  strings.TrimSpace(req.Message),
					Language:   req.Language,
					ResponseMs: 0,
					SourcesCnt: 0,
					IsBlocked:  true,
				})
			}()
		}

		offTopicMsg := domain.OffTopicResponseUA
		if req.Language == domain.LangEn {
			offTopicMsg = domain.OffTopicResponseEN
		}

		writeSSEToken(w, flusher, offTopicMsg)
		writeSources(w, flusher, nil)
		fmt.Fprintf(w, "data: [DONE]\n\n")
		flusher.Flush()

		slog.Info("off-topic query blocked and recorded",
			"request_id", reqID,
			"session_id", req.SessionID,
			"language", req.Language,
		)
		return
	}

	ctx := r.Context()

	result, err := h.askBot.Handle(ctx, queries.AskBotQuery{Request: &req}, &sseWriter{w: w, flusher: flusher})
	if err != nil {
		metrics.ChatRequestsTotal.WithLabelValues(string(req.Language), "error").Inc()
		slog.Error("RAG pipeline error",
			"request_id", reqID,
			"session_id", req.SessionID,
			"error", err,
		)
		h.handleRAGError(err, &req, w, flusher)
		return
	}

	metrics.ChatRequestsTotal.WithLabelValues(string(req.Language), "ok").Inc()
	metrics.ChatLatencySeconds.WithLabelValues(string(req.Language)).Observe(time.Since(chatStart).Seconds())

	writeSSEMeta(w, flusher, result.QueryHash)

	writeSources(w, flusher, result.Sources)
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

// handleRAGError handles RAG pipeline errors and sends appropriate SSE error responses.
func (h *ChatHandler) handleRAGError(err error, req *domain.ChatRequest, w http.ResponseWriter, flusher http.Flusher) {
	msg := domain.RAGErrorResponseEN
	if req.Language == domain.LangUk {
		msg = domain.RAGErrorResponseUA
	}

	if errors.Is(err, domain.ErrLLMOverloaded) {
		msg = domain.OverloadResponseEN
		if req.Language == domain.LangUk {
			msg = domain.OverloadResponseUA
		}
	}

	escapedMsg := strings.ReplaceAll(msg, "\n", "\\n")
	fmt.Fprintf(w, "data: %s\n\n", escapedMsg)
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

// ─── POST /api/v1/feedback ────────────────────────────────────────────────────

// SubmitFeedback handles thumbs up/down feedback for chat responses.
func (h *ChatHandler) SubmitFeedback(w http.ResponseWriter, r *http.Request) {
	var cmd commands.SubmitFeedbackCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		jsonError(w, "invalid_request", "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := h.feedback.Handle(r.Context(), cmd); err != nil {
		jsonError(w, "validation_error", err.Error(), http.StatusBadRequest)
		return
	}

	if cmd.Feedback == 1 {
		metrics.FeedbackTotal.WithLabelValues("positive").Inc()
	} else {
		metrics.FeedbackTotal.WithLabelValues("negative").Inc()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// sseWriter is an io.Writer wrapper for SSE streaming.
type sseWriter struct {
	w       http.ResponseWriter
	flusher http.Flusher
}

// Write writes the given byte slice to the response writer and flushes the flusher.
func (sw *sseWriter) Write(p []byte) (n int, err error) {
	n, err = sw.w.Write(p)
	sw.flusher.Flush()
	return
}

// writeSSEToken writes an SSE token to the response writer.
func writeSSEToken(w http.ResponseWriter, f http.Flusher, token string) {
	token = strings.ReplaceAll(token, "\n", "\\n")
	fmt.Fprintf(w, "data: %s\n\n", token)
	f.Flush()
}

// writeSources writes the given sources to the response writer.
func writeSources(w http.ResponseWriter, f http.Flusher, sources []domain.Source) {
	if sources == nil {
		sources = []domain.Source{}
	}
	b, _ := json.Marshal(sources)
	fmt.Fprintf(w, "event: sources\ndata: %s\n\n", b)
	f.Flush()
}

// writeSSEMeta writes the given query hash to the response writer.
func writeSSEMeta(w http.ResponseWriter, f http.Flusher, queryHash string) {
	b, _ := json.Marshal(map[string]string{"query_hash": queryHash})
	fmt.Fprintf(w, "event: meta\ndata: %s\n\n", b)
	f.Flush()
}

// sseError writes an SSE error to the response writer.
func sseError(w http.ResponseWriter, f http.Flusher, code, msg string, status int) {
	w.WriteHeader(status)
	b, _ := json.Marshal(map[string]string{"error": code, "message": msg})
	fmt.Fprintf(w, "event: error\ndata: %s\n\n", b)
	f.Flush()
}

// jsonError writes a JSON error response to the response writer.
func jsonError(w http.ResponseWriter, code, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": code, "message": msg})
}

// realIP extracts the real IP address from the request.
func realIP(r *http.Request) string {
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return strings.TrimSpace(ip)
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 && ips[0] != "" {
			return strings.TrimSpace(ips[0])
		}
	}
	if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
		return strings.TrimSpace(xrip)
	}
	addr := r.RemoteAddr
	if idx := strings.LastIndex(addr, ":"); idx > 0 {
		return addr[:idx]
	}
	return addr
}

// containsCyrillic checks if the given text contains Cyrillic characters.
func containsCyrillic(text string) bool {
	for _, r := range text {
		if (r >= '\u0400' && r <= '\u04FF') || (r >= '\u0500' && r <= '\u052F') {
			return true
		}
	}
	return false
}
