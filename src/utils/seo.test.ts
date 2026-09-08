import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeText, extractArticleSummary } from "./seo.ts";

describe("normalizeText", () => {
  it("trims strings and handles null/undefined", () => {
    assert.strictEqual(normalizeText("  test  "), "test");
    assert.strictEqual(normalizeText("   "), "");
    assert.strictEqual(normalizeText(null), "");
    assert.strictEqual(normalizeText(undefined), "");
  });
});

describe("extractArticleSummary", () => {
  it("removes HTML tags and normalizes whitespace", () => {
    const html = "<p>This is a <strong>strong</strong> paragraph.</p><ul><li>Item 1</li></ul>";
    assert.strictEqual(extractArticleSummary(html), "This is a strong paragraph. Item 1");
  });

  it("removes script and style contents", () => {
    const html = `<style>.hidden { display: none; }</style><script>alert('xss');</script><p>Clean text</p>`;
    assert.strictEqual(extractArticleSummary(html), "Clean text");
  });

  it("decodes basic HTML entities", () => {
    const html = "<p>100 &lt; 200 &amp; &quot;quote&quot; &nbsp; test&#39;s</p>";
    assert.strictEqual(extractArticleSummary(html), "100 < 200 & \"quote\" test's");
  });

  it("truncates long text at sentence boundary if possible", () => {
    const html = "<p>First sentence here. Second long sentence that pushes the boundary past the limit to test truncation logic properly.</p>";
    // Limit to 40 chars:
    // "First sentence here. Second long sentence that..." -> cut at first sentence
    const res = extractArticleSummary(html, 30);
    assert.strictEqual(res, "First sentence here.");
  });

  it("truncates at word boundary if no suitable sentence boundary is found", () => {
    const html = "<p>This is a very long string without any periods that just keeps going and going until it gets truncated.</p>";
    const res = extractArticleSummary(html, 40);
    assert.strictEqual(res, "This is a very long string without any...");
  });

  it("handles empty or whitespace only inputs safely", () => {
    assert.strictEqual(extractArticleSummary(""), "");
    assert.strictEqual(extractArticleSummary("    <br/>   "), "");
    assert.strictEqual(extractArticleSummary(null as any), "");
  });
});
