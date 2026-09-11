import { RefreshCw, Save, Sparkles, ExternalLink, FileText, Image as ImageIcon, Paperclip, Layers } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import type { AdminNewsCategory, AdminNewsTag } from "../api";
import { AnimatedSection, GlassCard, TabLoader, PageGuide } from "../ui";
import { LocalePanel } from "./LocalePanel";
import { useArticleForm } from "./hooks/useArticleForm";
import { ArticleFormSidebar } from "./components/ArticleFormSidebar";
import { ArticleAttachmentsManager } from "./components/ArticleAttachmentsManager";
import { ArticleGalleryManager } from "./components/ArticleGalleryManager";
import { getEffectiveSeoPreview } from "@/utils/seo";

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

  // If a field error occurs during save, switch to the section containing the error
  useEffect(() => {
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      if (fieldErrors.title_uk || fieldErrors.content_uk || fieldErrors.title_en || fieldErrors.content_en || fieldErrors.slug_uk) {
        setActiveSectionTab("main");
      }
    }
  }, [fieldErrors]);

  if (loading) return <TabLoader />;

  const galleryCount = (form.gallery?.length || 0) + pendingPhotos.length;

  return (
    <div className="flex flex-col gap-6 relative">
      {/* ── STICKY TOP ACTION HEADER ── */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            ← Назад
          </button>
          <h2 className="text-sm font-bold text-foreground truncate max-w-[180px] sm:max-w-xs">
            {articleId ? "Редагування статті" : "Нова стаття"}
          </h2>

          {/* Save / Dirty Status indicator */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${autoSaveStatus === "saving" || saving
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : isDirty
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}>
            {saving ? "Збереження..." : isDirty ? "Є незбережені зміни" : "Збережено"}
          </span>
        </div>

        {/* Quick Workspace Tabs Header */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSectionTab("main")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${activeSectionTab === "main" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Текст
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab("media")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${activeSectionTab === "media" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Медіа
            <span className="text-[10px] opacity-80 font-bold">({galleryCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab("files")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${activeSectionTab === "files" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Файли
            {pendingFiles.length > 0 && <span className="text-[10px] text-amber-500 font-bold">+{pendingFiles.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab("seo")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${activeSectionTab === "seo" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            SEO
          </button>
          <button
            type="button"
            onClick={() => setActiveSectionTab("all")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${activeSectionTab === "all" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground opacity-60 hover:opacity-100"
              }`}
            title="Показати всі секції підряд"
          >
            Все
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAutoFillSEO(activeLocale)}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 transition-colors cursor-pointer"
            title="Автозаповнити порожні SEO-поля та Slug"
          >
            <Sparkles size={14} />
            <span>SEO Helper</span>
          </button>

          <button
            onClick={() => window.open(`/preview/hub?url=/preview/news/${form.locales.uk?.slug || "preview"}&session=${sessionId}`, "_blank")}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer bg-card border-border text-foreground hover:bg-muted"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Live Preview</span>
          </button>

          {/* Status selector */}
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as "draft" | "published",
              }))
            }
            className="rounded-xl border border-input bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs"
          >
            <option value="draft">Чернетка</option>
            <option value="published">Опублікувати</option>
          </select>

          {/* Primary Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>{saving ? "Збереження..." : "Зберегти"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Helper Guide */}
        <div className="mb-2">
          <PageGuide
            title="Як заповнювати статтю"
            summary="Підказки щодо заповнення полів (UK / EN, SEO, обкладинка, категорія, прикріплені документи)"
            items={[
              { title: "Українська версія", desc: "Спочатку повністю заповніть українську версію: Заголовок, Короткий опис, Основний текст. Українська версія є базою для заповнення англійською." },
              { title: "Англійська версія", desc: "Title EN, Description EN та Content EN заповнюються редактором вручну. Переконайтеся, що англійська версія відповідає змісту української перед публікацією." },
              { title: "Прикріплені документи", desc: "До новини можна додати до 20 документів (PDF, Word, Excel, PowerPoint, TXT тощо). Для кожного файла можна вказати локалізовані назви (UK/EN) та змінювати їх порядок стрілками." },
              { title: "Режими Відкрити / Завантажити", desc: "PDF та TXT підтримують перегляд прямо в браузері (кнопки «Відкрити» та «Завантажити»). Офісні формати (DOCX, XLSX, PPTX) відображають тільки «Завантажити» для збереження на пристрій." },
              { title: "Slug", desc: "Slug — це частина адреси сторінки (наприклад: /news/nova-stattia). Для нової статті він формується автоматично. Для існуючої/опублікованої статті не рекомендується змінювати slug без необхідності, тому що це змінює URL." },
              { title: "SEO", desc: "SEO Title та SEO Description допомагають керувати тим, як сторінка описується для пошукових систем. Їх можна: залишити порожніми, заповнити автоматично кнопкою «🪄 Автозаповнити SEO та Slug» (вона заповнює лише порожні поля), або змінити вручну." },
              { title: "SEO Preview", desc: "\"Попередній перегляд у пошуку\" дозволяє приблизно побачити Title, URL та Description до публікації. Фактичний вигляд у пошуковій системі може відрізнятися." },
              { title: "Обкладинка", desc: "Виберіть релевантне зображення, перевірте, що воно відповідає змісту статті та використовуйте якісне зображення." },
              { title: "Категорія", desc: "Оберіть категорію, яка найкраще відповідає темі матеріалу." },
              { title: "Закріплення", desc: "Закріплення використовуйте лише для важливих матеріалів, які повинні відображатися вище за звичайні новини." },
              { title: "Публікація", desc: "Стаття може бути збережена як Чернетка або Опублікована. Перед публікацією рекомендуємо перевірити: UK, EN, Обкладинку, Категорію, SEO Preview та Slug." }
            ]}
          />
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
                <GlassCard>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border/50">
                    <div>
                      <h3 className="font-semibold text-foreground text-base">
                        SEO та відображення у пошуку ({activeLocale.toUpperCase()})
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Налаштування пошукової оптимізації та картки в соціальних мережах
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAutoFillSEO(activeLocale)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Автозаповнити SEO та Slug</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    Автозаповнення згенерує SEO Title та SEO Description з заголовку й тексту новини, залишаючи ваші ручні редагування без змін.
                  </div>

                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        SEO Title ({activeLocale.toUpperCase()})
                      </label>
                      <input
                        value={form.locales[activeLocale].seo_title}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            locales: {
                              ...f.locales,
                              [activeLocale]: { ...f.locales[activeLocale], seo_title: e.target.value },
                            },
                          }))
                        }
                        placeholder="Заголовок для пошуковиків…"
                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground ml-1">
                        {form.locales[activeLocale].seo_title.length} символів (рекомендовано ~60)
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        SEO Description ({activeLocale.toUpperCase()})
                      </label>
                      <textarea
                        rows={3}
                        value={form.locales[activeLocale].seo_description}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            locales: {
                              ...f.locales,
                              [activeLocale]: { ...f.locales[activeLocale], seo_description: e.target.value },
                            },
                          }))
                        }
                        placeholder="Опис новини для Google та соцмереж…"
                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground ml-1">
                        {form.locales[activeLocale].seo_description.length} символів (рекомендовано ~160)
                      </p>
                    </div>

                    {/* Search Engine Result Preview (Google Preview) */}
                    <div className="mt-2 pt-5 border-t border-border/60">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h4 className="text-sm font-bold text-foreground">Попередній перегляд у пошуку</h4>
                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
                          {(["uk", "en"] as const).map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setActiveLocale(l)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeLocale === l
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                              {l.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-card border border-border/70 rounded-xl shadow-xs">
                        <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-1.5 break-all">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {typeof window !== 'undefined' ? window.location.host : 'example.com'}{activeLocale === 'uk' ? '/news/' : '/en/news/'}
                          </span>
                          <span className="text-foreground font-medium">{form.locales[activeLocale].slug || "slug-url"}</span>
                        </div>
                        <h3 className="text-lg leading-tight font-semibold text-blue-700 dark:text-blue-400 mb-1 hover:underline cursor-pointer">
                          {(() => {
                            const preview = getEffectiveSeoPreview({
                              title: form.locales[activeLocale].title,
                              description: form.locales[activeLocale].description,
                              content: form.locales[activeLocale].content,
                              seoTitle: form.locales[activeLocale].seo_title,
                              seoDescription: form.locales[activeLocale].seo_description,
                              fallbackTitle: "Заголовок статті",
                              fallbackDescription: "Опис статті з'явиться тут після заповнення."
                            });
                            return preview.effectiveTitle;
                          })()}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {(() => {
                            const preview = getEffectiveSeoPreview({
                              title: form.locales[activeLocale].title,
                              description: form.locales[activeLocale].description,
                              content: form.locales[activeLocale].content,
                              seoTitle: form.locales[activeLocale].seo_title,
                              seoDescription: form.locales[activeLocale].seo_description,
                              fallbackTitle: "Заголовок статті",
                              fallbackDescription: "Опис статті з'явиться тут після заповнення."
                            });
                            return preview.effectiveDescription;
                          })()}
                        </p>
                      </div>

                      <p className="mt-2 text-[11px] text-muted-foreground ml-1">
                        Фактичний вигляд у пошуковій системі Google або соціальних мережах може відрізнятися залежно від пристрою та запиту.
                      </p>
                    </div>
                  </div>
                </GlassCard>
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
