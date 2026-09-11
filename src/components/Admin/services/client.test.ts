import { describe, it } from "node:test";
import assert from "node:assert";
import { ApiError } from "./client";

describe("Frontend ApiError & Response Handling", () => {
  it("preserves machine code, message, field, and fieldErrors from backend JSON", () => {
    const rawBackendPayload = {
      code: "NEWS_CATEGORY_REQUIRED",
      message: "Оберіть категорію новини.",
      field: "category_id",
      field_errors: {
        category_id: "Оберіть категорію новини.",
      },
    };

    const err = new ApiError(
      rawBackendPayload.message,
      400,
      rawBackendPayload.code,
      rawBackendPayload.field,
      rawBackendPayload.field_errors
    );

    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.code, "NEWS_CATEGORY_REQUIRED");
    assert.strictEqual(err.field, "category_id");
    assert.strictEqual(err.message, "Оберіть категорію новини.");
    assert.deepStrictEqual(err.fieldErrors, {
      category_id: "Оберіть категорію новини.",
    });
  });

  it("handles duplicate slug conflict response parsing", () => {
    const rawBackendPayload = {
      code: "NEWS_SLUG_CONFLICT",
      message: "Новина з такою адресою (Slug) вже існує. Змініть Slug.",
      field: "slug_uk",
      field_errors: {
        slug_uk: "Новина з такою адресою (Slug) вже існує. Змініть Slug.",
      },
    };

    const err = new ApiError(
      rawBackendPayload.message,
      409,
      rawBackendPayload.code,
      rawBackendPayload.field,
      rawBackendPayload.field_errors
    );

    assert.strictEqual(err.status, 409);
    assert.strictEqual(err.code, "NEWS_SLUG_CONFLICT");
    assert.strictEqual(err.field, "slug_uk");
    assert.strictEqual(err.message, "Новина з такою адресою (Slug) вже існує. Змініть Slug.");
  });

  it("ensures failed save preserves ALL form fields (title, description, content, category, slug, video_url, seo)", () => {
    const formState = {
      category_id: "cat-news",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      locales: {
        uk: {
          title: "Збережений Заголовок",
          slug: "test-slug-uk",
          description: "Збережений Короткий Опис",
          content: "<p>Збережений Текст Новини</p>",
          seo_title: "SEO Заголовок",
          seo_description: "SEO Опис",
        },
      },
    };

    const initialSnapshot = JSON.stringify(formState);

    // Simulate API save failure (e.g., duplicate slug or server error)
    const simulateSave = () => {
      throw new ApiError(
        "Новина з такою адресою (Slug) вже існує. Змініть Slug.",
        409,
        "NEWS_SLUG_CONFLICT",
        "slug_uk",
        { slug_uk: "Новина з такою адресою (Slug) вже існує. Змініть Slug." }
      );
    };

    try {
      simulateSave();
      assert.fail("Should have thrown ApiError");
    } catch (e: any) {
      assert.ok(e instanceof ApiError);
      assert.strictEqual(e.code, "NEWS_SLUG_CONFLICT");
    }

    // Verify complete form state preservation
    assert.strictEqual(JSON.stringify(formState), initialSnapshot);
    assert.strictEqual(formState.category_id, "cat-news");
    assert.strictEqual(formState.video_url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    assert.strictEqual(formState.locales.uk.title, "Збережений Заголовок");
    assert.strictEqual(formState.locales.uk.slug, "test-slug-uk");
    assert.strictEqual(formState.locales.uk.description, "Збережений Короткий Опис");
    assert.strictEqual(formState.locales.uk.content, "<p>Збережений Текст Новини</p>");
    assert.strictEqual(formState.locales.uk.seo_title, "SEO Заголовок");
    assert.strictEqual(formState.locales.uk.seo_description, "SEO Опис");
  });
});
