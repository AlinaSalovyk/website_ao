import { Sparkles, FileText, Image as ImageIcon, Paperclip, Layers } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import type { AdminNewsCategory, AdminNewsTag } from "../api";
import { GlassCard, TabLoader, PageGuide } from "../ui";
import { LocalePanel } from "./LocalePanel";
import { useArticleForm } from "./hooks/useArticleForm";
import { ArticleHeader } from "./components/ArticleHeader";
import { ArticleSeoTab } from "./components/ArticleSeoTab";
import { ArticleFormSidebar } from "./components/ArticleFormSidebar";
import { ArticleAttachmentsManager } from "./components/ArticleAttachmentsManager";
import { ArticleGalleryManager } from "./components/ArticleGalleryManager";

import { ARTICLE_EDIT_GUIDE } from "./constants/guides";

export const EditView = ({
  articleId,
  categories,
  tags,
  onBack,
  onSaved,
}: {
  articleId: string | null;
  categories: AdminNewsCategory[];
  tags: AdminNewsTag[];
  onBack: () => void;
  onSaved: () => void;
}): JSX.Element => {
  const {
    form,
    setForm,
    activeLocale,
    setActiveLocale,
    fieldErrors,
    loading,
    saving,
    autoSaveStatus,
    isDirty,
    imageUploading,
    imageHistory,
    setImageHistory,
    currentArticle,
    setCurrentArticle,
    sessionId,
    handleSave,
    handleImageFile,
    isSlugManuallyEdited,
    setIsSlugManuallyEdited,
    handleAutoFillSEO,
    pendingFiles,
    setPendingFiles,
    pendingPhotos,
    setPendingPhotos,
  } = useArticleForm(articleId, categories, onSaved);

  const [activeSectionTab, setActiveSectionTab] = useState<"main" | "media" | "files" | "seo" | "all">("main");
  const [managedGalleryCount, setManagedGalleryCount] = useState<number | null>(null);

  // If a field error occurs during save, switch to the section containing the error
  useEffect(() => {
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      if (fieldErrors.title_uk || fieldErrors.content_uk || fieldErrors.title_en || fieldErrors.content_en || fieldErrors.slug_uk) {
        setActiveSectionTab("main");
      }
    }
  }, [fieldErrors]);

  if (loading) return <TabLoader />;

  const galleryCount = managedGalleryCount !== null ? managedGalleryCount : ((form.gallery?.length || 0) + pendingPhotos.length);

  return (
    <div className="flex flex-col gap-6 relative">
      {/* ── STICKY TOP ACTION HEADER ── */}
      <ArticleHeader
        articleId={articleId}
        form={form}
        setForm={setForm}
        activeSectionTab={activeSectionTab}
        setActiveSectionTab={setActiveSectionTab}
        activeLocale={activeLocale}
        saving={saving}
        isDirty={isDirty}
        autoSaveStatus={autoSaveStatus}
        galleryCount={galleryCount}
        pendingFilesCount={pendingFiles.length}
        sessionId={sessionId}
        onBack={onBack}
        onSave={handleSave}
        onAutoFillSEO={handleAutoFillSEO}
      />

      <div className="flex flex-col gap-6 w-full">
        {/* Helper Guide */}
        <div className="mb-2">
          <PageGuide {...ARTICLE_EDIT_GUIDE} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Main Column (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* WORKSPACE SECTION TABS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/50 rounded-2xl border border-border/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSectionTab("main")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSectionTab === "main"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                >
                  <FileText size={15} className="text-primary" />
                  <span>Основне та Текст</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSectionTab("media")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSectionTab === "media"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                >
                  <ImageIcon size={15} className="text-blue-500" />
                  <span>Медіа та Галерея</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold border border-blue-500/20">
                    {galleryCount} / 30
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSectionTab("files")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSectionTab === "files"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                >
                  <Paperclip size={15} className="text-emerald-500" />
                  <span>Документи</span>
                  {pendingFiles.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">
                      +{pendingFiles.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSectionTab("seo")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSectionTab === "seo"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                >
                  <Sparkles size={15} className="text-indigo-500" />
                  <span>SEO та Пошук</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveSectionTab(activeSectionTab === "all" ? "main" : "all")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer border border-border/40"
              >
                <Layers size={13} />
                <span>{activeSectionTab === "all" ? "Вкладками" : "Показати все"}</span>
              </button>
            </div>

            {/* SECTION 1: MAIN CONTENT */}
            {(activeSectionTab === "main" || activeSectionTab === "all") && (
              <div id="section-main" className="scroll-mt-20">
                <GlassCard>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-base">
                        Основна інформація та зміст
                      </h3>
                    </div>

                    {/* Locale Switcher */}
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
                      {(["uk", "en"] as const).map((l) => (
                        <button
                          key={l}
                          onClick={() => setActiveLocale(l)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeLocale === l
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                          {l.toUpperCase()}
                          {l === "en" && form.status === "published" && !form.locales.en.title.trim() && (
                            <span className="ml-1 text-red-500 font-bold" title="Англійська версія обов'язкова для публікації">*</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <LocalePanel
                    locale={activeLocale}
                    value={form.locales[activeLocale]}
                    onChange={(updated) =>
                      setForm((f) => ({
                        ...f,
                        locales: { ...f.locales, [activeLocale]: updated },
                      }))
                    }
                    articleId={articleId ?? undefined}
                    isSlugManuallyEdited={isSlugManuallyEdited}
                    setIsSlugManuallyEdited={setIsSlugManuallyEdited}
                    onAutoFill={() => handleAutoFillSEO(activeLocale)}
                    fieldErrors={fieldErrors}
                    showSEO={activeSectionTab === "all"}
                  />
                </GlassCard>
              </div>
            )}

            {/* SECTION 2: MEDIA MATERIALS */}
            {(activeSectionTab === "media" || activeSectionTab === "all") && (
              <div id="section-media" className="flex flex-col gap-6 scroll-mt-20">
                {/* Video URL Card */}
                <GlassCard title="Відео новини (YouTube / Vimeo / MP4)">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Посилання на відео
                    </label>
                    <input
                      type="url"
                      value={form.video_url || ""}
                      onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=... або URL до mp4"
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Якщо вказано, відео буде доступне у медіаплеєрі новини.
                    </p>
                  </div>
                </GlassCard>

                {/* Photo Gallery Manager */}
                <ArticleGalleryManager
                  articleId={articleId}
                  pendingPhotos={pendingPhotos}
                  onPendingPhotosChange={setPendingPhotos}
                  onGalleryCountChange={setManagedGalleryCount}
                />
              </div>
            )}

            {/* SECTION 3: ATTACHMENTS & DOCUMENTS */}
            {(activeSectionTab === "files" || activeSectionTab === "all") && (
              <div id="section-files" className="scroll-mt-20">
                <ArticleAttachmentsManager
                  articleId={articleId}
                  pendingFiles={pendingFiles}
                  onPendingFilesChange={setPendingFiles}
                />
              </div>
            )}

            {/* SECTION 4: DEDICATED SEO TAB */}
            {activeSectionTab === "seo" && (
              <div id="section-seo-tab" className="scroll-mt-20">
                <ArticleSeoTab
                  form={form}
                  setForm={setForm}
                  activeLocale={activeLocale}
                  setActiveLocale={setActiveLocale}
                  onAutoFillSEO={handleAutoFillSEO}
                />
              </div>
            )}

          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-1 sticky top-20 flex flex-col gap-6">
            <ArticleFormSidebar
              form={form}
              setForm={setForm}
              categories={categories}
              tags={tags}
              currentArticle={currentArticle}
              setCurrentArticle={setCurrentArticle}
              imageUploading={imageUploading}
              imageHistory={imageHistory}
              setImageHistory={setImageHistory}
              handleImageFile={handleImageFile}
              fieldErrors={fieldErrors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
