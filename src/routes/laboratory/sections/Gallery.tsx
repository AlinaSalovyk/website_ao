import type { JSX } from "react";

import { LabGallerySection } from "@/components/gallery";

const galleryImages = [
  {
    id: "lab-1",
    src: "/images/Gallery/roboto.png",
    alt: "Робоче місце лабораторії з обладнанням",
  },
  {
    id: "lab-2",
    src: "/images/Gallery/roboto1.png",
    alt: "Навчальне обладнання в лабораторії",
  },
  {
    id: "lab-3",
    src: "/images/Gallery/roboto2.png",
    alt: "Технічне оснащення лабораторії",
  },
  {
    id: "lab-4",
    src: "/images/Gallery/roboto3.png",
    alt: "Простір лабораторії для практичних занять",
  },
  {
    id: "lab-5",
    src: "/images/Gallery/roboto.png",
    alt: "Лабораторний стенд для виконання проєктів",
  },
  {
    id: "lab-6",
    src: "/images/Gallery/roboto1.png",
    alt: "Навчальна зона лабораторії",
  },
];

export const Gallery = (): JSX.Element => {
  return <LabGallerySection items={galleryImages} />;
};
