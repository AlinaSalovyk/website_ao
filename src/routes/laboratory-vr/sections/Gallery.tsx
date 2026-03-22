import type { JSX } from "react";

import { GalleryCarousel } from "@/components/gallery";

const galleryImages = [
  {
    id: "vr-lab-1",
    src: "/images/Labs/vr/photo_2026-03-04_11-53-42.webp",
    alt: "VR/Game Development Lab: загальний вигляд лабораторії",
  },
  {
    id: "vr-lab-2",
    src: "/images/Labs/vr/photo_2026-03-04_11-54-01.webp",
    alt: "VR-лабораторія: робочі місця з комп'ютерами",
  },
  {
    id: "vr-lab-3",
    src: "/images/Labs/vr/photo_2026-03-04_11-54-07.webp",
    alt: "VR-лабораторія: зона розробки та моделювання",
  },
  {
    id: "vr-lab-4",
    src: "/images/Labs/vr/photo_2026-03-04_11-54-10.webp",
    alt: "VR-лабораторія: обладнання для цифрової візуалізації",
  },
  {
    id: "vr-lab-5",
    src: "/images/Labs/vr/photo_2026-03-04_11-54-15.webp",
    alt: "VR-лабораторія: простір для практичних занять",
  },
  {
    id: "vr-lab-6",
    src: "/images/Labs/vr/photo_2026-03-04_11-54-19.webp",
    alt: "VR-лабораторія: навчальна зона з моніторами",
  },
];

export const Gallery = (): JSX.Element => {
  return <GalleryCarousel items={galleryImages} />;
};
