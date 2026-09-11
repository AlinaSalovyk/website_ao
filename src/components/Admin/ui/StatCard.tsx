import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const accentBg: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5",
  cyan: "from-cyan-500/20 to-cyan-600/5",
  green: "from-emerald-500/20 to-emerald-600/5",
  red: "from-red-500/20 to-red-600/5",
  purple: "from-purple-500/20 to-purple-600/5",
};

const accentIcon: Record<string, string> = {
  blue: "text-blue-400 bg-blue-500/15",
  cyan: "text-cyan-400 bg-cyan-500/15",
  green: "text-emerald-400 bg-emerald-500/15",
  red: "text-red-400 bg-red-500/15",
  purple: "text-purple-400 bg-purple-500/15",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = "blue",
  subtitle,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm text-card-foreground"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100", accentBg[accent])} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="relative flex items-center gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", accentIcon[accent])}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </div>
          <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
          {subtitle && <div className="mt-0.5 text-[10px] text-muted-foreground opacity-80">{subtitle}</div>}
        </div>
      </div>
    </motion.div>
  );
}
