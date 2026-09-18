import { Newspaper } from "lucide-react";
import type { JSX } from "react";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

interface NewsEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  locale?: Locale;
}

export const NewsEmptyState = ({
  hasActiveFilters,
  onClearFilters,
  locale = "uk",
}: NewsEmptyStateProps): JSX.Element => {
  const t = getTranslations(locale);

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300 my-6 shadow-xs">
      <Newspaper className="w-10 h-10 text-slate-400" />
      <p className="text-slate-700 text-base font-medium">
        {t.newsPage.noResults}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 rounded-full bg-blue-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
        >
          {t.newsPage.clearFilters}
        </button>
      )}
    </div>
  );
};
