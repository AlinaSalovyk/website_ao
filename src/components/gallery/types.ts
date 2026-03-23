import type { Locale } from "@/i18n";

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
};

export type GalleryCarouselProps = {
  items: GalleryItem[];
  title?: string;
  locale?: Locale;
};
