// 

import { useCallback, useEffect, useState } from "react";
import {
  Shield, RefreshCw, ChevronLeft, ChevronRight,
  LogIn, LogOut, Upload, Trash2, RotateCw,
  Download, Eye, PencilLine, UserPlus, UserMinus
} from "lucide-react";
import { motion } from "motion/react";
import { fetchAudit, type AuditEntry, type AuditResponse } from "./api";
import { AnimatedSection, GlassCard, Badge, TabLoader, EmptyState } from "./ui";
import { cn } from "@/lib/utils";

/**
 * Returns display metadata (icon, colour, Ukrainian label) for a given audit action string.
 * Used to render coloured action badges in the audit log table.
 */
function actionMeta(action: string): { icon: React.ReactNode; color: string; label: string } {
  switch (action) {
    case "login":
      return { icon: <LogIn size={13} />, color: "green", label: "Вхід" };
    case "logout":
      return { icon: <LogOut size={13} />, color: "zinc", label: "Вихід" };
    case "upload_document":
      return { icon: <Upload size={13} />, color: "blue", label: "Завантаження" };
    case "delete_document":
      return { icon: <Trash2 size={13} />, color: "red", label: "Видалення" };
    case "rename_document":
      return { icon: <PencilLine size={13} />, color: "amber", label: "Перейменування" };
    case "reindex_document":
      return { icon: <RotateCw size={13} />, color: "purple", label: "Реіндексація" };
    case "reindex_all":
      return { icon: <RotateCw size={13} />, color: "purple", label: "Реіндексація всього" };
    case "export_csv":
      return { icon: <Download size={13} />, color: "cyan", label: "CSV Export" };
    case "view_analytics":
      return { icon: <Eye size={13} />, color: "blue", label: "Перегляд аналітики" };
    case "view_audit_log":
      return { icon: <Shield size={13} />, color: "zinc", label: "Перегляд audit" };
    case "add_admin":
      return { icon: <UserPlus size={13} />, color: "green", label: "Додано адміна" };
    case "remove_admin":
      return { icon: <UserMinus size={13} />, color: "red", label: "Видалено адміна" };
    default:
      return { icon: <Shield size={13} />, color: "zinc", label: action };
  }
}

const PAGE_SIZE = 20;

/**
 * Paginated audit log tab.
 *
 * Shows all admin actions in reverse-chronological order, fetched 20 per page.
 * Each row displays an action badge (coloured icon + Ukrainian label),
 * admin email, target URL path, client IP, and timestamp.
 *
 * Actions tracked: login, logout, upload_document, delete_document,
 * rename_document, reindex_document, reindex_all, export_csv,
 * view_analytics, view_audit_log, add_admin, remove_admin.
 */
export function AuditTab() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = useCallback(async (offset: number) => {
    setLoading(true);
    try {
      const res = await fetchAudit(offset, PAGE_SIZE);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page * PAGE_SIZE);
  }, [load, page]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  if (loading && !data) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Audit Log</h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            Всі дії адміністраторів · {data?.total ?? 0} записів
          </p>
        </div>
        <button
          onClick={() => load(page * PAGE_SIZE)}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Оновити
        </button>
      </AnimatedSection>

      <AnimatedSection i={0.5}>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-[13px] leading-relaxed text-blue-100/80">
          <strong className="text-blue-300">Audit Log</strong> — повний журнал дій адміністраторів:
          вхід/вихід, завантаження та видалення документів, реіндексація, керування адмінами, перегляд аналітики.
        </div>
      </AnimatedSection>

      <AnimatedSection i={1}>
        {(!data || data.entries.length === 0) ? (
          <EmptyState icon={Shield} title="Audit log порожній" description="Дії адміністраторів ще не записані" />
        ) : (
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    <th className="px-3 py-2.5">Дія</th>
                    <th className="px-3 py-2.5">Адміністратор</th>
                    <th className="px-3 py-2.5">Ціль</th>
                    <th className="px-3 py-2.5">IP</th>
                    <th className="px-3 py-2.5">Час</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry, i) => {
                    const meta = actionMeta(entry.action);
                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-3 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium ring-1",
                            meta.color === "green" && "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                            meta.color === "red" && "bg-red-500/10 text-red-400 ring-red-500/20",
                            meta.color === "blue" && "bg-blue-500/10 text-blue-400 ring-blue-500/20",
                            meta.color === "amber" && "bg-amber-500/10 text-amber-400 ring-amber-500/20",
                            meta.color === "purple" && "bg-purple-500/10 text-purple-400 ring-purple-500/20",
                            meta.color === "cyan" && "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
                            meta.color === "zinc" && "bg-zinc-800/80 text-zinc-400 ring-zinc-700/50",
                          )}>
                            {meta.icon}
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-zinc-400 font-mono">{entry.admin_email}</td>
                        <td className="px-3 py-3 text-xs text-zinc-500 max-w-[200px] truncate" title={entry.target}>
                          {entry.target || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs text-zinc-600 font-mono">{entry.ip || "—"}</td>
                        <td className="px-3 py-3 text-xs text-zinc-600 tabular-nums whitespace-nowrap">
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
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter(i => Math.abs(i - page) <= 2)
                    .map(i => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
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
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        )}
      </AnimatedSection>
    </div>
  );
}
