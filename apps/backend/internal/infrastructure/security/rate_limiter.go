package security

import (
	"context"
	"sync"
	"time"
)


// window holds the sliding-window request timestamps and ban state for one IP.
type window struct {
	mu       sync.Mutex
	ts       []time.Time // Timestamps of requests within the current window.
	banUntil time.Time   // Time until which the IP is banned (zero = not banned).
}

// RateLimiter implements a per-IP sliding window rate limiter with auto-ban.
// When a client exceeds the limit, it is temporarily banned for banDuration.
// Stale entries are cleaned up periodically via a background goroutine.
type RateLimiter struct {
	windows     sync.Map      // map[string]*window
	limit       int           // Maximum requests per period.
	period      time.Duration // Sliding window size.
	penaltyMult int           // Weight multiplier for penalized requests.
	banDuration time.Duration // Duration of auto-ban after limit exceeded.
}


// NewRateLimiter creates a rate limiter and starts a background cleanup goroutine.
// Stops when ctx is cancelled.
func NewRateLimiter(ctx context.Context, limit int, period time.Duration, penaltyMult int) *RateLimiter {
	rl := &RateLimiter{
		limit:       limit,
		period:      period,
		penaltyMult: penaltyMult,
		banDuration: period,
	}

	go rl.cleanupLoop(ctx)
	return rl
}

// Allow checks if a request from the given IP is allowed under the rate limit.
// Returns (allowed, retryAfter). Weight controls how many slots are consumed.
func (rl *RateLimiter) Allow(ip string, weight int) (bool, time.Duration) {
	raw, _ := rl.windows.LoadOrStore(ip, &window{})
	w := raw.(*window)
	w.mu.Lock()
	defer w.mu.Unlock()

	now := time.Now()

	if now.Before(w.banUntil) {
		return false, time.Until(w.banUntil)
	}

	cutoff := now.Add(-rl.period)

	filtered := w.ts[:0]
	for _, t := range w.ts {
		if t.After(cutoff) {
			filtered = append(filtered, t)
		}
	}
	w.ts = filtered

	if len(w.ts) >= rl.limit {
		retryAt := w.ts[0].Add(rl.period)
		return false, time.Until(retryAt)
	}

	for i := 0; i < weight; i++ {
		w.ts = append(w.ts, now)
	}
	if len(w.ts) > rl.limit {
		w.banUntil = now.Add(rl.banDuration)
		return false, rl.banDuration
	}

	return true, 0
}

// Ban immediately bans an IP for banDuration. Used when off-topic queries are detected.
func (rl *RateLimiter) Ban(ip string) {
	raw, _ := rl.windows.LoadOrStore(ip, &window{})
	w := raw.(*window)
	w.mu.Lock()
	defer w.mu.Unlock()
	w.banUntil = time.Now().Add(rl.banDuration)
}

// cleanupLoop removes stale window entries every period tick.
// An entry is stale if all its timestamps are outside the window and the ban has expired.
func (rl *RateLimiter) cleanupLoop(ctx context.Context) {
	ticker := time.NewTicker(rl.period)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			cutoff := time.Now().Add(-rl.period)
			rl.windows.Range(func(k, v any) bool {
				w := v.(*window)
				w.mu.Lock()
				stale := len(w.ts) == 0 && time.Now().After(w.banUntil)
				for _, t := range w.ts {
					if t.After(cutoff) {
						stale = false
						break
					}
				}
				w.mu.Unlock()
				if stale {
					rl.windows.Delete(k)
				}
				return true
			})
		}
	}
}
