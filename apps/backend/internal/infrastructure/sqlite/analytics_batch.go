package sqlite

import (
	"context"
	"database/sql"
	"log/slog"
	"time"

	"university-chatbot/backend/internal/domain"
)

const (
	analyticsBufferSize = 200
	analyticsBatchSize = 50
	analyticsFlushInterval = 500 * time.Millisecond
)

// BatchAnalyticsWriter wraps AnalyticsRepo with an asynchronous buffered
// write channel. Records are batched (up to 50) and flushed every 500ms
// or when the buffer is full. This prevents SQLite write contention on
// the hot chat request path.
//
// Implements domain.AnalyticsRepo — Record() is non-blocking (channel send),
// all read methods delegate directly to the underlying AnalyticsRepo.
type BatchAnalyticsWriter struct {
	repo    *AnalyticsRepo
	ch      chan domain.QueryRecord
	db      *sql.DB
}

// NewBatchAnalyticsWriter creates a writer and starts the background flush loop.
// Stops and drains remaining records when ctx is cancelled.
func NewBatchAnalyticsWriter(ctx context.Context, repo *AnalyticsRepo, db *sql.DB) *BatchAnalyticsWriter {
	w := &BatchAnalyticsWriter{
		repo: repo,
		ch:   make(chan domain.QueryRecord, analyticsBufferSize),
		db:   db,
	}
	go w.flushLoop(ctx)
	return w
}

// Record enqueues an analytics event to the batch channel.
// Non-blocking: drops the record and logs a warning if the channel is full.
func (w *BatchAnalyticsWriter) Record(_ context.Context, rec domain.QueryRecord) error {
	select {
	case w.ch <- rec:
	default:
		slog.Warn("analytics batch channel full — dropping record",
			"query_hash", rec.QueryHash)
	}
	return nil
}


// UpdateFeedback delegates directly to the underlying AnalyticsRepo.
func (w *BatchAnalyticsWriter) UpdateFeedback(ctx context.Context, queryHash string, fb domain.Feedback) error {
	return w.repo.UpdateFeedback(ctx, queryHash, fb)
}

// Summary delegates directly to the underlying AnalyticsRepo.
func (w *BatchAnalyticsWriter) Summary(ctx context.Context, days int) (*domain.AnalyticsSummary, error) {
	return w.repo.Summary(ctx, days)
}

// TopQueries delegates directly to the underlying AnalyticsRepo.
func (w *BatchAnalyticsWriter) TopQueries(ctx context.Context, days, limit int) ([]domain.TopQuery, error) {
	return w.repo.TopQueries(ctx, days, limit)
}

// DailyStats delegates directly to the underlying AnalyticsRepo.
func (w *BatchAnalyticsWriter) DailyStats(ctx context.Context, days int) ([]domain.DailyStat, error) {
	return w.repo.DailyStats(ctx, days)
}

// FeedbackStats delegates directly to the underlying AnalyticsRepo.
func (w *BatchAnalyticsWriter) FeedbackStats(ctx context.Context, days int) (*domain.FeedbackStat, error) {
	return w.repo.FeedbackStats(ctx, days)
}

// RecentQueries delegates directly to the underlying AnalyticsRepo.
func (w *BatchAnalyticsWriter) RecentQueries(ctx context.Context, days, limit int) ([]domain.QueryRow, error) {
	return w.repo.RecentQueries(ctx, days, limit)
}

// flushLoop runs in a goroutine. It collects records from the channel
// and flushes them to SQLite either on timer tick or when the buffer fills.
// On ctx cancellation, drains the remaining channel items before returning.
func (w *BatchAnalyticsWriter) flushLoop(ctx context.Context) {
	ticker := time.NewTicker(analyticsFlushInterval)
	defer ticker.Stop()

	buf := make([]domain.QueryRecord, 0, analyticsBatchSize)

	flush := func() {
		if len(buf) == 0 {
			return
		}
		if err := w.writeBatch(buf); err != nil {
			slog.Error("analytics batch write failed", "count", len(buf), "error", err)
		}
		buf = buf[:0]
	}

	for {
		select {
		case rec := <-w.ch:
			buf = append(buf, rec)
			if len(buf) >= analyticsBatchSize {
				flush()
			}

		case <-ticker.C:
			flush()

		case <-ctx.Done():
		drain:
			for {
				select {
				case rec := <-w.ch:
					buf = append(buf, rec)
				default:
					break drain
				}
			}
			flush()
			slog.Info("analytics batch writer stopped", "flushed_on_shutdown", len(buf))
			return
		}
	}
}

// writeBatch inserts a slice of analytics records inside a single transaction
// using a prepared statement for performance.
// Uses a 5-second timeout to guard against SQLite lock contention.
func (w *BatchAnalyticsWriter) writeBatch(records []domain.QueryRecord) error {
	if len(records) == 0 {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tx, err := w.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	stmt, err := tx.PrepareContext(ctx,
		`INSERT INTO queries (query_hash, query_text, language, response_ms, sources_cnt, feedback, is_blocked)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, rec := range records {
		lang := string(rec.Language)
		if lang == "" {
			lang = string(domain.LangUk)
		}
		blocked := 0
		if rec.IsBlocked {
			blocked = 1
		}
		if _, err = stmt.ExecContext(ctx, rec.QueryHash, rec.QueryText, lang,
			rec.ResponseMs, rec.SourcesCnt, int(rec.Feedback), blocked); err != nil {
			return err
		}
	}

	return tx.Commit()
}
