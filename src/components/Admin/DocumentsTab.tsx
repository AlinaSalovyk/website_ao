import { useCallback, useEffect, useState } from "react";
import {
  FileText, Upload, Trash2, FileUp, Eye, PencilLine,
  MoreVertical, AlertTriangle, Loader2, RotateCw, RefreshCw, Download
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  fetchDocuments, uploadDocument, deleteDocument, renameDocument,
  getDocumentDownloadUrl, reindexDocument, reindexAll, getToken,
  type DocumentRecord
} from "./api";
import { AnimatedSection, GlassCard, Badge, TabLoader, EmptyState } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Animated progress bar for the document indexing pipeline.
 * @param progress - Integer 0–100.
 * @param step     - Human-readable current pipeline step label.
 */
function ProgressBar({ progress, step }: { progress: number; step: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-400">{step || "Обробляємо..."}</span>
        <span className="font-medium text-zinc-300 tabular-nums">{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/**
 * A single row in the documents table.
 * Supports inline rename (click-to-edit), a Radix dropdown menu with
 * Preview / Rename / Reindex / Delete actions, and a spinner during re-indexing.
 */
function DocumentRow({
  d,
  onDelete,
  onRename,
  onPreview,
  onReindex,
  reindexing,
}: {
  d: DocumentRecord;
  onDelete: (id: string, n: string) => void;
  onRename: (id: string, oldName: string, newName: string) => void;
  onPreview: (id: string) => void;
  onReindex: (id: string) => void;
  reindexing: boolean;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(d.filename);

  const handleSave = () => {
    setIsRenaming(false);
    if (editName.trim() && editName !== d.filename) {
      onRename(d.id, d.filename, editName.trim());
    } else {
      setEditName(d.filename);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsRenaming(false);
      setEditName(d.filename);
    }
  };

  return (
    <motion.tr
      key={d.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="group border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
    >
      <td className="flex items-center gap-2.5 px-3 py-3 font-medium text-zinc-300">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <FileText size={14} className="text-blue-400" />
        </div>
        {isRenaming ? (
          <input
            autoFocus
            type="text"
            className="h-7 w-[180px] rounded bg-white/5 border border-white/10 px-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className="truncate max-w-[180px] cursor-pointer hover:text-blue-400 transition-colors"
            onClick={() => setIsRenaming(true)}
            title="Клікніть для перейменування"
          >
            {d.filename}
          </span>
        )}
        {reindexing && (
          <span title="Реіндексація...">
            <Loader2 size={13} className="animate-spin text-blue-400 shrink-0" aria-label="Реіндексація..." />
          </span>
        )}
      </td>
      <td className="px-3 py-3"><Badge color="cyan">{d.doc_type || "pdf"}</Badge></td>
      <td className="px-3 py-3">{d.language === "uk" ? "🇺🇦" : "🇬🇧"}</td>
      <td className="px-3 py-3 text-zinc-400 tabular-nums">{d.chunk_count}</td>
      <td className="px-3 py-3 text-xs text-zinc-600">{d.uploaded_at?.slice(0, 10) ?? "—"}</td>
      <td className="px-3 py-3 text-right">
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
              className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 p-1.5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/5 origin-top-right will-change-transform data-[state=open]:fade-in data-[state=closed]:fade-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
            >
              <DropdownMenu.Item
                onSelect={() => onPreview(d.id)}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 outline-none transition-colors data-[highlighted]:bg-white/10 data-[highlighted]:text-white"
              >
                <Eye size={15} className="text-blue-400" />
                Переглянути
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => setIsRenaming(true)}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 outline-none transition-colors data-[highlighted]:bg-white/10 data-[highlighted]:text-white"
              >
                <PencilLine size={15} className="text-amber-400" />
                Перейменувати
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => onReindex(d.id)}
                disabled={reindexing}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 outline-none transition-colors data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
              >
                <RotateCw size={15} className="text-purple-400" />
                Реіндексувати
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1.5 h-px w-full bg-white/10" />

              <DropdownMenu.Item
                onSelect={() => setTimeout(() => onDelete(d.id, d.filename), 0)}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 outline-none transition-colors data-[highlighted]:bg-red-500/15 data-[highlighted]:text-red-300"
              >
                <Trash2 size={15} />
                Видалити
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </td>
    </motion.tr>
  );
}

/**
 * Knowledge base document management tab.
 *
 * Features:
 * - Drag-and-drop and click-to-upload (PDF, DOCX, XLSX, TXT)
 * - Real-time indexing progress bar (polls job status every 1.2s)
 * - Table of all indexed documents with per-row actions:
 *   inline rename, download, preview, single reindex, delete
 * - Bulk "Reindex All" and CSV export buttons
 * - Confirmation modal before deletion
 */
export function DocumentsTab() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ progress: number; step: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [reindexingAll, setReindexingAll] = useState(false);
  const [reindexingIds, setReindexingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDocs(await fetchDocuments()); }
    catch { toast.error("Не вдалось завантажити документи"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress({ progress: 0, step: "Завантаження файлу..." });

    try {
      const token = getToken();
      const h: Record<string, string> = {};
      if (token) h["Authorization"] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append("file", file);

      const uploadRes = await fetch(
        `${(import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080")}/admin-${import.meta.env.PUBLIC_ADMIN_PATH ?? "panel"}/documents/upload`,
        { method: "POST", headers: h, body: fd }
      );
      if (!uploadRes.ok) throw new Error(await uploadRes.text());

      const { job_id } = await uploadRes.json() as { job_id: string };

      const startedAt = Date.now();
      await new Promise<void>((resolve, reject) => {
        const check = async () => {
          if (Date.now() - startedAt > 5 * 60 * 1000) {
            reject(new Error("Час очікування закінчився (5 хв)"));
            return;
          }
          try {
            const jobRes = await fetch(
              `${import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080"}/admin-${import.meta.env.PUBLIC_ADMIN_PATH ?? "panel"}/documents/jobs/${job_id}`,
              { headers: h }
            );
            if (!jobRes.ok) throw new Error("Failed to check status");
            const job = await jobRes.json() as { status: string; error: string; progress: number; current_step: string };

            setUploadProgress({ progress: job.progress, step: job.current_step || "Обробляємо..." });

            if (job.status === "completed") {
              resolve();
            } else if (job.status === "failed") {
              reject(new Error(job.error || "Upload failed during processing"));
            } else {
              setTimeout(check, 1200);
            }
          } catch (err) {
            reject(err);
          }
        };
        setTimeout(check, 800);
      });

      toast.success(`${file.name} успішно завантажено та індексовано`);
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Помилка завантаження");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await doUpload(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await doUpload(file);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDocument(deleteTarget.id);
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} видалено`);
      setDeleteOpen(false);
      setTimeout(() => load(), 300);
    } catch {
      toast.error("Помилка видалення");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRename = async (id: string, currentName: string, newName?: string) => {
    if (!newName || newName === currentName) return;
    try {
      await renameDocument(id, newName);
      setDocs(prev => prev.map(d => d.id === id ? { ...d, filename: newName } : d));
      toast.success("Документ перейменовано");
    } catch {
      toast.error("Помилка при перейменуванні");
    }
  };

  const handlePreview = (id: string) => {
    const token = getToken();
    fetch(getDocumentDownloadUrl(id), {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) {
          if (r.status === 404) throw new Error("Файл не знайдено (можливо, це старий документ)");
          throw new Error("Помилка доступу");
        }
        return r.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      })
      .catch(e => toast.error(e.message));
  };

  const handleReindex = async (docId: string) => {
    setReindexingIds(prev => new Set([...prev, docId]));
    try {
      await reindexDocument(docId);
      toast.success("Реіндексацію розпочато. Це може зайняти кілька хвилин.");
      setTimeout(() => load(), 3000);
    } catch (err: any) {
      toast.error(err?.message || "Помилка реіндексації");
    } finally {
      setTimeout(() => {
        setReindexingIds(prev => {
          const next = new Set(prev);
          next.delete(docId);
          return next;
        });
      }, 30000);
    }
  };

  const handleReindexAll = async () => {
    if (docs.length === 0) return;
    setReindexingAll(true);
    try {
      const result = await reindexAll();
      toast.success(`Реіндексацію всіх ${result.count} документів розпочато. Це займе кілька хвилин.`);
    } catch (err: any) {
      toast.error(err?.message || "Помилка при запуску реіндексації");
    } finally {
      setTimeout(() => setReindexingAll(false), 5000);
    }
  };

  const handleExportCSV = () => {
    const token = getToken();
    const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080";
    const ADMIN_PATH = import.meta.env.PUBLIC_ADMIN_PATH ?? "panel";
    const url = `${API_BASE}/admin-${ADMIN_PATH}/analytics/export/csv?days=30`;
    fetch(url, { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error("Помилка завантаження CSV");
        return r.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `analytics_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("CSV завантажено");
      })
      .catch(e => toast.error(e.message));
  };

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-6">
      <AnimatedSection i={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Документи бази знань</h2>
          <p className="mt-0.5 text-xs text-zinc-600">{docs.length} документів у базі</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.07] hover:text-zinc-200"
            title="Експорт аналітики у CSV"
          >
            <Download size={15} />
            CSV
          </button>

          <button
            onClick={handleReindexAll}
            disabled={reindexingAll || docs.length === 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-2.5 text-sm font-medium text-purple-400 transition-all hover:bg-purple-500/10 hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-40"
            title="Реіндексувати всі документи"
          >
            <RefreshCw size={15} className={reindexingAll ? "animate-spin" : ""} />
            {reindexingAll ? "Реіндексація..." : "Реіндекс всіх"}
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/15 transition-all hover:shadow-blue-600/25 hover:from-blue-500 hover:to-blue-400">
            <Upload size={16} />
            {uploading ? "Завантаження..." : "Завантажити"}
            <input type="file" accept=".pdf,.docx,.xlsx,.txt" onChange={handleUpload} hidden disabled={uploading} />
          </label>
        </div>
      </AnimatedSection>

      <AnimatePresence>
        {uploading && uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <AnimatedSection i={0.3}>
              <GlassCard title="Індексація документа" icon={Loader2}>
                <ProgressBar progress={uploadProgress.progress} step={uploadProgress.step} />
              </GlassCard>
            </AnimatedSection>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedSection i={0.5}>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-[13px] leading-relaxed text-blue-100/80">
          <strong className="text-blue-300">Як користуватися цією сторінкою:</strong> Ця сторінка — це «мозок» вашого чат-бота.
          Завантажуйте сюди офіційні документи, загальні положення, накази та довідники (підтримуються PDF, DOCX, XLSX, TXT).
          Бот зможе читати ці файли та надавати точні відповіді студентам на їх основі. Чим актуальніші документи, тим якісніша допомога бота.
        </div>
      </AnimatedSection>

      <AnimatedSection i={1}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-all duration-300 ${
            dragging
              ? "border-blue-400/50 bg-blue-500/5"
              : "border-white/[0.06] bg-transparent hover:border-white/[0.12]"
          }`}
        >
          <FileUp size={32} className={`transition-colors ${dragging ? "text-blue-400" : "text-zinc-700"}`} />
          <p className="text-sm text-zinc-500">
            Перетягніть файл або{" "}
            <label className="cursor-pointer text-blue-400 hover:underline">
              оберіть
              <input type="file" accept=".pdf,.docx,.xlsx,.txt" onChange={handleUpload} hidden disabled={uploading} />
            </label>
          </p>
          <p className="text-[10px] text-zinc-700">PDF, DOCX, XLSX, TXT</p>
        </div>
      </AnimatedSection>

      {docs.length === 0 ? (
        <AnimatedSection i={2}>
          <EmptyState icon={FileText} title="Документів ще немає" description="Завантажте файл, щоб додати до бази знань" />
        </AnimatedSection>
      ) : (
        <AnimatedSection i={2}>
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    <th className="px-3 py-2.5">Файл</th>
                    <th className="px-3 py-2.5">Тип</th>
                    <th className="px-3 py-2.5">Мова</th>
                    <th className="px-3 py-2.5">Чанків</th>
                    <th className="px-3 py-2.5">Дата</th>
                    <th className="px-3 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {docs.map((d) => (
                      <DocumentRow
                        key={d.id}
                        d={d}
                        onRename={handleRename}
                        onDelete={handleDelete}
                        onPreview={handlePreview}
                        onReindex={handleReindex}
                        reindexing={reindexingIds.has(d.id)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </GlassCard>
        </AnimatedSection>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-red-500/20 bg-[#0e1114] sm:max-w-[400px] shadow-2xl shadow-rose-900/10 backdrop-blur-3xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold flex flex-col items-center gap-3 text-center text-rose-500">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={24} className="text-rose-500" />
              </div>
              Видалення документу
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-sm text-zinc-400 mb-6">
            Ви впевнені, що хочете безповоротно видалити <span className="font-bold text-zinc-200">"{deleteTarget?.name}"</span> з бази знань?
            Бот більше не зможе читати цей файл.
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
