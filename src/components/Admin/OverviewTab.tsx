import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare, Clock, ThumbsUp, ThumbsDown,
  TrendingUp, Users, RefreshCw, Shield,
} from "lucide-react";
import { motion } from "motion/react";
import {
  fetchSummary, fetchDaily, fetchTopQueries, fetchFeedback, fetchAudit,
  type AnalyticsSummary, type DailyStat, type TopQuery, type FeedbackStat, type AuditResponse,
} from "./api";
import { AnimatedSection, StatCard, GlassCard, Badge, TabLoader } from "./ui";
import { cn } from "@/lib/utils";

/**
 * Animated numeric counter that counts up from 0 to `target` over 1.2s
 * with a cubic ease-out curve. Used in KPI stat cards.
 */
function AnimCount({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <>{val}</>;
}

/**
 * Analytics overview dashboard tab.
 *
 * Displays:
 * - 4 KPI stat cards (total queries, avg response time, positive/negative feedback)
 * - Animated vertical bar chart (queries per day)
 * - Top queries leaderboard (up to 6 entries)
 * - Feedback satisfaction gauge (positive vs negative ratio)
 * - Last 5 audit log events
 *
 * All data is fetched in parallel via `Promise.all`. A 7/14/30-day filter
 * is available in the header and triggers a full data reload.
 */
export function OverviewTab() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [topQ, setTopQ] = useState<TopQuery[]>([]);
  const [fb, setFb] = useState<FeedbackStat | null>(null);
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, q, f, a] = await Promise.all([
        fetchSummary(days), fetchDaily(days), fetchTopQueries(days, 10), fetchFeedback(days), fetchAudit(0, 5),
      ]);
      setSummary(s); setDaily(d); setTopQ(q); setFb(f); setAudit(a);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Аналітика</h2>
          <p className="mt-0.5 text-xs text-zinc-600">Статистика використання чат-бота</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/[0.06]">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all",
                days === d ? "text-white" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {days === d && (
                <motion.div
                  layoutId="period-active"
                  className="absolute inset-0 rounded-lg bg-blue-500/20 ring-1 ring-blue-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{d}д</span>
            </button>
          ))}
          <button onClick={load} className="ml-1.5 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-300" title="Оновити">
            <RefreshCw size={14} />
          </button>
        </div>
      </AnimatedSection>

      <AnimatedSection i={0.5}>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-[13px] leading-relaxed text-blue-100/80">
          <strong className="text-blue-300">Як користуватися цією сторінкою:</strong> Тут зібрана загальна статистика роботи чат-бота. 
          Ви можете перевірити популярність бота (кількість запитів), його швидкість та оцінки користувачів (лайки 👍 / дизлайки 👎). 
          Гістограма відображає активність по днях, а блок «Топ запити» допоможе зрозуміти, що найчастіше цікавить ваших абітурієнтів чи студентів.
        </div>
      </AnimatedSection>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedSection i={1}>
            <StatCard icon={MessageSquare} label="Всього запитів" value={<AnimCount target={summary.total_queries} />} accent="blue" />
          </AnimatedSection>
          <AnimatedSection i={2}>
            <StatCard icon={Clock} label="Сер. відповідь" value={`${(summary.avg_response_ms / 1000).toFixed(1)}с`} accent="cyan" />
          </AnimatedSection>
          <AnimatedSection i={3}>
            <StatCard icon={ThumbsUp} label="Позитивних" value={<AnimCount target={fb?.positive ?? 0} />} accent="green" />
          </AnimatedSection>
          <AnimatedSection i={4}>
            <StatCard icon={ThumbsDown} label="Негативних" value={<AnimCount target={fb?.negative ?? 0} />} accent="red" />
          </AnimatedSection>
        </div>
      )}

      {daily.length > 0 && (
        <AnimatedSection i={5}>
          <GlassCard title="Запити по днях" icon={TrendingUp}>
            <div className="relative mt-2 flex h-60 w-full items-end gap-2 pt-4">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between border-y border-white/5 py-4 z-0">
                <div className="h-px w-full bg-white/[0.03]" />
                <div className="h-px w-full bg-white/[0.03]" />
                <div className="h-px w-full bg-white/[0.03]" />
                <div className="h-px w-full bg-white/[0.03]" />
              </div>
              
              {daily.map((d, i) => {
                const max = Math.max(...daily.map((s) => s.total_queries), 1);
                const pct = (d.total_queries / max) * 100;
                return (
                  <motion.div
                    key={d.date}
                    className="group relative z-10 flex h-full flex-1 flex-col items-center justify-end"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.4 + i * 0.03, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ transformOrigin: "bottom" }}
                  >
                    <div className="pointer-events-none absolute -top-14 z-30 hidden flex-col items-center group-hover:flex">
                      <div className="rounded-lg border border-white/10 bg-zinc-900/90 px-3 py-2 text-center shadow-xl backdrop-blur-md">
                        <div className="text-[10px] font-medium text-zinc-400">{d.date}</div>
                        <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{d.total_queries} запитів</div>
                      </div>
                      <div className="mt-[-4px] h-2 w-2 rotate-45 border-r border-b border-white/10 bg-zinc-900/90" />
                    </div>

                    <div
                      className="w-full max-w-[28px] rounded-t border-t border-white/20 bg-gradient-to-t from-indigo-900/40 via-blue-600/70 to-cyan-400/90 transition-all duration-300 group-hover:from-indigo-600/60 group-hover:via-blue-500/80 group-hover:to-cyan-300 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                    <div className="absolute bottom-0 w-full h-[2px] bg-cyan-400/0 transition-all duration-300 group-hover:bg-cyan-400/50" />
                    
                    {i % Math.max(1, Math.floor(daily.length / 7)) === 0 && (
                      <span className="absolute -bottom-6 mt-3 text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">{d.date.slice(5)}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="h-6 w-full" />
          </GlassCard>
        </AnimatedSection>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {topQ.length > 0 && (
          <AnimatedSection i={6}>
            <GlassCard title="Топ запити" icon={Users}>
              <div className="space-y-0">
                {topQ.slice(0, 6).map((q, i) => (
                  <div key={q.query_text} className="flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800/80 text-[10px] font-bold text-zinc-500">{i + 1}</span>
                    <span className="flex-1 truncate font-medium text-[13px] text-zinc-300" title={q.query_text}>{q.query_text}</span>
                    <Badge>{q.count}×</Badge>
                  </div>
                ))}
              </div>
            </GlassCard>
          </AnimatedSection>
        )}

        <div className="space-y-4">
          {fb && fb.total > 0 && (
            <AnimatedSection i={7}>
              <GlassCard title="Задоволеність" icon={ThumbsUp}>
                <div className="space-y-3">
                  <div className="flex h-8 overflow-hidden rounded-xl text-xs font-medium">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fb.ratio * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="flex items-center justify-center bg-gradient-to-r from-emerald-600 to-emerald-400 text-white"
                      style={{ minWidth: 40 }}
                    >
                      {(fb.ratio * 100).toFixed(0)}% 👍
                    </motion.div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(1 - fb.ratio) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                      className="flex items-center justify-center bg-gradient-to-r from-red-600 to-red-400 text-white"
                      style={{ minWidth: 40 }}
                    >
                      {((1 - fb.ratio) * 100).toFixed(0)}% 👎
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-600">
                    <span>Позитивних: {fb.positive}</span>
                    <span>Негативних: {fb.negative}</span>
                  </div>
                </div>
              </GlassCard>
            </AnimatedSection>
          )}

          {audit && audit.entries.length > 0 && (
            <AnimatedSection i={8}>
              <GlassCard title="Лог адміністратора" icon={Shield}>
                <div className="space-y-0">
                  {audit.entries.slice(0, 5).map((e) => (
                    <div key={e.id} className="flex items-center gap-2 border-b border-white/[0.03] py-2 last:border-0 text-xs">
                      <Badge color="purple">{e.action}</Badge>
                      <span className="flex-1 truncate text-zinc-500">{e.admin_email}</span>
                      <span className="text-[10px] text-zinc-700">{new Date(e.created_at).toLocaleDateString("uk-UA")}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </AnimatedSection>
          )}
        </div>
      </div>
    </div>
  );
}
