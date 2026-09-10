import { describe, it } from "node:test";
import assert from "node:assert";
import { 
  getNewsAttachmentFileUrl, 
  getNewsAttachmentDownloadUrl, 
  canPreviewAttachment 
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
});
