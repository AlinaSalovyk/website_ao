import { RefreshCw, Shield } from "lucide-react";
import { AnimatedSection, EmptyState, PageGuide, TabLoader } from "../ui";
import { AuditTable } from "./components/AuditTable";
import { AUDIT_GUIDE } from "./constants/guides";
import { useAudit } from "./hooks/useAudit";

export function AuditTab() {
  const { data, loading, page, setPage, totalPages, reload } = useAudit();

  if (loading && !data) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Audit Log</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Всі дії адміністраторів · {data?.total ?? 0} записів
          </p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer shadow-sm"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Оновити
        </button>
      </AnimatedSection>

      <AnimatedSection i={0.5}>
        <PageGuide {...AUDIT_GUIDE} />
      </AnimatedSection>

      <AnimatedSection i={1}>
        {!data || data.entries.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Audit log порожній"
            description="Дії адміністраторів ще не записані"
          />
        ) : (
          <AuditTable
            data={data}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </AnimatedSection>
    </div>
  );
}
