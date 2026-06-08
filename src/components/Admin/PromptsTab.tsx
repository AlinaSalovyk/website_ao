import { useState, useCallback, useEffect } from "react";
import { MessageSquareDashed, Plus, Edit2, Play, Square, Loader2, Trash2, AlertTriangle, MoreVertical } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { fetchPrompts, createPrompt, togglePromptActive, updatePrompt, deletePrompt, type PromptVariant } from "./api";
import { toast } from "sonner";
import { AnimatedSection, GlassCard, Badge, TabLoader } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * A/B system prompt management tab.
 *
 * Enables admins to:
 * - Create new prompt variants (name, language, text) via a Dialog form
 * - Toggle variants active/inactive (multiple can be active simultaneously)
 * - Edit prompt text via an edit Dialog
 * - Delete variants with a confirmation modal
 * - View per-variant usage count and average feedback score
 *
 * Active variants are selected randomly by the backend's PromptSelector.
 * The variant with the highest `avg_score` (feedback ratio) is the "winner".
 */
export function PromptsTab() {
  const [prompts, setPrompts] = useState<PromptVariant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Partial<PromptVariant>>({
    name: "", language: "uk", prompt_text: "", is_active: false,
  });

  const [editTarget, setEditTarget] = useState<PromptVariant | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editText, setEditText] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<PromptVariant | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPrompts();
      setPrompts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await togglePromptActive(id, !currentActive);
      await loadPrompts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!newPrompt.name || !newPrompt.prompt_text) return;
    setIsCreating(true);
    try {
      await createPrompt(newPrompt);
      setNewPrompt({ name: "", language: "uk", prompt_text: "", is_active: false });
      toast.success("Новий промпт створено!");
      await loadPrompts();
    } catch (e) {
      console.error(e);
      toast.error("Помилка створення");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editText.trim()) return;
    setEditLoading(true);
    try {
      await updatePrompt(editTarget.id, editText.trim());
      toast.success("Промпт успішно оновлено");
      setEditOpen(false);
      setTimeout(() => loadPrompts(), 300);
    } catch {
      toast.error("Помилка оновлення");
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deletePrompt(deleteTarget.id);
      toast.success("Промпт видалено з бази");
      setDeleteOpen(false);
      setTimeout(() => loadPrompts(), 300);
    } catch {
      toast.error("Помилка видалення");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (p: PromptVariant) => {
    setEditTarget(p);
    setEditText(p.prompt_text);
    setEditOpen(true);
  };

  const openDeleteModal = (p: PromptVariant) => {
    setDeleteTarget(p);
    setDeleteOpen(true);
  };

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">A/B Промпти</h2>
          <p className="mt-0.5 text-xs text-zinc-400">Керуйте системними інструкціями для чат-бота</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-400 hover:scale-[1.02] active:scale-95">
              <Plus size={16} /> <span>Створити</span>
            </button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#0e1114] sm:max-w-[550px] shadow-2xl shadow-blue-900/10 backdrop-blur-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquareDashed className="text-blue-400" size={20} />
                Новий Промпт
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Назва варіанту</label>
                  <input
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                    placeholder="e.g. friendly_bot_v2"
                    className="rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm font-medium text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Мова</label>
                  <select
                    value={newPrompt.language}
                    onChange={(e) => setNewPrompt({ ...newPrompt, language: e.target.value })}
                    className="rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm font-medium text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="uk">🇺🇦 Українська</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Текст Промпту (Системна інструкція)</label>
                <textarea
                  value={newPrompt.prompt_text}
                  onChange={(e) => setNewPrompt({ ...newPrompt, prompt_text: e.target.value })}
                  className="min-h-[160px] resize-y rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all leading-relaxed"
                  placeholder="Напишіть детальну інструкцію для штучного інтелекту..."
                />
              </div>
              <button 
                onClick={handleCreate} 
                disabled={isCreating || !newPrompt.name || !newPrompt.prompt_text} 
                className="mt-2 inline-flex w-full cursor-pointer justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isCreating ? <Loader2 className="animate-spin" size={18} /> : "Зберегти промпт"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </AnimatedSection>

      <AnimatedSection i={0.5}>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-[13px] leading-relaxed text-blue-100/80">
          <strong className="text-blue-300">Як користуватися цією сторінкою:</strong> Ця вкладка дозволяє експериментувати з налаштуваннями характеру бота (A/B тестування).
          Створюйте різні варіанти системних переконань (наприклад, "Будь дуже лаконічним" або "Будь завжди веселим і використовуй емодзі"). 
          Увімкніть кілька промптів одночасно, і система буде випадковим чином показувати їх різним користувачам. На основі лайків/дизлайків бот вирахує "Рейтинг" кожного промпту, щоб ви могли залишити найкращий!
        </div>
      </AnimatedSection>
      
      <AnimatedSection i={1}>
        <GlassCard title="Каталог промптів" icon={MessageSquareDashed}>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/[0.04] text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-4">Варіант</th>
                  <th className="pb-3 pr-4">Мова</th>
                  <th className="pb-3 pr-4 text-center">Статус</th>
                  <th className="pb-3 pr-4 text-right">Сесії</th>
                  <th className="pb-3 text-right">Рейтинг (Avg)</th>
                  <th className="pb-3 pl-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {prompts.map((p) => (
                  <tr key={p.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-zinc-200">{p.name}</div>
                      <div className="mt-1 line-clamp-1 max-w-[280px] whitespace-normal text-xs text-zinc-500 leading-tight" title={p.prompt_text}>
                        {p.prompt_text}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge color={p.language === "uk" ? "blue" : "purple"}>
                        {p.language === "uk" ? "🇺🇦 UA" : "🇬🇧 EN"}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 text-center">
                      <button
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                          p.is_active 
                          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20" 
                          : "bg-zinc-800/80 text-zinc-500 ring-1 ring-inset ring-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-300"
                        }`}
                      >
                        {p.is_active ? <Play size={10} className="fill-current" /> : <Square size={10} className="fill-current" />}
                        {p.is_active ? "АКТИВНИЙ" : "ВИМКНЕНО"}
                      </button>
                    </td>
                    <td className="py-4 pr-4 text-right font-mono text-zinc-400 font-medium">
                      {p.usage_count}
                    </td>
                    <td className="py-4 text-right">
                      {p.avg_score !== 0 ? (
                        <div className={`inline-flex items-center justify-end font-mono font-bold text-sm ${p.avg_score > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {p.avg_score > 0 ? "+" : ""}{p.avg_score.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-white/10 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 data-[state=open]:bg-white/10 data-[state=open]:text-zinc-200">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenu.Trigger>
                        
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            sideOffset={5}
                            align="end"
                            className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 p-1.5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/5 origin-top-right will-change-transform data-[state=open]:fade-in data-[state=closed]:fade-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
                          >
                            <DropdownMenu.Item
                              onSelect={() => setTimeout(() => openEditModal(p), 0)}
                              className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 outline-none transition-colors data-[highlighted]:bg-amber-500/15 data-[highlighted]:text-amber-400"
                            >
                              <Edit2 size={15} />
                              Редагувати
                            </DropdownMenu.Item>
                            
                            <DropdownMenu.Separator className="my-1.5 h-px w-full bg-white/10" />
                            
                            <DropdownMenu.Item
                              onSelect={() => setTimeout(() => openDeleteModal(p), 0)}
                              className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 outline-none transition-colors data-[highlighted]:bg-red-500/15 data-[highlighted]:text-red-300"
                            >
                              <Trash2 size={15} />
                              Видалити
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))}
                {prompts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      Немає створених промптів. Натисніть "Створити" щоб додати новий варіант для A/B тестування.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </AnimatedSection>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-white/10 bg-[#0e1114] sm:max-w-[550px] shadow-2xl backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Edit2 className="text-amber-400" size={20} />
              Редагування Промпту "{editTarget?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Текст Промпту</label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[160px] resize-y rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-zinc-300 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setEditOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Скасувати
              </button>
              <button 
                onClick={handleSaveEdit} 
                disabled={editLoading || !editText.trim()} 
                className="inline-flex min-w-[120px] justify-center items-center gap-2 rounded-xl bg-amber-500/10 text-amber-400 px-4 py-2.5 text-sm font-bold border border-amber-500/20 transition-all hover:bg-amber-500/20 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? <Loader2 className="animate-spin" size={16} /> : "Зберегти зміни"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-red-500/20 bg-[#0e1114] sm:max-w-[400px] shadow-2xl shadow-rose-900/10 backdrop-blur-3xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold flex flex-col items-center gap-3 text-center text-rose-500">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={24} className="text-rose-500" />
              </div>
              Підтвердження видалення
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-sm text-zinc-400 mb-6">
            Ви впевнені, що хочете безповоротно видалити варіант <span className="font-bold text-zinc-200">"{deleteTarget?.name}"</span>? 
            Вся статистика по ньому буде втрачена.
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
