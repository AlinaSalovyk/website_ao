package cache

import (
	"context"
	"testing"
	"time"
)

// TestNoopCache_AlwaysMisses verifies that the NoopCache implementation:
// - Always returns an empty string for Get (no-op).
// - Accepts Set without storing anything.
// - Accepts Delete without doing anything.
// This confirms its behavior as a "do-nothing" cache suitable for environments
// where Redis is not available or desired.
func TestNoopCache_AlwaysMisses(t *testing.T) {
	c := NewNoopCache()
	ctx := context.Background()

	if err := c.Set(ctx, "key", "value", time.Minute); err != nil {
		t.Errorf("NoopCache.Set should not error: %v", err)
	}
	val, err := c.Get(ctx, "key")
	if err != nil {
		t.Errorf("NoopCache.Get should not error: %v", err)
	}
	if val != "" {
		t.Errorf("NoopCache.Get should return empty, got %q", val)
	}

	if err := c.Delete(ctx, "key"); err != nil {
		t.Errorf("NoopCache.Delete should not error: %v", err)
	}
}

// TestExtractResult verifies that extractResult can extract the string value
// from various JSON shapes where the result is stored under the key "result".
// It handles JSON objects with string, null, integer, empty string, and complex
// string values, ensuring only the string content is returned.
func TestExtractResult(t *testing.T) {
	tests := []struct {
		name     string
		body     string
		expected string
	}{
		{"string_value", `{"result":"hello world"}`, "hello world"},
		{"null_value", `{"result":null}`, ""},
		{"int_value", `{"result":1}`, "1"},
		{"empty_string", `{"result":""}`, ""},
		{"complex_string", `{"result":"key:value"}`, "key:value"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractResult(tt.body)
			if result != tt.expected {
				t.Errorf("extractResult(%q) = %q, want %q", tt.body, result, tt.expected)
			}
		})
	}
}

// TestNewCacheFromEnv_NoopFallback verifies that if both REDIS_URL and
// REDIS_TOKEN are empty, NewCacheFromEnv returns a NoopCache instance.
func TestNewCacheFromEnv_NoopFallback(t *testing.T) {
	cache := NewCacheFromEnv("", "")
	_, ok := cache.(*NoopCache)
	if !ok {
		t.Error("expected NoopCache when Redis URL is empty")
	}
}

// TestNewCacheFromEnv_RedisWhenConfigured verifies that if both REDIS_URL and
// REDIS_TOKEN are non-empty, NewCacheFromEnv returns a RedisCache instance.
func TestNewCacheFromEnv_RedisWhenConfigured(t *testing.T) {
	cache := NewCacheFromEnv("https://example.upstash.io", "test-token")
	_, ok := cache.(*RedisCache)
	if !ok {
		t.Error("expected RedisCache when URL and token are provided")
	}
}
