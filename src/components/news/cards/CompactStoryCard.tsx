import { ArrowUpRight } from "lucide-react";
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

interface CompactStoryCardProps {
  article: NewsArticle;
  locale: Locale;
  index?: number;
}

export const CompactStoryCard = ({
  article,
  locale,
  index = 0,
}: CompactStoryCardProps): JSX.Element => {
  const t = getTranslations(locale);
  const title = articleTitle(article, locale);
  const slug = articleSlug(article, locale);
  const date = article.published_at ?? article.created_at;
  const href = getLocalizedPath(`/news/${slug}`, locale);
  const [imgError, setImgError] = useState(false);

  const hasImage = Boolean(article.image_url) && !imgError;

  return (
    <ScrollReveal variant="fade-up" delay={index * 40}>
      <a
        href={href}
        aria-label={`${t.home.news.readMore}: ${title}`}
        className="group flex items-center gap-4 p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all duration-200 cursor-pointer"
      >
        {/* Cover Thumbnail */}
        {hasImage ? (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
            <img
              src={getFullImageUrl(article.image_url)}
              alt={title}
              width={120}
              height={120}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
            <NewsFallbackCover article={article} variant="thumb" locale={locale} />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-2 mb-1">
            {article.category && (
              <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">
                {categoryName(article.category, locale)}
              </span>
            )}
            {article.category && <span className="text-slate-300 text-xs">•</span>}
            <time dateTime={date} className="text-[11px] text-slate-500 font-medium">
              {formatNewsDate(date, locale)}
            </time>
          </div>

          <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug group-hover:text-blue-700 transition-colors line-clamp-2 mb-1">
            {title}
          </h4>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 group-hover:text-blue-800 mt-auto">
            <span>{t.home.news.readMore}</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </a>
    </ScrollReveal>
  );
};
