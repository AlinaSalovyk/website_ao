import { Ban, Clock, Loader2, RotateCcw } from "lucide-react";
import type { AdminInvitation } from "../../types/api.types";
import { getDeliveryBadge, getRoleBadge } from "../constants/admins.constants";

interface PendingInvitationsTableProps {
  invitations: AdminInvitation[];
  actionLoading: string | null;
  onResend: (inv: AdminInvitation) => void;
  onRevoke: (inv: AdminInvitation) => void;
}

export function PendingInvitationsTable({
  invitations,
  actionLoading,
  onResend,
  onRevoke,
}: PendingInvitationsTableProps) {
  if (invitations.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Немає активних запрошень. Натисніть «Додати адміністратора», щоб надіслати нове.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-border/50 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Email</th>
            <th className="py-3 px-3">Запропонована Роль</th>
            <th className="py-3 px-3">Статус доставки</th>
            <th className="py-3 px-3">Ким запрошено</th>
            <th className="py-3 px-3">Дійсне до</th>
            <th className="py-3 px-3 text-right">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {invitations.map((inv) => {
            const badge = getRoleBadge(inv.role);
            const isResending = actionLoading === `resend-${inv.id}`;
            const isRevoking = actionLoading === `revoke-${inv.id}`;
            const delBadge = getDeliveryBadge(inv.delivery_status);
            const DelIcon = delBadge.icon;

            return (
              <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                <td className="py-3.5 px-3 font-semibold text-foreground">{inv.email}</td>
                <td className="py-3.5 px-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${badge.color}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${delBadge.color}`}>
                    <DelIcon size={10} />
                    {delBadge.label}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-muted-foreground text-[11px]">{inv.invited_by_admin_id}</td>
                <td className="py-3.5 px-3 text-muted-foreground text-[11px] flex items-center gap-1">
                  <Clock size={12} className="text-amber-400" />
                  {new Date(inv.expires_at).toLocaleString("uk-UA")}
                </td>
                <td className="py-3.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onResend(inv)}
                      disabled={isResending || isRevoking}
                      className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      {isResending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                      Надіслати повторно
                    </button>
                    <button
                      onClick={() => onRevoke(inv)}
                      disabled={isResending || isRevoking}
                      className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                    >
                      {isRevoking ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                      Анулювати
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
