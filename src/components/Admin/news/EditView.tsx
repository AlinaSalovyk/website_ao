import { RefreshCw, Save, Sparkles, ExternalLink } from "lucide-react";
import type { JSX } from "react";
import type { AdminNewsCategory, AdminNewsTag } from "../api";
import { AnimatedSection, GlassCard, TabLoader, PageGuide } from "../ui";
import { LocalePanel } from "./LocalePanel";
import { useArticleForm } from "./hooks/useArticleForm";
import { ArticleFormSidebar } from "./components/ArticleFormSidebar";

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
    loading,
    saving,
    translating,
    showTranslateConfirm,
    setShowTranslateConfirm,
    handleTranslateRequest,
    executeTranslation,
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
            summary="Підказки щодо заповнення полів (UK / EN, SEO, обкладинка, категорія, закріплення)"
            items={[
              { title: "Українська версія", desc: "Спочатку повністю заповніть українську версію: Заголовок, Короткий опис, Основний текст. Українська версія є базою для подальшого перекладу англійською." },
              { title: "Англійська версія", desc: "Після заповнення UK використайте кнопку перекладу. Після автоматичного перекладу: перегляньте заголовок, перевірте опис та основний текст, за потреби виправте переклад вручну." },
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

                <button
                  type="button"
                  onClick={handleTranslateRequest}
                  disabled={translating}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  title="Автоматично перекласти українську версію на англійську через DeepL"
                >
                  {translating ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  <span>{translating ? "Перекладаємо..." : "✨ Перекласти UK → EN"}</span>
                </button>
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
              />
            </GlassCard>
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
          />
        </div>
      </div>

      {/* Confirmation modal for overwriting EN content */}
      {showTranslateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-foreground font-semibold text-base">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3>Замінити англійський текст?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Англійська версія вже містить дані. Перекласти українську версію заново та замінити англійський текст?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTranslateConfirm(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={executeTranslation}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer font-semibold shadow-sm"
              >
                Перекласти та замінити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
