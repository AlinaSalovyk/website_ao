import type { JSX } from "react";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import type { NewsArticle } from "@/lib/news-api";
import { ArticleCard } from "../cards/ArticleCard";

interface NewsFeedGridProps {
  articles: NewsArticle[];
  locale?: Locale;
}

export const NewsFeedGrid = ({
  articles,
  locale = "uk",
}: NewsFeedGridProps): JSX.Element | null => {
  if (articles.length === 0) return null;
  const t = getTranslations(locale);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
        <h3 className="text-lg md:text-xl font-serif font-bold text-slate-900 tracking-tight">
          {t.newsPage.latestArticles}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            locale={locale}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};
