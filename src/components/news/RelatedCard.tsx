import { ArrowUpRight, Calendar } from "lucide-react";
import { useState, type JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import {
  articleSlug,
  articleTitle,
  categoryName,
  formatNewsDate,
  getFullImageUrl,
  type NewsArticle,
} from "@/lib/news-api";
import { NewsFallbackCover } from "./NewsFallbackCover";

interface RelatedCardProps {
  article: NewsArticle;
  locale: Locale;
  index: number;
}

export const RelatedCard = ({
  article,
  locale,
  index,
}: RelatedCardProps): JSX.Element => {
  const t = getTranslations(locale);
  const title = articleTitle(article, locale);
  const slug = articleSlug(article, locale);
  const date = article.published_at ?? article.created_at;
  const href = getLocalizedPath(`/news/${slug}`, locale);
  const [imgError, setImgError] = useState(false);

  const hasImage = Boolean(article.image_url) && !imgError;

  return (
    <ScrollReveal
      variant="fade-up"
      delay={index * 60}
      className="w-full h-full"
    >
      <a
        href={href}
        aria-label={`${t.home.news.readMore}: ${title}`}
        className="flex flex-col w-full h-full rounded-xl overflow-hidden group cursor-pointer border border-slate-200/90 hover:border-slate-300 bg-white shadow-xs hover:shadow-md transition-all duration-300"
      >
        {/* Cover image */}
        {hasImage ? (
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
            <img
              src={getFullImageUrl(article.image_url)}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <NewsFallbackCover article={article} variant="card" locale={locale} />
        )}

        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 w-full mb-2.5">
              {article.category && (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold tracking-wider uppercase border border-blue-200/80">
                  {categoryName(article.category, locale)}
                </span>
              )}
              <div className="flex items-center gap-1 text-slate-500 text-xs font-medium ml-auto">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <time dateTime={date}>{formatNewsDate(date, locale)}</time>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 group-hover:text-blue-800 pt-4 mt-3 border-t border-slate-100">
            <span>{t.home.news.readMore}</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </a>
    </ScrollReveal>
  );
};
