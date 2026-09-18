import { useEffect, useState, type JSX } from "react";
import { Info, X } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import {
  ArticleAttachmentsSection,
  ArticleBody,
  ArticleBreadcrumbs,
  ArticleHeader,
  ArticleTagsSection,
  ArticleVideoSection,
  NewsPhotoGallery,
  RelatedNewsSlider,
} from "@/components/news";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { toast } from "sonner";
import { fetchNewsList, hasEnglishTranslation, type NewsArticle } from "@/lib/news-api";

interface ArticlePageProps {
  article: NewsArticle;
  locale?: Locale;
}

export const ArticlePage = ({
  article,
  locale = "uk",
}: ArticlePageProps): JSX.Element => {
  const t = getTranslations(locale);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [isUntranslatedNotice, setIsUntranslatedNotice] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("untranslated=1")
    ) {
      setIsUntranslatedNotice(true);
      toast.info(
        "Notice: This news article is not translated into English yet. Displaying original Ukrainian content."
      );
      // Clean up ?untranslated=1 from address bar URL so F5 refresh won't re-trigger the notice
      const cleanUrl =
        window.location.pathname +
        window.location.search
          .replace(/([?&])untranslated=1(&|$)/, "$1")
          .replace(/[?&]$/, "");
      window.history.replaceState({}, "", cleanUrl || window.location.pathname);
    }
  }, []);

  // Fetch related articles from same category or latest
  useEffect(() => {
    let isMounted = true;
    async function loadRelated() {
      try {
        const res = await fetchNewsList({
          locale,
          limit: 10,
          category: article.category_id || undefined,
        });
        if (isMounted && res.articles) {
          let filtered = res.articles.filter((a: NewsArticle) => a.id !== article.id);

          // If on English locale, filter out untranslated articles from Related list
          if (locale === "en") {
            filtered = filtered.filter((a: NewsArticle) => hasEnglishTranslation(a));
          }

          if (filtered.length < 3) {
            const generalRes = await fetchNewsList({ locale, limit: 8 });
            if (generalRes.articles) {
              let generalFiltered = generalRes.articles.filter(
                (a: NewsArticle) => a.id !== article.id && !filtered.some((f) => f.id === a.id)
              );
              if (locale === "en") {
                generalFiltered = generalFiltered.filter((a: NewsArticle) => hasEnglishTranslation(a));
              }
              filtered = [...filtered, ...generalFiltered];
            }
          }
          setRelatedArticles(filtered.slice(0, 8));
        }
      } catch (e) {
        console.error("Failed to load related articles", e);
      }
    }
    loadRelated();
    return () => {
      isMounted = false;
    };
  }, [article.id, article.category_id, locale]);

  return (
    <article className="w-full bg-slate-50 text-slate-900 pt-24 md:pt-32 pb-20 relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        {/* ── Breadcrumb & Back Navigation ── */}
        <ArticleBreadcrumbs article={article} locale={locale} />

        {/* ── Untranslated Notice Banner ── */}
        {isUntranslatedNotice && (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-900 text-xs sm:text-sm font-medium my-4 flex items-center justify-between gap-3 shadow-xs transition-all">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Notice: This news article is not translated into English yet. Displaying original Ukrainian content.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsUntranslatedNotice(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <span>OK</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Article Header ── */}
        <ArticleHeader article={article} locale={locale} />

        {/* ── Main Article Body Content ── */}
        <section className="w-full max-w-3xl mx-auto py-4">
          <ArticleBody article={article} locale={locale} />

          {/* ── Video Section ── */}
          <ArticleVideoSection article={article} locale={locale} />

          {/* ── Photo Gallery Section ── */}
          <ScrollReveal variant="fade-up" delay={50}>
            <NewsPhotoGallery article={article} locale={locale} />
          </ScrollReveal>

          {/* ── Document Attachments Section ── */}
          <ArticleAttachmentsSection article={article} locale={locale} />

          {/* ── Tags Section ── */}
          <ArticleTagsSection tags={article.tags} />
        </section>

        {/* ── Related News Section ── */}
        {relatedArticles.length > 0 && (
          <section className="mt-14 md:mt-20 pt-10 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                {t.newsPage.relatedNews}
              </h3>
            </div>

            <RelatedNewsSlider articles={relatedArticles} locale={locale} />
          </section>
        )}
      </div>
    </article>
  );
};
