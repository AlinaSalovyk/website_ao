import type { JSX } from "react";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { formatAuthorName, formatAuthorPosition, type NewsAuthor } from "@/lib/news-api";

interface ArticleAuthorBlockProps {
  author?: NewsAuthor;
  locale?: Locale;
}

export const ArticleAuthorBlock = ({
  author,
  locale = "uk",
}: ArticleAuthorBlockProps): JSX.Element | null => {
  const t = getTranslations(locale);

  if (!author?.name) return null;

  const displayAuthorName = formatAuthorName(author.name, locale);
  const displayAuthorPosition = formatAuthorPosition(author.position, locale);

  return (
    <div className="flex items-center gap-3.5 pt-4 border-t border-slate-200">
      <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
        {displayAuthorName.charAt(0).toUpperCase()}
      </div>
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          {t.newsPage.authorLabel}
        </span>
        <p className="text-slate-900 text-sm font-bold">
          {displayAuthorName}
        </p>
        {displayAuthorPosition && (
          <p className="text-slate-500 text-xs">
            {displayAuthorPosition}
          </p>
        )}
      </div>
    </div>
  );
};
