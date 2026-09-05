import { useCallback, useEffect, useState } from "react";
import { Users, UserPlus, RefreshCw, AlertTriangle, Loader2, Shield, Send, Ban, RotateCcw, Mail, Clock, CheckCircle, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  fetchAdmins, updateAdminRole, updateAdminStatus, removeAdmin,
  fetchInvitations, sendInvitation, resendInvitation, revokeInvitation
} from "../services/general.api";
import type { AdminUser, AdminInvitation, Role, AdminStatus } from "../types/api.types";
import { AnimatedSection, GlassCard, TabLoader, EmptyState, PageGuide } from "../ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AdminsTab({ currentUser }: { currentUser?: AdminUser | null }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("news_editor");
  const [inviting, setInviting] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Confirmation modal
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionText: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    actionText: "",
    onConfirm: async () => {},
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, invitesRes] = await Promise.all([
        fetchAdmins().catch(() => []),
        fetchInvitations().catch(() => []),
      ]);
      setAdmins(adminsRes);
      setInvitations(invitesRes);
    } catch {
      toast.error("Не вдалося завантажити дані адміністраторів");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setInviting(true);
    try {
      const res = await sendInvitation(email, inviteRole);
      setInvitations(prev => [res.invitation, ...prev.filter(i => i.email !== email)]);
      setInviteEmail("");
      setInviteOpen(false);
      toast.success(`Запрошення надіслано на ${email}`);
    } catch (err: any) {
      toast.error(err?.message || "Не вдалося надіслати запрошення.");
      await loadData();
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (inv: AdminInvitation) => {
    setActionLoading(`resend-${inv.id}`);
    try {
      await resendInvitation(inv.id);
      toast.success(`Повторне запрошення надіслано на ${inv.email}`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Не вдалося перенадслати запрошення");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = (inv: AdminInvitation) => {
    setConfirmDialog({
      open: true,
      title: "Анулювання запрошення",
      description: `Ви впевнені, що хочете анулювати запрошення для "${inv.email}"? Посилання для активації стане недійсним.`,
      actionText: "Анулювати",
      onConfirm: async () => {
        setActionLoading(`revoke-${inv.id}`);
        try {
          await revokeInvitation(inv.id);
          setInvitations(prev => prev.filter(i => i.id !== inv.id));
          toast.success(`Запрошення для ${inv.email} анульовано`);
        } catch (err: any) {
          toast.error(err?.message || "Не вдалося анулювати запрошення");
        } finally {
          setActionLoading(null);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleChangeRole = (admin: AdminUser, newRole: Role) => {
    if (admin.role === newRole) return;
    setConfirmDialog({
      open: true,
      title: "Зміна ролі адміністратора",
      description: `Змінити роль для ${admin.email} на "${getRoleBadge(newRole).label}"?`,
      actionText: "Змінити роль",
      onConfirm: async () => {
        setActionLoading(`role-${admin.email}`);
        try {
          const updated = await updateAdminRole(admin.email, newRole);
          setAdmins(prev => prev.map(a => a.email === admin.email ? updated : a));
          toast.success(`Роль ${admin.email} змінено на ${getRoleBadge(newRole).label}`);
        } catch (err: any) {
          toast.error(err?.message || "Помилка при зміні ролі");
        } finally {
          setActionLoading(null);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleToggleStatus = (admin: AdminUser) => {
    const newStatus: AdminStatus = admin.status === "active" ? "disabled" : "active";
    const actionLabel = newStatus === "disabled" ? "деактивувати" : "активувати";

    setConfirmDialog({
      open: true,
      title: newStatus === "disabled" ? "Деактивація адміністратора" : "Активація адміністратора",
      description: `Ви впевнені, що хочете ${actionLabel} обліковий запис "${admin.email}"?`,
      actionText: newStatus === "disabled" ? "Деактивувати" : "Активувати",
      onConfirm: async () => {
        setActionLoading(`status-${admin.email}`);
        try {
          const updated = await updateAdminStatus(admin.email, newStatus);
          setAdmins(prev => prev.map(a => a.email === admin.email ? updated : a));
          toast.success(`Обліковий запис ${admin.email} ${newStatus === "disabled" ? "деактивовано" : "активовано"}`);
        } catch (err: any) {
          toast.error(err?.message || "Помилка при зміні статусу");
        } finally {
          setActionLoading(null);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleRemoveAdmin = (admin: AdminUser) => {
    setConfirmDialog({
      open: true,
      title: "Вилучення адміністратора",
      description: `Ви впевнені, що хочете остаточно вилучити обліковий запис "${admin.email}"?`,
      actionText: "Вилучити",
      onConfirm: async () => {
        setActionLoading(`remove-${admin.email}`);
        try {
          await removeAdmin(admin.email);
          setAdmins(prev => prev.filter(a => a.email !== admin.email));
          toast.success(`Адміністратора ${admin.email} вилучено`);
          await loadData();
        } catch (err: any) {
          toast.error(err?.message || "Помилка при вилученні адміністратора");
        } finally {
          setActionLoading(null);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "super_admin":
        return { label: "Головний адмін", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "news_editor":
        return { label: "Редактор новин", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case "chatbot_admin":
        return { label: "Адмін чат-бота", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    }
  };

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Адміністратори</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Керування ролями та запрошеннями · {admins.length} активних адмінів
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} />
            Оновити
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 cursor-pointer"
          >
            <UserPlus size={15} />
            Додати адміністратора
          </button>
        </div>
      </AnimatedSection>

      {/* Page Instructions & Guide */}
      <AnimatedSection i={0.5}>
        <PageGuide
          title="Як користуватися сторінкою та відмінності дій"
          summary="Правила керування доступом, ролями та різниця між деактивацією й видаленням"
          items={[
            {
              title: "Ролі та привілеї",
              desc: "Обирайте відповідну роль: Головний адмін (повний доступ), Редактор новин (CMS новин) або Адмін чат-бота (аналітика та знання)."
            },
            {
              title: "Запрошення (OAuth)",
              desc: "Натисніть «Додати адміністратора», щоб надіслати лист із посиланням. Користувач активується після першого входу через Google."
            },
            {
              title: "Деактивувати (Disable)",
              desc: "Тимчасово блокує вхід, але зберігає запис у базі. У будь-який момент відновлюється в 1 клік кнопкою «Активувати»."
            },
            {
              title: "Видалити (Delete)",
              desc: "Остаточно вилучає запис з бази даних й анулює запрошення. Для повернення доступу доведеться надсилати нове запрошення заново."
            }
          ]}
        />
      </AnimatedSection>

      {/* Active Admins List */}
      <AnimatedSection i={1}>
        <GlassCard title="Активні адміністратори" icon={ShieldCheck}>
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
                  const isSelf = Boolean(currentUser && currentUser.email.toLowerCase() === admin.email.toLowerCase());
                  const isLoading = actionLoading === `role-${admin.email}` || actionLoading === `status-${admin.email}`;

                  return (
                    <tr key={admin.email} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                            {admin.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-xs">{admin.email}</div>
                            <div className="text-[10px] text-muted-foreground">Додано: {new Date(admin.added_at).toLocaleDateString("uk-UA")}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          disabled={isLoading || isSelf}
                          value={admin.role}
                          onChange={(e) => handleChangeRole(admin, e.target.value as Role)}
                          className={`rounded-lg border px-2 py-1 text-[11px] font-semibold bg-background ${badge.color} outline-none cursor-pointer disabled:opacity-60`}
                        >
                          <option value="super_admin">Головний адмін</option>
                          <option value="news_editor">Редактор новин</option>
                          <option value="chatbot_admin">Адмін чат-бота</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                          admin.status === "active" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}>
                          {admin.status === "active" ? <CheckCircle size={10} /> : <Ban size={10} />}
                          {admin.status === "active" ? "Активний" : "Деактивовано"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground text-[11px]">
                        {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString("uk-UA") : "Не входив"}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(admin)}
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
                              onClick={() => handleRemoveAdmin(admin)}
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
        </GlassCard>
      </AnimatedSection>

      {/* Pending Invitations Section */}
      <AnimatedSection i={2}>
        <GlassCard title="Активні запрошення (Pending Invitations)" icon={Mail}>
          {invitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Немає активних запрошень. Натисніть «Додати адміністратора», щоб надіслати нове.
            </div>
          ) : (
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

                    const getDeliveryBadge = (status?: string) => {
                      if (status === "delivery_failed") {
                        return { label: "Помилка доставки", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
                      }
                      if (status === "pending") {
                        return { label: "В обробці", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock };
                      }
                      return { label: "Надіслано", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle };
                    };

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
                              onClick={() => handleResend(inv)}
                              disabled={isResending || isRevoking}
                              className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              {isResending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                              Надіслати повторно
                            </button>
                            <button
                              onClick={() => handleRevoke(inv)}
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
          )}
        </GlassCard>
      </AnimatedSection>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-border bg-card text-card-foreground sm:max-w-[460px] shadow-2xl backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <UserPlus className="text-primary" size={20} />
              Запросити адміністратора
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-5 mt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Електронна пошта (Email)
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="new.admin@university.edu.ua"
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Вибір ролі
              </label>
              <div className="space-y-3">
                <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  inviteRole === "news_editor" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    checked={inviteRole === "news_editor"}
                    onChange={() => setInviteRole("news_editor")}
                    className="mt-0.5 text-primary"
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">Редактор новин</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Має доступ лише до керування новинами та пов’язаним медіаконтентом.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  inviteRole === "chatbot_admin" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    checked={inviteRole === "chatbot_admin"}
                    onChange={() => setInviteRole("chatbot_admin")}
                    className="mt-0.5 text-primary"
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">Адміністратор чат-бота</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Має доступ до адміністративного функціоналу чат-бота, аналітики та бази знань.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {inviting ? "Надсилаємо..." : "Надіслати запрошення"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="border-border bg-card text-card-foreground sm:max-w-[400px] shadow-2xl backdrop-blur-3xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold flex flex-col items-center gap-2 text-center text-foreground">
              <AlertTriangle size={28} className="text-amber-400" />
              {confirmDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-xs text-muted-foreground mb-5 leading-relaxed">
            {confirmDialog.description}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              className="flex-1 py-2 rounded-xl text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              onClick={confirmDialog.onConfirm}
              className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-sm transition-all hover:bg-primary/90 cursor-pointer"
            >
              {confirmDialog.actionText}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
