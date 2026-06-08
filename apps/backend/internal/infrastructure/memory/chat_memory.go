// Package memory provides an in-process implementation of domain.ConversationMemory.
// Sessions are stored in a sync.Map with automatic TTL-based eviction.
package memory

import (
	"context"
	"sync"
	"time"

	"university-chatbot/backend/internal/domain"
)

// ChatMemory stores conversation histories keyed by session ID.
// Each session holds up to 50 messages and is evicted after ttl of inactivity.
type ChatMemory struct {
	sessions sync.Map  // map[string]*sessionData
	ttl      time.Duration
}

// sessionData holds the conversation history and last-access time for one session.
type sessionData struct {
	mu       sync.Mutex
	History  []domain.Message
	LastSeen time.Time
}
// NewChatMemory creates a ChatMemory and starts a background goroutine
// that evicts stale sessions every 10 minutes. Stops when ctx is cancelled.
func NewChatMemory(ctx context.Context, ttl time.Duration) *ChatMemory {
	cm := &ChatMemory{
		ttl: ttl,
	}

	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				cm.cleanup()
			}
		}
	}()

	return cm
}

// GetHistory returns the last `limit` messages for the session, touching LastSeen.
// Returns nil (no error) for unknown or empty session IDs.
func (m *ChatMemory) GetHistory(ctx context.Context, sessionID string, limit int) ([]domain.Message, error) {
	if sessionID == "" {
		return nil, nil
	}

	val, ok := m.sessions.Load(sessionID)
	if !ok {
		return nil, nil
	}

	data := val.(*sessionData)
	data.mu.Lock()
	defer data.mu.Unlock()

	data.LastSeen = time.Now()

	hist := data.History
	if len(hist) > limit {
		hist = hist[len(hist)-limit:]
	}

	copied := make([]domain.Message, len(hist))
	copy(copied, hist)
	return copied, nil
}

// AddMessage appends a message to the session history (cap 50).
// No-ops silently for empty session IDs.
func (m *ChatMemory) AddMessage(ctx context.Context, sessionID string, msg domain.Message) error {
	if sessionID == "" {
		return nil
	}

	val, _ := m.sessions.LoadOrStore(sessionID, &sessionData{
		History:  make([]domain.Message, 0),
		LastSeen: time.Now(),
	})

	data := val.(*sessionData)
	
	data.mu.Lock()
	defer data.mu.Unlock()

	hist := append(data.History, msg)
	if len(hist) > 50 {
		hist = hist[len(hist)-50:]
	}
	data.History = hist
	data.LastSeen = time.Now()

	return nil
}

// cleanup removes sessions that have been idle longer than m.ttl.
func (m *ChatMemory) cleanup() {
	now := time.Now()
	m.sessions.Range(func(key, value interface{}) bool {
		data := value.(*sessionData)
		if now.Sub(data.LastSeen) > m.ttl {
			m.sessions.Delete(key)
		}
		return true
	})
}
