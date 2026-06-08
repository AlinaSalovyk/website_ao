import { useCallback, useEffect, useState } from "react";
import { Users, UserPlus, Trash2, RefreshCw, AlertTriangle, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { fetchAdmins, addAdmin, removeAdmin, type AdminUser } from "./api";
import { AnimatedSection, GlassCard, TabLoader, EmptyState } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Admin user management tab.
 *
 * Allows authenticated admins to:
 * - View all registered admins (email, added-by, date)
 * - Add a new admin by Google email address
 * - Remove an admin via a confirmation dialog
 *   (the backend prevents self-removal)
 *
 * All changes are reflected in the Audit Log automatically.
 */
export function AdminsTab() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAdmins(await fetchAdmins());
    } catch {
      toast.error("Не вдалось завантажити список адміністраторів");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = addEmail.trim().toLowerCase();
    if (!email) return;

    setAdding(true);
    try {
      const newAdmin = await addAdmin(email);
      setAdmins(prev => [newAdmin, ...prev]);
      setAddEmail("");
      toast.success(`${email} додано як адміністратора`);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("already")) {
        toast.error("Цей email вже є адміністратором");
      } else {
        toast.error(err?.message || "Помилка при додаванні адміністратора");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (admin: AdminUser) => {
    setDeleteTarget(admin);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await removeAdmin(deleteTarget.email);
      setAdmins(prev => prev.filter(a => a.email !== deleteTarget.email));
      toast.success(`${deleteTarget.email} видалено з адміністраторів`);
      setDeleteOpen(false);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("cannot_self_remove")) {
        toast.error("Не можна видалити самого себе");
      } else {
        toast.error("Помилка при видаленні адміністратора");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Адміністратори</h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            Керування доступом до панелі · {admins.length} адміністраторів
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
        >
          <RefreshCw size={13} />
          Оновити
        </button>
      </AnimatedSection>

      {/* Info block */}
      <AnimatedSection i={0.5}>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-[13px] leading-relaxed text-blue-100/80">
          <strong className="text-blue-300">Управління адміністраторами:</strong> Тут ви можете надати доступ до адмін-панелі іншим співробітникам кафедри.
          Введіть Google email адресу і натисніть «Додати». Всі зміни фіксуються в Audit Log.
        </div>
      </AnimatedSection>

      {/* Add admin form */}
      <AnimatedSection i={1}>
        <GlassCard title="Додати адміністратора" icon={UserPlus}>
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <input
                type="email"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                placeholder="admin@university.edu.ua"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !addEmail.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/15 transition-all hover:shadow-blue-600/25 hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {adding ? "Додаємо..." : "Додати"}
            </button>
          </form>
        </GlassCard>
      </AnimatedSection>

      {/* Admins list */}
      <AnimatedSection i={2}>
        {admins.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Список адміністраторів порожній"
            description="Додайте перших адміністраторів за допомогою форми вище"
          />
        ) : (
          <GlassCard title="Зареєстровані адміністратори" icon={Shield}>
            <div className="space-y-0">
              <AnimatePresence>
                {admins.map((admin, i) => (
                  <motion.div
                    key={admin.email}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 border-b border-white/[0.04] py-3 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-2"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/10 text-blue-400 font-bold text-sm">
                      {admin.email.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px] text-zinc-200 truncate">{admin.email}</div>
                      <div className="text-[11px] text-zinc-600">
                        Додано: {new Date(admin.added_at).toLocaleDateString("uk-UA")}
                        {admin.added_by && admin.added_by !== "system" && (
                          <span> · Ким: {admin.added_by}</span>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(admin)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Видалити адміністратора"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        )}
      </AnimatedSection>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-red-500/20 bg-[#0e1114] sm:max-w-[400px] shadow-2xl shadow-rose-900/10 backdrop-blur-3xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold flex flex-col items-center gap-3 text-center text-rose-500">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={24} className="text-rose-500" />
              </div>
              Видалення адміністратора
            </DialogTitle>
          </DialogHeader>
          {/* Warning message about self-removal prevention */}
          <div className="text-center text-sm text-zinc-400 mb-6">
            Ви впевнені, що хочете видалити <span className="font-bold text-zinc-200">"{deleteTarget?.email}"</span> з адміністраторів?
            Вони більше не матимуть доступу до панелі.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-800/50 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Скасувати
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-rose-500 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? <Loader2 className="animate-spin" size={16} /> : "Видалити"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
