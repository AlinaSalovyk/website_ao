// Package queries implements the read-side use cases (CQRS queries) for the chat feature.
// The primary use case is AskBotHandler which orchestrates the full RAG pipeline:
// translate → vector search → rerank → filter → cache check → LLM stream → persist.
package queries

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/metrics"
)

// AskBotQuery wraps a ChatRequest for dispatch through the use-case handler.
type AskBotQuery struct {
	Request *domain.ChatRequest
}

// AskBotResult is returned after a successful chat interaction, carrying
// metadata needed by the presentation layer (sources for SSE, query hash for feedback).
type AskBotResult struct {
	Sources   []domain.Source // Documents that contributed to the answer.
	QueryHash string          // SHA-256 prefix used to link feedback to this query.
	StartedAt time.Time       // Timestamp when processing began (for latency tracking).
	VariantID int64           // ID of the prompt variant used (0 = default).
}

// AskBotHandler is the core RAG pipeline orchestrator. It performs:
//  1. Query translation (EN→UK) for Ukrainian-language vector corpus
//  2. Dense vector search via VectorStore
//  3. Optional LLM-based reranking
//  4. Relevance filtering (score ≥ 0.55, keyword boost ≥ 0.4)
//  5. Conversation history injection from ConversationMemory
//  6. Response cache check via CacheStore
//  7. Streaming LLM answer generation
//  8. Asynchronous analytics recording
//
// Dependencies are injected via constructor + fluent With* methods.
type AskBotHandler struct {
	vectorStore    domain.VectorStore
	llm            domain.LLMClient
	analytics      domain.AnalyticsRepo
	cache          domain.CacheStore
	memory         domain.ConversationMemory
	promptSelector *PromptSelector
	reranker       *Reranker
}

// NewAskBotHandler creates a new handler with the minimum required dependencies.
// Optional features (cache, memory, prompt A/B, reranking) are attached via With* methods.
func NewAskBotHandler(vs domain.VectorStore, llm domain.LLMClient, ar domain.AnalyticsRepo) *AskBotHandler {
	return &AskBotHandler{vectorStore: vs, llm: llm, analytics: ar}
}

// WithCache attaches an optional response cache to the handler.
// When set, identical query+context combinations are served from cache (1h TTL).
func (h *AskBotHandler) WithCache(cache domain.CacheStore) *AskBotHandler {
	h.cache = cache
	return h
}


// WithMemory attaches conversation history storage.
// When set, the last 5 messages of the session are injected into the LLM context.
func (h *AskBotHandler) WithMemory(memory domain.ConversationMemory) *AskBotHandler {
	h.memory = memory
	return h
}

// WithPromptSelector attaches the A/B prompt selector.
// When nil, the default static system prompt for the request language is used.
func (h *AskBotHandler) WithPromptSelector(ps *PromptSelector) *AskBotHandler {
	h.promptSelector = ps
	return h
}

// WithReranker attaches the LLM-based reranker.
// When nil or disabled, vector search results are used in original score order.
func (h *AskBotHandler) WithReranker(rr *Reranker) *AskBotHandler {
	h.reranker = rr
	return h
}

// Handle executes the full RAG pipeline for a single chat request.
//
// It writes SSE-formatted tokens directly to w. The caller is responsible
// for setting the correct Content-Type and flushing headers before calling this.
//
// Returns:
//   - *AskBotResult: metadata about the interaction (sources, hash, timing)
//   - error: non-nil if vector search or LLM streaming fails
func (h *AskBotHandler) Handle(ctx context.Context, q AskBotQuery, w io.Writer) (*AskBotResult, error) {
	start := time.Now()
	req := q.Request

	hash := sha256.Sum256([]byte(strings.TrimSpace(req.Message)))
	queryHash := fmt.Sprintf("%x", hash[:8])

	searchQuery := req.Message
	if req.Language == domain.LangEn {
		var tr struct {
			Translated string `json:"translated"`
		}
		prompt := "You are a professional translator. Translate the following user query to Ukrainian. " +
			"Return ONLY a JSON object with a single key 'translated' containing the translation. " +
			"Do not add any explanations or markdown. Query: " + req.Message

		if err := h.llm.GenerateJSON(ctx, prompt, &tr); err == nil && tr.Translated != "" {
			searchQuery = tr.Translated
			slog.Info("Query translated for vector search", "original", req.Message, "translated", searchQuery)
		} else {
			slog.Warn("Failed to translate query, using original", "error", err)
		}
	}

	results, err := h.vectorStore.HybridSearch(ctx, searchQuery, 20)
	if err != nil {
		return nil, fmt.Errorf("vector search: %w", err)
	}

	if h.reranker != nil {
		results = h.reranker.Rerank(ctx, searchQuery, results)
	}

	var contextBuf bytes.Buffer
	sources := make([]domain.Source, 0, len(results))
	seenDocs := make(map[string]bool)

	queryWords := tokenizeQuery(searchQuery)

	for _, r := range results {
		hasKeyword := chunkContainsKeyword(r.Chunk.Text, queryWords)
		if r.Score < 0.55 && !(r.Score >= 0.4 && hasKeyword) {
			continue
		}

		fmt.Fprintf(&contextBuf, "--- %s ---\n%s\n\n",
			r.Chunk.DocumentName, r.Chunk.Text)

		if !seenDocs[r.Chunk.DocumentName] && len(sources) < 15 {
			seenDocs[r.Chunk.DocumentName] = true
			sources = append(sources, domain.Source{
				DocumentName: r.Chunk.DocumentName,
				Score:        r.Score,
				PageNumber:   r.Chunk.PageNumber,
			})
		}
	}

	hasHistory := false
	if h.memory != nil {
		hist, err := h.memory.GetHistory(ctx, req.SessionID, 5)
		if err == nil && len(hist) > 0 {
			hasHistory = true
			histJSON, _ := json.Marshal(hist)
			contextBuf.WriteString("\n\n--- Історія розмови ---\n")
			contextBuf.Write(histJSON)
			contextBuf.WriteString("\n-----------------------\n")
		}
	}

	if contextBuf.Len() == 0 && !hasHistory {
		fallback := domain.FallbackResponseUA
		if req.Language == domain.LangEn {
			fallback = domain.FallbackResponseEN
		}
		fallbackEscaped := strings.ReplaceAll(fallback, "\n", "\\n")
		fmt.Fprintf(w, "data: %s\n\n", fallbackEscaped)
		if f, ok := w.(interface{ Flush() }); ok {
			f.Flush()
		}

		elapsed := time.Since(start).Milliseconds()
		go func() {
			if err := h.analytics.Record(context.Background(), domain.QueryRecord{
				QueryHash:  queryHash,
				QueryText:  req.Message,
				Language:   req.Language,
				ResponseMs: elapsed,
				SourcesCnt: 0,
				IsBlocked:  false,
			}); err != nil {
				slog.Error("Failed to record analytics", "error", err)
			}
		}()

		return &AskBotResult{
			Sources:   []domain.Source{},
			QueryHash: queryHash,
			StartedAt: start,
		}, nil
	}

	var sysPrompt string
	var variantID int64

	if h.promptSelector != nil {
		selection := h.promptSelector.Select(ctx, req.Language)
		sysPrompt = selection.PromptText
		variantID = selection.VariantID
	} else {
		sysPrompt = domain.SystemPromptUA
		if req.Language == domain.LangEn {
			sysPrompt = domain.SystemPromptEN
		}
	}

	ctxHash := sha256.Sum256([]byte(string(req.Language) + req.Message + contextBuf.String()))
	cacheKey := fmt.Sprintf("resp:%x", ctxHash[:12])

	if h.cache != nil {
		cached, cacheErr := h.cache.Get(ctx, cacheKey)
		if cacheErr == nil && cached != "" {
			metrics.CacheHitsTotal.WithLabelValues("hit").Inc()
			cachedEscaped := strings.ReplaceAll(cached, "\n", "\\n")
			fmt.Fprintf(w, "data: %s\n\n", cachedEscaped)
			if f, ok := w.(interface{ Flush() }); ok {
				f.Flush()
			}

			elapsed := time.Since(start).Milliseconds()
			go func() {
				if err := h.analytics.Record(context.Background(), domain.QueryRecord{
					QueryHash:  queryHash,
					QueryText:  req.Message,
					Language:   req.Language,
					ResponseMs: elapsed,
					SourcesCnt: len(sources),
					IsBlocked:  false,
				}); err != nil {
					slog.Error("Failed to record analytics", "error", err)
				}
			}()

			return &AskBotResult{
				Sources:   sources,
				QueryHash: queryHash,
				StartedAt: start,
				VariantID: variantID,
			}, nil
		}
	}

	metrics.CacheHitsTotal.WithLabelValues("miss").Inc()
	var capturedResponse strings.Builder
	teeWriter := io.MultiWriter(w, &capturedResponse)

	if err := h.llm.StreamAnswer(ctx, sysPrompt, req.Message, contextBuf.String(), req.Language, teeWriter); err != nil {
		return nil, fmt.Errorf("llm stream: %w", err)
	}

	if capturedResponse.Len() > 0 {
		go func() {
			bgCtx := context.Background()
			if h.cache != nil {
				if err := h.cache.Set(bgCtx, cacheKey, capturedResponse.String(), time.Hour); err != nil {
					slog.Warn("Failed to cache response", "error", err)
				}
			}
			if h.memory != nil {
				_ = h.memory.AddMessage(bgCtx, req.SessionID, domain.Message{Role: "user", Content: req.Message})
				_ = h.memory.AddMessage(bgCtx, req.SessionID, domain.Message{Role: "assistant", Content: capturedResponse.String()})
			}
		}()
	}

	elapsed := time.Since(start).Milliseconds()

	go func() {
		if err := h.analytics.Record(context.Background(), domain.QueryRecord{
			QueryHash:  queryHash,
			QueryText:  req.Message,
			Language:   req.Language,
			ResponseMs: elapsed,
			SourcesCnt: len(sources),
			IsBlocked:  false,
		}); err != nil {
			slog.Error("Failed to record analytics", "error", err)
		}
	}()

	return &AskBotResult{
		Sources:   sources,
		QueryHash: queryHash,
		StartedAt: start,
		VariantID: variantID,
	}, nil
}

// tokenizeQuery splits a query into lowercase keyword tokens,
// removing stop words (UK/EN) and tokens shorter than 3 runes.
// Used by chunkContainsKeyword for the keyword-boost relevance gate.
func tokenizeQuery(q string) []string {
	words := strings.FieldsFunc(strings.ToLower(q), func(r rune) bool {
		return r == ' ' || r == '\t' || r == '\n' ||
			r == ',' || r == '.' || r == '?' || r == '!' ||
			r == ';' || r == ':' || r == '(' || r == ')' ||
			r == '"' || r == '\'' || r == '«' || r == '»'
	})

	stopWords := map[string]bool{
		"і": true, "та": true, "в": true, "у": true, "на": true,
		"з": true, "до": true, "як": true, "що": true, "це": true,
		"для": true, "не": true, "але": true, "а": true,
		"the": true, "a": true, "an": true, "in": true, "on": true,
		"at": true, "is": true, "are": true, "was": true, "how": true,
	}

	result := make([]string, 0, len(words))
	for _, w := range words {
		if len([]rune(w)) > 2 && !stopWords[w] {
			result = append(result, w)
		}
	}
	return result
}

// chunkContainsKeyword returns true if the chunk text contains at least
// one keyword from the tokenized query. This provides a secondary relevance
// signal alongside the vector similarity score.
func chunkContainsKeyword(chunkText string, queryWords []string) bool {
	lower := strings.ToLower(chunkText)
	for _, word := range queryWords {
		if strings.Contains(lower, word) {
			return true
		}
	}
	return false
}
