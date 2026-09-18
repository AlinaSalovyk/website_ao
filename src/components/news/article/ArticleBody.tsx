import type { JSX } from "react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { resolveHtmlMediaUrls, type NewsArticle } from "@/lib/news-api";

interface ArticleBodyProps {
  article: NewsArticle;
  locale?: Locale;
}

export const ArticleBody = ({
  article,
  locale = "uk",
}: ArticleBodyProps): JSX.Element => {
  const t = getTranslations(locale);
  const localeContent =
    article.locales?.[locale]?.content ?? article.locales?.["uk"]?.content ?? "";
  const cleanContent = resolveHtmlMediaUrls(localeContent);

  return (
    <ScrollReveal variant="fade-up">
      {cleanContent ? (
        <div
          className="prose article-content prose-slate max-w-none text-slate-800"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      ) : (
        <p className="italic text-slate-500">{t.newsPage.noContent}</p>
      )}
    </ScrollReveal>
  );
};
