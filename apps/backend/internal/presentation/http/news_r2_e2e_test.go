package http_test

import (
	"context"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"university-chatbot/backend/internal/infrastructure/storage"
)

func TestNewsStorage_R2_E2E(t *testing.T) {
	if os.Getenv("R2_INTEGRATION_TEST") != "1" {
		t.Skip("Skipping real R2 news storage E2E test. Set R2_INTEGRATION_TEST=1 to run.")
	}

	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../../.env")

	if os.Getenv("MEDIA_STORAGE_DRIVER") == "" {
		os.Setenv("MEDIA_STORAGE_DRIVER", "r2")
	}

	tempDir, _ := os.MkdirTemp("", "r2_news_e2e_*")
	defer os.RemoveAll(tempDir)

	store, resolver, err := storage.NewFromEnv(tempDir)
	if err != nil {
		t.Fatalf("Failed to initialize R2 storage for news E2E test: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	testNewsID := "e2e-news-" + time.Now().Format("20060102150405")
	tinyWebpData := []byte("RIFF\x28\x00\x00\x00WEBPVP8L\x1b\x00\x00\x00\x2f\x00\x00\x00\x00\x07\x07\x07\x07")

	// 1. Cover Image E2E Flow
	coverStorageKey := "news/articles/" + testNewsID + "/cover/cover.webp"
	t.Logf("E2E Cover Uploading: key=%s", coverStorageKey)

	if err := store.Put(ctx, coverStorageKey, tinyWebpData, "image/webp"); err != nil {
		t.Fatalf("E2E Cover R2 Put failed: %v", err)
	}

	coverPublicURL := resolver.Resolve(coverStorageKey)
	t.Logf("E2E Cover Public URL: %s", coverPublicURL)
	if !strings.HasPrefix(coverPublicURL, "https://pub-bebae854aa5d4a54b536f62f74a8cdbd.r2.dev") {
		t.Errorf("Cover Public URL did not use R2_PUBLIC_BASE_URL: got %s", coverPublicURL)
	}

	respCover, err := http.Get(coverPublicURL)
	if err != nil {
		t.Fatalf("E2E Cover HTTP GET failed: %v", err)
	}
	respCover.Body.Close()
	if respCover.StatusCode != http.StatusOK {
		t.Errorf("E2E Cover HTTP status got %d, want 200", respCover.StatusCode)
	}
	if !strings.Contains(respCover.Header.Get("Content-Type"), "image/webp") {
		t.Errorf("E2E Cover Content-Type got %s, want image/webp", respCover.Header.Get("Content-Type"))
	}

	// 2. Gallery Image E2E Flow
	galleryStorageKey := "news/articles/" + testNewsID + "/gallery/photo_1.webp"
	t.Logf("E2E Gallery Uploading: key=%s", galleryStorageKey)

	if err := store.Put(ctx, galleryStorageKey, tinyWebpData, "image/webp"); err != nil {
		t.Fatalf("E2E Gallery R2 Put failed: %v", err)
	}

	galleryPublicURL := resolver.Resolve(galleryStorageKey)
	t.Logf("E2E Gallery Public URL: %s", galleryPublicURL)
	if !strings.HasPrefix(galleryPublicURL, "https://pub-bebae854aa5d4a54b536f62f74a8cdbd.r2.dev") {
		t.Errorf("Gallery Public URL did not use R2_PUBLIC_BASE_URL: got %s", galleryPublicURL)
	}

	respGallery, err := http.Get(galleryPublicURL)
	if err != nil {
		t.Fatalf("E2E Gallery HTTP GET failed: %v", err)
	}
	respGallery.Body.Close()
	if respGallery.StatusCode != http.StatusOK {
		t.Errorf("E2E Gallery HTTP status got %d, want 200", respGallery.StatusCode)
	}
	if !strings.Contains(respGallery.Header.Get("Content-Type"), "image/webp") {
		t.Errorf("E2E Gallery Content-Type got %s, want image/webp", respGallery.Header.Get("Content-Type"))
	}

	// 3. E2E Deletion & Cleanup Verification
	if err := store.Delete(ctx, coverStorageKey); err != nil {
		t.Errorf("E2E Cover Delete failed: %v", err)
	}
	if err := store.Delete(ctx, galleryStorageKey); err != nil {
		t.Errorf("E2E Gallery Delete failed: %v", err)
	}

	existsCover, _ := store.Exists(ctx, coverStorageKey)
	existsGallery, _ := store.Exists(ctx, galleryStorageKey)
	if existsCover || existsGallery {
		t.Errorf("E2E Delete cleanup check failed: coverExists=%v, galleryExists=%v", existsCover, existsGallery)
	}
	t.Logf("E2E News Storage Test SUCCESS: Cover and Gallery R2 objects uploaded, verified via HTTP GET 200, and cleaned up.")
}
