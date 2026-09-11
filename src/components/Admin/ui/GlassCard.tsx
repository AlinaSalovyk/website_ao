import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
      "relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm text-card-foreground",
      className,
    )}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
              {Icon && <Icon size={16} className="text-primary" />}
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
