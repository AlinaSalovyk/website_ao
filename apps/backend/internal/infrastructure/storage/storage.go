// Package storage defines provider-independent media storage abstractions
// and canonical public URL resolvers for the News module.
package storage

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var (
	ErrPresignNotSupported = errors.New("presigned upload URLs are only supported in s3 storage mode")
	ErrObjectNotFound      = errors.New("storage object not found")
)

// MediaStorage defines the contract for persisting media assets to binary storage.
// Decoupled from public URL resolution and HTTP routing concerns.
type MediaStorage interface {
	// Put writes data to the given storage key.
	Put(ctx context.Context, key string, data []byte, contentType string) error

	// Delete removes the object at the given storage key. Idempotent.
	Delete(ctx context.Context, key string) error

	// Exists checks if an object with the given storage key exists in storage.
	Exists(ctx context.Context, key string) (bool, error)

	// PresignPut generates a short-lived presigned URL for direct S3 client upload.
	PresignPut(ctx context.Context, key string, contentType string, ttl time.Duration) (string, error)
}

// MediaURLResolver defines the contract for transforming storage keys into browser-accessible URLs.
type MediaURLResolver interface {
	// Resolve converts a storage key (or legacy path) to a browser-accessible public URL.
	Resolve(key string) string
}

// NewFromEnv initializes MediaStorage and MediaURLResolver based on environment variables.
//
// Driver configuration:
//   MEDIA_STORAGE_DRIVER=local (default)
//   MEDIA_STORAGE_DRIVER=r2 or s3
//
// Environment variables for R2/S3 driver:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT, R2_PUBLIC_BASE_URL
//   (Fallbacks: S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION, MEDIA_PUBLIC_BASE_URL)
func NewFromEnv(defaultBaseDir string) (MediaStorage, MediaURLResolver, error) {
	driver := strings.ToLower(strings.TrimSpace(os.Getenv("MEDIA_STORAGE_DRIVER")))

	if driver == "s3" || driver == "r2" {
		endpoint := getFirstEnv("R2_ENDPOINT", "S3_ENDPOINT")
		accountID := getFirstEnv("R2_ACCOUNT_ID")
		if strings.Contains(endpoint, "<account_id>") && accountID != "" {
			endpoint = strings.ReplaceAll(endpoint, "<account_id>", accountID)
		} else if endpoint == "" && accountID != "" {
			endpoint = fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)
		}

		accessKeyID := getFirstEnv("R2_ACCESS_KEY_ID", "S3_ACCESS_KEY_ID")
		secretAccessKey := getFirstEnv("R2_SECRET_ACCESS_KEY", "S3_SECRET_ACCESS_KEY")
		bucket := getFirstEnv("R2_BUCKET_NAME", "R2_BUCKET", "S3_BUCKET")
		region := getFirstEnv("R2_REGION", "S3_REGION")
		if region == "" {
			region = "auto"
		}
		publicBaseURL := getFirstEnv("R2_PUBLIC_BASE_URL", "MEDIA_PUBLIC_BASE_URL", "S3_PUBLIC_BASE_URL")

		cfg := S3Config{
			Endpoint:        endpoint,
			AccessKeyID:     accessKeyID,
			SecretAccessKey: secretAccessKey,
			Bucket:          bucket,
			Region:          region,
			PublicBaseURL:   publicBaseURL,
		}
		store, err := NewS3Storage(cfg)
		if err != nil {
			return nil, nil, fmt.Errorf("storage: init %s driver: %w", driver, err)
		}
		resolver := NewMediaURLResolver(publicBaseURL)
		return store, resolver, nil
	}

	// Default: local driver
	store, err := NewLocalStorage(defaultBaseDir)
	if err != nil {
		return nil, nil, fmt.Errorf("storage: init local driver: %w", err)
	}
	publicBaseURL := getFirstEnv("MEDIA_PUBLIC_BASE_URL", "PUBLIC_API_URL")
	resolver := NewMediaURLResolver(publicBaseURL)
	return store, resolver, nil
}

func getFirstEnv(keys ...string) string {
	for _, k := range keys {
		if v := strings.TrimSpace(os.Getenv(k)); v != "" {
			return v
		}
	}
	return ""
}

// ─── LocalStorage ─────────────────────────────────────────────────────────────

// LocalStorage implements MediaStorage using the local filesystem.
type LocalStorage struct {
	baseDir string // Absolute path on disk where files are stored.
}

// NewLocalStorage creates a LocalStorage rooted at baseDir.
func NewLocalStorage(baseDir string) (*LocalStorage, error) {
	abs, err := filepath.Abs(baseDir)
	if err != nil {
		return nil, fmt.Errorf("storage: resolve base dir: %w", err)
	}
	if err := os.MkdirAll(abs, 0o755); err != nil {
		return nil, fmt.Errorf("storage: create base dir %s: %w", abs, err)
	}
	return &LocalStorage{baseDir: abs}, nil
}

// BaseDir returns the root base directory on disk.
func (s *LocalStorage) BaseDir() string {
	return s.baseDir
}

// Put writes data to baseDir/key, creating parent directories as needed.
func (s *LocalStorage) Put(_ context.Context, key string, data []byte, _ string) error {
	cleanKey := strings.TrimPrefix(filepath.ToSlash(key), "/")
	target := filepath.Join(s.baseDir, filepath.FromSlash(cleanKey))

	if !isUnder(s.baseDir, target) {
		return fmt.Errorf("storage: path traversal rejected: %q", key)
	}

	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return fmt.Errorf("storage: mkdir for %q: %w", key, err)
	}
	if err := os.WriteFile(target, data, 0o644); err != nil {
		return fmt.Errorf("storage: write %q: %w", key, err)
	}
	return nil
}

// Delete removes the file at baseDir/key. Idempotent.
func (s *LocalStorage) Delete(_ context.Context, key string) error {
	cleanKey := strings.TrimPrefix(filepath.ToSlash(key), "/")
	target := filepath.Join(s.baseDir, filepath.FromSlash(cleanKey))
	if !isUnder(s.baseDir, target) {
		return fmt.Errorf("storage: path traversal rejected: %q", key)
	}
	err := os.Remove(target)
	if os.IsNotExist(err) {
		return nil
	}
	return err
}

// Exists checks if baseDir/key exists.
func (s *LocalStorage) Exists(_ context.Context, key string) (bool, error) {
	cleanKey := strings.TrimPrefix(filepath.ToSlash(key), "/")
	target := filepath.Join(s.baseDir, filepath.FromSlash(cleanKey))
	if !isUnder(s.baseDir, target) {
		return false, fmt.Errorf("storage: path traversal rejected: %q", key)
	}
	_, err := os.Stat(target)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

// PresignPut returns ErrPresignNotSupported for LocalStorage.
func (s *LocalStorage) PresignPut(_ context.Context, _ string, _ string, _ time.Duration) (string, error) {
	return "", ErrPresignNotSupported
}

// ─── DefaultMediaURLResolver ──────────────────────────────────────────────────

// DefaultMediaURLResolver resolves storage keys to public URLs.
type DefaultMediaURLResolver struct {
	publicBaseURL string
}

// NewMediaURLResolver constructs a MediaURLResolver given a public base URL.
func NewMediaURLResolver(publicBaseURL string) *DefaultMediaURLResolver {
	baseURL := strings.TrimSuffix(strings.TrimSpace(publicBaseURL), "/")
	return &DefaultMediaURLResolver{publicBaseURL: baseURL}
}

// Resolve converts a storage key (or legacy URL/path) into a canonical browser public URL.
func (r *DefaultMediaURLResolver) Resolve(key string) string {
	if key == "" {
		return ""
	}
	// Pass through blob: and external https?:// URLs if already resolved.
	if strings.HasPrefix(key, "blob:") || strings.HasPrefix(key, "http://") || strings.HasPrefix(key, "https://") {
		// If it's a legacy localhost URL, replace base if needed
		return key
	}

	cleanKey := strings.TrimPrefix(key, "/")
	if r.publicBaseURL != "" {
		return fmt.Sprintf("%s/%s", r.publicBaseURL, cleanKey)
	}
	return "/" + cleanKey
}

// isUnder reports whether target is within or equal to base after cleaning both paths.
func isUnder(base, target string) bool {
	base = filepath.Clean(base) + string(filepath.Separator)
	return len(target) >= len(base) && target[:len(base)] == base ||
		filepath.Clean(target) == filepath.Clean(base)
}
