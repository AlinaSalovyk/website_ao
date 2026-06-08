package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"university-chatbot/backend/internal/domain"
)

// AnalyticsRepo implements domain.AnalyticsRepo using SQLite.
// Provides synchronous record/query operations on the "queries" table.
type AnalyticsRepo struct {
	db *sql.DB
}

// NewAnalyticsRepo creates a new AnalyticsRepo.
func NewAnalyticsRepo(db *sql.DB) (*AnalyticsRepo, error) {
	return &AnalyticsRepo{db: db}, nil
}

// Record inserts a single analytics event into the queries table.
func (r *AnalyticsRepo) Record(ctx context.Context, rec domain.QueryRecord) error {
	lang := string(rec.Language)
	if lang == "" {
		lang = string(domain.LangUk)
	}
	blocked := 0
	if rec.IsBlocked {
		blocked = 1
	}

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO queries (query_hash, query_text, language, response_ms, sources_cnt, feedback, is_blocked)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		rec.QueryHash, rec.QueryText, lang, rec.ResponseMs, rec.SourcesCnt, int(rec.Feedback), blocked,
	)
	return err
}

// UpdateFeedback sets the feedback value for all queries matching the given hash.
func (r *AnalyticsRepo) UpdateFeedback(ctx context.Context, queryHash string, fb domain.Feedback) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE queries SET feedback = ? WHERE query_hash = ?`,
		int(fb), queryHash,
	)
	return err
}

// Summary returns aggregate KPIs (total, blocked, feedback, avg latency)
// for all queries in the last `days` days.
func (r *AnalyticsRepo) Summary(ctx context.Context, days int) (*domain.AnalyticsSummary, error) {
	since := time.Now().AddDate(0, 0, -days).Format(time.RFC3339)

	row := r.db.QueryRowContext(ctx, `
		SELECT
			COALESCE(COUNT(*), 0),
			COALESCE(SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN feedback =  1 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN feedback = -1 THEN 1 ELSE 0 END), 0),
			AVG(response_ms)
		FROM queries
		WHERE created_at >= ?
	`, since)

	s := &domain.AnalyticsSummary{}
	var avgMs sql.NullFloat64
	if err := row.Scan(&s.TotalQueries, &s.BlockedQueries, &s.PositiveFeedback, &s.NegativeFeedback, &avgMs); err != nil {
		return nil, fmt.Errorf("sqlite: summary: %w", err)
	}
	if avgMs.Valid {
		s.AvgResponseMs = avgMs.Float64
	}
	return s, nil
}

// TopQueries returns the most frequently asked non-blocked queries
// grouped by hash. Results are ordered by count DESC, limited to `limit` rows.
// Falls back to 20 if limit <= 0.
func (r *AnalyticsRepo) TopQueries(ctx context.Context, days, limit int) ([]domain.TopQuery, error) {
	if limit <= 0 {
		limit = 20
	}
	since := time.Now().AddDate(0, 0, -days).Format(time.RFC3339)

	rows, err := r.db.QueryContext(ctx, `
		SELECT query_hash as display_name, COUNT(*) as cnt, language, MAX(created_at) as last_seen
		FROM queries
		WHERE created_at >= ? AND is_blocked = 0
		GROUP BY query_hash, language
		ORDER BY cnt DESC
		LIMIT ?
	`, since, limit)
	if err != nil {
		return nil, fmt.Errorf("sqlite: top queries: %w", err)
	}
	defer rows.Close()

	var results []domain.TopQuery
	for rows.Next() {
		var q domain.TopQuery
		if err := rows.Scan(&q.QueryText, &q.Count, &q.Language, &q.LastSeen); err != nil {
			return nil, fmt.Errorf("sqlite: scan top query: %w", err)
		}
		results = append(results, q)
	}
	return results, rows.Err()
}

// DailyStats returns per-day aggregates (total, blocked, avg_ms, feedback)
// ordered by date ASC for the last `days` days.
func (r *AnalyticsRepo) DailyStats(ctx context.Context, days int) ([]domain.DailyStat, error) {
	since := time.Now().AddDate(0, 0, -days).Format(time.RFC3339)

	rows, err := r.db.QueryContext(ctx, `
		SELECT 
			DATE(created_at) as day,
			COUNT(*) as total,
			SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked,
			AVG(response_ms) as avg_ms,
			SUM(CASE WHEN feedback = 1 THEN 1 ELSE 0 END) as pos,
			SUM(CASE WHEN feedback = -1 THEN 1 ELSE 0 END) as neg
		FROM queries
		WHERE created_at >= ?
		GROUP BY DATE(created_at)
		ORDER BY day ASC
	`, since)
	if err != nil {
		return nil, fmt.Errorf("sqlite: daily stats: %w", err)
	}
	defer rows.Close()

	var stats []domain.DailyStat
	for rows.Next() {
		var s domain.DailyStat
		var avgMs sql.NullFloat64
		if err := rows.Scan(&s.Date, &s.TotalQueries, &s.BlockedQueries, &avgMs, &s.PositiveFeedback, &s.NegativeFeedback); err != nil {
			return nil, fmt.Errorf("sqlite: scan daily stat: %w", err)
		}
		if avgMs.Valid {
			s.AvgResponseMs = avgMs.Float64
		}
		stats = append(stats, s)
	}
	return stats, rows.Err()
}

// FeedbackStats returns aggregate feedback counts using a single
// portable SUM(CASE) query (no FILTER clause — SQLite compatible).
func (r *AnalyticsRepo) FeedbackStats(ctx context.Context, days int) (*domain.FeedbackStat, error) {
	since := time.Now().AddDate(0, 0, -days).Format(time.RFC3339)

	row := r.db.QueryRowContext(ctx, `
		SELECT
			SUM(CASE WHEN feedback != 0 THEN 1 ELSE 0 END) as total,
			SUM(CASE WHEN feedback = 1 THEN 1 ELSE 0 END) as pos,
			SUM(CASE WHEN feedback = -1 THEN 1 ELSE 0 END) as neg
		FROM queries
		WHERE created_at >= ?
	`, since)

	fs := &domain.FeedbackStat{}
	if err := row.Scan(&fs.Total, &fs.Positive, &fs.Negative); err != nil {
		return nil, fmt.Errorf("sqlite: feedback stats: %w", err)
	}

	if fs.Total > 0 {
		fs.Ratio = float64(fs.Positive) / float64(fs.Total)
	}
	return fs, nil
}

// RecentQueries returns the most recent queries (newest first) with full metadata.
// Replaces blank query_text with the placeholder "[Текст не збережено]" for display.
// Falls back to limit=50 if limit <= 0.
func (r *AnalyticsRepo) RecentQueries(ctx context.Context, days, limit int) ([]domain.QueryRow, error) {
	if limit <= 0 {
		limit = 50
	}
	since := time.Now().AddDate(0, 0, -days).Format(time.RFC3339)

	rows, err := r.db.QueryContext(ctx, `
		SELECT query_hash, COALESCE(NULLIF(query_text, ''), '[Текст не збережено]') as query_text, language, response_ms, sources_cnt, feedback, is_blocked, created_at
		FROM queries
		WHERE created_at >= ?
		ORDER BY created_at DESC
		LIMIT ?
	`, since, limit)
	if err != nil {
		return nil, fmt.Errorf("sqlite: recent queries: %w", err)
	}
	defer rows.Close()

	var results []domain.QueryRow
	for rows.Next() {
		var q domain.QueryRow
		if err := rows.Scan(&q.QueryHash, &q.QueryText, &q.Language, &q.ResponseMs, &q.SourcesCnt, &q.Feedback, &q.IsBlocked, &q.CreatedAt); err != nil {
			return nil, fmt.Errorf("sqlite: scan query row: %w", err)
		}
		results = append(results, q)
	}
	return results, rows.Err()
}
