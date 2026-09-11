import React, { useState, useRef, useEffect } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Calendar, User, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import {
  articleSlug,
  articleTitle,
  categoryName,
  formatAuthorName,
  formatNewsDate,
  getFullImageUrl,
  type NewsArticle,
} from "@/lib/news-api";
import { NewsFallbackCover } from "./NewsFallbackCover";

interface RelatedNewsSliderProps {
  articles: NewsArticle[];
  locale: Locale;
}

export function RelatedNewsSlider({ articles, locale }: RelatedNewsSliderProps) {
  const t = getTranslations(locale);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!articles || articles.length === 0) return null;

  // Extract unique categories for filter tabs
  const categoryMap = new Map<string, string>();
  articles.forEach((art) => {
    if (art.category) {
      const name = categoryName(art.category, locale);
      if (name) categoryMap.set(art.category.id, name);
    }
  });

  const categoryTabs = [
    { id: "all", label: locale === "en" ? "All" : "Усі" },
    ...Array.from(categoryMap.entries()).map(([id, label]) => ({ id, label })),
  ];

  // Filter articles based on active tab
  const filteredArticles = articles.filter(
    (art) => activeTab === "all" || art.category_id === activeTab
  );

  const [visibleItems, setVisibleItems] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVisibleItems(3);
      } else if (window.innerWidth >= 640) {
        setVisibleItems(2);
      } else {
        setVisibleItems(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIdx = Math.max(0, filteredArticles.length - visibleItems);
  const totalDots = maxIdx + 1;

  const handleNext = () => {
    if (totalDots <= 1) return;
    setCurrentIdx((prev) => (prev < maxIdx ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (totalDots <= 1) return;
    setCurrentIdx((prev) => (prev > 0 ? prev - 1 : maxIdx));
  };

  // Scroll carousel to active index
  useEffect(() => {
    if (sliderRef.current && sliderRef.current.children.length > 0) {
      const card = sliderRef.current.children[0] as HTMLElement;
      if (card) {
        const cardWidth = card.clientWidth + 24; // card width + flex gap
        sliderRef.current.scrollTo({
          left: currentIdx * cardWidth,
          behavior: "smooth",
        });
      }
    }
  }, [currentIdx]);

  // Reset index when tab changes
  useEffect(() => {
    setCurrentIdx(0);
  }, [activeTab]);

  return (
    <div className="w-full select-none">
      {/* Header Tabs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        {categoryTabs.length > 1 ? (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:text-blue-700 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-2xs"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 ml-auto">
          {/* All News link */}
          <a
            href={getLocalizedPath("/news", locale)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors group"
          >
            <span>{locale === "en" ? "Explore all" : "Усі новини"}</span>
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </a>
        </div>
      </div>

      {/* Slider Carousel Container */}
      <div
        ref={sliderRef}
        className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {filteredArticles.map((art) => {
          const title = articleTitle(art, locale);
          const slug = articleSlug(art, locale);
          const href = getLocalizedPath(`/news/${slug}`, locale);
          const date = art.published_at || art.created_at;
          const catName = categoryName(art.category, locale);
          const authorName = formatAuthorName(art.author?.name, locale);

          return (
            <a
              key={art.id}
              href={href}
              className="w-full sm:w-[48%] lg:w-[31.8%] shrink-0 snap-start group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200/90 bg-white hover:border-blue-400 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              {/* Top Image Banner Container */}
              <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-100 shrink-0">
                {art.image_url ? (
                  <img
                    src={getFullImageUrl(art.image_url)}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <NewsFallbackCover article={art} variant="card" locale={locale} />
                )}

                {/* Subtle gradient vignette at bottom of image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-60" />

                {/* Top Badges: Category Left, Date Right */}
                <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between gap-2">
                  {catName ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full text-[10px] font-bold text-blue-700 uppercase tracking-wider shadow-xs">
                      <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                      <span>{catName}</span>
                    </span>
                  ) : (
                    <div />
                  )}

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full text-[10px] font-semibold text-slate-700 shadow-xs">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>{formatNewsDate(date, locale)}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Content Body */}
              <div className="p-5 flex flex-col justify-between flex-1 bg-white">
                <div>
                  {/* Author Line */}
                  {authorName && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate">{authorName}</span>
                    </div>
                  )}

                  {/* Article Title */}
                  <h3
                    className="font-serif text-slate-900 font-bold text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors"
                    title={title}
                  >
                    {title}
                  </h3>
                </div>

                {/* Footer Read More Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200">
                    <span>{t.home.news.readMore}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>

                  <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Navigation Footer Controls - Only shown when items overflow visible screen width */}
      {totalDots > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/90 relative z-20">
          {/* Step Indicators with white backdrop pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            {Array.from({ length: totalDots }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIdx === idx
                    ? "w-6 bg-blue-600 shadow-2xs"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>

          {/* Arrow Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-slate-200/90 bg-white hover:bg-blue-600 hover:border-blue-600 text-slate-700 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-slate-200/90 bg-white hover:bg-blue-600 hover:border-blue-600 text-slate-700 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

