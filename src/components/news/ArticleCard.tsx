import { ArrowUpRight, Calendar, User } from "lucide-react";
import { useState, type JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import {
  articleDescription,
  articleSlug,
  articleTitle,
  categoryName,
  formatNewsDate,
  getFullImageUrl,
  type NewsArticle,
} from "@/lib/news-api";
import { NewsFallbackCover } from "./NewsFallbackCover";

interface ArticleCardProps {
  article: NewsArticle;
  locale: Locale;
  index: number;
}

export const ArticleCard = ({
  article,
  locale,
  index,
}: ArticleCardProps): JSX.Element => {
  const t = getTranslations(locale);
  const title = articleTitle(article, locale);
  const description = articleDescription(article, locale);
  const slug = articleSlug(article, locale);
  const date = article.published_at ?? article.created_at;
  const href = getLocalizedPath(`/news/${slug}`, locale);
  const [imgError, setImgError] = useState(false);

  const hasImage = Boolean(article.image_url) && !imgError;

  return (
    <ScrollReveal variant="fade-up" delay={index * 30} className="h-full">
      <a
        href={href}
        aria-label={`${t.home.news.readMore}: ${title}`}
        className="group flex flex-col h-full rounded-xl overflow-hidden bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-300 cursor-pointer isolate shadow-xs"
      >
        {/* Cover Thumbnail */}
        {hasImage ? (
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
            <img
              src={getFullImageUrl(article.image_url)}
              alt={title}
              width={640}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
            {article.category && (
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-blue-700 text-[10px] font-bold tracking-wider uppercase shadow-xs border border-slate-200">
                  {categoryName(article.category, locale)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <NewsFallbackCover article={article} variant="card" locale={locale} />
        )}

        {/* Content Body */}
        <div className="flex flex-col flex-1 p-5">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-2.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <time dateTime={date}>{formatNewsDate(date, locale)}</time>
            </span>
            {article.author?.name && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 line-clamp-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {article.author.name}
                </span>
              </>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-2 group-hover:text-blue-700 transition-colors duration-200 line-clamp-2">
            {title}
          </h3>

          {description && (
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 flex-1 font-normal">
              {description}
            </p>
          )}

          {/* Footer Action Link */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
            <span className="text-xs font-bold text-blue-700 group-hover:text-blue-800 flex items-center gap-1.5 tracking-wide">
              {t.home.news.readMore}
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </a>
    </ScrollReveal>
  );
};
