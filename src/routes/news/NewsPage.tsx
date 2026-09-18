import type { JSX } from "react";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { categoryName, type NewsArticle, type NewsCategory } from "@/lib/news-api";
import { useNewsList } from "@/hooks/useNewsList";
import {
  NewsEmptyState,
  NewsFeedGrid,
  NewsFilterBar,
  NewsHeroBanner,
  NewsHighlightsSection,
  NewsPaginationNav,
} from "@/components/news";

interface NewsPageProps {
  locale?: Locale;
  initialArticles?: unknown[];
  initialTotal?: number;
  initialCategories?: unknown[];
  initialCategoryId?: string;
}

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

  const hasActiveFilters = Boolean(selectedCategory || debouncedSearch);

  return (
    <section className="w-full bg-slate-50 text-slate-900 pt-24 md:pt-32 pb-16 relative overflow-hidden">
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-8 relative z-10">

        {/* ── Header / Hero Banner ── */}
        <NewsHeroBanner
          activeCat={activeCat}
          selectedCategory={selectedCategory}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          locale={locale}
        />

        {/* ── Filters & Category Bar ── */}
        <NewsFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchClear={handleSearchClear}
          categories={categories}
          selectedCategory={selectedCategory}
          handleCategoryChange={handleCategoryChange}
          locale={locale}
        />

        {/* Loading Spinner */}
        {loading && (
          <div aria-busy="true" className="flex justify-center py-20">
            <div className="w-9 h-9 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <NewsEmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => {
              handleSearchClear();
              handleCategoryChange("");
            }}
            locale={locale}
          />
        )}

        {/* ── Highlights Section ── */}
        {!loading && featured && (
          <NewsHighlightsSection
            featured={featured}
            secondaryHighlights={secondaryHighlights}
            locale={locale}
          />
        )}

        {/* ── Main News Feed Grid ── */}
        {!loading && (
          <NewsFeedGrid
            articles={mainFeed.length > 0 ? mainFeed : rest}
            locale={locale}
          />
        )}

        {/* ── Pagination ── */}
        {!loading && (
          <NewsPaginationNav
            page={page}
            totalPages={totalPages}
            isFirstPage={isFirstPage}
            isLastPage={isLastPage}
            setPage={setPage}
            locale={locale}
          />
        )}
      </div>
    </section>
  );
};
