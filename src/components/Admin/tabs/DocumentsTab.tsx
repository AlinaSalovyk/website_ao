import { FileText, Upload, FileUp, Loader2, RefreshCw, Download, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedSection, GlassCard, TabLoader, EmptyState, PageGuide } from "../ui";
import { DOCUMENTS_GUIDE } from "./constants/guides";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getToken } from "../api";
import { API_BASE, ADMIN_BASE } from "../services/client";
import { toast } from "sonner";

import { useDocuments } from "./hooks/useDocuments";
import { DocumentList } from "./components/DocumentList";

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

export function DocumentsTab() {
  const {
    docs,
    loading,
    uploading,
    uploadProgress,
    dragging, setDragging,
    reindexingAll,
    reindexingIds,
    deleteTarget,
    deleteOpen, setDeleteOpen,
    deleteLoading,
    handleUpload,
    handleDrop,
    handleDelete,
    confirmDelete,
    handleRename,
    handleReindex,
    handleReindexAll,
  } = useDocuments();

  const handleExportCSV = () => {
    const token = getToken();
    const url = `${API_BASE}${ADMIN_BASE}/analytics/export/csv?days=30`;
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

  const handlePreview = (id: string) => {
    const token = getToken();
    fetch(`${API_BASE}${ADMIN_BASE}/documents/${id}/download`, {
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
        <PageGuide {...DOCUMENTS_GUIDE} />
      </AnimatedSection>

      <AnimatedSection i={1}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-all duration-300 ${
            dragging
              ? "border-primary/50 bg-primary/10"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <FileUp size={32} className={`transition-colors ${dragging ? "text-primary" : "text-muted-foreground opacity-60"}`} />
          <p className="text-sm text-muted-foreground">
            Перетягніть файл або{" "}
            <label className="cursor-pointer text-primary font-semibold hover:underline">
              оберіть
              <input type="file" accept=".pdf,.docx,.xlsx,.txt" onChange={handleUpload} hidden disabled={uploading} />
            </label>
          </p>
          <p className="text-[10px] text-muted-foreground opacity-60">PDF, DOCX, XLSX, TXT</p>
        </div>
      </AnimatedSection>

      {docs.length === 0 ? (
        <AnimatedSection i={2}>
          <EmptyState icon={FileText} title="Документів ще немає" description="Завантажте файл, щоб додати до бази знань" />
        </AnimatedSection>
      ) : (
        <AnimatedSection i={2}>
          <GlassCard>
            <DocumentList
              docs={docs}
              handleRename={handleRename}
              handleDelete={handleDelete}
              handlePreview={handlePreview}
              handleReindex={handleReindex}
              reindexingIds={reindexingIds}
            />
          </GlassCard>
        </AnimatedSection>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-destructive/20 bg-card text-card-foreground sm:max-w-[400px] shadow-2xl backdrop-blur-3xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold flex flex-col items-center gap-3 text-center text-destructive">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={24} className="text-destructive" />
              </div>
              Видалення документу
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-sm text-muted-foreground mb-6">
            Ви впевнені, що хочете безповоротно видалити <span className="font-bold text-foreground">"{deleteTarget?.name}"</span> з бази знань?
            Бот більше не зможе читати цей файл.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-800/50 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
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
