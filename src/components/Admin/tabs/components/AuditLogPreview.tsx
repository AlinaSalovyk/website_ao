import { Shield } from "lucide-react";
import type { AuditResponse } from "../../api";
import { Badge, GlassCard } from "../../ui";

interface AuditLogPreviewProps {
  audit: AuditResponse | null;
}

export function AuditLogPreview({ audit }: AuditLogPreviewProps) {
  if (!audit || audit.entries.length === 0) return null;

  return (
    <GlassCard title="Лог адміністратора" icon={Shield}>
      <div className="space-y-0">
        {audit.entries.slice(0, 5).map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2 border-b border-border/40 py-2 last:border-0 text-xs"
          >
            <Badge color="purple">{e.action}</Badge>
            <span className="flex-1 truncate text-muted-foreground">{e.admin_email}</span>
            <span className="text-[10px] text-muted-foreground opacity-75">
              {new Date(e.created_at).toLocaleDateString("uk-UA")}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
