package storage_test

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/joho/godotenv"

	"university-chatbot/backend/internal/infrastructure/storage"
)

type mockS3Client struct {
	putFunc    func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	deleteFunc func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	headFunc   func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error)
}

func (m *mockS3Client) PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	if m.putFunc != nil {
		return m.putFunc(ctx, params, optFns...)
	}
	return &s3.PutObjectOutput{}, nil
}

func (m *mockS3Client) DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, params, optFns...)
	}
	return &s3.DeleteObjectOutput{}, nil
}

func (m *mockS3Client) HeadObject(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
	if m.headFunc != nil {
		return m.headFunc(ctx, params, optFns...)
	}
	return &s3.HeadObjectOutput{}, nil
}

type mockPresignClient struct {
	presignPutFunc func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

func (m *mockPresignClient) PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
	if m.presignPutFunc != nil {
		return m.presignPutFunc(ctx, params, optFns...)
	}
	return &v4.PresignedHTTPRequest{URL: "https://r2.test/my-bucket/key?signed=true"}, nil
}

func TestLocalStorage_Lifecycle(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "storage_test_*")
	if err != nil {
		t.Fatalf("create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	store, err := storage.NewLocalStorage(tempDir)
	if err != nil {
		t.Fatalf("NewLocalStorage: %v", err)
	}

	ctx := context.Background()
	key := "news/articles/art-123/cover/test.webp"
	content := []byte("fake-webp-bytes")

	if err := store.Put(ctx, key, content, "image/webp"); err != nil {
		t.Fatalf("Put: %v", err)
	}

	exists, err := store.Exists(ctx, key)
	if err != nil || !exists {
		t.Errorf("Exists: got (%v, %v), want (true, nil)", exists, err)
	}

	onDiskPath := filepath.Join(tempDir, "news", "articles", "art-123", "cover", "test.webp")
	readData, err := os.ReadFile(onDiskPath)
	if err != nil || string(readData) != string(content) {
		t.Errorf("ReadFile on disk: got (%q, %v), want %q", string(readData), err, string(content))
	}

	if err := store.Delete(ctx, key); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	existsAfter, err := store.Exists(ctx, key)
	if err != nil || existsAfter {
		t.Errorf("Exists after delete: got (%v, %v), want (false, nil)", existsAfter, err)
	}
}

func TestLocalStorage_PathTraversalRejection(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "storage_test_*")
	if err != nil {
		t.Fatalf("create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	store, err := storage.NewLocalStorage(tempDir)
	if err != nil {
		t.Fatalf("NewLocalStorage: %v", err)
	}

	ctx := context.Background()
	maliciousKey := "../../etc/passwd"

	err = store.Put(ctx, maliciousKey, []byte("hack"), "text/plain")
	if err == nil || !strings.Contains(err.Error(), "path traversal rejected") {
		t.Errorf("Put traversal: expected path traversal error, got %v", err)
	}

	err = store.Delete(ctx, maliciousKey)
	if err == nil || !strings.Contains(err.Error(), "path traversal rejected") {
		t.Errorf("Delete traversal: expected path traversal error, got %v", err)
	}
}

func TestS3Storage_AWSSDKv2_Operations(t *testing.T) {
	cfg := storage.S3Config{
		Endpoint:        "https://r2-test.cloudflarestorage.com",
		AccessKeyID:     "test-access-key",
		SecretAccessKey: "test-secret-key",
		Bucket:          "my-news-bucket",
		Region:          "auto",
		PublicBaseURL:   "https://media.example.com",
	}

	var putCapturedInput *s3.PutObjectInput
	var deleteCapturedInput *s3.DeleteObjectInput
	var headCapturedInput *s3.HeadObjectInput

	client := &mockS3Client{
		putFunc: func(_ context.Context, params *s3.PutObjectInput, _ ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
			putCapturedInput = params
			return &s3.PutObjectOutput{}, nil
		},
		deleteFunc: func(_ context.Context, params *s3.DeleteObjectInput, _ ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
			deleteCapturedInput = params
			return &s3.DeleteObjectOutput{}, nil
		},
		headFunc: func(_ context.Context, params *s3.HeadObjectInput, _ ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
			headCapturedInput = params
			if aws.ToString(params.Key) == "news/articles/456/notfound.webp" {
				return nil, &types.NotFound{Message: aws.String("not found")}
			}
			return &s3.HeadObjectOutput{}, nil
		},
	}

	presigner := &mockPresignClient{
		presignPutFunc: func(_ context.Context, params *s3.PutObjectInput, _ ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
			return &v4.PresignedHTTPRequest{
				URL: "https://r2-test.cloudflarestorage.com/my-news-bucket/" + aws.ToString(params.Key) + "?X-Amz-Signature=fake",
			}, nil
		},
	}

	store, err := storage.NewS3StorageWithClients(cfg, client, presigner)
	if err != nil {
		t.Fatalf("NewS3StorageWithClients: %v", err)
	}

	ctx := context.Background()

	// 1. Test Put
	key := "news/articles/456/cover/uuid.webp"
	if err := store.Put(ctx, key, []byte("test-data"), "image/webp"); err != nil {
		t.Fatalf("S3 Put: %v", err)
	}
	if aws.ToString(putCapturedInput.Bucket) != "my-news-bucket" {
		t.Errorf("Put bucket: got %s, want my-news-bucket", aws.ToString(putCapturedInput.Bucket))
	}
	if aws.ToString(putCapturedInput.Key) != key {
		t.Errorf("Put key: got %s, want %s", aws.ToString(putCapturedInput.Key), key)
	}
	if aws.ToString(putCapturedInput.CacheControl) != "public, max-age=31536000, immutable" {
		t.Errorf("Put CacheControl: got %s", aws.ToString(putCapturedInput.CacheControl))
	}

	// 2. Test Exists (Found)
	exists, err := store.Exists(ctx, key)
	if err != nil || !exists {
		t.Errorf("S3 Exists: got (%v, %v), want (true, nil)", exists, err)
	}
	if aws.ToString(headCapturedInput.Key) != key {
		t.Errorf("Head key: got %s, want %s", aws.ToString(headCapturedInput.Key), key)
	}

	// 3. Test Exists (Not Found)
	notFoundKey := "news/articles/456/notfound.webp"
	existsNF, err := store.Exists(ctx, notFoundKey)
	if err != nil || existsNF {
		t.Errorf("S3 Exists Not Found: got (%v, %v), want (false, nil)", existsNF, err)
	}

	// 4. Test Delete
	if err := store.Delete(ctx, key); err != nil {
		t.Fatalf("S3 Delete: %v", err)
	}
	if aws.ToString(deleteCapturedInput.Key) != key {
		t.Errorf("Delete key: got %s, want %s", aws.ToString(deleteCapturedInput.Key), key)
	}

	// 5. Test PresignPut
	videoKey := "news/articles/456/video/uuid.mp4"
	pURL, err := store.PresignPut(ctx, videoKey, "video/mp4", 15*time.Minute)
	if err != nil {
		t.Fatalf("S3 PresignPut: %v", err)
	}
	if !strings.Contains(pURL, videoKey) {
		t.Errorf("PresignPut URL missing key: %s", pURL)
	}

	// 6. Path Traversal Rejection
	badKey := "../../secret/file"
	if err := store.Put(ctx, badKey, []byte("x"), "text/plain"); err == nil {
		t.Errorf("S3 Put traversal: expected error, got nil")
	}
}

func TestMediaURLResolver(t *testing.T) {
	resolver := storage.NewMediaURLResolver("https://media.example.com")

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Canonical storage key",
			input:    "news/articles/123/cover/image.webp",
			expected: "https://media.example.com/news/articles/123/cover/image.webp",
		},
		{
			name:     "Legacy path relative",
			input:    "/news-images/cover.webp",
			expected: "https://media.example.com/news-images/cover.webp",
		},
		{
			name:     "Already absolute HTTPS URL",
			input:    "https://cdn.example.com/news-images/cover.webp",
			expected: "https://cdn.example.com/news-images/cover.webp",
		},
		{
			name:     "Empty input",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := resolver.Resolve(tt.input)
			if got != tt.expected {
				t.Errorf("Resolve(%q) = %q; want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestNewFromEnv_Drivers(t *testing.T) {
	tempDir, _ := os.MkdirTemp("", "factory_test_*")
	defer os.RemoveAll(tempDir)

	os.Unsetenv("MEDIA_STORAGE_DRIVER")
	store, resolver, err := storage.NewFromEnv(tempDir)
	if err != nil {
		t.Fatalf("NewFromEnv local: %v", err)
	}
	if store == nil || resolver == nil {
		t.Fatal("NewFromEnv local returned nil store or resolver")
	}

	os.Setenv("MEDIA_STORAGE_DRIVER", "s3")
	os.Setenv("S3_ENDPOINT", "https://r2.test")
	os.Setenv("S3_ACCESS_KEY_ID", "key")
	os.Setenv("S3_SECRET_ACCESS_KEY", "secret")
	os.Setenv("S3_BUCKET", "bucket")
	os.Setenv("MEDIA_PUBLIC_BASE_URL", "https://media.test")

	s3Store, s3Resolver, err := storage.NewFromEnv(tempDir)
	if err != nil {
		t.Fatalf("NewFromEnv s3: %v", err)
	}
	if s3Store == nil || s3Resolver == nil {
		t.Fatal("NewFromEnv s3 returned nil store or resolver")
	}

	resURL := s3Resolver.Resolve("news/test.webp")
	if resURL != "https://media.test/news/test.webp" {
		t.Errorf("S3 resolver url: got %q, want https://media.test/news/test.webp", resURL)
	}

	os.Unsetenv("MEDIA_STORAGE_DRIVER")
	os.Unsetenv("S3_ENDPOINT")
	os.Unsetenv("S3_ACCESS_KEY_ID")
	os.Unsetenv("S3_SECRET_ACCESS_KEY")
	os.Unsetenv("S3_BUCKET")
	os.Unsetenv("MEDIA_PUBLIC_BASE_URL")
}

func TestNewFromEnv_R2Driver(t *testing.T) {
	tempDir, _ := os.MkdirTemp("", "factory_r2_test_*")
	defer os.RemoveAll(tempDir)

	os.Setenv("MEDIA_STORAGE_DRIVER", "r2")
	os.Setenv("R2_ACCOUNT_ID", "acc123")
	os.Setenv("R2_ACCESS_KEY_ID", "key123")
	os.Setenv("R2_SECRET_ACCESS_KEY", "secret123")
	os.Setenv("R2_BUCKET_NAME", "my-r2-bucket")
	os.Setenv("R2_PUBLIC_BASE_URL", "https://pub-bebae854aa5d4a54b536f62f74a8cdbd.r2.dev")

	r2Store, r2Resolver, err := storage.NewFromEnv(tempDir)
	if err != nil {
		t.Fatalf("NewFromEnv r2: %v", err)
	}
	if r2Store == nil || r2Resolver == nil {
		t.Fatal("NewFromEnv r2 returned nil store or resolver")
	}

	key := "news/articles/art-999/cover/cover.webp"
	resURL := r2Resolver.Resolve(key)
	expectedURL := "https://pub-bebae854aa5d4a54b536f62f74a8cdbd.r2.dev/news/articles/art-999/cover/cover.webp"
	if resURL != expectedURL {
		t.Errorf("R2 resolver url: got %q, want %q", resURL, expectedURL)
	}

	os.Unsetenv("MEDIA_STORAGE_DRIVER")
	os.Unsetenv("R2_ACCOUNT_ID")
	os.Unsetenv("R2_ACCESS_KEY_ID")
	os.Unsetenv("R2_SECRET_ACCESS_KEY")
	os.Unsetenv("R2_BUCKET_NAME")
	os.Unsetenv("R2_PUBLIC_BASE_URL")
}

func TestR2Integration(t *testing.T) {
	if os.Getenv("R2_INTEGRATION_TEST") != "1" {
		t.Skip("Skipping real R2 integration test. Set R2_INTEGRATION_TEST=1 with valid credentials in env to run.")
	}

	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../../.env")

	if os.Getenv("MEDIA_STORAGE_DRIVER") == "" {
		os.Setenv("MEDIA_STORAGE_DRIVER", "r2")
	}

	tempDir, _ := os.MkdirTemp("", "r2_integration_*")
	defer os.RemoveAll(tempDir)

	store, resolver, err := storage.NewFromEnv(tempDir)
	if err != nil {
		t.Fatalf("Failed to initialize R2 storage for integration test: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	testObjectKey := "test/integration/" + time.Now().Format("20060102-150405") + "-test.webp"
	tinyWebpData := []byte("RIFF\x28\x00\x00\x00WEBPVP8L\x1b\x00\x00\x00\x2f\x00\x00\x00\x00\x07\x07\x07\x07")

	t.Logf("R2 Integration Test: Uploading test object key %q", testObjectKey)
	if err := store.Put(ctx, testObjectKey, tinyWebpData, "image/webp"); err != nil {
		t.Fatalf("R2 Put Object failed: %v", err)
	}

	exists, err := store.Exists(ctx, testObjectKey)
	if err != nil || !exists {
		t.Fatalf("R2 Exists check failed: exists=%v, err=%v", exists, err)
	}

	publicURL := resolver.Resolve(testObjectKey)
	t.Logf("R2 Integration Test Public URL: %s", publicURL)

	// Verify HTTP GET public URL
	resp, err := http.Get(publicURL)
	if err != nil {
		t.Fatalf("HTTP GET public URL failed: %v", err)
	}
	defer resp.Body.Close()

	t.Logf("R2 Integration Test HTTP Response Status: %d", resp.StatusCode)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected HTTP 200 from public R2 URL, got %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	t.Logf("R2 Integration Test HTTP Response Content-Type: %s", contentType)
	if !strings.Contains(contentType, "image/webp") {
		t.Errorf("Expected Content-Type image/webp from public R2 URL, got %s", contentType)
	}

	// Clean up test object
	if err := store.Delete(ctx, testObjectKey); err != nil {
		t.Errorf("R2 Delete Object cleanup failed: %v", err)
	}

	existsAfter, err := store.Exists(ctx, testObjectKey)
	if err != nil || existsAfter {
		t.Errorf("Expected object to be deleted, exists=%v, err=%v", existsAfter, err)
	}
	t.Logf("R2 Integration Test SUCCESS: Object uploaded, verified HTTP 200, and cleaned up.")
}
