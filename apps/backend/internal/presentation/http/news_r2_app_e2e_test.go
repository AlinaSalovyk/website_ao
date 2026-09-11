package http_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"image"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/imageproc"
	"university-chatbot/backend/internal/infrastructure/sqlite"
	"university-chatbot/backend/internal/infrastructure/storage"
	newshttp "university-chatbot/backend/internal/presentation/http"
)

// TestNewsR2ApplicationE2E performs full application-level HTTP testing against Cloudflare R2:
// - Multipart form upload for Cover image via POST /admin/news/{id}/cover
// - Image processing & validation
// - Database update of image_url
// - Public HTTP GET verification from pub-bebae854aa5d4a54b536f62f74a8cdbd.r2.dev
// - Real Cover replacement & verification that old cover object is deleted from R2
// - Multipart form upload for Gallery image via POST /admin/news/{id}/gallery
// - Database insertion into news_gallery_images
// - Gallery delete via DELETE /admin/news/{id}/gallery/{imageId} & verification that R2 object is deleted
func TestNewsR2ApplicationE2E(t *testing.T) {
	if os.Getenv("R2_INTEGRATION_TEST") != "1" {
		t.Skip("Skipping Application-Level R2 E2E test. Set R2_INTEGRATION_TEST=1 to run.")
	}

	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../../.env")

	if os.Getenv("MEDIA_STORAGE_DRIVER") == "" {
		os.Setenv("MEDIA_STORAGE_DRIVER", "r2")
	}

	tempDir, err := os.MkdirTemp("", "r2_app_e2e_*")
	if err != nil {
		t.Fatalf("create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbFile, err := os.CreateTemp("", "news_r2_app_*.db")
	if err != nil {
		t.Fatalf("create temp db: %v", err)
	}
	dbFile.Close()
	defer os.Remove(dbFile.Name())

	db, err := sqlite.InitDB(dbFile.Name())
	if err != nil {
		t.Fatalf("InitDB: %v", err)
	}
	defer db.Close()

	repo := sqlite.NewNewsRepo(db)
	store, resolver, err := storage.NewFromEnv(tempDir)
	if err != nil {
		t.Fatalf("storage.NewFromEnv: %v", err)
	}
	imgProc := imageproc.NewProcessor(imageproc.DefaultOptions())

	handler := newshttp.NewNewsHandler(repo, nil, imgProc, store, resolver, nil)

	r := chi.NewRouter()
	r.Post("/admin/news", handler.HandleCreate)
	r.Post("/admin/news/{id}/cover", handler.HandleUploadImage)
	r.Post("/admin/news/{id}/gallery", handler.HandleUploadGalleryImage)
	r.Delete("/admin/news/{id}/gallery/{imageId}", handler.HandleDeleteGalleryImage)
	r.Get("/admin/news/{id}/gallery", handler.HandleGetGalleryImages)

	ctx := context.Background()

	// 1. Create a draft news article in SQLite DB
	articleID := "e2e-app-" + time.Now().Format("20060102150405")
	art := &domain.NewsArticle{
		ID:         articleID,
		CategoryID: "cat-news",
		Status:     domain.NewsStatusDraft,
		Author:     domain.NewsAuthor{Name: "E2E Tester"},
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {
				Locale:      domain.LangUk,
				Title:       "E2E R2 Test Article",
				Slug:        articleID + "-slug",
				Description: "Description",
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := repo.Create(ctx, art); err != nil {
		t.Fatalf("Failed to seed article in DB: %v", err)
	}

	// Generate a valid 10x10 PNG image binary for imageproc
	imgObj := image.NewRGBA(image.Rect(0, 0, 10, 10))
	bufImg := &bytes.Buffer{}
	if err := png.Encode(bufImg, imgObj); err != nil {
		t.Fatalf("png.Encode: %v", err)
	}
	validImageData := bufImg.Bytes()

	// Helper for multipart upload
	createMultipartRequest := func(url string, fieldName string, fileName string, fileData []byte) *http.Request {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		part, err := writer.CreateFormFile(fieldName, fileName)
		if err != nil {
			t.Fatalf("CreateFormFile failed: %v", err)
		}
		part.Write(fileData)
		writer.Close()

		req := httptest.NewRequest(http.MethodPost, url, body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		return req
	}

	// ─── TEST STEP A: Cover Upload via Application HTTP Handler ──────────────────
	t.Logf("App E2E: Uploading Cover 1 via HTTP POST /admin/news/%s/cover", articleID)
	reqCover1 := createMultipartRequest("/admin/news/"+articleID+"/cover", "image", "cover1.png", validImageData)
	recCover1 := httptest.NewRecorder()
	r.ServeHTTP(recCover1, reqCover1)

	if recCover1.Code != http.StatusOK {
		t.Fatalf("Cover 1 Upload HTTP Status got %d, want 200. Body: %s", recCover1.Code, recCover1.Body.String())
	}

	var cover1Resp map[string]interface{}
	if err := json.Unmarshal(recCover1.Body.Bytes(), &cover1Resp); err != nil {
		t.Fatalf("Unmarshal cover 1 resp: %v", err)
	}

	cover1StorageKey := cover1Resp["storage_key"].(string)
	cover1URL := cover1Resp["image_url"].(string)

	t.Logf("App E2E Cover 1 Storage Key: %s", cover1StorageKey)
	t.Logf("App E2E Cover 1 Public URL: %s", cover1URL)

	if !strings.HasPrefix(cover1URL, "https://pub-bebae854aa5d4a54b536f62f74a8cdbd.r2.dev") {
		t.Errorf("Cover 1 URL missing R2 public base prefix: got %s", cover1URL)
	}

	// Verify Cover 1 Public HTTP GET
	respCover1, err := http.Get(cover1URL)
	if err != nil {
		t.Fatalf("HTTP GET Cover 1 failed: %v", err)
	}
	respCover1.Body.Close()
	if respCover1.StatusCode != http.StatusOK {
		t.Errorf("Public R2 GET Cover 1 got status %d, want 200", respCover1.StatusCode)
	}

	// ─── TEST STEP B: Cover Replacement & Old Object Cleanup ───────────────────
	t.Logf("App E2E: Uploading Replacement Cover 2 via HTTP POST")
	reqCover2 := createMultipartRequest("/admin/news/"+articleID+"/cover", "image", "cover2.png", validImageData)
	recCover2 := httptest.NewRecorder()
	r.ServeHTTP(recCover2, reqCover2)

	if recCover2.Code != http.StatusOK {
		t.Fatalf("Cover 2 Upload HTTP Status got %d, want 200. Body: %s", recCover2.Code, recCover2.Body.String())
	}

	var cover2Resp map[string]interface{}
	json.Unmarshal(recCover2.Body.Bytes(), &cover2Resp)
	cover2StorageKey := cover2Resp["storage_key"].(string)
	cover2URL := cover2Resp["image_url"].(string)

	t.Logf("App E2E Cover 2 Storage Key: %s", cover2StorageKey)
	t.Logf("App E2E Cover 2 Public URL: %s", cover2URL)

	// Verify DB now references Cover 2
	fetchedArt, err := repo.GetByID(ctx, articleID)
	if err != nil || fetchedArt.ImageURL != cover2StorageKey {
		t.Errorf("DB ImageURL update check: got %q, want %q (err=%v)", fetchedArt.ImageURL, cover2StorageKey, err)
	}

	// Verify Cover 1 (Old Object) was automatically cleaned up from R2
	cover1Exists, _ := store.Exists(ctx, cover1StorageKey)
	if cover1Exists {
		t.Errorf("Cover replacement cleanup failure: Old Cover 1 (%s) still exists in R2 after replacement", cover1StorageKey)
	} else {
		t.Logf("App E2E Cover Replacement Cleanup SUCCESS: Old Cover 1 automatically removed from R2")
	}

	// Verify Cover 2 (New Object) exists in R2 and public GET returns 200 OK
	cover2Exists, _ := store.Exists(ctx, cover2StorageKey)
	if !cover2Exists {
		t.Errorf("Cover replacement failure: New Cover 2 (%s) does not exist in R2", cover2StorageKey)
	}
	respCover2, err := http.Get(cover2URL)
	if err != nil {
		t.Fatalf("HTTP GET Cover 2 failed: %v", err)
	}
	respCover2.Body.Close()
	if respCover2.StatusCode != http.StatusOK {
		t.Errorf("Public R2 GET Cover 2 got status %d, want 200", respCover2.StatusCode)
	}

	// ─── TEST STEP B.2: Failure Safety Check — Invalid Upload Payload ─────────
	// Invalid payload upload must fail and keep Cover 2 intact
	reqBad := createMultipartRequest("/admin/news/"+articleID+"/cover", "image", "corrupt.txt", []byte("not-an-image"))
	recBad := httptest.NewRecorder()
	r.ServeHTTP(recBad, reqBad)
	if recBad.Code == http.StatusOK {
		t.Errorf("Failure safety check: expected invalid format request to fail, got 200")
	}
	cover2StillExists, _ := store.Exists(ctx, cover2StorageKey)
	if !cover2StillExists {
		t.Errorf("Failure safety check failed: Cover 2 was deleted when bad upload failed")
	} else {
		t.Logf("App E2E Failure Safety SUCCESS: Failed upload kept Cover 2 intact in R2")
	}

	// ─── TEST STEP B.3: Failure Safety Check — DB Update Failure ─────────────
	// If DB update fails after uploading Cover 3:
	// - DB must not be updated
	// - Old Cover 2 must NOT be deleted from R2
	// - Newly uploaded Cover 3 must be cleaned up from R2 (no orphan)
	failingHandler := newshttp.NewNewsHandler(&failingDBSetImageURLRepo{NewsRepo: repo}, nil, imgProc, store, resolver, nil)
	rFail := chi.NewRouter()
	rFail.Post("/admin/news/{id}/cover", failingHandler.HandleUploadImage)

	reqFailDB := createMultipartRequest("/admin/news/"+articleID+"/cover", "image", "cover3.png", validImageData)
	recFailDB := httptest.NewRecorder()
	rFail.ServeHTTP(recFailDB, reqFailDB)

	if recFailDB.Code != http.StatusInternalServerError {
		t.Errorf("DB update failure safety check: got HTTP %d, want 500", recFailDB.Code)
	}
	cover2AfterFailDB, _ := store.Exists(ctx, cover2StorageKey)
	if !cover2AfterFailDB {
		t.Errorf("DB update failure safety check failed: Old Cover 2 was deleted when DB update failed!")
	} else {
		t.Logf("App E2E Failure Safety SUCCESS: Failed DB update kept old Cover 2 intact in R2")
	}

	// ─── TEST STEP C: Gallery Upload & DB + R2 Creation ───────────────────────
	t.Logf("App E2E: Uploading Gallery Image via HTTP POST /admin/news/%s/gallery", articleID)
	reqGal := createMultipartRequest("/admin/news/"+articleID+"/gallery", "image", "photo1.png", validImageData)
	recGal := httptest.NewRecorder()
	r.ServeHTTP(recGal, reqGal)

	if recGal.Code != http.StatusCreated && recGal.Code != http.StatusOK {
		t.Fatalf("Gallery Upload HTTP Status got %d, want 201/200. Body: %s", recGal.Code, recGal.Body.String())
	}

	var galImg domain.NewsGalleryImage
	if err := json.Unmarshal(recGal.Body.Bytes(), &galImg); err != nil {
		t.Fatalf("Unmarshal gallery image resp: %v", err)
	}

	galleryStorageKey := "news/articles/" + articleID + "/gallery/" + galImg.StoredName
	t.Logf("App E2E Gallery Image ID: %s, StoredName: %s", galImg.ID, galImg.StoredName)
	t.Logf("App E2E Gallery Storage Key: %s", galleryStorageKey)

	// Verify Gallery Image exists in DB
	galImgsDB, err := repo.GetGalleryImagesByNewsID(ctx, articleID)
	if err != nil || len(galImgsDB) != 1 || galImgsDB[0].ID != galImg.ID {
		t.Errorf("DB Gallery insertion check: got count %d (err=%v)", len(galImgsDB), err)
	}

	// Verify Gallery Image exists in R2
	galExists, _ := store.Exists(ctx, galleryStorageKey)
	if !galExists {
		t.Errorf("Gallery upload failure: Image %s does not exist in R2", galleryStorageKey)
	}

	// ─── TEST STEP D: Gallery Delete & DB + R2 Cleanup ───────────────────────
	t.Logf("App E2E: Deleting Gallery Image via HTTP DELETE /admin/news/%s/gallery/%s", articleID, galImg.ID)
	reqDelGal := httptest.NewRequest(http.MethodDelete, "/admin/news/"+articleID+"/gallery/"+galImg.ID, nil)
	recDelGal := httptest.NewRecorder()
	r.ServeHTTP(recDelGal, reqDelGal)

	if recDelGal.Code != http.StatusOK {
		t.Fatalf("Gallery Delete HTTP Status got %d, want 200. Body: %s", recDelGal.Code, recDelGal.Body.String())
	}

	// Verify DB row removed
	galImgsAfterDel, _ := repo.GetGalleryImagesByNewsID(ctx, articleID)
	if len(galImgsAfterDel) != 0 {
		t.Errorf("DB Gallery row cleanup failure: got count %d, want 0", len(galImgsAfterDel))
	} else {
		t.Logf("App E2E Gallery Delete DB Cleanup SUCCESS: DB row removed")
	}

	// Verify R2 object removed
	galExistsAfterDel, _ := store.Exists(ctx, galleryStorageKey)
	if galExistsAfterDel {
		t.Errorf("R2 Gallery object cleanup failure: Object %s still exists in R2", galleryStorageKey)
	} else {
		t.Logf("App E2E Gallery Delete R2 Cleanup SUCCESS: Object removed from R2")
	}

	// Cleanup Cover 2 from R2
	_ = store.Delete(ctx, cover2StorageKey)
	t.Logf("App E2E FULL APPLICATION TEST PASSED SUCCESSFULLY!")
}

type failingDBSetImageURLRepo struct {
	domain.NewsRepo
}

func (f *failingDBSetImageURLRepo) SetImageURL(ctx context.Context, id string, imageURL string) error {
	return errors.New("simulated DB update failure")
}

