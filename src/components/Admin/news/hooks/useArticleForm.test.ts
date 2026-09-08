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
