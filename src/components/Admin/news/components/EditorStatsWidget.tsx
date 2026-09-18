import { CheckCircle2, FileEdit, BarChart2 } from "lucide-react";
import type { JSX } from "react";
import type { NewsStats } from "../hooks/useNewsStats";

interface EditorStatsWidgetProps {
  stats: NewsStats;
  loading?: boolean;
}

export function EditorStatsWidget({ stats, loading }: EditorStatsWidgetProps): JSX.Element {
  return (
    <div className="mx-3 mb-3 hidden md:block rounded-xl border border-sidebar-border bg-card/60 p-3 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <BarChart2 size={13} className="text-primary" />
          <span>Статистика</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-2 text-[11px] text-muted-foreground animate-pulse">
          Завантаження...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 p-1.5 border border-emerald-500/15">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium leading-none">Опубліковано</div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 leading-tight mt-0.5">{stats.published}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 p-1.5 border border-amber-500/15">
            <FileEdit size={13} className="text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-medium leading-none">Чернетки</div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300 leading-tight mt-0.5">{stats.drafts}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
