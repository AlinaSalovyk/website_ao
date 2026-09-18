import { describe, it } from "node:test";
import assert from "node:assert";
import {
  hasEnglishTranslation,
  articleTitle,
  articleSlug,
  articleDescription,
  type NewsArticle,
} from "../news-api";

describe("News Article Translation & Fallback Logic", () => {
  const articleOnlyUk: NewsArticle = {
    id: "art-100",
    status: "published",
    category_id: "cat-1",
    tags: [],
    author: { name: "Тестовий Автор" },
    image_url: "/news-images/test.webp",
    is_pinned: false,
    created_at: "2026-09-17T10:00:00Z",
    updated_at: "2026-09-17T10:00:00Z",
    locales: {
      uk: {
        locale: "uk",
        title: "Українська Новина Про Робототехніку",
        slug: "ukrainska-novyna-pro-robototekhniku",
        description: "Опис українською мовою",
        content: "<p>Повний текст новини українською.</p>",
        seo_title: "Українська Новина",
        seo_description: "Опис для SEO",
      },
      en: {
        locale: "en",
        title: "",
        slug: "",
        description: "",
        content: "",
        seo_title: "",
        seo_description: "",
      },
    },
  };

  const articleWithEn: NewsArticle = {
    ...articleOnlyUk,
    id: "art-200",
    locales: {
      ...articleOnlyUk.locales,
      en: {
        locale: "en",
        title: "English News About Robotics",
        slug: "english-news-about-robotics",
        description: "English description",
        content: "<p>Full text in English.</p>",
        seo_title: "English News",
        seo_description: "English SEO description",
      },
    },
  };

  it("Case 1: Correctly identifies articles WITHOUT English translation", () => {
    assert.strictEqual(hasEnglishTranslation(articleOnlyUk), false);
  });

  it("Case 2: Correctly identifies articles WITH English translation", () => {
    assert.strictEqual(hasEnglishTranslation(articleWithEn), true);
  });

  it("Case 3: Safely falls back to Ukrainian title when requested EN locale is missing", () => {
    assert.strictEqual(articleTitle(articleOnlyUk, "en"), "Українська Новина Про Робототехніку");
    assert.strictEqual(articleTitle(articleWithEn, "en"), "English News About Robotics");
  });

  it("Case 4: Safely falls back to Ukrainian slug when requested EN slug is missing", () => {
    assert.strictEqual(articleSlug(articleOnlyUk, "en"), "ukrainska-novyna-pro-robototekhniku");
    assert.strictEqual(articleSlug(articleWithEn, "en"), "english-news-about-robotics");
  });

  it("Case 5: Safely falls back to Ukrainian description when requested EN description is missing", () => {
    assert.strictEqual(articleDescription(articleOnlyUk, "en"), "Опис українською мовою");
    assert.strictEqual(articleDescription(articleWithEn, "en"), "English description");
  });

  it("Case 6: Handles null or undefined articles gracefully", () => {
    assert.strictEqual(hasEnglishTranslation(null), false);
    assert.strictEqual(hasEnglishTranslation(undefined), false);
  });
});
