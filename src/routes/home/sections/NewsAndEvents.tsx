import { ArrowRightIcon } from "lucide-react";
import { useEffect, useState, type JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import {
  fetchNewsList,
  hasEnglishTranslation,
  type NewsArticle,
} from "@/lib/news-api";
import { ArticleCard } from "@/components/news/cards/ArticleCard";
import { FeaturedCard } from "@/components/news/cards/FeaturedCard";

export const NewsAndEvents = ({
  locale,
  initialArticles = [],
}: {
  locale?: Locale;
  initialArticles?: NewsArticle[];
}): JSX.Element => {
  const t = getTranslations(locale);
  const currentLocale = locale ?? "uk";
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [loading, setLoading] = useState(initialArticles.length === 0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (initialArticles.length > 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchNewsList({
          locale: currentLocale,
          status: "published",
          limit: 4,
        });
        let fetched = data.articles ?? [];
        if (currentLocale === "en") {
          fetched = fetched.filter((a) => hasEnglishTranslation(a));
        }
        if (isMounted) {
          setArticles(fetched);
        }
      } catch (e) {
        console.error("Failed to load homepage news", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [currentLocale, initialArticles.length]);

  return (
    <section
      id="news"
      className="w-full bg-slate-50 py-16 md:py-24 relative overflow-hidden"
    >
      {/* Background creative flares */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-blue-100/50 rounded-full blur-[80px] md:blur-[120px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <ScrollReveal variant="fade-up">
          <header className="flex flex-col md:flex-row items-start md:items-end justify-between w-full mb-10 md:mb-14 gap-6 md:gap-8">
            <div className="flex flex-col items-start gap-3 w-full md:w-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wide border border-blue-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                {t.home.news.badge}
              </div>
              <h2 className="font-semibold text-slate-900 text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
                {t.home.news.heading}
              </h2>
            </div>

            <a
              href={getLocalizedPath("/news", currentLocale)}
              className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-3.5 rounded-full font-medium text-sm md:text-base hover:bg-blue-700 transition-colors duration-300 w-full md:w-max shadow-xs"
            >
              {t.home.news.allNews}
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </header>
        </ScrollReveal>

        {/* Loading Spinner */}
        {loading && (
          <div aria-busy="true" className="flex justify-center py-20">
            <div className="w-9 h-9 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="flex flex-col gap-6 md:gap-8">
            {articles[0] && (
              <FeaturedCard
                article={articles[0]}
                locale={currentLocale}
              />
            )}

            {articles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(1, 4).map((article, idx) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    locale={currentLocale}
                    index={idx + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
