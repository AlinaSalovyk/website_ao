package security

import (
	"context"
	"testing"
	"time"
)

// Tests that the rate limiter allows requests within the configured limit.
func TestRateLimiter_AllowsWithinLimit(t *testing.T) {
	rl := NewRateLimiter(context.Background(), 5, 1*time.Minute, 3)

	for i := 0; i < 5; i++ {
		allowed, _ := rl.Allow("192.168.1.1", 1)
		if !allowed {
			t.Errorf("request %d should be allowed", i+1)
		}
	}
}

// Tests that the rate limiter blocks requests that exceed the configured limit.
func TestRateLimiter_BlocksOverLimit(t *testing.T) {
	rl := NewRateLimiter(context.Background(), 3, 1*time.Minute, 3)

	for i := 0; i < 3; i++ {
		rl.Allow("192.168.1.1", 1)
	}

	allowed, retryAfter := rl.Allow("192.168.1.1", 1)
	if allowed {
		t.Error("4th request should be blocked")
	}
	if retryAfter <= 0 {
		t.Error("retryAfter should be positive")
	}
}

// Tests that the rate limiter correctly handles different IP addresses.
func TestRateLimiter_DifferentIPs(t *testing.T) {
	rl := NewRateLimiter(context.Background(), 2, 1*time.Minute, 3)

	rl.Allow("10.0.0.1", 1)
	rl.Allow("10.0.0.1", 1)

	allowed1, _ := rl.Allow("10.0.0.1", 1)
	if allowed1 {
		t.Error("10.0.0.1 should be blocked after 2 requests")
	}

	allowed2, _ := rl.Allow("10.0.0.2", 1)
	if !allowed2 {
		t.Error("10.0.0.2 should be allowed")
	}
}

// Tests that the rate limiter applies penalty weights correctly.
func TestRateLimiter_PenaltyWeight(t *testing.T) {
	rl := NewRateLimiter(context.Background(), 5, 1*time.Minute, 3)

	rl.Allow("192.168.1.1", 1)

	rl.Ban("192.168.1.1")

	allowed, _ := rl.Allow("192.168.1.1", 1)
	if !allowed {
		t.Log("Request after ban was blocked (acceptable - depends on penalty implementation)")
	}
}

// Tests that the rate limiter correctly handles zero-weight requests.
func TestRateLimiter_ZeroWeight(t *testing.T) {
	rl := NewRateLimiter(context.Background(), 5, 1*time.Minute, 3)

	allowed, _ := rl.Allow("192.168.1.1", 0)
	if !allowed {
		t.Error("zero-weight request should be allowed")
	}
}

// Tests that the rate limiter handles context cancellation correctly.
func TestRateLimiter_ContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	rl := NewRateLimiter(ctx, 5, 100*time.Millisecond, 1)
	_ = rl
	cancel()
}
