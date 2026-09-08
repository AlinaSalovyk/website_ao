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

interface FeaturedCardProps {
  article: NewsArticle;
  locale: Locale;
}

export const FeaturedCard = ({
  article,
  locale,
}: FeaturedCardProps): JSX.Element => {
  const t = getTranslations(locale);
  const title = articleTitle(article, locale);
  const description = articleDescription(article, locale);
  const slug = articleSlug(article, locale);
  const date = article.published_at ?? article.created_at;
  const href = getLocalizedPath(`/news/${slug}`, locale);
  const [imgError, setImgError] = useState(false);

  const hasImage = Boolean(article.image_url) && !imgError;

  return (
    <ScrollReveal variant="fade-up" className="w-full">
      <a
        href={href}
        aria-label={`${t.home.news.readMore}: ${title}`}
        className="group block rounded-2xl overflow-hidden bg-white border border-slate-200/90 hover:border-slate-300 transition-all duration-300 cursor-pointer relative isolate shadow-xs hover:shadow-md"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Cover Media */}
          {hasImage ? (
            <div className="lg:col-span-7 relative w-full aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200/60 min-h-[260px]">
              <img
                src={getFullImageUrl(article.image_url)}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
                decoding="async"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="lg:col-span-7 relative w-full aspect-[16/10] lg:aspect-auto border-b lg:border-b-0 lg:border-r border-slate-200/60 overflow-hidden min-h-[260px]">
              <NewsFallbackCover article={article} variant="hero" locale={locale} />
            </div>
          )}

          {/* Content Block */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Badges & Meta */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wider uppercase border border-blue-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  {article.category ? categoryName(article.category, locale) : t.home.news.weeklyBadge}
                </span>

                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium ml-auto sm:ml-0">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <time dateTime={date}>{formatNewsDate(date, locale)}</time>
                </div>
              </div>

              {/* Headline */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-slate-900 tracking-tight leading-snug mb-3 group-hover:text-blue-700 transition-colors">
                {title}
              </h2>

              {/* Description */}
              {description && (
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-6 font-normal">
                  {description}
                </p>
              )}
            </div>

            {/* Author & CTA Button */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-4">
              {article.author?.name ? (
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px]">
                    <User className="w-3 h-3 text-slate-500" />
                  </div>
                  <span>{article.author.name}</span>
                </div>
              ) : <div />}

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs group-hover:bg-blue-700 transition-colors shadow-xs">
                <span>{t.home.news.readMore}</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </a>
    </ScrollReveal>
  );
};
