import type { Locale } from "@/i18n";

export type GalleryItem = {
  id: string;
  /** Shown in the viewer: large image or video file. */
  src: string;
  alt: string;
  type?: "image" | "video";
  /** Grid tiles and dialog thumbnail strip. Falls back to `src`. */
  thumbnailSrc?: string;
  /** Text under the media in the dialog. Falls back to `alt`. */
  caption?: string;
};

export type GalleryCarouselProps = {
  items: GalleryItem[];
  title?: string;
  locale?: Locale;
};

export type GalleryDialogProps = {
  items: GalleryItem[];
  open: boolean;
  initialIndex: number;
  onOpenChange: (open: boolean) => void;
  locale?: Locale;
};
