package sqlite_test

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"university-chatbot/backend/internal/domain"
	"university-chatbot/backend/internal/infrastructure/sqlite"
)

// openTestDB creates a temporary SQLite database with all migrations applied.
// The returned cleanup function removes the temp file.
func openTestDB(t *testing.T) (*sqlite.NewsRepo, func()) {
	t.Helper()
	f, err := os.CreateTemp("", "news_test_*.db")
	if err != nil {
		t.Fatalf("create temp file: %v", err)
	}
	f.Close()

	db, err := sqlite.InitDB(f.Name())
	if err != nil {
		os.Remove(f.Name())
		t.Fatalf("InitDB: %v", err)
	}
	repo := sqlite.NewNewsRepo(db)
	return repo, func() {
		db.Close()
		os.Remove(f.Name())
	}
}

// makeArticle builds a minimal valid NewsArticle for insertion tests.
func makeArticle(ukSlug, enSlug string) *domain.NewsArticle {
	return &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Author:     domain.NewsAuthor{Name: "Test Author"},
		CreatedBy:  "test@example.com",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Тестова Новина", Slug: ukSlug, Description: "Короткий опис"},
			domain.LangEn: {Locale: domain.LangEn, Title: "Test Article", Slug: enSlug, Description: "Short desc"},
		},
	}
}

func TestNewsRepo_CreateAndGetByID(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("testova-novyna", "test-article")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}
	if article.ID == "" {
		t.Fatal("ID was not assigned")
	}
	if article.PreviewToken == "" {
		t.Fatal("PreviewToken was not assigned")
	}

	got, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.ID != article.ID {
		t.Errorf("ID: got %q, want %q", got.ID, article.ID)
	}
	if got.Status != domain.NewsStatusDraft {
		t.Errorf("Status: got %q, want %q", got.Status, domain.NewsStatusDraft)
	}
	ukLoc := got.Locales[domain.LangUk]
	if ukLoc.Title != "Тестова Новина" {
		t.Errorf("UK title: got %q", ukLoc.Title)
	}
	enLoc := got.Locales[domain.LangEn]
	if enLoc.Slug != "test-article" {
		t.Errorf("EN slug: got %q", enLoc.Slug)
	}
}

func TestNewsRepo_GetByID_NotFound(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	_, err := repo.GetByID(context.Background(), "nonexistent-id")
	if err != domain.ErrNewsNotFound {
		t.Errorf("expected ErrNewsNotFound, got %v", err)
	}
}

func TestNewsRepo_List_Empty(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()

	articles, total, err := repo.List(context.Background(), domain.NewsListOptions{Limit: 12})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total != 0 {
		t.Errorf("total: got %d, want 0", total)
	}
	if len(articles) != 0 {
		t.Errorf("articles: got %d, want 0", len(articles))
	}
}

func TestNewsRepo_Publish_SetsPublishedAt(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("novyna-pub", "article-pub")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}

	if err := repo.SetStatus(ctx, article.ID, domain.NewsStatusPublished); err != nil {
		t.Fatalf("SetStatus: %v", err)
	}

	got, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID after publish: %v", err)
	}
	if got.Status != domain.NewsStatusPublished {
		t.Errorf("Status: got %q, want published", got.Status)
	}
	if got.PublishedAt == nil {
		t.Error("PublishedAt should be set after first publish")
	}
}

func TestNewsRepo_SoftDeleteAndRestore(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("del-novyna", "del-article")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}

	// List should return 1 before delete.
	_, total, err := repo.List(ctx, domain.NewsListOptions{Limit: 12})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total != 1 {
		t.Errorf("total before delete: got %d, want 1", total)
	}

	// Soft delete.
	if err := repo.Delete(ctx, article.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	// List should return 0 (deleted articles excluded by default).
	_, total, err = repo.List(ctx, domain.NewsListOptions{Limit: 12})
	if err != nil {
		t.Fatalf("List after delete: %v", err)
	}
	if total != 0 {
		t.Errorf("total after delete: got %d, want 0", total)
	}

	// List with IncludeDeleted should return 1.
	_, total, err = repo.List(ctx, domain.NewsListOptions{Limit: 12, IncludeDeleted: true})
	if err != nil {
		t.Fatalf("List IncludeDeleted: %v", err)
	}
	if total != 1 {
		t.Errorf("total IncludeDeleted: got %d, want 1", total)
	}

	// Restore.
	if err := repo.Restore(ctx, article.ID); err != nil {
		t.Fatalf("Restore: %v", err)
	}

	// List should return 1 again.
	_, total, err = repo.List(ctx, domain.NewsListOptions{Limit: 12})
	if err != nil {
		t.Fatalf("List after restore: %v", err)
	}
	if total != 1 {
		t.Errorf("total after restore: got %d, want 1", total)
	}
}

func TestNewsRepo_GetBySlug_Current(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("poshuk-slug", "search-slug")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}

	got, redirected, err := repo.GetBySlug(ctx, domain.LangUk, "poshuk-slug")
	if err != nil {
		t.Fatalf("GetBySlug: %v", err)
	}
	if redirected {
		t.Error("wasRedirected should be false for a current slug")
	}
	if got.ID != article.ID {
		t.Errorf("ID mismatch: got %q, want %q", got.ID, article.ID)
	}
}

func TestNewsRepo_GetBySlug_NotFound(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()

	_, _, err := repo.GetBySlug(context.Background(), domain.LangUk, "nema-takoi-statti")
	if err != domain.ErrNewsNotFound {
		t.Errorf("expected ErrNewsNotFound, got %v", err)
	}
}

func TestNewsRepo_SlugConflict(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	a1 := makeArticle("odyn-slug", "one-slug")
	if err := repo.Create(ctx, a1); err != nil {
		t.Fatalf("Create first: %v", err)
	}

	// Second article with same UK slug → must fail.
	a2 := makeArticle("odyn-slug", "two-slug-en")
	err := repo.Create(ctx, a2)
	if err != domain.ErrNewsSlugConflict {
		t.Errorf("expected ErrNewsSlugConflict, got %v", err)
	}
}

func TestNewsRepo_SlugHistory_Redirect(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("staryy-slug", "old-slug-en")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}

	// Update with a new UK slug.
	article.Locales[domain.LangUk] = domain.NewsLocale{
		Locale: domain.LangUk, Title: "Нова Назва", Slug: "novyy-slug",
	}
	article.Locales[domain.LangEn] = domain.NewsLocale{
		Locale: domain.LangEn, Title: "New Title", Slug: "old-slug-en",
	}
	if err := repo.Update(ctx, article); err != nil {
		t.Fatalf("Update: %v", err)
	}

	// Querying old slug should return wasRedirected=true.
	got, redirected, err := repo.GetBySlug(ctx, domain.LangUk, "staryy-slug")
	if err != nil {
		t.Fatalf("GetBySlug old slug: %v", err)
	}
	if !redirected {
		t.Error("wasRedirected should be true for a historic slug")
	}
	if got.ID != article.ID {
		t.Errorf("ID mismatch after redirect")
	}
}

func TestNewsRepo_GetByPreviewToken(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("preview-uk", "preview-en")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}

	got, err := repo.GetByPreviewToken(ctx, article.PreviewToken)
	if err != nil {
		t.Fatalf("GetByPreviewToken: %v", err)
	}
	if got.ID != article.ID {
		t.Errorf("ID mismatch: got %q, want %q", got.ID, article.ID)
	}
}

func TestNewsRepo_GetByPreviewToken_IncludesDeleted(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("del-preview-uk", "del-preview-en")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}
	if err := repo.Delete(ctx, article.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	// Preview must still work after soft delete.
	got, err := repo.GetByPreviewToken(ctx, article.PreviewToken)
	if err != nil {
		t.Fatalf("GetByPreviewToken after delete: %v", err)
	}
	if got.ID != article.ID {
		t.Errorf("ID mismatch")
	}
}

func TestNewsRepo_GetCategories(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()

	cats, err := repo.GetCategories(context.Background())
	if err != nil {
		t.Fatalf("GetCategories: %v", err)
	}
	// 5 seed categories from migration v9.
	if len(cats) != 5 {
		t.Errorf("expected 5 categories, got %d", len(cats))
	}
}

func TestNewsRepo_EnsureTag(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	tag, err := repo.EnsureTag(ctx, "olympiad", "Олімпіада")
	if err != nil {
		t.Fatalf("EnsureTag first call: %v", err)
	}
	if tag.ID == "" {
		t.Error("tag ID not assigned")
	}

	// Second call with same slug must return the same tag.
	tag2, err := repo.EnsureTag(ctx, "olympiad", "Олімпіада")
	if err != nil {
		t.Fatalf("EnsureTag second call: %v", err)
	}
	if tag2.ID != tag.ID {
		t.Errorf("IDs differ: %q vs %q", tag.ID, tag2.ID)
	}
}

func TestNewsRepo_ScheduledPublish_NotInPublicList(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	future := time.Now().Add(24 * time.Hour)
	article := makeArticle("zaplenov-uk", "scheduled-en")
	article.Status = domain.NewsStatusPublished
	article.PublishAt = &future
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create: %v", err)
	}

	// Public query (status=published, publish_at <= now) should exclude future article.
	_, total, err := repo.List(ctx, domain.NewsListOptions{
		Status: domain.NewsStatusPublished,
		Limit:  12,
	})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total != 0 {
		t.Errorf("scheduled article should not appear in public list, total=%d", total)
	}
}

func TestNewsRepo_GetAllPublishedSlugs(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	a := makeArticle("pub-slug-uk", "pub-slug-en")
	if err := repo.Create(ctx, a); err != nil {
		t.Fatalf("Create: %v", err)
	}
	if err := repo.SetStatus(ctx, a.ID, domain.NewsStatusPublished); err != nil {
		t.Fatalf("SetStatus: %v", err)
	}

	slugs, err := repo.GetAllPublishedSlugs(ctx)
	if err != nil {
		t.Fatalf("GetAllPublishedSlugs: %v", err)
	}
	// One article × 2 locales = 2 entries.
	if len(slugs) != 2 {
		t.Errorf("expected 2 slug entries, got %d", len(slugs))
	}
}

func TestNewsRepo_MediaFieldsPersistence(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("media-test-uk", "media-test-en")
	article.CoverPosition = "50% 35%"
	article.Gallery = []string{"/news-images/1.webp", "/news-images/2.webp"}
	article.VideoURL = "https://www.youtube.com/embed/dQw4w9WgXcQ"
	article.VideoPoster = "/news-images/poster.webp"

	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create media article: %v", err)
	}

	got, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID media article: %v", err)
	}

	if got.CoverPosition != "50% 35%" {
		t.Errorf("CoverPosition: got %q, want %q", got.CoverPosition, "50% 35%")
	}
	if len(got.Gallery) != 2 || got.Gallery[0] != "/news-images/1.webp" || got.Gallery[1] != "/news-images/2.webp" {
		t.Errorf("Gallery: got %v, want 2 items", got.Gallery)
	}
	if got.VideoURL != "https://www.youtube.com/embed/dQw4w9WgXcQ" {
		t.Errorf("VideoURL: got %q, want %q", got.VideoURL, "https://www.youtube.com/embed/dQw4w9WgXcQ")
	}
	if got.VideoPoster != "/news-images/poster.webp" {
		t.Errorf("VideoPoster: got %q, want %q", got.VideoPoster, "/news-images/poster.webp")
	}

	// Test Update
	got.CoverPosition = "top"
	got.Gallery = []string{"/news-images/3.webp"}
	got.VideoURL = "https://www.youtube.com/embed/abc12345678"

	if err := repo.Update(ctx, got); err != nil {
		t.Fatalf("Update media article: %v", err)
	}

	updated, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID updated media article: %v", err)
	}
	if updated.CoverPosition != "top" {
		t.Errorf("Updated CoverPosition: got %q, want top", updated.CoverPosition)
	}
	if len(updated.Gallery) != 1 || updated.Gallery[0] != "/news-images/3.webp" {
		t.Errorf("Updated Gallery: got %v, want 1 item", updated.Gallery)
	}
	if updated.VideoURL != "https://www.youtube.com/embed/abc12345678" {
		t.Errorf("Updated VideoURL: got %q, want embed URL", updated.VideoURL)
	}
}

func TestNewsRepo_PublishPreservesMediaAndFields(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("publish-preserve-uk", "publish-preserve-en")
	article.ImageURL = "/news-images/cover.webp"
	article.CoverPosition = "50% 35%"
	article.Gallery = []string{"/news-images/g1.webp", "/news-images/g2.webp", "/news-images/g3.webp"}
	article.VideoURL = "https://www.youtube.com/embed/dQw4w9WgXcQ"
	article.VideoPoster = "/news-images/poster.webp"

	ukLoc := article.Locales[domain.LangUk]
	ukLoc.Content = `<p>Test</p><img src="/news-images/inline.webp" alt="test" />`
	article.Locales[domain.LangUk] = ukLoc

	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create article: %v", err)
	}

	// Publish via SetStatus
	if err := repo.SetStatus(ctx, article.ID, domain.NewsStatusPublished); err != nil {
		t.Fatalf("SetStatus(published): %v", err)
	}

	published, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID published article: %v", err)
	}

	if published.Status != domain.NewsStatusPublished {
		t.Errorf("Status: got %q, want %q", published.Status, domain.NewsStatusPublished)
	}
	if published.ImageURL != "/news-images/cover.webp" {
		t.Errorf("ImageURL lost on publish: got %q", published.ImageURL)
	}
	if published.CoverPosition != "50% 35%" {
		t.Errorf("CoverPosition lost on publish: got %q", published.CoverPosition)
	}
	if len(published.Gallery) != 3 {
		t.Errorf("Gallery lost on publish: got %d items", len(published.Gallery))
	}
	if published.VideoURL != "https://www.youtube.com/embed/dQw4w9WgXcQ" {
		t.Errorf("VideoURL lost on publish: got %q", published.VideoURL)
	}
	if published.VideoPoster != "/news-images/poster.webp" {
		t.Errorf("VideoPoster lost on publish: got %q", published.VideoPoster)
	}
	if !strings.Contains(published.Locales[domain.LangUk].Content, `<img src="/news-images/inline.webp"`) {
		t.Errorf("Inline image lost from Content on publish: got %q", published.Locales[domain.LangUk].Content)
	}
}

func TestNewsRepo_AttachmentsCRUD(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("attachments-uk", "attachments-en")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create article: %v", err)
	}

	att1 := &domain.NewsAttachment{
		ID:           "att-1",
		NewsID:       article.ID,
		OriginalName: "Nakaz-123.pdf",
		StoredName:   "uuid-123.pdf",
		MIMEType:     "application/pdf",
		Extension:    ".pdf",
		SizeBytes:    1024567,
		SortOrder:    1,
		TitleUK:      "Наказ МОН №123",
		TitleEN:      "MES Order No. 123",
	}

	att2 := &domain.NewsAttachment{
		ID:           "att-2",
		NewsID:       article.ID,
		OriginalName: "Report.docx",
		StoredName:   "uuid-456.docx",
		MIMEType:     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		Extension:    ".docx",
		SizeBytes:    2048500,
		SortOrder:    2,
		TitleUK:      "Звіт",
		TitleEN:      "Report",
	}

	if err := repo.AddAttachment(ctx, att1); err != nil {
		t.Fatalf("AddAttachment 1: %v", err)
	}
	if err := repo.AddAttachment(ctx, att2); err != nil {
		t.Fatalf("AddAttachment 2: %v", err)
	}

	// Fetch attachments directly
	atts, err := repo.GetAttachmentsByNewsID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetAttachmentsByNewsID: %v", err)
	}
	if len(atts) != 2 {
		t.Fatalf("expected 2 attachments, got %d", len(atts))
	}
	if atts[0].ID != "att-1" || atts[1].ID != "att-2" {
		t.Errorf("unexpected attachment order: %v", atts)
	}

	// Fetch article with loaded attachments
	fetched, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if len(fetched.Attachments) != 2 {
		t.Fatalf("article attachments count: got %d, want 2", len(fetched.Attachments))
	}

	// Update attachment metadata
	if err := repo.UpdateAttachment(ctx, "att-1", "Оновлений наказ №123", "Updated Order No. 123", 1); err != nil {
		t.Fatalf("UpdateAttachment: %v", err)
	}

	updatedAtt, err := repo.GetAttachmentByID(ctx, "att-1")
	if err != nil {
		t.Fatalf("GetAttachmentByID: %v", err)
	}
	if updatedAtt.TitleUK != "Оновлений наказ №123" {
		t.Errorf("TitleUK update failed: got %q", updatedAtt.TitleUK)
	}

	// Reorder attachments
	if err := repo.ReorderAttachments(ctx, article.ID, []string{"att-2", "att-1"}); err != nil {
		t.Fatalf("ReorderAttachments: %v", err)
	}
	reordered, err := repo.GetAttachmentsByNewsID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetAttachmentsByNewsID after reorder: %v", err)
	}
	if len(reordered) != 2 || reordered[0].ID != "att-2" || reordered[1].ID != "att-1" {
		t.Errorf("reorder failed: %v", reordered)
	}

	// Delete single attachment
	if err := repo.DeleteAttachment(ctx, "att-1"); err != nil {
		t.Fatalf("DeleteAttachment: %v", err)
	}
	afterDelete, err := repo.GetAttachmentsByNewsID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetAttachmentsByNewsID after delete: %v", err)
	}
	if len(afterDelete) != 1 || afterDelete[0].ID != "att-2" {
		t.Errorf("expected 1 attachment (att-2), got %v", afterDelete)
	}
}

func TestNewsRepo_VideoRemovalSemantics(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("video-test-uk", "video-test-en")
	article.VideoURL = "https://www.youtube.com/embed/dQw4w9WgXcQ"
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create article with video: %v", err)
	}

	// Verify video exists in DB
	got, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.VideoURL != "https://www.youtube.com/embed/dQw4w9WgXcQ" {
		t.Fatalf("VideoURL not saved: got %q", got.VideoURL)
	}

	// Explicitly clear videoURL
	got.VideoURL = ""
	if err := repo.Update(ctx, got); err != nil {
		t.Fatalf("Update with empty VideoURL: %v", err)
	}

	// Verify videoURL cleared in DB
	cleared, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID after clear: %v", err)
	}
	if cleared.VideoURL != "" {
		t.Errorf("VideoURL should be cleared, got %q", cleared.VideoURL)
	}
}

func TestNewsRepo_GalleryImagesCRUD(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	article := makeArticle("gallery-uk", "gallery-en")
	if err := repo.Create(ctx, article); err != nil {
		t.Fatalf("Create article: %v", err)
	}

	img1 := &domain.NewsGalleryImage{
		ID:           "img-1",
		NewsID:       article.ID,
		OriginalName: "photo1.jpg",
		StoredName:   "uuid-photo1.webp",
		MIMEType:     "image/webp",
		Extension:    ".webp",
		SizeBytes:    512000,
		Width:        1920,
		Height:       1080,
		SortOrder:    1,
		AltUK:        "Фото 1",
		AltEN:        "Photo 1",
		CaptionUK:    "Опис 1",
		CaptionEN:    "Caption 1",
	}

	img2 := &domain.NewsGalleryImage{
		ID:           "img-2",
		NewsID:       article.ID,
		OriginalName: "photo2.png",
		StoredName:   "uuid-photo2.webp",
		MIMEType:     "image/webp",
		Extension:    ".webp",
		SizeBytes:    812000,
		Width:        1200,
		Height:       800,
		SortOrder:    2,
		AltUK:        "Фото 2",
		AltEN:        "Photo 2",
		CaptionUK:    "Опис 2",
		CaptionEN:    "Caption 2",
	}

	if err := repo.AddGalleryImage(ctx, img1); err != nil {
		t.Fatalf("AddGalleryImage 1: %v", err)
	}
	if err := repo.AddGalleryImage(ctx, img2); err != nil {
		t.Fatalf("AddGalleryImage 2: %v", err)
	}

	// Fetch gallery images directly
	imgs, err := repo.GetGalleryImagesByNewsID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetGalleryImagesByNewsID: %v", err)
	}
	if len(imgs) != 2 {
		t.Fatalf("expected 2 gallery images, got %d", len(imgs))
	}
	if imgs[0].ID != "img-1" || imgs[1].ID != "img-2" {
		t.Errorf("unexpected image order: %v", imgs)
	}

	// Fetch article with loaded gallery images
	fetched, err := repo.GetByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if len(fetched.GalleryImages) != 2 {
		t.Fatalf("article gallery images count: got %d, want 2", len(fetched.GalleryImages))
	}

	// Update metadata
	if err := repo.UpdateGalleryImage(ctx, "img-1", "Оновлене Фото 1", "Updated Photo 1", "Оновлений опис", "Updated Caption", 1); err != nil {
		t.Fatalf("UpdateGalleryImage: %v", err)
	}

	updatedImg, err := repo.GetGalleryImageByID(ctx, "img-1")
	if err != nil {
		t.Fatalf("GetGalleryImageByID: %v", err)
	}
	if updatedImg.AltUK != "Оновлене Фото 1" || updatedImg.CaptionUK != "Оновлений опис" {
		t.Errorf("Alt/Caption update failed: got alt %q, caption %q", updatedImg.AltUK, updatedImg.CaptionUK)
	}

	// Reorder images
	if err := repo.ReorderGalleryImages(ctx, article.ID, []string{"img-2", "img-1"}); err != nil {
		t.Fatalf("ReorderGalleryImages: %v", err)
	}
	reordered, err := repo.GetGalleryImagesByNewsID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetGalleryImagesByNewsID after reorder: %v", err)
	}
	if len(reordered) != 2 || reordered[0].ID != "img-2" || reordered[1].ID != "img-1" {
		t.Errorf("reorder failed: %v", reordered)
	}

	// Delete single image
	if err := repo.DeleteGalleryImage(ctx, "img-1"); err != nil {
		t.Fatalf("DeleteGalleryImage: %v", err)
	}
	afterDelete, err := repo.GetGalleryImagesByNewsID(ctx, article.ID)
	if err != nil {
		t.Fatalf("GetGalleryImagesByNewsID after delete: %v", err)
	}
	if len(afterDelete) != 1 || afterDelete[0].ID != "img-2" {
		t.Errorf("expected 1 gallery image (img-2), got %v", afterDelete)
	}
}

func TestNewsRepo_SoftDeletedArticleDoesNotBlockSlugReuse(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	// 1. Create article with slug
	a1 := makeArticle("reuse-slug-uk", "reuse-slug-en")
	if err := repo.Create(ctx, a1); err != nil {
		t.Fatalf("Create a1: %v", err)
	}

	// 2. Soft delete a1
	if err := repo.Delete(ctx, a1.ID); err != nil {
		t.Fatalf("Delete a1: %v", err)
	}

	// 3. SlugExists should return false for deleted article's slug
	exists, err := repo.SlugExists(ctx, domain.LangUk, "reuse-slug-uk", "")
	if err != nil {
		t.Fatalf("SlugExists check: %v", err)
	}
	if exists {
		t.Errorf("expected SlugExists to be false for soft-deleted article's slug")
	}

	// 4. Create new article a2 with the same slug → must succeed
	a2 := makeArticle("reuse-slug-uk", "reuse-slug-en")
	if err := repo.Create(ctx, a2); err != nil {
		t.Fatalf("Create a2 with reused slug failed: %v", err)
	}
}

func TestNewsRepo_MultipleDraftsWithEmptySlugsSucceed(t *testing.T) {
	repo, cleanup := openTestDB(t)
	defer cleanup()
	ctx := context.Background()

	// Draft 1 with empty EN slug
	d1 := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Author:     domain.NewsAuthor{Name: "Draft Author"},
		CreatedBy:  "test@example.com",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Чернетка 1", Slug: "chernatka-1"},
			domain.LangEn: {Locale: domain.LangEn, Title: "", Slug: ""},
		},
	}
	if err := repo.Create(ctx, d1); err != nil {
		t.Fatalf("Create draft 1 failed: %v", err)
	}

	// Draft 2 with empty EN slug → must succeed without UNIQUE constraint error
	d2 := &domain.NewsArticle{
		Status:     domain.NewsStatusDraft,
		CategoryID: "cat-news",
		Author:     domain.NewsAuthor{Name: "Draft Author"},
		CreatedBy:  "test@example.com",
		Locales: map[domain.Language]domain.NewsLocale{
			domain.LangUk: {Locale: domain.LangUk, Title: "Чернетка 2", Slug: "chernatka-2"},
			domain.LangEn: {Locale: domain.LangEn, Title: "", Slug: ""},
		},
	}
	if err := repo.Create(ctx, d2); err != nil {
		t.Fatalf("Create draft 2 failed: %v", err)
	}
}




