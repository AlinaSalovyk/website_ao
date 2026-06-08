package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"university-chatbot/backend/internal/domain"
)

// ErrJobNotFound is returned when a job ID does not exist in the upload_jobs table.
var ErrJobNotFound = errors.New("job not found")

// JobRepository manages the "upload_jobs" table which tracks the progress
// of asynchronous document indexing pipelines.
type JobRepository struct {
	db *sql.DB
}

// NewJobRepository creates a new JobRepository backed by the given SQLite connection.
func NewJobRepository(db *sql.DB) *JobRepository {
	return &JobRepository{db: db}
}

// CreateJob inserts a new upload job. Sets both CreatedAt and UpdatedAt to UTC now.
// Returns a wrapped error on failure.
func (r *JobRepository) CreateJob(ctx context.Context, job *domain.UploadJob) error {
	query := `INSERT INTO upload_jobs (id, filename, status, error, progress, current_step, chunks_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	now := time.Now().UTC()
	job.CreatedAt = now
	job.UpdatedAt = now

	_, err := r.db.ExecContext(ctx, query, job.ID, job.Filename, job.Status, job.Error,
		job.Progress, job.CurrentStep, job.ChunksCount, job.CreatedAt, job.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create job: %w", err)
	}
	return nil
}

// UpsertJob inserts or replaces an upload job record.
// Used when re-indexing an existing document (the job ID already exists).
func (r *JobRepository) UpsertJob(ctx context.Context, job *domain.UploadJob) error {
	query := `INSERT OR REPLACE INTO upload_jobs (id, filename, status, error, progress, current_step, chunks_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	now := time.Now().UTC()
	job.CreatedAt = now
	job.UpdatedAt = now

	_, err := r.db.ExecContext(ctx, query, job.ID, job.Filename, job.Status, job.Error,
		job.Progress, job.CurrentStep, job.ChunksCount, job.CreatedAt, job.UpdatedAt)
	if err != nil {
		return fmt.Errorf("upsert job: %w", err)
	}
	return nil
}

// UpdateJobStatus sets the job's status and optional error message.
// Automatically sets progress=100 when status==JobStatusCompleted.
// Returns ErrJobNotFound if no row matched.
func (r *JobRepository) UpdateJobStatus(ctx context.Context, id string, status domain.JobStatus, jobErr error) error {
	var errStr *string
	if jobErr != nil {
		s := jobErr.Error()
		errStr = &s
	}

	progress := 0
	if status == domain.JobStatusCompleted {
		progress = 100
	}

	query := `UPDATE upload_jobs SET status = ?, error = ?, progress = CASE WHEN ? > 0 THEN ? ELSE progress END, updated_at = ? WHERE id = ?`
	now := time.Now().UTC()

	res, err := r.db.ExecContext(ctx, query, status, errStr, progress, progress, now, id)
	if err != nil {
		return fmt.Errorf("update job: %w", err)
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrJobNotFound
	}
	return nil
}

// UpdateProgress sets the progress percentage (0–100) and the human-readable
// current_step description. Returns ErrJobNotFound if no row matched.
func (r *JobRepository) UpdateProgress(ctx context.Context, id string, progress int, step string) error {
	query := `UPDATE upload_jobs SET progress = ?, current_step = ?, updated_at = ? WHERE id = ?`
	now := time.Now().UTC()

	res, err := r.db.ExecContext(ctx, query, progress, step, now, id)
	if err != nil {
		return fmt.Errorf("update progress: %w", err)
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrJobNotFound
	}
	return nil
}

// UpdateChunksCount updates the chunks_count column for a job.
func (r *JobRepository) UpdateChunksCount(ctx context.Context, id string, count int) error {
	query := `UPDATE upload_jobs SET chunks_count = ?, updated_at = ? WHERE id = ?`
	now := time.Now().UTC()

	_, err := r.db.ExecContext(ctx, query, count, now, id)
	return err
}

// GetJob retrieves an upload job by ID.
// Returns ErrJobNotFound if the job does not exist.
func (r *JobRepository) GetJob(ctx context.Context, id string) (*domain.UploadJob, error) {
	query := `SELECT filename, status, error, progress, current_step, chunks_count, created_at, updated_at FROM upload_jobs WHERE id = ?`

	var job domain.UploadJob
	job.ID = id
	var errStr sql.NullString

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&job.Filename,
		&job.Status,
		&errStr,
		&job.Progress,
		&job.CurrentStep,
		&job.ChunksCount,
		&job.CreatedAt,
		&job.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrJobNotFound
	} else if err != nil {
		return nil, fmt.Errorf("get job: %w", err)
	}

	if errStr.Valid {
		job.Error = errStr.String
	}

	return &job, nil
}
