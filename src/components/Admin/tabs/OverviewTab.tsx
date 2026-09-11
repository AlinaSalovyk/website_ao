import { cn } from "@/lib/utils";
import { Clock, MessageSquare, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedSection, PageGuide, StatCard, TabLoader } from "../ui";
import { AuditLogPreview } from "./components/AuditLogPreview";
import { DailyQueriesChart } from "./components/DailyQueriesChart";
import { SatisfactionGauge } from "./components/SatisfactionGauge";
import { TopQueriesList } from "./components/TopQueriesList";
import { OVERVIEW_GUIDE } from "./constants/guides";
import { useOverview } from "./hooks/useOverview";

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

export function OverviewTab() {
  const { summary, daily, topQ, fb, audit, days, setDays, loading, load } = useOverview();

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Аналітика</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Статистика використання чат-бота</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                days === d ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {days === d && (
                <motion.div
                  layoutId="period-active"
                  className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{d}д</span>
            </button>
          ))}
          <button
            onClick={load}
            className="ml-1.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            title="Оновити"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </AnimatedSection>

      <AnimatedSection i={0.5}>
        <PageGuide {...OVERVIEW_GUIDE} />
      </AnimatedSection>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedSection i={1}>
            <StatCard
              icon={MessageSquare}
              label="Всього запитів"
              value={<AnimCount target={summary.total_queries} />}
              accent="blue"
            />
          </AnimatedSection>
          <AnimatedSection i={2}>
            <StatCard
              icon={Clock}
              label="Сер. відповідь"
              value={`${(summary.avg_response_ms / 1000).toFixed(1)}с`}
              accent="cyan"
            />
          </AnimatedSection>
          <AnimatedSection i={3}>
            <StatCard
              icon={ThumbsUp}
              label="Позитивних"
              value={<AnimCount target={fb?.positive ?? 0} />}
              accent="green"
            />
          </AnimatedSection>
          <AnimatedSection i={4}>
            <StatCard
              icon={ThumbsDown}
              label="Негативних"
              value={<AnimCount target={fb?.negative ?? 0} />}
              accent="red"
            />
          </AnimatedSection>
        </div>
      )}

      <AnimatedSection i={5}>
        <DailyQueriesChart daily={daily} />
      </AnimatedSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnimatedSection i={6}>
          <TopQueriesList topQ={topQ} />
        </AnimatedSection>

        <div className="space-y-4">
          <AnimatedSection i={7}>
            <SatisfactionGauge fb={fb} />
          </AnimatedSection>

          <AnimatedSection i={8}>
            <AuditLogPreview audit={audit} />
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
