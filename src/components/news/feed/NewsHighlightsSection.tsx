import type { JSX } from "react";
import type { Locale } from "@/i18n";
import type { NewsArticle } from "@/lib/news-api";
import { CompactStoryCard } from "../cards/CompactStoryCard";
import { FeaturedCard } from "../cards/FeaturedCard";

interface NewsHighlightsSectionProps {
  featured: NewsArticle;
  secondaryHighlights: NewsArticle[];
  locale?: Locale;
}

export const NewsHighlightsSection = ({
  featured,
  secondaryHighlights,
  locale = "uk",
}: NewsHighlightsSectionProps): JSX.Element => {
  return (
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
                {locale === "en" ? "Highlights" : "Важливе"}
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
  );
};
