import { RefreshCw, Save, Sparkles, ExternalLink } from "lucide-react";
import type { JSX } from "react";
import type { AdminNewsCategory, AdminNewsTag } from "../api";
import { AnimatedSection, GlassCard, TabLoader, PageGuide } from "../ui";
import { LocalePanel } from "./LocalePanel";
import { useArticleForm } from "./hooks/useArticleForm";
import { ArticleFormSidebar } from "./components/ArticleFormSidebar";
import { ArticleAttachmentsManager } from "./components/ArticleAttachmentsManager";
import { ArticleGalleryManager } from "./components/ArticleGalleryManager";

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

  if (loading) return <TabLoader />;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Editor panel ── */}
      <div className="flex flex-col gap-6 w-full">
        <AnimatedSection i={0}>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                ← Назад
              </button>
              <h2 className="text-base font-semibold text-foreground">
                {articleId ? "Редагування статті" : "Нова стаття"}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => window.open(`/preview/hub?url=/preview/news/${form.locales.uk?.slug || "preview"}&session=${sessionId}`, "_blank")}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer bg-card border-border text-foreground hover:bg-muted"
              >
                <ExternalLink size={16} />
                Live Preview
              </button>

              {/* Status toggle */}
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as "draft" | "published",
                  }))
                }
                className="rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
              >
                <option value="draft">Чернетка</option>
                <option value="published">Опублікувати</option>
              </select>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {saving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </div>
        </AnimatedSection>

        <div className="mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Locale tabs & Translate button */}
            <GlassCard>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-border/50">
                <div className="flex gap-1">
                  {(["uk", "en"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setActiveLocale(l)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeLocale === l
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      {l.toUpperCase()}
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
              />
            </GlassCard>

            {/* Article Photo Gallery Manager */}
            <ArticleGalleryManager
              articleId={articleId}
              pendingPhotos={pendingPhotos}
              onPendingPhotosChange={setPendingPhotos}
            />

            {/* Document Attachments Manager */}
            <ArticleAttachmentsManager
              articleId={articleId}
              pendingFiles={pendingFiles}
              onPendingFilesChange={setPendingFiles}
            />
          </div>

          {/* Right: sidebar settings */}
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
  );
};
