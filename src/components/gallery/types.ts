export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  type?: "image" | "video";
};

export type GalleryCarouselProps = {
  items: GalleryItem[];
  title?: string;
};
