import React, { useRef, useCallback } from "react";
import { Image as ImageIcon, RefreshCw, Plus, Trash2, Move, Upload } from "lucide-react";
import { GlassCard } from "../../ui";
import type { AdminNewsCategory, AdminNewsTag, AdminNewsArticle } from "../../types/api.types";
import type { ArticleForm } from "../types";
import { ImageCropper } from "../../ui/ImageCropper";
import { uploadAdminInlineImage } from "../../services/news.api";
import { getFullImageUrl } from "../../utils/helpers";
import { toast } from "sonner";

interface ArticleFormSidebarProps {
  form: ArticleForm;
  setForm: React.Dispatch<React.SetStateAction<ArticleForm>>;
  categories: AdminNewsCategory[];
  tags: AdminNewsTag[];
  currentArticle: AdminNewsArticle | null;
  setCurrentArticle: React.Dispatch<React.SetStateAction<AdminNewsArticle | null>>;
  imageUploading: boolean;
  imageHistory: string[];
  setImageHistory: React.Dispatch<React.SetStateAction<string[]>>;
  handleImageFile: (file: File) => Promise<void>;
  fieldErrors?: Record<string, string>;
}

export function ArticleFormSidebar({
  form,
  setForm,
  categories,
  tags,
  currentArticle,
  setCurrentArticle,
  imageUploading,
  imageHistory,
  setImageHistory,
  handleImageFile,
  fieldErrors,
}: ArticleFormSidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [galleryUploading, setGalleryUploading] = React.useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile]
  );

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await uploadAdminInlineImage(files[i]);
        if (res?.image_url) uploadedUrls.push(res.image_url);
      }
      setForm((prev) => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...uploadedUrls],
      }));
      toast.success(`Додано ${uploadedUrls.length} фото до галереї`);
    } catch {
      toast.error("Помилка завантаження фото в галерею");
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index),
    }));
  };

  const inputCls =
    "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition shadow-sm";

  return (
    <div className="flex flex-col gap-4">
      {/* Category * Card - PRIMARY */}
      <GlassCard title="Категорія *">
        <div data-field-error="category_id" className={fieldErrors?.category_id ? "has-error" : ""}>
          <select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            className={`${inputCls} ${fieldErrors?.category_id ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20 dark:bg-red-950/10" : ""}`}
          >
            <option value="">Оберіть категорію новини...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.locales?.["uk"]?.name || "Без назви"}
              </option>
            ))}
          </select>
          {fieldErrors?.category_id && (
            <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
              <span>⚠</span> {fieldErrors.category_id}
            </p>
          )}
        </div>
      </GlassCard>

      {/* Options */}
      <GlassCard title="Параметри публікації">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setForm((f) => ({ ...f, is_pinned: !f.is_pinned }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.is_pinned ? "bg-amber-500" : "bg-muted border border-border"
              }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${form.is_pinned ? "translate-x-5 bg-white" : "translate-x-0"
                }`}
            />
          </div>
          <span className="text-sm text-foreground">Закріплена стаття</span>
        </label>
      </GlassCard>

      {/* Cover image with ImageCropper */}
      <GlassCard title="Обкладинка новини" icon={ImageIcon}>
        {(form.image_url || currentArticle?.image_url) ? (
          <div className="flex flex-col gap-3">
            <ImageCropper
              imageSrc={getFullImageUrl(form.image_url || currentArticle?.image_url || "")}
              aspectRatio={16 / 9}
              currentFocalPoint={form.cover_position || "50% 35%"}
              onCropComplete={(focalPoint) => {
                setForm((prev) => ({ ...prev, cover_position: focalPoint }));
              }}
              onClear={() => {
                const cur = form.image_url || currentArticle?.image_url || "";
                if (cur) {
                  setImageHistory((prev) => [...prev, cur]);
                }
                setForm((prev) => ({ ...prev, image_url: "" }));
                setCurrentArticle((prev) => (prev ? { ...prev, image_url: "" } : prev));
              }}
              canUndo={imageHistory.length > 0}
              onUndo={() => {
                const last = imageHistory[imageHistory.length - 1];
                setForm((prev) => ({ ...prev, image_url: last }));
                setCurrentArticle((prev) => (prev ? { ...prev, image_url: last } : prev));
                setImageHistory((prev) => prev.slice(0, -1));
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Замінити обкладинку
            </button>
          </div>
        ) : (
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer overflow-hidden bg-card py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground"
            onClick={() => fileRef.current?.click()}
          >
            {imageUploading ? (
              <RefreshCw size={20} className="animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon size={24} className="text-muted-foreground" />
                <p className="text-xs font-medium">Клікніть або перетягніть обкладинку</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
          }}
        />
      </GlassCard>

      {/* Tags */}
      {tags.length > 0 && (
        <GlassCard title="Теги">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const selected = form.tag_ids.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      tag_ids: selected
                        ? f.tag_ids.filter((id) => id !== tag.id)
                        : [...f.tag_ids, tag.id],
                    }))
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${selected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                  #{tag.slug}
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Author */}
      <GlassCard title="Автор">
        <div className="flex flex-col gap-2">
          <input
            value={form.author_name}
            onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
            placeholder="Ім'я автора"
            className={inputCls}
          />
          <input
            value={form.author_position}
            onChange={(e) => setForm((f) => ({ ...f, author_position: e.target.value }))}
            placeholder="Посада"
            className={inputCls}
          />
        </div>
      </GlassCard>
    </div>
  );
}
