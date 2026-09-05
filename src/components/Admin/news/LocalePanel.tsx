import { Check, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

import { checkAdminNewsSlug } from "../api";
import { type LocaleForm, slugify } from "./types";
import { RichTextEditor } from "../ui/RichTextEditor";

export const LocalePanel = ({
  locale,
  value,
  onChange,
  articleId,
}: {
  locale: "uk" | "en";
  value: LocaleForm;
  onChange: (updated: LocaleForm) => void;
  articleId?: string;
}): JSX.Element => {
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugOk, setSlugOk] = useState<boolean | null>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const field = (key: keyof LocaleForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const updated = { ...value, [key]: e.target.value };
    // Auto-fill slug from title on UK locale
    if (key === "title" && locale === "uk" && !value.slug) {
      updated.slug = slugify(e.target.value);
    }
    onChange(updated);
  };

  // Debounce slug availability check
  useEffect(() => {
    if (!value.slug) { setSlugOk(null); return; }
    if (slugTimer.current) clearTimeout(slugTimer.current);
    setSlugChecking(true);
    slugTimer.current = setTimeout(() => {
      checkAdminNewsSlug(locale, value.slug, articleId ?? "")
        .then((res) => setSlugOk(res.available))
        .catch(() => setSlugOk(null))
        .finally(() => setSlugChecking(false));
    }, 500);
    return () => { if (slugTimer.current) clearTimeout(slugTimer.current); };
  }, [value.slug, locale, articleId]);

  const inputCls =
    "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Заголовок ({locale.toUpperCase()}) *
          </label>
          <input
            value={value.title}
            onChange={field("title")}
            placeholder={locale === "uk" ? "Введіть заголовок…" : "Enter title…"}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slug ({locale.toUpperCase()})
          </label>
          <div className="relative">
            <input
              value={value.slug}
              onChange={field("slug")}
              placeholder="slug-url"
              className={`${inputCls} pr-8`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {slugChecking && (
                <RefreshCw size={12} className="text-muted-foreground animate-spin" />
              )}
              {!slugChecking && slugOk === true && (
                <Check size={12} className="text-emerald-500" />
              )}
              {!slugChecking && slugOk === false && (
                <X size={12} className="text-destructive" />
              )}
            </div>
          </div>
          {slugOk === false && (
            <p className="mt-1 text-[11px] text-destructive">
              Цей slug вже зайнятий
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Короткий опис ({locale.toUpperCase()})
        </label>
        <textarea
          rows={2}
          value={value.description}
          onChange={field("description")}
          placeholder={locale === "uk" ? "Короткий опис статті…" : "Short article description…"}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Зміст ({locale.toUpperCase()}) — Rich Text Editor
        </label>
        <RichTextEditor
          content={value.content}
          onChange={(html) => onChange({ ...value, content: html })}
          articleId={articleId}
        />
      </div>

      <details className="group">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1.5">
          <span className="transition-transform group-open:rotate-90">▶</span>
          SEO ({locale.toUpperCase()})
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <input
            value={value.seo_title}
            onChange={field("seo_title")}
            placeholder="SEO Title"
            className={inputCls}
          />
          <input
            value={value.seo_description}
            onChange={field("seo_description")}
            placeholder="SEO Description"
            className={inputCls}
          />
          <input
            value={value.keywords}
            onChange={field("keywords")}
            placeholder="Keywords (через кому)"
            className={inputCls}
          />
        </div>
      </details>
    </div>
  );
};
