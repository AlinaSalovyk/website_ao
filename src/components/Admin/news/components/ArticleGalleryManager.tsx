import React, { useState, useEffect, useRef } from "react";
import {
  ImageIcon,
  Upload,
  Trash2,
  Maximize2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "../../ui";
import type { NewsGalleryImage } from "@/lib/news-api";
import {
  fetchAdminNewsGallery,
  uploadAdminNewsGalleryImage,
  deleteAdminNewsGalleryImage,
  updateAdminNewsGalleryImage,
  reorderAdminNewsGalleryImages,
} from "../../services/news.api";
import { formatFileSize, getFullImageUrl } from "@/lib/news-api";

interface ArticleGalleryManagerProps {
  articleId: string | null;
  pendingPhotos: File[];
  onPendingPhotosChange: (files: File[]) => void;
}

export function ArticleGalleryManager({
  articleId,
  pendingPhotos,
  onPendingPhotosChange,
}: ArticleGalleryManagerProps) {
  const [galleryImages, setGalleryImages] = useState<NewsGalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAltUk, setEditAltUk] = useState("");
  const [editAltEn, setEditAltEn] = useState("");
  const [editCaptionUk, setEditCaptionUk] = useState("");
  const [editCaptionEn, setEditCaptionEn] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch gallery images for existing article
  useEffect(() => {
    if (!articleId || articleId === "temp-draft") {
      setGalleryImages([]);
      return;
    }
    setLoading(true);
    fetchAdminNewsGallery(articleId)
      .then((data) => setGalleryImages(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load gallery images:", err);
        setGalleryImages([]);
      })
      .finally(() => setLoading(false));
  }, [articleId]);

  // Handle files selected via file input or drag-and-drop
  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    const filesArray = Array.from(selectedFiles).filter((f) =>
      f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(f.name)
    );

    if (filesArray.length === 0) {
      toast.error("Будь ласка, виберіть зображення у форматі JPEG, PNG або WebP");
      return;
    }

    // Check 30 photos limit
    if ((galleryImages?.length || 0) + (pendingPhotos?.length || 0) + filesArray.length > 30) {
      toast.error("Максимум 30 фотографій у галереї цієї новини");
      return;
    }

    if (!articleId || articleId === "temp-draft") {
      // Staged client-side for unsaved draft
      const updated = [...pendingPhotos, ...filesArray];
      onPendingPhotosChange(updated);
      toast.success(`Додано ${filesArray.length} фото (будуть завантажені при збереженні новини)`);
      return;
    }

    // Immediate upload for existing article
    setUploading(true);
    let successCount = 0;

    for (const file of filesArray) {
      try {
        const created = await uploadAdminNewsGalleryImage(articleId, file);
        setGalleryImages((prev) => [...prev, created]);
        successCount++;
      } catch (err: any) {
        toast.error(`Помилка завантаження «${file.name}»: ${err.message || "Непідтримуваний формат"}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`Завантажено ${successCount} фотографій`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Reorder photos
  const handleMove = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === galleryImages.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newItems = [...galleryImages];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    setGalleryImages(newItems);

    if (articleId && articleId !== "temp-draft") {
      try {
        await reorderAdminNewsGalleryImages(
          articleId,
          newItems.map((img) => img.id)
        );
      } catch (err) {
        toast.error("Не вдалося зберегти новий порядок фотографій");
      }
    }
  };

  // Delete photo
  const handleDelete = async (imageId: string) => {
    if (!articleId || articleId === "temp-draft") return;
    try {
      await deleteAdminNewsGalleryImage(articleId, imageId);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Фотографію видалено з галереї");
    } catch (err: any) {
      toast.error(`Помилка видалення: ${err.message || "Помилка сервера"}`);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Remove pending staged file
  const handleRemovePending = (idx: number) => {
    const updated = pendingPhotos.filter((_, i) => i !== idx);
    onPendingPhotosChange(updated);
    toast.info("Фотографію вилучено зі списку завантаження");
  };

  // Start editing photo metadata
  const handleStartEdit = (img: NewsGalleryImage) => {
    setEditingId(img.id);
    setEditAltUk(img.alt_uk || "");
    setEditAltEn(img.alt_en || "");
    setEditCaptionUk(img.caption_uk || "");
    setEditCaptionEn(img.caption_en || "");
  };

  // Save photo metadata
  const handleSaveEdit = async (img: NewsGalleryImage) => {
    if (!articleId || articleId === "temp-draft") return;
    try {
      await updateAdminNewsGalleryImage(articleId, img.id, {
        alt_uk: editAltUk,
        alt_en: editAltEn,
        caption_uk: editCaptionUk,
        caption_en: editCaptionEn,
        sort_order: img.sort_order,
      });

      setGalleryImages((prev) =>
        prev.map((item) =>
          item.id === img.id
            ? {
                ...item,
                alt_uk: editAltUk,
                alt_en: editAltEn,
                caption_uk: editCaptionUk,
                caption_en: editCaptionEn,
              }
            : item
        )
      );
      toast.success("Метадані фотографії оновлено");
      setEditingId(null);
    } catch (err: any) {
      toast.error(`Не вдалося оновити: ${err.message || "Помилка сервера"}`);
    }
  };

  const totalPhotosCount = (galleryImages?.length || 0) + (pendingPhotos?.length || 0);

  return (
    <GlassCard className="p-5 sm:p-6 mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
            Фотогалерея новини
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {totalPhotosCount} / 30
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Додайте фотографії до галереї новини (JPEG, PNG, WebP до 15 MB). Для кожного фото можна вказати подвійні підписи та alt-опис (UK/EN).
      </p>

      {/* Drag and drop upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/70 dark:bg-slate-950/40 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 mb-6 group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
        />
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          {uploading ? "Завантаження фотографій..." : "Перетягніть фотографії сюди або натисніть для вибору"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Підтримуються JPG, PNG, WebP (до 15 MB, максимум 30 фото)
        </p>
      </div>

      {/* Staged pending photos for unsaved draft */}
      {pendingPhotos.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Очікують завантаження після збереження ({pendingPhotos.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pendingPhotos.map((file, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden border border-amber-500/30 bg-slate-900 group"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover opacity-80"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePending(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                  title="Вилучити"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/70 backdrop-blur-xs text-[10px] text-white truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List of uploaded gallery photos */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Завантаження фотогалереї...</span>
        </div>
      ) : galleryImages.length === 0 && pendingPhotos.length === 0 ? (
        <div className="text-center py-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-500">
          <FileImage className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
          <p className="text-sm font-medium">У галереї цієї новини поки немає фотографій</p>
        </div>
      ) : (
        <div className="space-y-4">
          {galleryImages.map((img, idx) => {
            const isEditing = editingId === img.id;
            const isDeleting = deleteConfirmId === img.id;
            const fullUrl = getFullImageUrl(img.url || img.stored_name);

            return (
              <div
                key={img.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 transition-all hover:border-blue-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Photo Thumbnail */}
                  <div
                    onClick={() => setPreviewImage(fullUrl)}
                    className="relative w-full sm:w-36 aspect-[4/3] rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 shrink-0 cursor-pointer group"
                  >
                    <img
                      src={fullUrl}
                      alt={img.alt_uk || img.original_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Photo Details / Metadata Edit */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={img.original_name}>
                          {img.original_name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="uppercase font-semibold">{img.extension.replace(".", "")}</span>
                          <span>•</span>
                          <span>{formatFileSize(img.size_bytes)}</span>
                          {img.width > 0 && (
                            <>
                              <span>•</span>
                              <span>{img.width}×{img.height}px</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Reorder and Delete Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                          title="Перемістити вгору"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "down")}
                          disabled={idx === galleryImages.length - 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                          title="Перемістити вниз"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {isDeleting ? (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(img.id)}
                              className="px-2 py-1 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700"
                            >
                              Так
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg"
                            >
                              Ні
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(img.id)}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 ml-1"
                            title="Видалити фотографію"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Editable localized metadata fields */}
                    {isEditing ? (
                      <div className="space-y-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Alt UK (Опис фото)
                            </label>
                            <input
                              type="text"
                              value={editAltUk}
                              onChange={(e) => setEditAltUk(e.target.value)}
                              placeholder="Короткий опис для UK..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Alt EN (Photo description)
                            </label>
                            <input
                              type="text"
                              value={editAltEn}
                              onChange={(e) => setEditAltEn(e.target.value)}
                              placeholder="Short description for EN..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Caption UK (Підпис під фото)
                            </label>
                            <input
                              type="text"
                              value={editCaptionUk}
                              onChange={(e) => setEditCaptionUk(e.target.value)}
                              placeholder="Підпис під фото українською..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Caption EN (Photo caption)
                            </label>
                            <input
                              type="text"
                              value={editCaptionEn}
                              onChange={(e) => setEditCaptionEn(e.target.value)}
                              placeholder="English photo caption..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(img)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Зберегти метадані</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Скасувати
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <p className="truncate">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Alt UK:</span>{" "}
                            {img.alt_uk || <span className="italic text-slate-400">не вказано (fallback на заголовок)</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(img)}
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-2"
                          >
                            Редагувати
                          </button>
                        </div>
                        {img.caption_uk && (
                          <p className="text-slate-600 dark:text-slate-400 truncate">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Caption UK:</span>{" "}
                            {img.caption_uk}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
