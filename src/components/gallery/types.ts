export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
};

export type LabGallerySectionProps = {
  items: GalleryItem[];
  title?: string;
};
