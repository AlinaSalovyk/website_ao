import { Calendar } from "lucide-react";
import type { JSX } from "react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import {
  articleDescription,
  articleTitle,
  categoryName,
  formatNewsDate,
  type NewsArticle,
} from "@/lib/news-api";
import { ArticleAuthorBlock } from "./ArticleAuthorBlock";

interface ArticleHeaderProps {
  article: NewsArticle;
  locale?: Locale;
}

export const ArticleHeader = ({
  article,
  locale = "uk",
}: ArticleHeaderProps): JSX.Element => {
  const title = articleTitle(article, locale);
  const description = articleDescription(article, locale);
  const rawDate = article.published_at || article.publish_at || article.created_at || article.updated_at;
  const date = (rawDate && !rawDate.startsWith("0001")) ? rawDate : (article.created_at || article.updated_at || new Date().toISOString());

  return (
    <header className="flex flex-col gap-6 mb-8 md:mb-12">
      <ScrollReveal variant="fade-up">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {article.category && (
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider uppercase">
              {categoryName(article.category, locale)}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <time dateTime={date}>{formatNewsDate(date, locale)}</time>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-serif font-bold text-slate-900 tracking-tight leading-[1.18] mb-5">
          {title}
        </h1>

        {description && (
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-normal max-w-3xl mb-6 border-l-2 border-blue-600 pl-4 py-1">
            {description}
          </p>
        )}

        <ArticleAuthorBlock author={article.author} locale={locale} />
      </ScrollReveal>
    </header>
  );
};
