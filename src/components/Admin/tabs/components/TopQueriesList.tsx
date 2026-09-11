import { Users } from "lucide-react";
import type { TopQuery } from "../../api";
import { Badge, GlassCard } from "../../ui";

interface TopQueriesListProps {
  topQ: TopQuery[];
}

export function TopQueriesList({ topQ }: TopQueriesListProps) {
  if (topQ.length === 0) return null;

  return (
    <GlassCard title="Топ запити" icon={Users}>
      <div className="space-y-0">
        {topQ.slice(0, 6).map((q, i) => (
          <div
            key={q.query_text}
            className="flex items-center gap-3 border-b border-border/50 py-2.5 last:border-0"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground border border-border">
              {i + 1}
            </span>
            <span
              className="flex-1 truncate font-medium text-[13px] text-foreground"
              title={q.query_text}
            >
              {q.query_text}
            </span>
            <Badge>{q.count}×</Badge>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
