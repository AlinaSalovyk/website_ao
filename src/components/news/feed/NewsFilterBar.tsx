import { Search, X } from "lucide-react";
import type { JSX } from "react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { categoryName, type NewsCategory } from "@/lib/news-api";

interface NewsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  handleSearchClear: () => void;
  categories: NewsCategory[];
  selectedCategory: string;
  handleCategoryChange: (catId: string) => void;
  locale?: Locale;
}

export const NewsFilterBar = ({
  searchQuery,
  setSearchQuery,
  handleSearchClear,
  categories,
  selectedCategory,
  handleCategoryChange,
  locale = "uk",
}: NewsFilterBarProps): JSX.Element => {
  const t = getTranslations(locale);

  return (
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
  );
};
