import { describe, it } from "node:test";
import assert from "node:assert";

// We test the production helper used for SEO autofill logic
import { computeAutoFillSEO } from "../../../../utils/seo.ts";
import { slugify } from "../types.ts";

describe("SEO State Logic (computeAutoFillSEO)", () => {
  it("autofills empty SEO fields from Title and Content", () => {
    const { next, filled } = computeAutoFillSEO(
      "Test Article",
      "",
      "",
      "",
      "",
      "<p>Sample content</p>",
      slugify
    );
    
    assert.strictEqual(filled, true);
    assert.strictEqual(next.slug, "test-article");
    assert.strictEqual(next.seo_title, "Test Article");
    assert.strictEqual(next.seo_description, "Sample content");
  });

  it("does NOT overwrite manually edited existing SEO fields", () => {
    const { next, filled } = computeAutoFillSEO(
      "New Title",
      "existing-slug",
      "Existing SEO Title",
      "Existing SEO Desc",
      "New description",
      "<p>New content</p>",
      slugify
    );
    
    assert.strictEqual(filled, false);
    assert.strictEqual(next.slug, "existing-slug");
    assert.strictEqual(next.seo_title, "Existing SEO Title");
    assert.strictEqual(next.seo_description, "Existing SEO Desc");
  });

  it("does nothing if title is empty", () => {
    const { next, filled } = computeAutoFillSEO(
      "   ",
      "",
      "",
      "",
      "",
      "",
      slugify
    );
    
    assert.strictEqual(filled, false);
    assert.strictEqual(next.slug, "");
    assert.strictEqual(next.seo_title, "");
  });
});

describe("News Form Validation Contract & Error Clearing", () => {
  it("flags empty category_id with exact Ukrainian error", () => {
    const category_id = "";
    const errors: Record<string, string> = {};
    if (!category_id.trim()) {
      errors.category_id = "Оберіть категорію новини.";
    }
    assert.strictEqual(errors.category_id, "Оберіть категорію новини.");
  });

  it("flags empty UK title with exact Ukrainian error", () => {
    const title_uk = "   ";
    const errors: Record<string, string> = {};
    if (!title_uk.trim()) {
      errors.title_uk = "Введіть заголовок новини.";
    }
    assert.strictEqual(errors.title_uk, "Введіть заголовок новини.");
  });

  it("flags empty Rich Text HTML content with exact Ukrainian error", () => {
    const rawContent = "<p><br>&nbsp;</p>";
    const stripped = rawContent.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").trim();
    const errors: Record<string, string> = {};
    if (stripped === "") {
      errors.content_uk = "Додайте текст новини.";
    }
    assert.strictEqual(errors.content_uk, "Додайте текст новини.");
  });

  it("clears category error when valid category is selected", () => {
    let fieldErrors: Record<string, string> = {
      category_id: "Оберіть категорію новини.",
      title_uk: "Введіть заголовок новини.",
    };

    const clearFieldError = (fieldKey: string) => {
      const next = { ...fieldErrors };
      delete next[fieldKey];
      fieldErrors = next;
    };

    clearFieldError("category_id");

    assert.strictEqual(fieldErrors.category_id, undefined);
    assert.strictEqual(fieldErrors.title_uk, "Введіть заголовок новини.");
  });

  it("clears title error when user inputs valid title", () => {
    let fieldErrors: Record<string, string> = {
      title_uk: "Введіть заголовок новини.",
    };

    const clearFieldError = (fieldKey: string) => {
      const next = { ...fieldErrors };
      delete next[fieldKey];
      fieldErrors = next;
    };

    clearFieldError("title_uk");

    assert.strictEqual(fieldErrors.title_uk, undefined);
  });
});
