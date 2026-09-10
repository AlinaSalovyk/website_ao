import { useState, useEffect, useRef } from "react";
import { 
  Paperclip, FileText, FileSpreadsheet, Upload, Trash2, 
  ExternalLink, Download, ArrowUp, ArrowDown, Loader2, AlertCircle, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../../ui";
import type { AdminNewsAttachment } from "../../types/api.types";
import { 
  fetchAdminNewsAttachments, 
  uploadAdminNewsAttachment, 
  deleteAdminNewsAttachment, 
  updateAdminNewsAttachment, 
  reorderAdminNewsAttachments 
} from "../../services/news.api";
import { 
  formatFileSize, 
  getNewsAttachmentFileUrl, 
  getNewsAttachmentDownloadUrl, 
  canPreviewAttachment 
} from "@/lib/news-api";

interface ArticleAttachmentsManagerProps {
  articleId: string | null;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
}

export function ArticleAttachmentsManager({
  articleId,
  pendingFiles,
  onPendingFilesChange,
}: ArticleAttachmentsManagerProps) {
  const [attachments, setAttachments] = useState<AdminNewsAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleUk, setEditTitleUk] = useState("");
  const [editTitleEn, setEditTitleEn] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing attachments for existing article
  useEffect(() => {
    if (!articleId || articleId === "temp-draft") {
      setAttachments([]);
      return;
    }
    setLoading(true);
    fetchAdminNewsAttachments(articleId)
      .then((data) => setAttachments(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load attachments:", err);
        setAttachments([]);
      })
      .finally(() => setLoading(false));
  }, [articleId]);

  // Handle files selected via file input or drag-and-drop
  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    const filesArray = Array.from(selectedFiles);
    if (filesArray.length === 0) return;

    // Check count limit
    if ((attachments?.length || 0) + (pendingFiles?.length || 0) + filesArray.length > 20) {
      toast.error("Максимум 20 документів на одну статтю");
      return;
    }

    if (!articleId || articleId === "temp-draft") {
      // Unsaved article case: stage files client-side until Save
      const updated = [...pendingFiles, ...filesArray];
      onPendingFilesChange(updated);
      toast.success(`Додано ${filesArray.length} файл(ів) (будуть завантажені при збереженні статті)`);
      return;
    }

    // Existing article case: upload immediately
    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of filesArray) {
      try {
        const created = await uploadAdminNewsAttachment(articleId, file);
        setAttachments((prev) => [...prev, created]);
        successCount++;
      } catch (err: any) {
        failCount++;
        toast.error(`Помилка завантаження «${file.name}»: ${err.message || "Непідтримуваний формат або перевищено розмір"}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`Завантажено ${successCount} документ(ів)`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemovePending = (index: number) => {
    const updated = pendingFiles.filter((_, i) => i !== index);
    onPendingFilesChange(updated);
    toast.info("Файл вилучено зі списку нових");
  };

  const handleDeleteSaved = async (id: string) => {
    if (!articleId) return;
    try {
      await deleteAdminNewsAttachment(articleId, id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Документ видалено");
    } catch {
      toast.error("Не вдалося видалити документ");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSaveTitle = async (att: AdminNewsAttachment) => {
    if (!articleId) return;
    try {
      await updateAdminNewsAttachment(articleId, att.id, {
        title_uk: editTitleUk,
        title_en: editTitleEn,
        sort_order: att.sort_order,
      });
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === att.id ? { ...a, title_uk: editTitleUk, title_en: editTitleEn } : a
        )
      );
      toast.success("Назву оновлено");
    } catch {
      toast.error("Помилка оновлення назви");
    } finally {
      setEditingId(null);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (!articleId) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= attachments.length) return;

    const reordered = [...attachments];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Optimistic state update
    setAttachments(reordered);

    try {
      const ids = reordered.map((a) => a.id);
      await reorderAdminNewsAttachments(articleId, ids);
    } catch {
      toast.error("Помилка змінення порядку документів");
    }
  };

  const getFileIcon = (ext: string) => {
    const normalized = ext.toLowerCase();
    if (normalized === ".pdf") {
      return <FileText size={20} className="text-red-500 shrink-0" />;
    }
    if (normalized === ".doc" || normalized === ".docx") {
      return <FileText size={20} className="text-blue-500 shrink-0" />;
    }
    if (normalized === ".xls" || normalized === ".xlsx" || normalized === ".csv") {
      return <FileSpreadsheet size={20} className="text-emerald-500 shrink-0" />;
    }
    if (normalized === ".ppt" || normalized === ".pptx") {
      return <FileText size={20} className="text-amber-500 shrink-0" />;
    }
    return <FileText size={20} className="text-slate-400 shrink-0" />;
  };

  const inputCls =
    "w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs";

  return (
    <GlassCard title="Документи та файли" icon={Paperclip}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Додайте PDF, Word, Excel, PowerPoint або текстові документи до статті. Документи будуть відображатися в окремому блоці на сторінці новини.
        </p>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/60 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv,.rtf"
            className="hidden"
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          />
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              Перетягніть файли сюди або <span className="text-primary underline underline-offset-2">Оберіть файли</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              PDF, DOCX, XLSX, PPTX, TXT • Макс. 25 MB на файл
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-4">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span>Завантаження списку документів...</span>
          </div>
        )}

        {/* Pending Files (Client-side staged for new article) */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle size={14} />
              Нові файли для завантаження ({pendingFiles.length}):
            </span>
            <div className="flex flex-col gap-2">
              {pendingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-foreground text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {getFileIcon(file.name.substring(file.name.lastIndexOf(".")))}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.size)} • <span className="text-amber-500 font-medium">Буде завантажено після Збереження</span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePending(idx)}
                    className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Скасувати додавання"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Attachments List */}
        {attachments.length > 0 && (
          <div className="flex flex-col gap-2.5 mt-2">
            <span className="text-xs font-semibold text-foreground">
              Прикріплені документи ({attachments.length}):
            </span>
            <div className="flex flex-col gap-2">
              {attachments.map((att, idx) => {
                const targetNewsId = att.news_id || articleId || "";
                const openUrl = targetNewsId ? getNewsAttachmentFileUrl(targetNewsId, att.id) : (att.url || "");
                const downloadUrl = targetNewsId ? getNewsAttachmentDownloadUrl(targetNewsId, att.id) : "";
                const previewable = canPreviewAttachment(att.extension || att.mime_type);

                return (
                  <div
                    key={att.id}
                    className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-card shadow-xs hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        {getFileIcon(att.extension)}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {att.title_uk || att.original_name}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold uppercase text-[9px]">
                              {att.extension.replace(".", "")}
                            </span>
                            <span>{formatFileSize(att.size_bytes)}</span>
                            {att.title_en && (
                              <span className="truncate italic text-muted-foreground/80">
                                EN: {att.title_en}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up / Down */}
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded cursor-pointer"
                          title="Перемістити вище"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "down")}
                          disabled={idx === attachments.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded cursor-pointer"
                          title="Перемістити нижче"
                        >
                          <ArrowDown size={14} />
                        </button>

                        {/* Open (ONLY for previewable files: PDF, TXT) */}
                        {previewable && openUrl && (
                          <a
                            href={openUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                            title="Відкрити документ"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}

                        {/* Download (For ALL attachments) */}
                        {downloadUrl && (
                          <a
                            href={downloadUrl}
                            download={att.original_name}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                            title="Завантажити"
                          >
                            <Download size={14} />
                          </a>
                        )}

                      {/* Edit titles toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          if (editingId === att.id) {
                            setEditingId(null);
                          } else {
                            setEditingId(att.id);
                            setEditTitleUk(att.title_uk || "");
                            setEditTitleEn(att.title_en || "");
                          }
                        }}
                        className={`px-2 py-1 text-[11px] rounded-md border transition-colors cursor-pointer ${
                          editingId === att.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Назва
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(att.id)}
                        className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors cursor-pointer"
                        title="Видалити"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Name Editing Form */}
                  {editingId === att.id && (
                    <div className="flex flex-col gap-2 p-3 mt-1 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Назва для відображення (UK):</label>
                        <input
                          value={editTitleUk}
                          onChange={(e) => setEditTitleUk(e.target.value)}
                          placeholder={att.original_name}
                          className={inputCls}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Назва для відображення (EN):</label>
                        <input
                          value={editTitleEn}
                          onChange={(e) => setEditTitleEn(e.target.value)}
                          placeholder="Display name in English..."
                          className={inputCls}
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-border bg-card hover:bg-muted text-foreground cursor-pointer"
                        >
                          Скасувати
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveTitle(att)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium cursor-pointer shadow-xs"
                        >
                          Зберегти назву
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation Modal/Prompt */}
                  {deleteConfirmId === att.id && (
                    <div className="flex items-center justify-between gap-2 p-2.5 mt-1 rounded-lg border border-destructive/30 bg-destructive/10 text-xs">
                      <span className="text-destructive font-medium">Видалити документ «{att.title_uk || att.original_name}»?</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 rounded border border-border bg-card text-foreground hover:bg-muted cursor-pointer"
                        >
                          Ні
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(att.id)}
                          className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 cursor-pointer shadow-xs"
                        >
                          Так, видалити
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
