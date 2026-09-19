import { describe, it } from "node:test";
import assert from "node:assert";
import { 
  getNewsAttachmentFileUrl, 
  getNewsAttachmentDownloadUrl, 
  canPreviewAttachment,
  formatAuthorName,
  formatAuthorPosition,
  getFullImageUrl,
  escapeHtml,
  resolveHtmlMediaUrls,
} from "./news-api.ts";

describe("News Attachment Helpers", () => {
  it("generates correct Open URL with newsId and attachmentId", () => {
    const url = getNewsAttachmentFileUrl("news-123", "file-456");
    assert.strictEqual(url, "/api/v1/news/news-123/attachments/file-456/file");
    assert.notStrictEqual(url, "/api/v1/news/attachments/file-456/file");
  });

  it("generates correct Download URL with newsId and attachmentId", () => {
    const url = getNewsAttachmentDownloadUrl("news-123", "file-456");
    assert.strictEqual(url, "/api/v1/news/news-123/attachments/file-456/file?download=1");
    assert.notStrictEqual(url, "/api/v1/news/attachments/file-456/file?download=1");
  });

  it("throws an error when newsId or attachmentId is missing", () => {
    assert.throws(() => {
      getNewsAttachmentFileUrl("", "file-456");
    }, /newsId and attachmentId are required/);

    assert.throws(() => {
      getNewsAttachmentFileUrl("news-123", "");
    }, /newsId and attachmentId are required/);
  });

  it("correctly identifies preview capability via canPreviewAttachment", () => {
    // Previewable formats
    assert.strictEqual(canPreviewAttachment("pdf"), true);
    assert.strictEqual(canPreviewAttachment(".pdf"), true);
    assert.strictEqual(canPreviewAttachment("application/pdf"), true);
    assert.strictEqual(canPreviewAttachment("txt"), true);
    assert.strictEqual(canPreviewAttachment(".txt"), true);
    assert.strictEqual(canPreviewAttachment("text/plain"), true);

    // Non-previewable office formats
    assert.strictEqual(canPreviewAttachment("doc"), false);
    assert.strictEqual(canPreviewAttachment("docx"), false);
    assert.strictEqual(canPreviewAttachment(".docx"), false);
    assert.strictEqual(canPreviewAttachment("xls"), false);
    assert.strictEqual(canPreviewAttachment("xlsx"), false);
    assert.strictEqual(canPreviewAttachment(".xlsx"), false);
    assert.strictEqual(canPreviewAttachment("ppt"), false);
    assert.strictEqual(canPreviewAttachment("pptx"), false);
    assert.strictEqual(canPreviewAttachment(".pptx"), false);
    assert.strictEqual(canPreviewAttachment("odt"), false);
    assert.strictEqual(canPreviewAttachment("ods"), false);
    assert.strictEqual(canPreviewAttachment("odp"), false);
    assert.strictEqual(canPreviewAttachment("rtf"), false);
    assert.strictEqual(canPreviewAttachment("csv"), false);
    assert.strictEqual(canPreviewAttachment(undefined), false);
  });

  it("formats and transliterates author name correctly per locale", () => {
    assert.strictEqual(formatAuthorName("Денис Мацевич", "uk"), "Денис Мацевич");
    assert.strictEqual(formatAuthorName("Денис Мацевич", "en"), "Denys Matsevych");
    assert.strictEqual(formatAuthorName("Олександр Войтюк", "en"), "Oleksandr Voitiuk");
  });

  it("translates or transliterates author position correctly per locale", () => {
    assert.strictEqual(formatAuthorPosition("Вчитель", "uk"), "Вчитель");
    assert.strictEqual(formatAuthorPosition("Вчитель", "en"), "Teacher");
    assert.strictEqual(formatAuthorPosition("Викладач", "en"), "Lecturer");
    assert.strictEqual(formatAuthorPosition("Доцент", "en"), "Associate Professor");
    assert.strictEqual(formatAuthorPosition("Професор", "en"), "Professor");
  });
});

describe("News Photo Gallery Helpers", () => {
  it("resolves full gallery image URL correctly", () => {
    const url = getFullImageUrl("/api/v1/news/news-123/gallery/img-456/file");
    assert.ok(url.endsWith("/api/v1/news/news-123/gallery/img-456/file"));
  });
});

describe("HTML Escaping & Sanitization", () => {
  it("escapes malicious HTML tags in captions to prevent XSS", () => {
    assert.strictEqual(
      escapeHtml("<script>alert('xss')</script>"),
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
    assert.strictEqual(
      escapeHtml('<img src=x onerror="alert(1)">'),
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    assert.strictEqual(
      escapeHtml('Caption with "quotes" & <tags>'),
      "Caption with &quot;quotes&quot; &amp; &lt;tags&gt;"
    );
  });

  it("resolves relative img src tags in article HTML content to full backend URLs", () => {
    const rawHtml = '<p>Text</p><img src="/api/v1/news/media/123" alt="Photo"/><p>More text</p>';
    const resolved = resolveHtmlMediaUrls(rawHtml);
    assert.ok(resolved.includes('src="http'));
    assert.ok(resolved.includes('/api/v1/news/media/123"'));
  });
});


