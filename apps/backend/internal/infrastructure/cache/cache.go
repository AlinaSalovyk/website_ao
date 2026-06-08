// Package cache implements domain.CacheStore using Upstash Redis REST API.
// Falls back to NoopCache when Redis credentials are not configured.
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// RedisCache implements domain.CacheStore using the Upstash Redis REST API.
// All commands are translated to GET requests against the REST endpoint.
type RedisCache struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

// NewRedisCache creates a RedisCache with a 5-second HTTP timeout.
func NewRedisCache(restURL, restToken string) *RedisCache {
	return &RedisCache{
		baseURL: strings.TrimRight(restURL, "/"),
		token:   restToken,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// Get retrieves a value by key. Returns "" (no error) on cache miss or null result.
func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
	body, err := c.command(ctx, "GET", key)
	if err != nil {
		return "", err
	}
	if body == "" || body == "null" {
		return "", nil
	}
	return body, nil
}

// Set stores a value with an optional TTL (uses Redis EX flag when ttl > 0).
func (c *RedisCache) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	if ttl > 0 {
		_, err := c.command(ctx, "SET", key, value, "EX", fmt.Sprintf("%d", int(ttl.Seconds())))
		return err
	}
	_, err := c.command(ctx, "SET", key, value)
	return err
}

// Delete removes a key using the Redis DEL command.
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	_, err := c.command(ctx, "DEL", key)
	return err
}

// command builds a REST URL from Redis command args, executes a GET request,
// and returns the unwrapped result value.
func (c *RedisCache) command(ctx context.Context, args ...string) (string, error) {
	parts := make([]string, len(args))
	for i, arg := range args {
		parts[i] = url.PathEscape(arg)
	}
	endpoint := c.baseURL + "/" + strings.Join(parts, "/")

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return "", fmt.Errorf("redis: create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("redis: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("redis: status %d: %s", resp.StatusCode, string(body))
	}

	result := extractResult(string(body))
	return result, nil
}

// extractResult unwraps the Upstash REST API {"result": ...} envelope.
// Handles null, quoted strings, and raw JSON values.
func extractResult(body string) string {
	var envelope struct {
		Result *json.RawMessage `json:"result"`
	}
	if err := json.Unmarshal([]byte(body), &envelope); err != nil || envelope.Result == nil {
		return ""
	}

	raw := string(*envelope.Result)

	if raw == "null" {
		return ""
	}
	if len(raw) >= 2 && raw[0] == '"' {
		var s string
		if err := json.Unmarshal([]byte(raw), &s); err == nil {
			return s
		}
	}

	return raw
}

// NoopCache is a no-op CacheStore used when Redis is not configured.
// All operations succeed instantly without storing anything.
type NoopCache struct{}

// NewNoopCache returns a new NoopCache.
func NewNoopCache() *NoopCache { return &NoopCache{} }

func (c *NoopCache) Get(_ context.Context, _ string) (string, error)                 { return "", nil }
func (c *NoopCache) Set(_ context.Context, _, _ string, _ time.Duration) error        { return nil }
func (c *NoopCache) Delete(_ context.Context, _ string) error                          { return nil }

// NewCacheFromEnv returns a RedisCache if credentials are provided,
// otherwise falls back to NoopCache and logs a warning.
func NewCacheFromEnv(redisURL, redisToken string) interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
} {
	if redisURL == "" || redisToken == "" {
		slog.Info("Redis not configured, using NoopCache (no caching)")
		return NewNoopCache()
	}
	slog.Info("Connecting to Upstash Redis", "url", redisURL)
	return NewRedisCache(redisURL, redisToken)
}
