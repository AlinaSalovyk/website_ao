import {
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Presentation,
} from "lucide-react";
import type { JSX } from "react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import {
  attachmentDisplayName,
  canPreviewAttachment,
  formatFileSize,
  getFullImageUrl,
  getNewsAttachmentDownloadUrl,
  getNewsAttachmentFileUrl,
  type NewsArticle,
} from "@/lib/news-api";

interface ArticleAttachmentsSectionProps {
  article: NewsArticle;
  locale?: Locale;
}

export const ArticleAttachmentsSection = ({
  article,
  locale = "uk",
}: ArticleAttachmentsSectionProps): JSX.Element | null => {
  const t = getTranslations(locale);

  if (!article.attachments || article.attachments.length === 0) return null;

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
          const rawOpenUrl = att.url || getNewsAttachmentFileUrl(targetNewsId, att.id);
          const rawDownloadUrl = att.url
            ? (att.url.includes("?") ? `${att.url}&download=1` : `${att.url}?download=1`)
            : getNewsAttachmentDownloadUrl(targetNewsId, att.id);
          const fileUrl = getFullImageUrl(rawOpenUrl);
          const downloadUrl = getFullImageUrl(rawDownloadUrl);
          const previewable = canPreviewAttachment(att.extension || att.mime_type);

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
  );
};
