import { Plus } from "lucide-react";
import type { JSX } from "react";

interface NewsQuickActionsProps {
  onCreateArticle: () => void;
}

export function NewsQuickActions({ onCreateArticle }: NewsQuickActionsProps): JSX.Element {
  return (
    <div className="mb-3 px-3">
      <button
        type="button"
        onClick={onCreateArticle}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow transition-all duration-200 cursor-pointer active:scale-[0.98]"
      >
        <Plus size={16} className="transition-transform duration-200 group-hover:rotate-90" />
        <span className="hidden md:inline">Створити новину</span>
      </button>
    </div>
  );
}
