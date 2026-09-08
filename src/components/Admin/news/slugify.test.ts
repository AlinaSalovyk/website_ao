import { describe, it } from "node:test";
import assert from "node:assert";
import { slugify } from "./types.ts";

describe("slugify", () => {
  it("converts simple ascii text", () => {
    assert.strictEqual(slugify("Hello World"), "hello-world");
    assert.strictEqual(slugify("This is a Test"), "this-is-a-test");
  });

  it("handles cyrillic text according to ДСТУ 9112:2021", () => {
    assert.strictEqual(slugify("Новий корпус"), "novyi-korpus");
    assert.strictEqual(slugify("Острозька академія"), "ostrozka-akademiia");
    assert.strictEqual(slugify("Європа"), "ievropa");
    assert.strictEqual(slugify("Ґудзик"), "gudzyk");
    assert.strictEqual(slugify("Щука"), "shchuka");
  });

  it("removes non-word characters and handles numbers", () => {
    assert.strictEqual(slugify("Test #123!"), "test-123");
    assert.strictEqual(slugify("Звіт 2026"), "zvit-2026");
  });

  it("collapses and trims hyphens", () => {
    assert.strictEqual(slugify("  Text   with   spaces  "), "text-with-spaces");
    assert.strictEqual(slugify("---test---test---"), "test-test");
  });

  it("truncates long unbroken strings to 100 chars without error", () => {
    const longString = "A".repeat(120);
    assert.strictEqual(slugify(longString).length, 100);
  });

  it("handles UK long title with soft token truncation", () => {
    const title = "Першокурсникам Острозької академії розповіли про бібліотечно-інформаційні ресурси й сервіси університетської бібліотеки";
    const result = slugify(title);
    assert.strictEqual(result, "pershokursnykam-ostrozkoi-akademii-rozpovily-pro-bibliotechno-informatsiini-resursy-i-servisy");
    assert.ok(result.length <= 100);
    assert.ok(!result.endsWith("-"));
    assert.ok(!result.includes("--"));
  });

  it("handles EN long title with soft token truncation", () => {
    const title = "The freshmen of the Ostrom Academy told me about library information and university library services";
    const result = slugify(title);
    assert.strictEqual(result, "the-freshmen-of-the-ostrom-academy-told-me-about-library-information-and-university-library-services");
    assert.ok(result.length <= 100);
    assert.ok(!result.endsWith("-"));
  });
  
  it("handles empty or null string safely", () => {
    assert.strictEqual(slugify(""), "");
    assert.strictEqual(slugify(null as any), "");
  });
});
