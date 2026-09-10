import {
  Calendar,
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  Film,
  ImageIcon,
  Paperclip,
  Presentation,
  Tag,
  User,
} from "lucide-react";
import { useEffect, useState, type JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { RelatedCard } from "@/components/news/RelatedCard";
import { RelatedNewsSlider } from "@/components/news/RelatedNewsSlider";
import { NewsPhotoGallery } from "@/components/news/NewsPhotoGallery";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import {
  articleDescription,
  articleTitle,
  attachmentDisplayName,
  buildImageSrcSet,
  canPreviewAttachment,
  categoryName,
  fetchNewsList,
  formatAuthorName,
  formatAuthorPosition,
  formatFileSize,
  formatNewsDate,
  getFullImageUrl,
  getNewsAttachmentDownloadUrl,
  getNewsAttachmentFileUrl,
  type NewsArticle,
} from "@/lib/news-api";

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

  const title = articleTitle(article, locale);
  const description = articleDescription(article, locale);
  const rawDate = article.published_at || article.publish_at || article.created_at || article.updated_at;
  const date = (rawDate && !rawDate.startsWith("0001")) ? rawDate : (article.created_at || article.updated_at || new Date().toISOString());
  const localeContent =
    article.locales?.[locale]?.content ?? article.locales?.["uk"]?.content ?? "";

  // Sanitize content & ensure attributes
  const cleanContent = localeContent;

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
          if (filtered.length < 3) {
            const generalRes = await fetchNewsList({ locale, limit: 8 });
            if (generalRes.articles) {
              const generalFiltered = generalRes.articles.filter(
                (a: NewsArticle) => a.id !== article.id && !filtered.some((f) => f.id === a.id)
              );
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

  // Format YouTube embed URL helper
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/embed/")) return url;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <article className="w-full bg-slate-50 text-slate-900 pt-28 md:pt-36 pb-20 relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">

        {/* ── Article Header ── */}
        <header className="flex flex-col gap-6 mb-8 md:mb-12">
          <ScrollReveal variant="fade-up">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {article.category && (
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider uppercase">
                  {categoryName(article.category, locale)}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <time dateTime={date}>{formatNewsDate(date, locale)}</time>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-serif font-bold text-slate-900 tracking-tight leading-[1.18] mb-5">
              {title}
            </h1>

            {description && (
              <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-normal max-w-3xl mb-6 border-l-2 border-blue-600 pl-4 py-1">
                {description}
              </p>
            )}

            {/* Author Block */}
            {article.author?.name && (() => {
              const displayAuthorName = formatAuthorName(article.author.name, locale);
              const displayAuthorPosition = formatAuthorPosition(article.author.position, locale);

              return (
                <div className="flex items-center gap-3.5 pt-4 border-t border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                    {displayAuthorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.newsPage.authorLabel}
                    </span>
                    <p className="text-slate-900 text-sm font-bold">
                      {displayAuthorName}
                    </p>
                    {displayAuthorPosition && (
                      <p className="text-slate-500 text-xs">
                        {displayAuthorPosition}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </ScrollReveal>
        </header>

        {/* ── Main Article Body Content (Optimal 65-75 char reading measure) ── */}
        <section className="w-full max-w-3xl mx-auto py-4">
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

          {/* ── Video Section ── */}
          {article.video_url && (
            <ScrollReveal variant="fade-up" delay={50} className="mt-10 md:mt-14">
              <div className="flex items-center gap-2 mb-3 font-serif font-bold text-xl text-slate-900">
                <Film className="w-5 h-5 text-blue-600" />
                <span>{t.newsPage.videoMaterials}</span>
              </div>
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900 flex items-center justify-center">
                {article.video_type === "external" ||
                article.video_url.includes("youtube.com") ||
                article.video_url.includes("youtu.be") ||
                article.video_url.includes("vimeo.com") ? (
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
          )}

          {/* ── Photo Gallery Section ── */}
          <ScrollReveal variant="fade-up" delay={50}>
            <NewsPhotoGallery article={article} locale={locale} />
          </ScrollReveal>

          {/* ── Document Attachments Section ── */}
          {article.attachments && article.attachments.length > 0 && (
            <ScrollReveal variant="fade-up" delay={50} className="mt-10 md:mt-14">
              <div className="flex items-center gap-2 mb-4 font-serif font-bold text-xl text-slate-900">
                <Paperclip className="w-5 h-5 text-blue-600" />
                <span>{t.newsPage.attachmentsTitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {article.attachments.map((att) => {
                  const displayName = attachmentDisplayName(att, locale);
                  const ext = (att.extension || "").toUpperCase().replace(/^\./, "");
                  const formattedSize = formatFileSize(att.size_bytes);
                  
                  const targetNewsId = att.news_id || article.id;
                  const rawOpenUrl = getNewsAttachmentFileUrl(targetNewsId, att.id);
                  const rawDownloadUrl = getNewsAttachmentDownloadUrl(targetNewsId, att.id);
                  const fileUrl = getFullImageUrl(rawOpenUrl);
                  const downloadUrl = getFullImageUrl(rawDownloadUrl);
                  const previewable = canPreviewAttachment(att.extension || att.mime_type);

                  const getIcon = (extStr: string) => {
                    const e = extStr.toLowerCase();
                    if (e === "pdf") return <FileText className="w-5 h-5 text-red-600 shrink-0" />;
                    if (["doc", "docx", "rtf", "odt"].includes(e)) return <FileText className="w-5 h-5 text-blue-600 shrink-0" />;
                    if (["xls", "xlsx", "csv", "ods"].includes(e)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
                    if (["ppt", "pptx", "odp"].includes(e)) return <Presentation className="w-5 h-5 text-amber-600 shrink-0" />;
                    if (["txt"].includes(e)) return <FileCode className="w-5 h-5 text-slate-600 shrink-0" />;
                    return <Paperclip className="w-5 h-5 text-slate-600 shrink-0" />;
                  };

                  return (
                    <div
                      key={att.id}
                      className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200/60 shrink-0 mt-0.5">
                          {getIcon(ext)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-sm font-semibold text-slate-900 truncate leading-snug"
                            title={displayName}
                          >
                            {displayName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                            {ext && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                                {ext}
                              </span>
                            )}
                            <span>{formattedSize}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs font-semibold">
                        {previewable && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${t.newsPage.openDocumentAria} «${displayName}»`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{t.newsPage.openDocument}</span>
                          </a>
                        )}
                        <a
                          href={downloadUrl}
                          download={att.original_name}
                          aria-label={`${t.newsPage.downloadDocumentAria} «${displayName}»`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t.newsPage.downloadDocument}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-slate-200">
              <Tag className="w-4 h-4 text-blue-600 shrink-0" />
              {article.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full bg-slate-200/70 border border-slate-300/60 text-slate-700 text-xs font-semibold"
                >
                  #{tag.slug}
                </span>
              ))}
            </div>
          )}
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
