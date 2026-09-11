import { AnimatedSection } from "../../ui";

interface QueriesSummaryCardsProps {
  total: number;
  positive: number;
  negative: number;
  blocked: number;
}

export function QueriesSummaryCards({
  total,
  positive,
  negative,
  blocked,
}: QueriesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <AnimatedSection i={1}>
        <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-sm">
          <div className="text-lg font-bold text-foreground tabular-nums">{total}</div>
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
  );
}
