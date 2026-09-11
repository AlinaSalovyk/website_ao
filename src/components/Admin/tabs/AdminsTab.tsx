import { Mail, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import type { AdminUser } from "../types/api.types";
import { AnimatedSection, GlassCard, PageGuide, TabLoader } from "../ui";
import { AdminUsersTable } from "./components/AdminUsersTable";
import { ConfirmActionModal } from "./components/ConfirmActionModal";
import { InviteAdminModal } from "./components/InviteAdminModal";
import { PendingInvitationsTable } from "./components/PendingInvitationsTable";
import { ADMINS_GUIDE } from "./constants/guides";
import { useAdmins } from "./hooks/useAdmins";

export function AdminsTab({ currentUser }: { currentUser?: AdminUser | null }) {
  const {
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
  } = useAdmins();

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
        <PageGuide {...ADMINS_GUIDE} />
      </AnimatedSection>

      {/* Active Admins List */}
      <AnimatedSection i={1}>
        <GlassCard title="Активні адміністратори" icon={ShieldCheck}>
          <AdminUsersTable
            admins={admins}
            currentUser={currentUser}
            actionLoading={actionLoading}
            onChangeRole={handleChangeRole}
            onToggleStatus={handleToggleStatus}
            onRemoveAdmin={handleRemoveAdmin}
          />
        </GlassCard>
      </AnimatedSection>

      {/* Pending Invitations Section */}
      <AnimatedSection i={2}>
        <GlassCard title="Активні запрошення (Pending Invitations)" icon={Mail}>
          <PendingInvitationsTable
            invitations={invitations}
            actionLoading={actionLoading}
            onResend={handleResend}
            onRevoke={handleRevoke}
          />
        </GlassCard>
      </AnimatedSection>

      {/* Invite Modal */}
      <InviteAdminModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        email={inviteEmail}
        onEmailChange={setInviteEmail}
        role={inviteRole}
        onRoleChange={setInviteRole}
        inviting={inviting}
        onSubmit={handleSendInvite}
      />

      {/* Confirmation Dialog */}
      <ConfirmActionModal
        dialogState={confirmDialog}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
