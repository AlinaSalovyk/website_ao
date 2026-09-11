import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import type { AdminNewsCategory } from "../../api";

interface CategoryEditHeaderProps {
  categoryId: string | null;
  ukName: string;
  cat: Partial<AdminNewsCategory>;
  sessionId: string;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function CategoryEditHeader({
  categoryId,
  ukName,
  cat,
  sessionId,
  saving,
  onBack,
  onSave,
}: CategoryEditHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/40">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          Назад
        </button>
        <div className="h-4 w-px bg-border/60" />
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            {categoryId ? ukName : "Створення категорії"}
          </h2>
          {cat.status && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                cat.status === "visible"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : cat.status === "hidden"
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {cat.status === "visible"
                ? "Видима"
                : cat.status === "hidden"
                ? "Прихована"
                : "Архів"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            window.open(
              `/preview/hub?url=/preview/news/category/${
                cat.locales?.uk?.slug || "preview"
              }&session=${sessionId}`,
              "_blank"
            )
          }
          className="flex items-center gap-2 rounded-xl border border-border bg-card/80 hover:bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ExternalLink size={15} className="text-primary" />
          Live Preview
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer active:scale-95"
        >
          <Save size={16} />
          {saving ? "Збереження..." : "Зберегти категорію"}
        </button>
      </div>
    </div>
  );
}
