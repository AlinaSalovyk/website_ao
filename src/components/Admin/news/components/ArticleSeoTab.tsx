import { Sparkles } from "lucide-react";
import type { JSX } from "react";
import type { ArticleForm } from "../types";
import { GlassCard } from "../../ui";
import { getEffectiveSeoPreview } from "@/utils/seo";

interface ArticleSeoTabProps {
  form: ArticleForm;
  setForm: React.Dispatch<React.SetStateAction<ArticleForm>>;
  activeLocale: "uk" | "en";
  setActiveLocale: (locale: "uk" | "en") => void;
  onAutoFillSEO: (locale: "uk" | "en") => void;
}

export const ArticleSeoTab = ({
  form,
  setForm,
  activeLocale,
  setActiveLocale,
  onAutoFillSEO,
}: ArticleSeoTabProps): JSX.Element => {
  const currentLocaleForm = form.locales[activeLocale];

  const preview = getEffectiveSeoPreview({
    title: currentLocaleForm.title,
    description: currentLocaleForm.description,
    content: currentLocaleForm.content,
    seoTitle: currentLocaleForm.seo_title,
    seoDescription: currentLocaleForm.seo_description,
    fallbackTitle: "Заголовок статті",
    fallbackDescription: "Опис статті з'явиться тут після заповнення.",
  });

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border/50">
        <div>
          <h3 className="font-semibold text-foreground text-base">
            SEO та відображення у пошуку ({activeLocale.toUpperCase()})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Налаштування пошукової оптимізації та картки в соціальних мережах
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAutoFillSEO(activeLocale)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Автозаповнити SEO та Slug</span>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
        Автозаповнення згенерує SEO Title та SEO Description з заголовку й тексту новини, залишаючи ваші ручні редагування без змін.
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            SEO Title ({activeLocale.toUpperCase()})
          </label>
          <input
            value={currentLocaleForm.seo_title}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                locales: {
                  ...f.locales,
                  [activeLocale]: { ...f.locales[activeLocale], seo_title: e.target.value },
                },
              }))
            }
            placeholder="Заголовок для пошуковиків…"
            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm"
          />
          <p className="mt-1 text-[11px] text-muted-foreground ml-1">
            {currentLocaleForm.seo_title.length} символів (рекомендовано ~60)
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            SEO Description ({activeLocale.toUpperCase()})
          </label>
          <textarea
            rows={3}
            value={currentLocaleForm.seo_description}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                locales: {
                  ...f.locales,
                  [activeLocale]: { ...f.locales[activeLocale], seo_description: e.target.value },
                },
              }))
            }
            placeholder="Опис новини для Google та соцмереж…"
            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm"
          />
          <p className="mt-1 text-[11px] text-muted-foreground ml-1">
            {currentLocaleForm.seo_description.length} символів (рекомендовано ~160)
          </p>
        </div>

        {/* Search Engine Result Preview (Google Preview) */}
        <div className="mt-2 pt-5 border-t border-border/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-sm font-bold text-foreground">Попередній перегляд у пошуку</h4>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
              {(["uk", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setActiveLocale(l)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeLocale === l
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-card border border-border/70 rounded-xl shadow-xs">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-1.5 break-all">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {typeof window !== "undefined" ? window.location.host : "example.com"}
                {activeLocale === "uk" ? "/news/" : "/en/news/"}
              </span>
              <span className="text-foreground font-medium">{currentLocaleForm.slug || "slug-url"}</span>
            </div>
            <h3 className="text-lg leading-tight font-semibold text-blue-700 dark:text-blue-400 mb-1 hover:underline cursor-pointer">
              {preview.effectiveTitle}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {preview.effectiveDescription}
            </p>
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground ml-1">
            Фактичний вигляд у пошуковій системі Google або соціальних мережах може відрізнятися залежно від пристрою та запиту.
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
