import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { AuditResponse } from "../../api";
import { GlassCard } from "../../ui";
import { getActionMeta } from "../constants/audit.constants";

interface AuditTableProps {
  data: AuditResponse;
  page: number;
  totalPages: number;
  onPageChange: (fn: (p: number) => number) => void;
}

export function AuditTable({
  data,
  page,
  totalPages,
  onPageChange,
}: AuditTableProps) {
  return (
    <GlassCard>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2.5">Дія</th>
              <th className="px-3 py-2.5">Адміністратор</th>
              <th className="px-3 py-2.5">Ціль</th>
              <th className="px-3 py-2.5">IP</th>
              <th className="px-3 py-2.5">Час</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry, i) => {
              const meta = getActionMeta(entry.action);
              return (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium ring-1",
                        meta.color === "green" && "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
                        meta.color === "red" && "bg-red-500/10 text-red-500 ring-red-500/20",
                        meta.color === "blue" && "bg-blue-500/10 text-blue-500 ring-blue-500/20",
                        meta.color === "amber" && "bg-amber-500/10 text-amber-500 ring-amber-500/20",
                        meta.color === "purple" && "bg-purple-500/10 text-purple-500 ring-purple-500/20",
                        meta.color === "cyan" && "bg-cyan-500/10 text-cyan-500 ring-cyan-500/20",
                        meta.color === "zinc" && "bg-muted text-muted-foreground ring-border"
                      )}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-foreground font-mono font-medium">
                    {entry.admin_email}
                  </td>
                  <td
                    className="px-3 py-3 text-xs text-muted-foreground max-w-[200px] truncate"
                    title={entry.target}
                  >
                    {entry.target || "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground font-mono">
                    {entry.ip || "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground opacity-80 tabular-nums whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString("uk-UA", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
          <span className="text-xs text-zinc-600">
            Сторінка {page + 1} з {totalPages} · {data.total} записів
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => onPageChange((p) => Math.max(0, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => Math.abs(i - page) <= 2)
              .map((i) => (
                <button
                  key={i}
                  onClick={() => onPageChange(() => i)}
                  className={cn(
                    "h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                    i === page
                      ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                      : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
                  )}
                >
                  {i + 1}
                </button>
              ))}

            <button
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange((p) => Math.min(totalPages - 1, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
