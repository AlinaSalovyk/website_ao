export type View = "list" | "edit";

export interface LocaleForm {
  title: string;
  slug: string;
  description: string;
  content: string;
  seo_title: string;
  seo_description: string;
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

// ДСТУ 9112:2021 Cyrillic -> Latin map (matching backend)
const cyrillicMap: Record<string, string> = {
  'а': "a", 'б': "b", 'в': "v", 'г': "h", 'ґ': "g",
  'д': "d", 'е': "e", 'є': "ie", 'ж': "zh", 'з': "z",
  'и': "y", 'і': "i", 'ї': "i", 'й': "i", 'к': "k",
  'л': "l", 'м': "m", 'н': "n", 'о': "o", 'п': "p",
  'р': "r", 'с': "s", 'т': "t", 'у': "u", 'ф': "f",
  'х': "kh", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "shch",
  'ь': "", 'ю': "iu", 'я': "ia",
};

export const MAX_AUTO_SLUG_LENGTH = 100;

export const slugify = (s: string): string => {
  if (!s) return "";
  s = s.toLowerCase();
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (cyrillicMap[char] !== undefined) {
      result += cyrillicMap[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else {
      result += "-";
    }
  }
  
  const collapsed = result
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens

  if (!collapsed) return "";

  const tokens = collapsed.split("-");
  let finalSlug = "";

  for (const token of tokens) {
    const additionLength = finalSlug.length === 0 ? token.length : token.length + 1;
    if (finalSlug.length + additionLength > MAX_AUTO_SLUG_LENGTH) {
      break;
    }
    finalSlug += (finalSlug.length === 0 ? "" : "-") + token;
  }

  if (finalSlug.length === 0 && tokens.length > 0) {
    return tokens[0].slice(0, MAX_AUTO_SLUG_LENGTH);
  }

  return finalSlug;
};

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
