import { ArrowUpRight } from "lucide-react";
import type { JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { formatArticleDate, getSortedArticles } from "@/data/articles";
import type { Article } from "@/data/articles";
import type { Locale, Translations } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";

interface NewsPageProps {
  locale?: Locale;
}

const SHOW_THUMBNAILS = false;

const FeaturedArticle = ({
  article,
  locale,
  t,
}: {
  article: Article;
  locale: Locale;
  t: Translations;
}) => (
  <ScrollReveal variant="fade-up" className="w-full">
    <a
      href={getLocalizedPath(`/news/${article.slug}`, locale)}
      aria-label={`${t.home.news.readMore}: ${article.title[locale]}`}
      className="group block rounded-3xl overflow-hidden bg-gray-900 cursor-pointer p-8 md:p-12 lg:p-16 relative isolate"
    >
      {/* Hover overlay — behind text */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] md:text-xs font-semibold tracking-wider uppercase">
            {t.home.news.weeklyBadge}
          </span>
          <time
            dateTime={article.date}
            className="text-white/50 text-xs md:text-sm font-medium"
          >
            {formatArticleDate(article.date, locale)}
          </time>
        </div>

        {SHOW_THUMBNAILS && article.thumbnail && (
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-6 md:mb-8">
            <img
              src={article.thumbnail}
              alt={article.title[locale]}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight mb-4 md:mb-6 max-w-3xl">
          {article.title[locale]}
        </h2>

        <p className="text-white/60 text-sm md:text-base lg:text-lg leading-relaxed line-clamp-3 max-w-2xl mb-8 md:mb-10">
          {article.summary[locale]}
        </p>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
            <ArrowUpRight className="w-5 h-5 text-black group-hover:text-white transition-colors" />
          </div>
          <span className="text-sm md:text-base font-medium text-white/90 group-hover:text-white relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-white group-hover:after:w-full after:transition-all after:duration-300">
            {t.home.news.readMore}
          </span>
        </div>
      </div>
    </a>
  </ScrollReveal>
);

const ArticleRow = ({
  article,
  locale,
  t,
  index,
}: {
  article: Article;
  locale: Locale;
  t: Translations;
  index: number;
}) => (
  <ScrollReveal variant="fade-up" delay={index * 80}>
    <a
      href={getLocalizedPath(`/news/${article.slug}`, locale)}
      aria-label={`${t.home.news.readMore}: ${article.title[locale]}`}
      className="group flex items-start gap-5 md:gap-8 py-8 md:py-10 border-b border-gray-200 last:border-b-0 cursor-pointer"
    >
      {SHOW_THUMBNAILS && article.thumbnail && (
        <div className="hidden sm:block relative w-32 md:w-44 lg:w-56 shrink-0 aspect-[4/3] rounded-xl overflow-hidden">
          <img
            src={article.thumbnail}
            alt={article.title[locale]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <time
          dateTime={article.date}
          className="text-gray-600 text-xs md:text-sm font-medium tracking-wider mb-3"
        >
          {formatArticleDate(article.date, locale)}
        </time>

        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-pure-black tracking-tight leading-snug mb-2 group-hover:text-blue-700 transition-colors duration-300">
          {article.title[locale]}
        </h3>

        <p className="text-gray-500 text-sm md:text-base leading-relaxed line-clamp-2 mb-4">
          {article.summary[locale]}
        </p>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
            <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 group-hover:text-white transition-colors" />
          </div>
          <span className="text-sm font-medium text-gray-500 group-hover:text-blue-700 transition-colors duration-300">
            {t.home.news.readMore}
          </span>
        </div>
      </div>
    </a>
  </ScrollReveal>
);

export const NewsPage = ({ locale = "uk" }: NewsPageProps): JSX.Element => {
  const t = getTranslations(locale);
  const articles = getSortedArticles();
  const [featured, ...rest] = articles;

  return (
    <section className="w-full bg-pure-white pt-32 md:pt-40 pb-16 md:pb-24 relative overflow-hidden">
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 relative z-10">
        {/* Header */}
        <ScrollReveal variant="fade-up">
          <header className="flex flex-col items-start gap-4 mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-pulse" />
              {t.newsPage.badge}
            </div>
            <h1 className="font-semibold text-pure-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1]">
              {t.newsPage.title}
            </h1>
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl">
              {t.newsPage.subtitle}
            </p>
          </header>
        </ScrollReveal>

        {/* Featured Article */}
        {featured && (
          <div className="mb-12 md:mb-16">
            <FeaturedArticle
              article={featured}
              locale={locale}
              t={t}
            />
          </div>
        )}

        {/* Article List */}
        {rest.length > 0 && (
          <div className="flex flex-col bg-pure-white">
            {rest.map((article, index) => (
              <ArticleRow
                key={article.slug}
                article={article}
                locale={locale}
                t={t}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
