import type { JSX } from "react";

import { GalleryCarousel } from "@/components/gallery";

const galleryImages = [
  {
    id: "lab-1",
    src: "/images/Gallery/roboto.webp",
    alt: "Робоче місце лабораторії з обладнанням",
  },
  {
    id: "lab-2",
    src: "/images/Gallery/roboto1.webp",
    alt: "Навчальне обладнання в лабораторії",
  },
  {
    id: "lab-3",
    src: "/images/Gallery/roboto2.webp",
    alt: "Технічне оснащення лабораторії",
  },
  {
    id: "lab-4",
    src: "/images/Gallery/roboto3.webp",
    alt: "Простір лабораторії для практичних занять",
  },
  {
    id: "lab-5",
    src: "/images/Gallery/roboto.webp",
    alt: "Лабораторний стенд для виконання проєктів",
  },
  {
    id: "lab-6",
    src: "/images/Gallery/roboto1.webp",
    alt: "Навчальна зона лабораторії",
  },
];

export const Gallery = (): JSX.Element => {
  return <GalleryCarousel items={galleryImages} />;
};
