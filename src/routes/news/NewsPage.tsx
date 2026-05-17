import { ArrowRight, ArrowUpRight, Calendar } from "lucide-react";
import type { JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { formatArticleDate } from "@/data/articles";
import type { Article } from "@/data/articles";
import type { Locale, Translations } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";

interface NewsPageProps {
  locale?: Locale;
  articles: Article[];
}

const FeaturedMagazineCard = ({ article, locale, t }: { article: Article; locale: Locale; t: Translations }) => (
  <ScrollReveal variant="fade-up" className="w-full">
    <a
      href={getLocalizedPath(`/news/${article.slug}`, locale)}
      className="group relative flex flex-col lg:flex-row w-full bg-gray-900 rounded-[2rem] overflow-hidden isolate shadow-2xl hover:shadow-3xl transition-all duration-500"
    >
      {/* Background Gradient for text area */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-transparent z-0 pointer-events-none hidden lg:block" />
      
      {/* Content Area */}
      <div className="relative z-10 w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center order-2 lg:order-1 bg-gray-900 lg:bg-transparent">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-widest uppercase">
            {t.home.news.weeklyBadge}
          </span>
          <time className="text-gray-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatArticleDate(article.date, locale)}
          </time>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-6 group-hover:text-blue-400 transition-colors duration-300">
          {article.title[locale]}
        </h2>

        <p className="text-gray-400 text-base md:text-lg leading-relaxed line-clamp-3 mb-10 max-w-lg">
          {article.summary[locale]}
        </p>

        <div className="flex items-center gap-3 mt-auto">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
            <ArrowUpRight className="w-5 h-5 text-black group-hover:text-white transition-colors" />
          </div>
          <span className="text-white/90 font-medium group-hover:text-white transition-colors">
            {t.home.news.readMore}
          </span>
        </div>
      </div>

      {/* Image Area */}
      <div className="relative w-full lg:w-1/2 aspect-[4/3] lg:aspect-auto h-64 sm:h-80 lg:h-auto order-1 lg:order-2 overflow-hidden bg-gray-800">
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title[locale]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80 lg:hidden pointer-events-none" />
        {/* Subtle overlay to blend on desktop */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-900 opacity-0 lg:opacity-100 pointer-events-none" />
      </div>
    </a>
  </ScrollReveal>
);

const BentoGridCard = ({ article, locale, t, index }: { article: Article; locale: Locale; t: Translations, index: number }) => (
  <ScrollReveal variant="fade-up" delay={index * 100} className="w-full h-full">
    <a
      href={getLocalizedPath(`/news/${article.slug}`, locale)}
      className="group flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="w-full aspect-[16/10] overflow-hidden bg-gray-100 relative">
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title[locale]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
      </div>
      <div className="p-6 md:p-8 flex flex-col flex-1">
        <time className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3 block">
          {formatArticleDate(article.date, locale)}
        </time>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-blue-600 transition-colors">
          {article.title[locale]}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-6 mt-auto">
          {article.summary[locale]}
        </p>
      </div>
    </a>
  </ScrollReveal>
);

const CompactArticleRow = ({ article, locale, t, index }: { article: Article; locale: Locale; t: Translations, index: number }) => (
  <ScrollReveal variant="fade-up" delay={index * 50}>
    <a
      href={getLocalizedPath(`/news/${article.slug}`, locale)}
      className="group flex items-start sm:items-center gap-4 sm:gap-6 py-5 border-b border-gray-100 hover:bg-gray-50/80 -mx-4 px-4 sm:mx-0 sm:px-4 rounded-2xl transition-colors cursor-pointer"
    >
      <div className="hidden sm:block shrink-0 w-24 aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative">
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt={article.title[locale]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
        <time className="text-gray-400 text-xs font-semibold uppercase tracking-widest sm:w-32 shrink-0">
          {formatArticleDate(article.date, locale)}
        </time>
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 leading-snug group-hover:text-blue-600 transition-colors truncate sm:whitespace-normal sm:line-clamp-2 flex-1">
          {article.title[locale]}
        </h4>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors duration-300">
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </div>
    </a>
  </ScrollReveal>
);

export const NewsPage = ({ locale = "uk", articles }: NewsPageProps): JSX.Element => {
  const t = getTranslations(locale);
  
  const featuredArticle = articles[0];
  const bentoArticles = articles.slice(1, 5); // Next 4 articles
  const compactArticles = articles.slice(5);  // The rest

  return (
    <section className="w-full bg-[#f8fafc] pt-32 md:pt-40 pb-24 md:pb-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[140px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 relative z-10">
        {/* Header */}
        <ScrollReveal variant="fade-up">
          <header className="flex flex-col items-center text-center gap-4 mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 text-xs md:text-sm font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              {t.newsPage.badge}
            </div>
            <h1 className="font-bold text-gray-900 text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] max-w-4xl">
              {t.newsPage.title}
            </h1>
          </header>
        </ScrollReveal>

        {/* 1. Featured Magazine Card */}
        {featuredArticle && (
          <div className="mb-8 md:mb-12">
            <FeaturedMagazineCard article={featuredArticle} locale={locale} t={t} />
          </div>
        )}

        {/* 2. Bento Grid (Trending) */}
        {bentoArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16 md:mb-20">
            {bentoArticles.map((article, index) => (
              <BentoGridCard key={article.slug} article={article} locale={locale} t={t} index={index} />
            ))}
          </div>
        )}

        {/* 3. Compact List (Older News) */}
        {compactArticles.length > 0 && (
          <div className="w-full max-w-4xl mx-auto">
            <ScrollReveal variant="fade-up">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Раніше</h3>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
            </ScrollReveal>
            
            <div className="flex flex-col">
              {compactArticles.map((article, index) => (
                <CompactArticleRow key={article.slug} article={article} locale={locale} t={t} index={index} />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
