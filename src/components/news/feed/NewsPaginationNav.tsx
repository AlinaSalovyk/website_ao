import { ChevronLeft, ChevronRight } from "lucide-react";
import type { JSX } from "react";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

interface NewsPaginationNavProps {
  page: number;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  setPage: (p: number | ((prev: number) => number)) => void;
  locale?: Locale;
}

export const NewsPaginationNav = ({
  page,
  totalPages,
  isFirstPage,
  isLastPage,
  setPage,
  locale = "uk",
}: NewsPaginationNavProps): JSX.Element | null => {
  const t = getTranslations(locale);

  if (totalPages <= 1) return null;

  return (
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
  );
};
