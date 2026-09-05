import { useCallback, useEffect, useState } from "react";
import { MessageCircle, ThumbsUp, ThumbsDown, Shield, Clock } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { fetchQueries, type QueryRow } from "../api";
import { AnimatedSection, GlassCard, Badge, TabLoader, EmptyState, PageGuide } from "../ui";
import { cn } from "@/lib/utils";

/**
 * Displays the feedback value for a query row:
 * thumbs up (green) for +1, thumbs down (red) for -1, or "—" for none.
 */
function FeedbackIcon({ value }: { value: number }) {
  if (value === 1) return <ThumbsUp size={14} className="text-emerald-400" />;
  if (value === -1) return <ThumbsDown size={14} className="text-red-400" />;
  return <span className="text-[10px] text-zinc-700">—</span>;
}

/**
 * Paginated query log tab.
 *
 * Features:
 * - Shows all queries for the selected time range (7/14/30/90 days, up to 200 rows)
 * - Summary mini-cards: total / positive / negative / blocked counts
 * - Table: query text (or hash), language, response time, sources used, feedback, block status, date
 * - Client-side pagination at 20 rows per page
 */
export function QueriesTab() {
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try { setQueries(await fetchQueries(days, 200)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <TabLoader />;

  const paginated = queries.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(queries.length / perPage);

  const withFeedback = queries.filter((q) => q.feedback !== 0);
  const positive = queries.filter((q) => q.feedback === 1).length;
  const negative = queries.filter((q) => q.feedback === -1).length;
  const blocked = queries.filter((q) => q.is_blocked === 1).length;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Запити користувачів</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{queries.length} запитів за останні {days} днів</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => { setDays(d); setPage(0); }}
              className={cn(
                "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                days === d ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {days === d && (
                <motion.div
                  layoutId="queries-period"
                  className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{d}д</span>
            </button>
          ))}
        </div>
      </AnimatedSection>

      {/* Info Block */}
      <AnimatedSection i={0.5}>
        <PageGuide
          title="Як користуватися цією сторінкою"
          summary="Детальний журнал звернень до вашого бота, перевірка часу відповідей та дизлайків (👎)"
          items={[
            { title: "Журнал запитів", desc: "Кожен рядок — це окреме запитання користувача до чат-бота." },
            { title: "Швидкість та Джерела", desc: "Показує час формування відповіді (Час) та кількість використаних документів." },
            { title: "Аналіз дизлайків (👎)", desc: "Позначає відповіді, які не задовольнили користувача (сигнал додати нові документи)." },
            { title: "Заблоковано", desc: "Запити, відхилені фільтрами безпеки або офф-топік перевіркою." }
          ]}
        />
      </AnimatedSection>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnimatedSection i={1}>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-sm">
            <div className="text-lg font-bold text-foreground tabular-nums">{queries.length}</div>
            <div className="text-[10px] font-medium text-muted-foreground">Всього</div>
          </div>
        </AnimatedSection>
        <AnimatedSection i={2}>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-sm">
            <div className="text-lg font-bold text-emerald-500 tabular-nums">{positive}</div>
            <div className="text-[10px] font-medium text-muted-foreground">Позитивних</div>
          </div>
        </AnimatedSection>
        <AnimatedSection i={3}>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-sm">
            <div className="text-lg font-bold text-rose-500 tabular-nums">{negative}</div>
            <div className="text-[10px] font-medium text-muted-foreground">Негативних</div>
          </div>
        </AnimatedSection>
        <AnimatedSection i={4}>
          <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-sm">
            <div className="text-lg font-bold text-amber-500 tabular-nums">{blocked}</div>
            <div className="text-[10px] font-medium text-muted-foreground">Заблоковано</div>
          </div>
        </AnimatedSection>
      </div>

      {queries.length === 0 ? (
        <AnimatedSection i={5}>
          <EmptyState icon={MessageCircle} title="Запитів ще немає" description="Коли користувачі почнуть використовувати бота, запити з'являться тут" />
        </AnimatedSection>
      ) : (
        <AnimatedSection i={5}>
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5">Запит</th>
                    <th className="px-3 py-2.5">Мова</th>
                    <th className="px-3 py-2.5">
                      <div className="flex items-center gap-1"><Clock size={11} /> Час</div>
                    </th>
                    <th className="px-3 py-2.5">Джерел</th>
                    <th className="px-3 py-2.5">Відгук</th>
                    <th className="px-3 py-2.5">Стан</th>
                    <th className="px-3 py-2.5">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((q, i) => (
                    <motion.tr
                      key={`${q.query_hash}-${q.created_at}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/40 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground max-w-[200px] truncate" title={q.query_text}>{q.query_text || q.query_hash}</div>
                      </td>
                      <td className="px-3 py-2.5">{q.language === "uk" ? "🇺🇦" : "🇬🇧"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{(q.response_ms / 1000).toFixed(1)}с</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{q.sources_cnt}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                           <FeedbackIcon value={q.feedback} />
                           <span className="text-xs text-muted-foreground">
                             {q.feedback === 1 ? "Добре" : q.feedback === -1 ? "Погано" : "Немає"}
                           </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {q.is_blocked === 1
                          ? <Badge color="red">Заблоковано</Badge>
                          : <Badge color="green">Чисто</Badge>
                        }
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground opacity-80">{new Date(q.created_at).toLocaleString("uk-UA")}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                ← Назад
              </Button>
              <span className="text-xs text-zinc-600">
                {page + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Далі →
              </Button>
            </div>
          )}
        </AnimatedSection>
      )}
    </div>
  );
}
