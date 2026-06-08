
import { cn } from "@/lib/utils";
import { RefreshCw, type LucideIcon } from "lucide-react";
import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * Framer Motion variant set for a staggered fade-up entrance.
 * Use with `custom={i}` to stagger by index (each step adds 80ms delay).
 *
 * @example
 * \<motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} /\>
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/**
 * Wraps children in a `motion.div` with the {@link fadeUp} variant.
 * Used to stagger cards and sections on the analytics dashboard.
 *
 * @param children  - Content to animate.
 * @param className - Additional CSS classes.
 * @param i         - Stagger index (0-based).
 */
export function AnimatedSection({
  children,
  className,
  i = 0,
}: {
  children: ReactNode;
  className?: string;
  i?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={i}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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

/**
 * KPI metric card used on the Overview dashboard.
 * Lifts and glows on hover. Supports 5 accent colours.
 *
 * @param icon     - Lucide icon component.
 * @param label    - Metric description (e.g. "Total queries").
 * @param value    - The metric value to display prominently.
 * @param accent   - Colour token: "blue" | "cyan" | "green" | "red" | "purple".
 * @param subtitle - Optional small note below the label.
 */
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
      whileHover={{ scale: 1.03, y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#14171a]/80 p-5 backdrop-blur-xl"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100", accentBg[accent])} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex items-center gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", accentIcon[accent])}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="text-[28px] font-bold leading-none tracking-tight text-white tabular-nums">
            {value}
          </div>
          <div className="mt-1 text-xs font-medium text-zinc-500">{label}</div>
          {subtitle && <div className="mt-0.5 text-[10px] text-zinc-600">{subtitle}</div>}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Glassmorphism card container used throughout the admin panel.
 * Optionally renders a header row with title, icon, and action slot.
 *
 * @param children  - Card body content.
 * @param className - Extra CSS classes.
 * @param title     - Section title shown in the header.
 * @param icon      - Lucide icon next to the title.
 * @param action    - ReactNode rendered right-aligned in the header (e.g. a button).
 */
export function GlassCard({
  children,
  className,
  title,
  icon: Icon,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#14171a]/80 p-5 backdrop-blur-xl",
      className,
    )}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="flex items-center gap-2.5 text-sm font-semibold text-zinc-200">
              {Icon && <Icon size={16} className="text-blue-400" />}
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  blue: "bg-blue-500/12 text-blue-400 ring-blue-500/20",
  green: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/20",
  red: "bg-red-500/12 text-red-400 ring-red-500/20",
  cyan: "bg-cyan-500/12 text-cyan-400 ring-cyan-500/20",
  purple: "bg-purple-500/12 text-purple-400 ring-purple-500/20",
  gray: "bg-zinc-500/12 text-zinc-400 ring-zinc-500/20",
  yellow: "bg-amber-500/12 text-amber-400 ring-amber-500/20",
};

/**
 * Pill-shaped coloured badge for status / category labels.
 *
 * @param color - One of: "blue" | "green" | "red" | "cyan" | "purple" | "gray" | "yellow".
 */
export function Badge({ children, color = "blue" }: { children: ReactNode; color?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", badgeColors[color])}>
      {children}
    </span>
  );
}


/**
 * Full-tab loading state: spinning refresh icon + "Завантаження..." label.
 * Shown while async data fetches are in-flight.
 */
export function TabLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <RefreshCw size={24} />
      </motion.div>
      <p className="text-sm font-medium">Завантаження...</p>
    </div>
  );
}

/**
 * Centered empty-state placeholder with an icon, title, and optional description.
 * Used when a tab's list is empty (no documents, no queries, etc.).
 *
 * @param icon        - Lucide icon to display.
 * @param title       - Primary empty-state heading.
 * @param description - Optional secondary explanation.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-zinc-600">
      <div className="rounded-2xl bg-zinc-800/50 p-4">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      {description && <p className="max-w-xs text-xs text-zinc-600">{description}</p>}
    </div>
  );
}
