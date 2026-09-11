import { Check, RefreshCw, X, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

import { getEffectiveSeoPreview } from "@/utils/seo";
import { checkAdminNewsSlug } from "../api";
import { type LocaleForm, slugify } from "./types";
import { RichTextEditor } from "../ui/RichTextEditor";

export const LocalePanel = ({
  locale,
  value,
  onChange,
  articleId,
  isSlugManuallyEdited,
  setIsSlugManuallyEdited,
  onAutoFill,
  fieldErrors,
}: {
  locale: "uk" | "en";
  value: LocaleForm;
  onChange: (updated: LocaleForm) => void;
  articleId?: string;
  isSlugManuallyEdited: { uk: boolean; en: boolean };
  setIsSlugManuallyEdited: React.Dispatch<React.SetStateAction<{ uk: boolean; en: boolean }>>;
  onAutoFill: () => void;
  fieldErrors?: Record<string, string>;
}): JSX.Element => {
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugOk, setSlugOk] = useState<boolean | null>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleErr = fieldErrors?.[`title_${locale}`] || (locale === "uk" ? fieldErrors?.title : undefined);
  const slugErr = fieldErrors?.[`slug_${locale}`] || (locale === "uk" ? fieldErrors?.slug : undefined);
  const contentErr = fieldErrors?.[`content_${locale}`] || (locale === "uk" ? fieldErrors?.content : undefined);

  const field = (key: keyof LocaleForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const updated = { ...value, [key]: e.target.value };
    
    if (key === "slug") {
      setIsSlugManuallyEdited((prev) => ({ ...prev, [locale]: true }));
    }

    // Auto-fill slug from title if not manually edited
    if (key === "title" && !isSlugManuallyEdited[locale]) {
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
        <div data-field-error={`title_${locale}`} className={titleErr ? "has-error" : ""}>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Заголовок ({locale.toUpperCase()}) *
          </label>
          <input
            value={value.title}
            onChange={field("title")}
            placeholder={locale === "uk" ? "Введіть заголовок…" : "Enter title…"}
            className={`${inputCls} ${titleErr ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20 dark:bg-red-950/10" : ""}`}
          />
          {titleErr && (
            <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
              <span>⚠</span> {titleErr}
            </p>
          )}
        </div>

        <div data-field-error={`slug_${locale}`} className={slugErr ? "has-error" : ""}>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slug ({locale.toUpperCase()})
          </label>
          <div className="relative">
            <input
              value={value.slug}
              onChange={field("slug")}
              placeholder="slug-url"
              className={`${inputCls} pr-8 ${slugErr ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20 dark:bg-red-950/10" : ""}`}
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
          {slugErr ? (
            <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
              <span>⚠</span> {slugErr}
            </p>
          ) : slugOk === false ? (
            <p className="mt-1 text-[11px] text-destructive">
              Цей slug вже зайнятий
            </p>
          ) : null}
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

      <div data-field-error={`content_${locale}`} className={contentErr ? "has-error" : ""}>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Зміст ({locale.toUpperCase()}) — Rich Text Editor *
        </label>
        <div className={contentErr ? "rounded-xl border-2 border-red-500/80 p-0.5" : ""}>
          <RichTextEditor
            content={value.content}
            onChange={(html) => onChange({ ...value, content: html })}
            articleId={articleId}
          />
        </div>
        {contentErr && (
          <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
            <span>⚠</span> {contentErr}
          </p>
        )}
      </div>

      <div className="border border-border/60 rounded-xl bg-card overflow-hidden mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 px-5 py-4 border-b border-border/60">
          <div>
            <h3 className="font-semibold text-foreground">SEO ({locale.toUpperCase()})</h3>
            <p className="text-xs text-muted-foreground mt-1">Налаштування відображення у пошуку</p>
          </div>
          <button
            type="button"
            onClick={onAutoFill}
            aria-label="Автозаповнити SEO та Slug"
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <Sparkles size={16} aria-hidden="true" focusable="false" />
            <span>Автозаповнити SEO та Slug</span>
          </button>
        </div>
        
        <div className="px-5 py-3 bg-indigo-500/5 border-b border-indigo-500/10">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            💡 Автоматично заповнить лише порожні SEO-поля та Slug.
          </p>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SEO Title
            </label>
            <input
              value={value.seo_title}
              onChange={field("seo_title")}
              placeholder="SEO Title"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-muted-foreground ml-1">
              {value.seo_title.length} символів (рекомендовано ~60)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SEO Description
            </label>
            <textarea
              rows={2}
              value={value.seo_description}
              onChange={field("seo_description")}
              placeholder="SEO Description"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-muted-foreground ml-1">
              {value.seo_description.length} символів (рекомендовано ~160)
            </p>
          </div>

          <div className="mt-2 pt-5 border-t border-border/60">
            <h4 className="text-sm font-medium mb-3 text-foreground">Попередній перегляд у пошуку</h4>
            
            <div className="p-4 bg-background border border-border/60 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-1 break-all">
                <span>{typeof window !== 'undefined' ? window.location.host : 'example.com'}{locale === 'uk' ? '/news/' : '/en/news/'}</span>
                <span className="text-foreground font-medium">{value.slug || "slug"}</span>
              </div>
              <h3 className="text-lg leading-tight font-medium text-blue-700 dark:text-blue-400 mb-1 truncate">
                {(() => {
                  const preview = getEffectiveSeoPreview({
                    title: value.title,
                    description: value.description,
                    content: value.content,
                    seoTitle: value.seo_title,
                    seoDescription: value.seo_description,
                    fallbackTitle: "Заголовок статті",
                    fallbackDescription: "Опис статті з'явиться тут після заповнення."
                  });
                  return preview.effectiveTitle;
                })()}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {(() => {
                  const preview = getEffectiveSeoPreview({
                    title: value.title,
                    description: value.description,
                    content: value.content,
                    seoTitle: value.seo_title,
                    seoDescription: value.seo_description,
                    fallbackTitle: "Заголовок статті",
                    fallbackDescription: "Опис статті з'явиться тут після заповнення."
                  });
                  return preview.effectiveDescription;
                })()}
              </p>
            </div>
            {locale === 'en' && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Примітка: публічний EN-роутинг ще знаходиться в розробці. Фактичний вигляд у пошуковій системі може відрізнятися.
              </p>
            )}
            {locale === 'uk' && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Фактичний вигляд у пошуковій системі може відрізнятися.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
