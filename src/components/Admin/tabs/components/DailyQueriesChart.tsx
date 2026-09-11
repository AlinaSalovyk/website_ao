import { TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import type { DailyStat } from "../../api";
import { GlassCard } from "../../ui";

interface DailyQueriesChartProps {
  daily: DailyStat[];
}

export function DailyQueriesChart({ daily }: DailyQueriesChartProps) {
  if (daily.length === 0) return null;

  const max = Math.max(...daily.map((s) => s.total_queries), 1);

  return (
    <GlassCard title="Запити по днях" icon={TrendingUp}>
      <div className="relative mt-2 flex h-60 w-full items-end gap-2 pt-4">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between border-y border-white/5 py-4 z-0">
          <div className="h-px w-full bg-white/[0.03]" />
          <div className="h-px w-full bg-white/[0.03]" />
          <div className="h-px w-full bg-white/[0.03]" />
          <div className="h-px w-full bg-white/[0.03]" />
        </div>

        {daily.map((d, i) => {
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
                <div className="rounded-lg border border-border bg-card px-3 py-2 text-center shadow-xl backdrop-blur-md text-card-foreground">
                  <div className="text-[10px] font-medium text-muted-foreground">{d.date}</div>
                  <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                    {d.total_queries} запитів
                  </div>
                </div>
                <div className="mt-[-4px] h-2 w-2 rotate-45 border-r border-b border-border bg-card" />
              </div>

              <div
                className="w-full max-w-[28px] rounded-t border-t border-primary/30 bg-gradient-to-t from-blue-600/40 via-blue-500/70 to-cyan-400/90 transition-all duration-300 group-hover:from-blue-600 group-hover:via-blue-500 group-hover:to-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              <div className="absolute bottom-0 w-full h-[2px] bg-cyan-400/0 transition-all duration-300 group-hover:bg-cyan-400/50" />

              {i % Math.max(1, Math.floor(daily.length / 7)) === 0 && (
                <span className="absolute -bottom-6 mt-3 text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {d.date.slice(5)}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="h-6 w-full" />
    </GlassCard>
  );
}
