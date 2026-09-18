import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import type { JSX, MouseEvent } from "react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import { categoryName, getCategoryCoverUrl, getFullImageUrl, type NewsCategory } from "@/lib/news-api";

interface NewsHeroBannerProps {
  activeCat?: NewsCategory;
  selectedCategory: string;
  pageTitle: string;
  pageSubtitle: string;
  locale?: Locale;
}

export const NewsHeroBanner = ({
  activeCat,
  selectedCategory,
  pageTitle,
  pageSubtitle,
  locale = "uk",
}: NewsHeroBannerProps): JSX.Element => {
  const t = getTranslations(locale);

  const handleSmartBack = (e: MouseEvent<HTMLAnchorElement>, fallbackPath: string) => {
    if (typeof window !== "undefined" && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          e.preventDefault();
          window.history.back();
        }
      } catch {
        // Fallback to default anchor navigation
      }
    }
  };

  return (
    <ScrollReveal variant="fade-up">
      <header className="flex flex-col items-start gap-3 mb-8 w-full">
        {/* Top Navigation: Smart Back button & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-3 pb-3 border-b border-slate-200">
          <a
            href={getLocalizedPath("/", locale)}
            onClick={(e) => handleSmartBack(e, getLocalizedPath("/", locale))}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>{locale === "en" ? "Back" : "Назад"}</span>
          </a>

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
            <a href={getLocalizedPath("/", locale)} className="hover:text-blue-600 transition-colors">
              {t.nav.home}
            </a>
            <span className="text-slate-300 font-bold">/</span>
            <a
              href={getLocalizedPath("/news", locale)}
              className={`transition-colors ${!activeCat ? "text-slate-900 font-bold px-2 py-0.5 bg-slate-200/60 rounded-md" : "hover:text-blue-600"}`}
            >
              {t.nav.news}
            </a>
            {activeCat && (
              <>
                <span className="text-slate-300 font-bold">/</span>
                <span className="text-slate-900 font-bold px-2 py-0.5 bg-slate-200/60 rounded-md truncate max-w-[200px]">
                  {categoryName(activeCat, locale)}
                </span>
              </>
            )}
          </nav>
        </div>

        <AnimatePresence mode="wait">
          {activeCat?.cover_image ? (
            <motion.div
              key={`banner-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              <div className="w-full h-56 sm:h-72 md:h-[320px] rounded-2xl overflow-hidden mb-2 relative shadow-xs border border-slate-200 group bg-slate-100">
                <img 
                  src={getCategoryCoverUrl(activeCat.cover_image)} 
                  alt="" 
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-105 pointer-events-none select-none"
                />

                <img 
                  src={getCategoryCoverUrl(activeCat.cover_image)} 
                  alt={pageTitle} 
                  className={`relative z-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015] ${
                    (activeCat as any)?.cover_position === "top"
                      ? "object-top"
                      : (activeCat as any)?.cover_position === "bottom"
                      ? "object-bottom"
                      : "object-[center_35%]"
                  }`}
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    if (activeCat.cover_image) {
                      img.src = getFullImageUrl(activeCat.cover_image);
                    }
                  }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent z-10 pointer-events-none" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/90 text-white text-[10px] font-bold tracking-wider uppercase mb-2 backdrop-blur-md border border-blue-400/30">
                     <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                     {t.newsPage.badge}
                   </div>
                   <h1 className="font-serif font-bold text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">
                      {pageTitle}
                   </h1>
                   {pageSubtitle && (
                     <p className="text-slate-200 text-sm sm:text-base max-w-2xl mt-2 font-normal">
                       {pageSubtitle}
                     </p>
                   )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="all-header"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex flex-col items-start gap-2.5 w-full"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                {t.newsPage.badge}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full shrink-0" />
                <h1 className="font-serif font-bold text-slate-900 text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
                  {pageTitle}
                </h1>
              </div>
              {pageSubtitle && (
                <p className="text-slate-600 text-sm sm:text-base max-w-2xl font-normal">
                  {pageSubtitle}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </ScrollReveal>
  );
};
