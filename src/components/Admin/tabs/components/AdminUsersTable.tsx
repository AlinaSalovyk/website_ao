import { Ban, CheckCircle, Trash2 } from "lucide-react";
import type { AdminUser, Role } from "../../types/api.types";
import { getRoleBadge } from "../constants/admins.constants";

interface AdminUsersTableProps {
  admins: AdminUser[];
  currentUser?: AdminUser | null;
  actionLoading: string | null;
  onChangeRole: (admin: AdminUser, newRole: Role) => void;
  onToggleStatus: (admin: AdminUser) => void;
  onRemoveAdmin: (admin: AdminUser) => void;
}

export function AdminUsersTable({
  admins,
  currentUser,
  actionLoading,
  onChangeRole,
  onToggleStatus,
  onRemoveAdmin,
}: AdminUsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-border/50 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Користувач</th>
            <th className="py-3 px-3">Роль</th>
            <th className="py-3 px-3">Статус</th>
            <th className="py-3 px-3">Останній вхід</th>
            <th className="py-3 px-3 text-right">Дії</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {admins.map((admin) => {
            const badge = getRoleBadge(admin.role);
            const isSelf = Boolean(
              currentUser && currentUser.email.toLowerCase() === admin.email.toLowerCase()
            );
            const isLoading =
              actionLoading === `role-${admin.email}` || actionLoading === `status-${admin.email}`;

            return (
              <tr key={admin.email} className="hover:bg-muted/40 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-xs">{admin.email}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Додано: {new Date(admin.added_at).toLocaleDateString("uk-UA")}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <select
                    disabled={isLoading || isSelf}
                    value={admin.role}
                    onChange={(e) => onChangeRole(admin, e.target.value as Role)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold bg-background ${badge.color} outline-none cursor-pointer disabled:opacity-60`}
                  >
                    <option value="super_admin">Головний адмін</option>
                    <option value="news_editor">Редактор новин</option>
                    <option value="chatbot_admin">Адмін чат-бота</option>
                  </select>
                </td>
                <td className="py-3.5 px-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                      admin.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {admin.status === "active" ? <CheckCircle size={10} /> : <Ban size={10} />}
                    {admin.status === "active" ? "Активний" : "Деактивовано"}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-muted-foreground text-[11px]">
                  {admin.last_login_at
                    ? new Date(admin.last_login_at).toLocaleString("uk-UA")
                    : "Не входив"}
                </td>
                <td className="py-3.5 px-3 text-right">
                  {!isSelf && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onToggleStatus(admin)}
                        disabled={isLoading}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer border ${
                          admin.status === "active"
                            ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {admin.status === "active" ? "Деактивувати" : "Активувати"}
                      </button>
                      <button
                        onClick={() => onRemoveAdmin(admin)}
                        disabled={isLoading}
                        title="Видалити адміністратора"
                        className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Видалити
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
