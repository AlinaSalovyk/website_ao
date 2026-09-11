import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedSection, EmptyState, PageGuide, TabLoader } from "../ui";
import { QueriesSummaryCards } from "./components/QueriesSummaryCards";
import { QueriesTable } from "./components/QueriesTable";
import { QUERIES_GUIDE } from "./constants/guides";
import { useQueries } from "./hooks/useQueries";

export function QueriesTab() {
  const {
    queries,
    loading,
    days,
    changeDays,
    page,
    setPage,
    paginated,
    totalPages,
    positive,
    negative,
    blocked,
  } = useQueries();

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Запити користувачів</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {queries.length} запитів за останні {days} днів
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => changeDays(d)}
              className={cn(
                "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                days === d ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
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
        <PageGuide {...QUERIES_GUIDE} />
      </AnimatedSection>

      {/* Summary cards */}
      <QueriesSummaryCards
        total={queries.length}
        positive={positive}
        negative={negative}
        blocked={blocked}
      />

      {queries.length === 0 ? (
        <AnimatedSection i={5}>
          <EmptyState
            icon={MessageCircle}
            title="Запитів ще немає"
            description="Коли користувачі почнуть використовувати бота, запити з'являться тут"
          />
        </AnimatedSection>
      ) : (
        <AnimatedSection i={5}>
          <QueriesTable
            paginated={paginated}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </AnimatedSection>
      )}
    </div>
  );
}
