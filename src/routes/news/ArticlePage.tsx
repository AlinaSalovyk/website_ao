import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import type { JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Article } from "@/data/articles";
import { formatArticleDate, getLatestArticles } from "@/data/articles";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";

interface ArticlePageProps {
  article: Article;
  locale?: Locale;
}

export const ArticlePage = ({
  article,
  locale = "uk",
}: ArticlePageProps): JSX.Element => {
  const t = getTranslations(locale);
  const relatedArticles = getLatestArticles(3)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gray-900">
        {/* Subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 pt-32 md:pt-44 pb-16 md:pb-24">
          <ScrollReveal variant="fade-up">
            <a
              href={getLocalizedPath("/news", locale)}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t.newsPage.backToNews}
            </a>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                <span className="text-white text-[10px] md:text-xs font-semibold tracking-wider uppercase">
                  {t.home.news.weeklyBadge}
                </span>
              </div>
              <div className="backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                <time
                  dateTime={article.date}
                  className="text-white/80 text-[10px] md:text-xs font-medium tracking-wider uppercase"
                >
                  {formatArticleDate(article.date, locale)}
                </time>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-[1.1] max-w-4xl">
              {article.title[locale]}
            </h1>
          </ScrollReveal>
        </div>
      </section>

      {/* Article Content */}
      <section className="w-full bg-pure-white py-12 md:py-20 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="w-full max-w-3xl mx-auto px-4 md:px-9 relative z-10">
          <ScrollReveal variant="fade-up">
            <div className="prose prose-lg prose-gray max-w-none">
              {article.content[locale].map((paragraph, i) => (
                <p
                  key={i}
                  className="text-gray-700 text-base md:text-lg leading-relaxed mb-6 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="w-full bg-gray-50 py-16 md:py-24 relative overflow-hidden z-10">
          <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 relative z-10">
            <ScrollReveal variant="fade-up">
              <h2 className="font-semibold text-pure-black text-2xl md:text-3xl lg:text-4xl tracking-tight mb-10 md:mb-14">
                {t.newsPage.relatedArticles}
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 auto-rows-[280px] md:auto-rows-[320px]">
              {relatedArticles.map((related, index) => (
                <ScrollReveal
                  key={related.slug}
                  variant="fade-up"
                  delay={index * 100}
                  className="w-full h-full"
                >
                  <motion.a
                    href={getLocalizedPath(`/news/${related.slug}`, locale)}
                    aria-label={`${t.home.news.readMore}: ${related.title[locale]}`}
                    whileHover="hover"
                    className="relative flex flex-col justify-end w-full h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group cursor-pointer border border-black/5 shadow-xl bg-gray-900 isolate"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-20 p-5 md:p-8 flex flex-col h-full w-full justify-between">
                      <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-auto mt-1 md:mt-2">
                        <div className="backdrop-blur-md bg-white/10 border border-white/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shrink-0">
                          <span className="text-white text-[9px] md:text-[10px] lg:text-xs font-semibold tracking-wider uppercase">
                            {t.home.news.weeklyBadge}
                          </span>
                        </div>
                        <div className="backdrop-blur-md bg-black/30 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shrink-0">
                          <time
                            dateTime={related.date}
                            className="text-white/80 text-[9px] md:text-[10px] lg:text-xs font-medium tracking-wider uppercase"
                          >
                            {formatArticleDate(related.date, locale)}
                          </time>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:gap-4 mt-6 md:mt-8">
                        <h3 className="text-lg md:text-2xl lg:text-3xl font-semibold text-white tracking-tight text-balance leading-snug">
                          {related.title[locale]}
                        </h3>
                        <div className="flex items-center gap-2.5 md:gap-3 mt-1 md:mt-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
                            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-black group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-sm md:text-base font-medium text-white/90 group-hover:text-white relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-white group-hover:after:w-full after:transition-all after:duration-300">
                            {t.home.news.readMore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.a>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};
