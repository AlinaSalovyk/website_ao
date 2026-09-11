import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchAdmins,
  fetchInvitations,
  removeAdmin,
  resendInvitation,
  revokeInvitation,
  sendInvitation,
  updateAdminRole,
  updateAdminStatus,
} from "../../services/general.api";
import type { AdminInvitation, AdminStatus, AdminUser, Role } from "../../types/api.types";
import { getRoleBadge } from "../constants/admins.constants";

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  actionText: string;
  onConfirm: () => Promise<void>;
}

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("news_editor");
  const [inviting, setInviting] = useState(false);

  // Action Loading State
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setInviting(true);
    try {
      const res = await sendInvitation(email, inviteRole);
      setInvitations((prev) => [res.invitation, ...prev.filter((i) => i.email !== email)]);
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
          setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
          toast.success(`Запрошення для ${inv.email} анульовано`);
        } catch (err: any) {
          toast.error(err?.message || "Не вдалося анулювати запрошення");
        } finally {
          setActionLoading(null);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
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
          setAdmins((prev) => prev.map((a) => (a.email === admin.email ? updated : a)));
          toast.success(`Роль ${admin.email} змінено на ${getRoleBadge(newRole).label}`);
        } catch (err: any) {
          toast.error(err?.message || "Помилка при зміні ролі");
        } finally {
          setActionLoading(null);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
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
          setAdmins((prev) => prev.map((a) => (a.email === admin.email ? updated : a)));
          toast.success(`Обліковий запис ${admin.email} ${newStatus === "disabled" ? "деактивовано" : "активовано"}`);
        } catch (err: any) {
          toast.error(err?.message || "Помилка при зміні статусу");
        } finally {
          setActionLoading(null);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
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
          setAdmins((prev) => prev.filter((a) => a.email !== admin.email));
          toast.success(`Адміністратора ${admin.email} вилучено`);
          await loadData();
        } catch (err: any) {
          toast.error(err?.message || "Помилка при вилученні адміністратора");
        } finally {
          setActionLoading(null);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  return {
    admins,
    invitations,
    loading,
    actionLoading,
    inviteOpen,
    setInviteOpen,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviting,
    confirmDialog,
    setConfirmDialog,
    loadData,
    handleSendInvite,
    handleResend,
    handleRevoke,
    handleChangeRole,
    handleToggleStatus,
    handleRemoveAdmin,
  };
}
