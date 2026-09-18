import { Film } from "lucide-react";
import type { JSX } from "react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { getFullImageUrl, type NewsArticle } from "@/lib/news-api";

interface ArticleVideoSectionProps {
  article: NewsArticle;
  locale?: Locale;
}

export const ArticleVideoSection = ({
  article,
  locale = "uk",
}: ArticleVideoSectionProps): JSX.Element | null => {
  const t = getTranslations(locale);

  if (!article.video_url) return null;

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/embed/")) return url;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const isExternalVideo =
    article.video_type === "external" ||
    article.video_url.includes("youtube.com") ||
    article.video_url.includes("youtu.be") ||
    article.video_url.includes("vimeo.com");

  return (
    <ScrollReveal variant="fade-up" delay={50} className="mt-10 md:mt-14">
      <div className="flex items-center gap-2 mb-3 font-serif font-bold text-xl text-slate-900">
        <Film className="w-5 h-5 text-blue-600" />
        <span>{t.newsPage.videoMaterials}</span>
      </div>
      <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900 flex items-center justify-center">
        {isExternalVideo ? (
          <iframe
            src={getEmbedUrl(article.video_url)}
            title="Article Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <video
            src={getFullImageUrl(article.video_url)}
            controls
            preload="metadata"
            playsInline
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </ScrollReveal>
  );
};
