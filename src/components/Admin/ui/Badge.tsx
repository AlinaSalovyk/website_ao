import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const badgeColors: Record<string, string> = {
  blue: "bg-blue-500/12 text-blue-400 ring-blue-500/20",
  green: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/20",
  red: "bg-red-500/12 text-red-400 ring-red-500/20",
  cyan: "bg-cyan-500/12 text-cyan-400 ring-cyan-500/20",
  purple: "bg-purple-500/12 text-purple-400 ring-purple-500/20",
  gray: "bg-zinc-500/12 text-zinc-400 ring-zinc-500/20",
  yellow: "bg-amber-500/12 text-amber-400 ring-amber-500/20",
};

export function Badge({ children, color = "blue" }: { children: ReactNode; color?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", badgeColors[color])}>
      {children}
    </span>
  );
}
