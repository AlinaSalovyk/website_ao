import assert from "node:assert";
import { test, describe } from "node:test";
import { getAlternatePath } from "./config.ts";

describe("getAlternatePath Preview URL Regression Tests", () => {
  test("Case 1: /preview/news/test?preview_session=ABC switch -> EN", () => {
    const result = getAlternatePath("/preview/news/test?preview_session=ABC", "en");
    assert.strictEqual(result, "/preview/news/test?preview_session=ABC&locale=en");
  });

  test("Case 2: /preview/news/test?preview_session=ABC&locale=en switch -> UK", () => {
    const result = getAlternatePath("/preview/news/test?preview_session=ABC&locale=en", "uk");
    assert.strictEqual(result, "/preview/news/test?preview_session=ABC");
  });

  test("Case 3: Additional query params preserved: /preview/news/test?preview_session=ABC&foo=bar switch -> EN", () => {
    const result = getAlternatePath("/preview/news/test?preview_session=ABC&foo=bar", "en");
    assert.strictEqual(result, "/preview/news/test?preview_session=ABC&foo=bar&locale=en");
  });

  test("Case 4: Normal public route uses standard localization behavior: /news/test switch -> EN", () => {
    const result = getAlternatePath("/news/test", "en");
    assert.strictEqual(result, "/en/news/test");
  });

  test("Case 5: Preview route must NEVER become /en/preview/...", () => {
    const result = getAlternatePath("/preview/news/test?preview_session=ABC", "en");
    assert.strictEqual(result.startsWith("/en/preview"), false);
  });
});
