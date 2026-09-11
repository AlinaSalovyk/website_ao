import { useState, useEffect } from "react";
import { toast } from "sonner";
import { emptyForm, type ArticleForm, slugify } from "../types";
import {
  type AdminNewsArticle,
  fetchAdminNewsById,
  updateAdminNews,
  createAdminNews,
  uploadAdminNewsImage,
  uploadAdminInlineImage,
  uploadAdminNewsAttachment,
  type AdminNewsCategory,
} from "../../api";
import { usePreviewSync } from "@/lib/preview-sync";
import { normalizeText, extractArticleSummary, computeAutoFillSEO } from "@/utils/seo";

import { ApiError } from "../../services/client";

function stripHTMLContent(s: string): string {
  if (!s) return "";
  const tmp = s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ");
  return tmp.replace(/\s+/g, " ").trim();
}

function scrollToFirstError(errors: Record<string, string>) {
  setTimeout(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;
    const firstKey = errorKeys[0];
    const el = document.querySelector(`[data-field-error="${firstKey}"]`) || document.querySelector(`.has-error`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = el.querySelector("input, select, textarea");
      if (input && "focus" in input && typeof (input as HTMLElement).focus === "function") {
        (input as HTMLElement).focus();
      }
    }
  }, 100);
}

export function useArticleForm(
  articleId: string | null,
  categories: AdminNewsCategory[],
  onSaved: () => void
) {
  const [form, setForm] = useState<ArticleForm>(emptyForm());
  const [activeLocale, setActiveLocale] = useState<"uk" | "en">("uk");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [isDirty, setIsDirty] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [currentArticle, setCurrentArticle] = useState<AdminNewsArticle | null>(null);

  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 12));

  // SEO Assistant State
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState<{ uk: boolean; en: boolean }>({ uk: false, en: false });

  // Adapter to convert form state into a valid NewsArticle structure for Live Preview
  const previewData = {
    ...form,
    id: articleId || "preview",
    image_url: form.image_url || currentArticle?.image_url || "",
    author: {
      name: form.author_name,
      position: form.author_position,
    },
    category: categories.find((c) => c.id === form.category_id),
  };

  // Sync draft to Live Preview
  usePreviewSync(sessionId, { type: "article", data: previewData }, true);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Debounced Autosave for Drafts (1.5s delay)
  useEffect(() => {
    if (!isDirty || loading || saving || !articleId) return;
    setAutoSaveStatus("dirty");

    const timer = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const payload: Partial<AdminNewsArticle> = {
          category_id: form.category_id || "",
          tags: form.tag_ids.map((id) => ({ id, slug: "", name: "" })),
          author: {
            name: form.author_name,
            position: form.author_position,
          },
          image_url: form.image_url || currentArticle?.image_url || "",
          cover_position: form.cover_position || "center",
          gallery: form.gallery || [],
          video_url: form.video_url || "",
          is_pinned: form.is_pinned,
          status: form.status,
          locales: {
            uk: { ...form.locales.uk, locale: "uk" },
            en: { ...form.locales.en, locale: "en" },
          } as Record<string, import("../../api").AdminNewsLocale>,
        };
        await updateAdminNews(articleId, payload);
        setAutoSaveStatus("saved");
        setIsDirty(false);
      } catch {
        setAutoSaveStatus("error");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, isDirty, loading, saving, articleId, currentArticle]);

  // Wrapped setForm state updater that marks form dirty & clears errors
  const updateForm: typeof setForm = (updater) => {
    setIsDirty(true);
    setAutoSaveStatus("dirty");
    setFieldErrors({});
    setForm(updater);
  };

  const clearFieldError = (fieldKey: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  // Load existing article
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    fetchAdminNewsById(articleId)
      .then((a) => {
        setCurrentArticle(a);
        setForm({
          category_id: a.category_id ?? "",
          tag_ids: (a.tags ?? []).map((t) => t.id),
          author_name: a.author?.name ?? "",
          author_position: a.author?.position ?? "",
          image_url: a.image_url ?? "",
          cover_position: a.cover_position ?? "center",
          gallery: a.gallery ?? [],
          video_url: a.video_url ?? "",
          is_pinned: a.is_pinned ?? false,
          status: a.status ?? "draft",
          locales: {
            uk: {
              title: a.locales?.uk?.title ?? "",
              slug: a.locales?.uk?.slug ?? "",
              description: a.locales?.uk?.description ?? "",
              content: a.locales?.uk?.content ?? "",
              seo_title: a.locales?.uk?.seo_title ?? "",
              seo_description: a.locales?.uk?.seo_description ?? "",
            },
            en: {
              title: a.locales?.en?.title ?? "",
              slug: a.locales?.en?.slug ?? "",
              description: a.locales?.en?.description ?? "",
              content: a.locales?.en?.content ?? "",
              seo_title: a.locales?.en?.seo_title ?? "",
              seo_description: a.locales?.en?.seo_description ?? "",
            },
          },
        });
        
        setIsSlugManuallyEdited({
          uk: !!(a.locales?.uk?.slug?.trim()),
          en: !!(a.locales?.en?.slug?.trim()),
        });

        setIsDirty(false);
        setAutoSaveStatus("saved");
      })
      .catch(() => toast.error("Не вдалося завантажити статтю"))
      .finally(() => setLoading(false));
  }, [articleId]);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);

  const handleSave = async () => {
    const errs: Record<string, string> = {};

    if (!form.category_id.trim()) {
      errs.category_id = "Оберіть категорію новини.";
    }

    if (!form.locales.uk.title.trim()) {
      errs.title_uk = "Введіть заголовок новини.";
    }

    if (stripHTMLContent(form.locales.uk.content) === "") {
      errs.content_uk = "Додайте текст новини.";
    }

    if (form.status === "published" && (!form.locales.en?.title?.trim())) {
      errs.title_en = "Перед публікацією заповніть англійську версію новини.";
      if (!activeLocale || activeLocale !== "en") {
        setActiveLocale("en");
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error("Перевірте правильність заповнення форми.");
      scrollToFirstError(errs);
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const payload: Partial<AdminNewsArticle> = {
        category_id: form.category_id || "",
        tags: form.tag_ids.map((id) => ({ id, slug: "", name: "" })),
        author: {
          name: form.author_name,
          position: form.author_position,
        },
        image_url: form.image_url || currentArticle?.image_url || "",
        cover_position: form.cover_position || currentArticle?.cover_position || "center",
        gallery: (form.gallery && form.gallery.length > 0) ? form.gallery : (currentArticle?.gallery || []),
        video_url: form.video_url ?? "",
        is_pinned: form.is_pinned,
        status: form.status,
        locales: {
          uk: { ...form.locales.uk, locale: "uk" },
          en: { ...form.locales.en, locale: "en" },
        } as Record<string, import("../../api").AdminNewsLocale>,
      };

      let savedArticleId = articleId;
      if (articleId) {
        await updateAdminNews(articleId, payload);
        toast.success("Зміни успішно збережено");
      } else {
        const created = await createAdminNews(payload);
        savedArticleId = created.id;
        toast.success("Новину успішно створено");
      }

      if (savedArticleId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          try {
            await uploadAdminNewsAttachment(savedArticleId, file);
          } catch (err: any) {
            toast.error(`Помилка завантаження «${file.name}»: ${err.message || "Не вдалося завантажити"}`);
          }
        }
        setPendingFiles([]);
      }

      if (savedArticleId && pendingPhotos.length > 0) {
        const { uploadAdminNewsGalleryImage } = await import("../../services/news.api");
        for (const file of pendingPhotos) {
          try {
            await uploadAdminNewsGalleryImage(savedArticleId, file);
          } catch (err: any) {
            toast.error(`Помилка завантаження фото «${file.name}»: ${err.message || "Не вдалося завантажити"}`);
          }
        }
        setPendingPhotos([]);
      }

      setIsDirty(false);
      setAutoSaveStatus("saved");
      onSaved();
    } catch (err: unknown) {
      const newFieldErrors: Record<string, string> = {};
      let msg = "Не вдалося зберегти новину. Перевірте виділені поля.";

      if (err instanceof ApiError) {
        if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
          Object.assign(newFieldErrors, err.fieldErrors);
        } else if (err.field && err.message) {
          newFieldErrors[err.field] = err.message;
        }
        msg = err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }

      if (msg.includes("category") || msg.includes("Категор")) {
        newFieldErrors.category_id = msg;
      } else if (msg.includes("slug") || msg.includes("URL")) {
        newFieldErrors.slug_uk = msg;
      }

      setFieldErrors(newFieldErrors);
      toast.error(msg);
      setAutoSaveStatus("error");
      scrollToFirstError(newFieldErrors);
    } finally {
      setSaving(false);
    }
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Лише зображення");
      return;
    }
    setImageUploading(true);
    try {
      const currentUrl = form.image_url || currentArticle?.image_url || "";
      if (currentUrl) {
        setImageHistory((prev) => [...prev, currentUrl]);
      }
      let url = "";
      if (currentArticle?.id) {
        const result = await uploadAdminNewsImage(currentArticle.id, file);
        url = result.image_url;
      } else {
        const result = await uploadAdminInlineImage(file);
        url = result.image_url;
      }
      updateForm((prev) => ({ ...prev, image_url: url }));
      setCurrentArticle((prev) => (prev ? { ...prev, image_url: url } : {
        id: "temp-draft",
        status: "draft",
        category_id: "",
        tags: [],
        author: { name: "" },
        image_url: url,
        is_pinned: false,
        preview_token: "",
        created_at: "",
        updated_at: "",
        locales: {},
      }));
      toast.success("Обкладинку завантажено");
    } catch {
      toast.error("Помилка завантаження зображення");
    } finally {
      setImageUploading(false);
    }
  };

  const handleAutoFillSEO = (locale: "uk" | "en") => {
    const locForm = form.locales[locale];
    if (normalizeText(locForm.title) === "") {
      if (locale === "en") {
        toast.error("Спочатку заповніть англійську версію новини.");
      } else {
        toast.error("Введіть заголовок статті.");
      }
      return;
    }

    updateForm((prev) => {
      const prevLoc = prev.locales[locale];
      const { next, filled } = computeAutoFillSEO(
        prevLoc.title,
        prevLoc.slug,
        prevLoc.seo_title,
        prevLoc.seo_description,
        prevLoc.description,
        prevLoc.content,
        slugify
      );

      if (filled && normalizeText(prevLoc.slug) === "") {
        // Setting to true ensures this explicitly autofilled slug is now protected
        setIsSlugManuallyEdited((flags) => ({ ...flags, [locale]: true }));
      }

      return {
        ...prev,
        locales: {
          ...prev.locales,
          [locale]: { ...prevLoc, ...next },
        },
      };
    });

    toast.success("SEO та Slug автозаповнено");
  };

  return {
    form, setForm: updateForm,
    activeLocale, setActiveLocale,
    fieldErrors, clearFieldError, setFieldErrors,
    loading, saving,
    isDirty, autoSaveStatus,
    imageUploading,
    imageHistory, setImageHistory,
    currentArticle, setCurrentArticle,
    sessionId,
    handleSave,
    handleImageFile,
    isSlugManuallyEdited,
    setIsSlugManuallyEdited,
    handleAutoFillSEO,
    pendingFiles,
    setPendingFiles,
    pendingPhotos,
    setPendingPhotos,
  };
}


