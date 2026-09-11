import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Newspaper, Search, X } from "lucide-react";
import type { JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { categoryName, getCategoryCoverUrl, getFullImageUrl, type NewsArticle, type NewsCategory } from "@/lib/news-api";

interface NewsPageProps {
  locale?: Locale;
  initialArticles?: unknown[];
  initialTotal?: number;
  initialCategories?: unknown[];
  initialCategoryId?: string;
}

import { ArticleCard } from "@/components/news/ArticleCard";
import { CompactStoryCard } from "@/components/news/CompactStoryCard";
import { FeaturedCard } from "@/components/news/FeaturedCard";
import { useNewsList } from "@/hooks/useNewsList";

const LIMIT = 12;

export const NewsPage = ({
  locale = "uk",
  initialArticles = [],
  initialTotal = 0,
  initialCategories = [],
  initialCategoryId = "",
}: NewsPageProps): JSX.Element => {
  const t = getTranslations(locale);

  const {
    articles,
    categories,
    page,
    setPage,
    totalPages,
    isFirstPage,
    isLastPage,
    selectedCategory,
    handleCategoryChange,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    handleSearchClear,
    loading,
  } = useNewsList({
    locale,
    initialArticles: initialArticles as NewsArticle[],
    initialTotal,
    initialCategories: initialCategories as NewsCategory[],
    limit: LIMIT,
    initialCategoryId,
  });

  const [featured, ...rest] = articles;
  const secondaryHighlights = rest.slice(0, 3);
  const mainFeed = rest.slice(3);

  const activeCat = categories.find((c) => c.id === selectedCategory);
  const pageTitle = activeCat 
    ? categoryName(activeCat, locale) 
    : t.newsPage.title;
  const pageSubtitle = activeCat 
    ? activeCat.locales[locale]?.description || activeCat.locales["uk"]?.description || ""
    : t.newsPage.subtitle;

  return (
    <section className="w-full bg-slate-50 text-slate-900 pt-24 md:pt-32 pb-16 relative overflow-hidden">
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-8 relative z-10">

        {/* ── Header / Hero Banner ── */}
        <ScrollReveal variant="fade-up">
          <header className="flex flex-col items-start gap-3 mb-8 w-full">
            <AnimatePresence mode="wait">
              {activeCat?.cover_image ? (
                <motion.div
                  key={`banner-${selectedCategory}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  <div className="w-full h-56 sm:h-72 md:h-[320px] rounded-2xl overflow-hidden mb-2 relative shadow-xs border border-slate-200 group bg-slate-100">
                    <img 
                      src={getCategoryCoverUrl(activeCat.cover_image)} 
                      alt="" 
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-105 pointer-events-none select-none"
                    />

                    <img 
                      src={getCategoryCoverUrl(activeCat.cover_image)} 
                      alt={pageTitle} 
                      className={`relative z-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015] ${
                        (activeCat as any)?.cover_position === "top"
                          ? "object-top"
                          : (activeCat as any)?.cover_position === "bottom"
                          ? "object-bottom"
                          : "object-[center_35%]"
                      }`}
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        if (activeCat.cover_image) {
                          img.src = getFullImageUrl(activeCat.cover_image);
                        }
                      }}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent z-10 pointer-events-none" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/90 text-white text-[10px] font-bold tracking-wider uppercase mb-2 backdrop-blur-md border border-blue-400/30">
                         <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                         {t.newsPage.badge}
                       </div>
                       <h1 className="font-serif font-bold text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">
                          {pageTitle}
                       </h1>
                       {pageSubtitle && (
                         <p className="text-slate-200 text-sm sm:text-base max-w-2xl mt-2 font-normal">
                           {pageSubtitle}
                         </p>
                       )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="all-header"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="flex flex-col items-start gap-2.5 w-full"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    {t.newsPage.badge}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full shrink-0" />
                    <h1 className="font-serif font-bold text-slate-900 text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
                      {pageTitle}
                    </h1>
                  </div>
                  {pageSubtitle && (
                    <p className="text-slate-600 text-sm sm:text-base max-w-2xl font-normal">
                      {pageSubtitle}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </header>
        </ScrollReveal>

        {/* ── Filters & Category Bar ── */}
        <ScrollReveal variant="fade-up" delay={50}>
          <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-10 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.newsPage.searchPlaceholder}
                aria-label={t.newsPage.searchLabel}
                className="w-full pl-10 pr-10 py-2 rounded-full border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={handleSearchClear}
                  aria-label={t.newsPage.clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => handleCategoryChange("")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                    selectedCategory === ""
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {t.newsPage.filterAll}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                      selectedCategory === cat.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {categoryName(cat, locale)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Loading Spinner */}
        {loading && (
          <div aria-busy="true" className="flex justify-center py-20">
            <div className="w-9 h-9 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300 my-6 shadow-xs">
            <Newspaper className="w-10 h-10 text-slate-400" />
            <p className="text-slate-700 text-base font-medium">
              {t.newsPage.noResults}
            </p>
            {(selectedCategory || debouncedSearch) && (
              <button
                onClick={() => {
                  handleSearchClear();
                  handleCategoryChange("");
                }}
                className="px-4 py-2 rounded-full bg-blue-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
              >
                {t.newsPage.clearFilters}
              </button>
            )}
          </div>
        )}

        {/* ── Top Story & Secondary Highlights Section (Google News Balance) ── */}
        {!loading && featured && (
          <div className="mb-10 md:mb-14">
            {secondaryHighlights.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-7 xl:col-span-8">
                  <FeaturedCard article={featured} locale={locale} />
                </div>
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-0.5 px-1">
                    <div className="w-1 h-3.5 bg-blue-600 rounded-full" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Важливе / Highlights
                    </span>
                  </div>
                  {secondaryHighlights.map((story, i) => (
                    <CompactStoryCard
                      key={story.id}
                      article={story}
                      locale={locale}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <FeaturedCard article={featured} locale={locale} />
            )}
          </div>
        )}

        {/* ── Main News Feed Grid ── */}
        {!loading && (mainFeed.length > 0 || (rest.length > 0 && secondaryHighlights.length === 0)) && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
              <h3 className="text-lg md:text-xl font-serif font-bold text-slate-900 tracking-tight">
                Останні матеріали
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(mainFeed.length > 0 ? mainFeed : rest).map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  locale={locale}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <nav
            aria-label={t.newsPage.pagination}
            className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-slate-200"
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={isFirstPage}
              aria-label={t.newsPage.prevPage}
              className="w-9 h-9 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-full text-xs font-bold transition cursor-pointer border ${
                  page === p
                    ? "bg-blue-700 border-blue-700 text-white shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={isLastPage}
              aria-label={t.newsPage.nextPage}
              className="w-9 h-9 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
};
