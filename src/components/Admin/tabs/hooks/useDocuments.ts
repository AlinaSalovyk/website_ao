import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  fetchDocuments, uploadDocument, deleteDocument, renameDocument,
  reindexDocument, reindexAll, getToken, type DocumentRecord
} from "../../api";
import { API_BASE, ADMIN_BASE } from "../../services/client";

export function useDocuments() {
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
        `${API_BASE}${ADMIN_BASE}/documents/upload`,
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
              `${API_BASE}${ADMIN_BASE}/documents/jobs/${job_id}`,
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

  return {
    docs, setDocs,
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
    load
  };
}
