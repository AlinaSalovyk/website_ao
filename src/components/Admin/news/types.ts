export type View = "list" | "edit";

export interface LocaleForm {
  title: string;
  slug: string;
  description: string;
  content: string;
  seo_title: string;
  seo_description: string;
  keywords: string;
}

export interface ArticleForm {
  category_id: string;
  tag_ids: string[];
  author_name: string;
  author_position: string;
  image_url?: string;
  cover_position?: string;
  gallery?: string[];
  video_url?: string;
  is_pinned: boolean;
  status: "draft" | "published";
  locales: { uk: LocaleForm; en: LocaleForm };
}

export const emptyLocale = (): LocaleForm => ({
  title: "",
  slug: "",
  description: "",
  content: "",
  seo_title: "",
  seo_description: "",
  keywords: "",
});

export const emptyForm = (): ArticleForm => ({
  category_id: "",
  tag_ids: [],
  author_name: "",
  author_position: "",
  image_url: "",
  cover_position: "center",
  gallery: [],
  video_url: "",
  is_pinned: false,
  status: "draft",
  locales: { uk: emptyLocale(), en: emptyLocale() },
});

export const formatDate = (iso: string | undefined): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 120);

import type { AdminNewsCategory, AdminNewsCategoryLocale } from "../api";

export type CategoryForm = Partial<AdminNewsCategory>;

export const emptyCategoryLocale = (locale: "uk" | "en"): AdminNewsCategoryLocale => ({
  locale,
  name: "",
  slug: "",
  description: "",
  seo_title: "",
  seo_description: "",
});

export const emptyCategoryForm = (): CategoryForm => ({
  color: "#3b82f6",
  icon: "folder",
  cover_image: "",
  status: "visible",
  sort_order: 0,
  locales: { uk: emptyCategoryLocale("uk"), en: emptyCategoryLocale("en") },
});
