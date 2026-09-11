import { RefreshCw, Save, Sparkles, ExternalLink } from "lucide-react";
import type { JSX } from "react";
import type { ArticleForm } from "../types";

interface ArticleHeaderProps {
  articleId: string | null;
  form: ArticleForm;
  setForm: React.Dispatch<React.SetStateAction<ArticleForm>>;
  activeSectionTab: "main" | "media" | "files" | "seo" | "all";
  setActiveSectionTab: (tab: "main" | "media" | "files" | "seo" | "all") => void;
  activeLocale: "uk" | "en";
  saving: boolean;
  isDirty: boolean;
  autoSaveStatus: string;
  galleryCount: number;
  pendingFilesCount: number;
  sessionId: string;
  onBack: () => void;
  onSave: () => void;
  onAutoFillSEO: (locale: "uk" | "en") => void;
}

export const ArticleHeader = ({
  articleId,
  form,
  setForm,
  activeSectionTab,
  setActiveSectionTab,
  activeLocale,
  saving,
  isDirty,
  autoSaveStatus,
  galleryCount,
  pendingFilesCount,
  sessionId,
  onBack,
  onSave,
  onAutoFillSEO,
}: ArticleHeaderProps): JSX.Element => {
  return (
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

        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            autoSaveStatus === "saving" || saving
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : isDirty
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {saving ? "Збереження..." : isDirty ? "Є незбережені зміни" : "Збережено"}
        </span>
      </div>

      <div className="hidden md:flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveSectionTab("main")}
          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            activeSectionTab === "main" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Текст
        </button>
        <button
          type="button"
          onClick={() => setActiveSectionTab("media")}
          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
            activeSectionTab === "media" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Медіа
          <span className="text-[10px] opacity-80 font-bold">({galleryCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSectionTab("files")}
          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
            activeSectionTab === "files" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Файли
          {pendingFilesCount > 0 && <span className="text-[10px] text-amber-500 font-bold">+{pendingFilesCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => setActiveSectionTab("seo")}
          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            activeSectionTab === "seo" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          SEO
        </button>
        <button
          type="button"
          onClick={() => setActiveSectionTab("all")}
          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            activeSectionTab === "all" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground opacity-60 hover:opacity-100"
          }`}
          title="Показати всі секції підряд"
        >
          Все
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAutoFillSEO(activeLocale)}
          className="hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 transition-colors cursor-pointer"
          title="Автозаповнити порожні SEO-поля та Slug"
        >
          <Sparkles size={14} />
          <span>SEO Helper</span>
        </button>

        <button
          onClick={() =>
            window.open(
              `/preview/hub?url=/preview/news/${form.locales.uk?.slug || "preview"}&session=${sessionId}`,
              "_blank"
            )
          }
          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer bg-card border-border text-foreground hover:bg-muted"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Live Preview</span>
        </button>

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

        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{saving ? "Збереження..." : "Зберегти"}</span>
        </button>
      </div>
    </div>
  );
};
