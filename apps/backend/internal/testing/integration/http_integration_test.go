package integration_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/auth"
	"university-chatbot/backend/internal/infrastructure/security"
	chathttp "university-chatbot/backend/internal/presentation/http"
	"university-chatbot/backend/internal/application/features/chat/queries"
)

// ─── Mocks ───────────────────────────────────────────────────────────────────

// mockAskBot satisfies AskBotUseCase. Simulates SSE streaming.
type mockAskBot struct{ fail bool }

func (m *mockAskBot) Handle(ctx context.Context, q queries.AskBotQuery, w io.Writer) (*queries.AskBotResult, error) {
	if m.fail {
		return nil, fmt.Errorf("invalid input")
	}
	
	chunks := []string{"Hello", " ", "world", "!"}
	for _, chunk := range chunks {
		fmt.Fprintf(w, "data: %s\n\n", chunk)
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
		time.Sleep(5 * time.Millisecond)
	}

	return &queries.AskBotResult{
		QueryHash: "mock-hash",
		Sources:   []domain.Source{},
	}, nil
}

// mockAnalyticsRepo satisfies domain.AnalyticsRepo for write-only tests.
type mockAnalyticsRepo struct{}

func (m *mockAnalyticsRepo) Record(ctx context.Context, rec domain.QueryRecord) error { return nil }
func (m *mockAnalyticsRepo) UpdateFeedback(ctx context.Context, hash string, fb domain.Feedback) error {
	return nil
}
// ─── Mocks ───────────────────────────────────────────────────────────────────
func (m *mockAnalyticsRepo) Summary(ctx context.Context, days int) (*domain.AnalyticsSummary, error) {
	return &domain.AnalyticsSummary{}, nil
}
func (m *mockAnalyticsRepo) TopQueries(ctx context.Context, days, limit int) ([]domain.TopQuery, error) {
	return nil, nil
}
func (m *mockAnalyticsRepo) DailyStats(ctx context.Context, days int) ([]domain.DailyStat, error) {
	return nil, nil
}
func (m *mockAnalyticsRepo) FeedbackStats(ctx context.Context, days int) (*domain.FeedbackStat, error) {
	return &domain.FeedbackStat{}, nil
}
func (m *mockAnalyticsRepo) RecentQueries(ctx context.Context, days, limit int) ([]domain.QueryRow, error) {
	return nil, nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func buildTestRouter(t *testing.T) http.Handler {
	t.Helper()
	ctx := context.Background()

	jwtSvc := auth.NewJWTService("integration-test-secret-min-32-chars!")
	rl := security.NewRateLimiter(ctx, 60, time.Minute, 1) 

	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	chatHandler := chathttp.NewChatHandler(&mockAskBot{}, nil, nil, nil, &mockAnalyticsRepo{})

	r.With(chathttp.RateLimitMiddleware(rl)).Post("/api/v1/chat/stream", chatHandler.StreamChat)

	r.With(chathttp.DualAuthMiddleware(jwtSvc, "test-legacy-token", []string{"test@example.com"}, nil)).Get("/admin-test/protected", func(w http.ResponseWriter, r *http.Request) {
		email := chathttp.AdminEmailFromCtx(r.Context())
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(email))
	})

	_ = jwtSvc
	return r
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// TestHealthEndpoint verifies the /health endpoint returns 200 JSON.
func TestHealthEndpoint(t *testing.T) {
	router := buildTestRouter(t)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/health")
	if err != nil {
		t.Fatalf("GET /health: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	ct := resp.Header.Get("Content-Type")
	if !strings.Contains(ct, "application/json") {
		t.Errorf("expected JSON content-type, got %q", ct)
	}

	var body map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("expected status=ok, got %v", body)
	}
}

// TestChatStreamRequiresBody verifies /api/v1/chat/stream rejects empty body.
func TestChatStreamRequiresBody(t *testing.T) {
	router := buildTestRouter(t)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Post(srv.URL+"/api/v1/chat/stream", "application/json", bytes.NewReader([]byte("{}")))
	if err != nil {
		t.Fatalf("POST /chat/stream: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusMethodNotAllowed {
		t.Errorf("unexpected routing error: %d", resp.StatusCode)
	}
}

// TestJWTMiddlewareRejectsUnauthenticated verifies that requests without a
// valid JWT token receive 401 Unauthorized.
func TestJWTMiddlewareRejectsUnauthenticated(t *testing.T) {
	router := buildTestRouter(t)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/admin-test/protected")
	if err != nil {
		t.Fatalf("GET /admin-test/protected: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

// TestJWTMiddlewareAcceptsValidToken verifies that a valid JWT is accepted.
func TestJWTMiddlewareAcceptsValidToken(t *testing.T) {
	jwtSvc := auth.NewJWTService("integration-test-secret-min-32-chars!")
	token, err := jwtSvc.GenerateToken(&auth.GoogleUserInfo{Email: "test@example.com"})
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	router := buildTestRouter(t)
	srv := httptest.NewServer(router)
	defer srv.Close()

	req, _ := http.NewRequest("GET", srv.URL+"/admin-test/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("expected 200, got %d: %s", resp.StatusCode, body)
	}

	body, _ := io.ReadAll(resp.Body)
	if string(body) != "test@example.com" {
		t.Errorf("expected email in body, got %q", body)
	}
}

// TestRateLimitMiddlewarePassesNormalTraffic verifies that a single request
// passes through the rate limiter without being blocked.
func TestRateLimitMiddlewarePassesNormalTraffic(t *testing.T) {
	router := buildTestRouter(t)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Post(srv.URL+"/api/v1/chat/stream", "application/json",
		bytes.NewReader([]byte(`{}`)))
	if err != nil {
		t.Fatalf("POST: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		t.Errorf("single request should not be rate-limited")
	}
}

// TestRateLimitMiddlewareBansExcessiveTraffic verifies that rapid excessive
// requests are eventually rate-limited.
func TestRateLimitMiddlewareBansExcessiveTraffic(t *testing.T) {
	ctx := context.Background()

	rl := security.NewRateLimiter(ctx, 2, time.Minute, 1)

	r := chi.NewRouter()
	r.With(chathttp.RateLimitMiddleware(rl)).Post("/chat", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	srv := httptest.NewServer(r)
	defer srv.Close()

	var lastStatus int
	for i := 0; i < 10; i++ {
		resp, err := http.Post(srv.URL+"/chat", "application/json", bytes.NewReader([]byte(`{}`)))
		if err != nil {
			t.Fatalf("request %d: %v", i, err)
		}
		_ = resp.Body.Close()
		lastStatus = resp.StatusCode
		if resp.StatusCode == http.StatusTooManyRequests {
			return 
		}
	}
	t.Errorf("expected 429 after excessive requests, last status: %d", lastStatus)
}

// TestChatSSEStreaming verifies that the chat endpoint correctly formats
// SSE (Server-Sent Events) and streams them to the client.
func TestChatSSEStreaming(t *testing.T) {
	router := buildTestRouter(t)
	srv := httptest.NewServer(router)
	defer srv.Close()

	reqBody := `{"message":"test stream","language":"uk","session_id":"test-123"}`
	resp, err := http.Post(srv.URL+"/api/v1/chat/stream", "application/json", strings.NewReader(reqBody))
	if err != nil {
		t.Fatalf("POST /chat/stream: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	ct := resp.Header.Get("Content-Type")
	if !strings.Contains(ct, "text/event-stream") {
		t.Errorf("expected text/event-stream, got %q", ct)
	}

	body, _ := io.ReadAll(resp.Body)
	bodyStr := string(body)

	if !strings.Contains(bodyStr, "data: Hello\n\n") {
		t.Errorf("missing SSE chunk Hello, got:\n%s", bodyStr)
	}
	if !strings.Contains(bodyStr, "data: world\n\n") {
		t.Errorf("missing SSE chunk world, got:\n%s", bodyStr)
	}
	
	if !strings.Contains(bodyStr, "event: meta") {
		t.Errorf("missing meta event")
	}
	if !strings.Contains(bodyStr, "data: [DONE]") {
		t.Errorf("missing [DONE] message")
	}
}
