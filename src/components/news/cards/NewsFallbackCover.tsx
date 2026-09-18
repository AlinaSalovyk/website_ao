import { Activity, BookOpen, Newspaper, Sparkles } from "lucide-react";
import type { JSX } from "react";
import type { NewsArticle } from "@/lib/news-api";
import { categoryName } from "@/lib/news-api";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";

interface NewsFallbackCoverProps {
  article: NewsArticle;
  variant?: "hero" | "card" | "thumb" | "bg";
  locale?: Locale;
  className?: string;
}

// Generate deterministic gradient & pattern based on article ID/title
function getDeterministicIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const GRADIENTS = [
  "from-blue-600 via-blue-700 to-indigo-800",
  "from-indigo-600 via-blue-600 to-sky-700",
  "from-blue-700 via-indigo-700 to-slate-800",
  "from-sky-600 via-blue-700 to-indigo-800",
  "from-indigo-700 via-purple-700 to-blue-800",
];

const ICONS = [Newspaper, Sparkles, BookOpen, Activity];

export const NewsFallbackCover = ({
  article,
  variant = "card",
  locale = "uk",
  className = "",
}: NewsFallbackCoverProps): JSX.Element => {
  const seed = article.id || article.locales?.[locale]?.title || "article";
  const index = getDeterministicIndex(seed);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const IconComponent = ICONS[index % ICONS.length];
  const catName = article.category ? categoryName(article.category, locale) : "";
  const t = getTranslations(locale);
  const labels = t.home.news.fallbackCover;

  if (variant === "bg") {
    return (
      <div
        className={cn(
          `absolute inset-0 w-full h-full bg-gradient-to-br ${gradient} overflow-hidden select-none`,
          className
        )}
      >
        {/* Ambient Glow & Radial Spot */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/25 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        {/* Decorative Grid Lines SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={`bg-grid-${seed}`}
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 28 0 L 0 0 0 28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-white"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bg-grid-${seed})`} />
        </svg>

        {/* Center Watermark & Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 group-hover:scale-105 transition-transform duration-700">
          <div className="relative flex items-center justify-center">
            <span className="text-7xl sm:text-8xl md:text-9xl font-serif font-black text-white/20 select-none tracking-tighter block leading-none drop-shadow-md">
              NEWS
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl">
                <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`relative w-full h-full min-h-[280px] lg:min-h-[340px] bg-gradient-to-br ${gradient} flex flex-col justify-between p-6 sm:p-8 md:p-10 overflow-hidden select-none ${className}`}>
        {/* Ambient Glow & Radial Spot */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        {/* Decorative Grid Lines SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" className="text-white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Top Bar inside Hero Graphic */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold tracking-widest uppercase">
            <IconComponent className="w-3.5 h-3.5 text-blue-300" />
            <span>{labels.institute}</span>
          </div>

          {catName && (
            <span className="px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-200 text-[11px] font-bold tracking-wider uppercase">
              {catName}
            </span>
          )}
        </div>

        {/* Center Watermark & Quote Art */}
        <div className="relative z-10 my-auto py-6 flex items-center justify-center text-center">
          <div className="relative">
            <span className="text-6xl sm:text-7xl lg:text-8xl font-serif font-black text-white/10 select-none tracking-tighter block leading-none">
              NEWS
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-xl">
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Accent line */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold text-slate-300/80 border-t border-white/10 pt-3">
          <span className="tracking-wider uppercase">{labels.official}</span>
          <span className="flex items-center gap-1.5 text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {labels.actual}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "thumb") {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center p-2 overflow-hidden select-none rounded-lg border border-slate-200/60 ${className}`}>
        {/* Subtle Ambient Radial */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xs">
          <IconComponent className="w-4 h-4 text-blue-200" />
        </div>
      </div>
    );
  }

  // Default "card" variant
  return (
    <div className={`relative w-full aspect-[16/10] bg-gradient-to-br ${gradient} flex flex-col justify-between p-5 overflow-hidden select-none ${className}`}>
      {/* Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Pattern Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="card-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-grid)" />
      </svg>

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-widest uppercase">
          <IconComponent className="w-3 h-3 text-blue-300" />
          <span>{labels.itb}</span>
        </div>
        {catName && (
          <span className="text-[10px] font-bold text-blue-200/90 tracking-wider uppercase">
            {catName}
          </span>
        )}
      </div>

      {/* Center Emblem */}
      <div className="relative z-10 my-auto flex items-center justify-center">
        <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
          <IconComponent className="w-5.5 h-5.5 text-blue-200" />
        </div>
      </div>

      {/* Footer Line */}
      <div className="relative z-10 flex items-center justify-between text-[10px] text-white/70 border-t border-white/10 pt-2 font-medium">
        <span className="uppercase tracking-wider">{labels.newsAndEvents}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
      </div>
    </div>
  );
};
