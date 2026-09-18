import { ChevronLeft } from "lucide-react";
import type { JSX, MouseEvent } from "react";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import { categoryName, categorySlug, type NewsArticle } from "@/lib/news-api";

interface ArticleBreadcrumbsProps {
  article: NewsArticle;
  locale?: Locale;
}

export const ArticleBreadcrumbs = ({
  article,
  locale = "uk",
}: ArticleBreadcrumbsProps): JSX.Element => {
  const t = getTranslations(locale);

  const handleSmartBack = (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          e.preventDefault();
          window.history.back();
        }
      } catch {
        // Fallback to normal anchor navigation
      }
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200/90 w-full"
    >
      <a
        href={getLocalizedPath("/news", locale)}
        onClick={handleSmartBack}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 cursor-pointer group"
      >
        <ChevronLeft className="w-4 h-4 text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
        <span>{t.newsPage.backToNews}</span>
      </a>

      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
        <a href={getLocalizedPath("/", locale)} className="hover:text-blue-600 transition-colors">
          {t.nav.home}
        </a>
        <span className="text-slate-300 font-bold">/</span>
        <a href={getLocalizedPath("/news", locale)} className="hover:text-blue-600 transition-colors">
          {t.nav.news}
        </a>
        {article.category && (
          <>
            <span className="text-slate-300 font-bold">/</span>
            <a
              href={getLocalizedPath(`/news/category/${categorySlug(article.category, locale)}`, locale)}
              className="text-slate-900 font-bold px-2 py-0.5 bg-slate-200/60 rounded-md hover:text-blue-600 transition-colors max-w-[200px] truncate"
            >
              {categoryName(article.category, locale)}
            </a>
          </>
        )}
      </div>
    </nav>
  );
};
