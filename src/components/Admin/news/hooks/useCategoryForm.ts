import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { emptyCategoryForm } from "../types";
import {
  type AdminNewsCategory,
  fetchAdminNewsCategories,
  updateAdminNewsCategory,
  createAdminNewsCategory,
  uploadAdminCategoryCover,
} from "../../api";
import { normalizeHexColor } from "../../utils/helpers";
import { usePreviewSync } from "@/lib/preview-sync";

export function useCategoryForm(categoryId: string | null, onSaved: () => void) {
  const [cat, setCat] = useState<Partial<AdminNewsCategory>>(emptyCategoryForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [errors, setErrors] = useState<{ ukName?: boolean; ukSlug?: boolean; enName?: boolean; enSlug?: boolean }>({});
  
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 12));
  
  const [imageHistory, setImageHistory] = useState<{ preview: string; file: File | null; }[]>([]);

  usePreviewSync(sessionId, { type: "category", data: { ...cat, live_cover_blob: coverFile } }, true);

  useEffect(() => {
    if (!categoryId) {
      setCat((prev: Partial<AdminNewsCategory>) => ({ ...prev, color: "#3b82f6" }));
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const cats = await fetchAdminNewsCategories();
        const found = cats.find((c: AdminNewsCategory) => c.id === categoryId);
        if (found) {
          setCat({ ...found, color: normalizeHexColor(found.color) });
          setCoverPreview(found.cover_image ?? "");
        }
      } catch {
        toast.error("Не вдалося завантажити категорію");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryId]);

  const handleSlugChange = (v: string, locale: "uk" | "en") => {
    const slug = v.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 120);
    setCat((prev: Partial<AdminNewsCategory>) => ({
      ...prev,
      locales: { ...prev.locales!, [locale]: { ...prev.locales![locale], slug } },
    }));
  };

  const handleImageFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setImageHistory(prev => [...prev, { preview: coverPreview, file: coverFile }]);
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } else {
      toast.error("Будь ласка, завантажте файл зображення (PNG, JPG, WebP)");
    }
  };

  const handleSave = async () => {
    const ukNameVal = cat.locales?.uk?.name?.trim();
    const ukSlugVal = cat.locales?.uk?.slug?.trim();
    const enNameVal = cat.locales?.en?.name?.trim();
    const enSlugVal = cat.locales?.en?.slug?.trim();
    const fieldErrors: typeof errors = {};
    
    if (!ukNameVal) fieldErrors.ukName = true;
    if (!ukSlugVal) fieldErrors.ukSlug = true;
    if (!enNameVal) fieldErrors.enName = true;
    if (!enSlugVal) fieldErrors.enSlug = true;
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error("Будь ласка, заповніть обов'язкові поля");
      return;
    }
    
    setErrors({});
    setSaving(true);
    
    try {
      const catToSave = { ...cat, cover_image: coverPreview ? (cat.cover_image || "") : "" };
      let savedCat: AdminNewsCategory;
      if (categoryId) {
        savedCat = await updateAdminNewsCategory(categoryId, catToSave);
      } else {
        savedCat = await createAdminNewsCategory(catToSave);
      }
      
      if (coverFile && savedCat.id) {
        const uploadRes = await uploadAdminCategoryCover(savedCat.id, coverFile);
        if (uploadRes?.cover_image) {
          savedCat.cover_image = uploadRes.cover_image;
          setCoverPreview(uploadRes.cover_image);
          setCoverFile(null);
        }
      }
      
      setCat(savedCat);
      toast.success(categoryId ? "Категорію оновлено" : "Категорію створено");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  return {
    cat, setCat,
    loading, saving,
    coverFile, setCoverFile,
    coverPreview, setCoverPreview,
    errors, setErrors,
    sessionId,
    imageHistory, setImageHistory,
    handleSlugChange,
    handleImageFile,
    handleSave,
  };
}
