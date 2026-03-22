import type { JSX } from "react";

import { GalleryCarousel } from "@/components/gallery";
import type { GalleryItem } from "@/components/gallery";

const galleryItems: GalleryItem[] = [
  {
    id: "robo-1",
    src: "/images/Labs/robo/IMG_0790.mp4",
    alt: "Лабораторія робототехніки: робота з обладнанням",
    type: "video",
  },
  {
    id: "robo-2",
    src: "/images/Labs/robo/IMG_2695.mp4",
    alt: "Лабораторія робототехніки: тестування прототипу",
    type: "video",
  },
  {
    id: "robo-3",
    src: "/images/Labs/robo/IMG_3382.mp4",
    alt: "Лабораторія робототехніки: процес складання",
    type: "video",
  },
  {
    id: "robo-4",
    src: "/images/Labs/robo/IMG_7281.mp4",
    alt: "Лабораторія робототехніки: демонстрація проєкту",
    type: "video",
  },
  {
    id: "robo-7",
    src: "/images/Labs/robo/video_2026-02-02_21-37-00.mp4",
    alt: "Лабораторія робототехніки: робочий процес в лабораторії",
    type: "video",
  },
  {
    id: "robo-8",
    src: "/images/Labs/robo/video_2026-02-02_21-37-22.mp4",
    alt: "Лабораторія робототехніки: розробка та тестування",
    type: "video",
  },
  {
    id: "robo-9",
    src: "/images/Labs/robo/video_2026-02-02_21-37-49.mp4",
    alt: "Лабораторія робототехніки: прототипування",
    type: "video",
  },
  {
    id: "robo-10",
    src: "/images/Labs/robo/video_2026-02-02_21-40-37.mp4",
    alt: "Лабораторія робототехніки: експерименти",
    type: "video",
  },
  {
    id: "robo-11",
    src: "/images/Labs/robo/video_2026-03-04_10-55-39.mp4",
    alt: "Лабораторія робототехніки: навчальний процес",
    type: "video",
  },
  {
    id: "robo-12",
    src: "/images/Labs/robo/video_2026-03-18_18-19-11.mp4",
    alt: "Лабораторія робототехніки: презентація проєкту",
    type: "video",
  },
  {
    id: "robo-13",
    src: "/images/Labs/robo/video_2026-03-18_18-19-25.mp4",
    alt: "Лабораторія робототехніки: результати роботи",
    type: "video",
  },
];

export const Gallery = (): JSX.Element => {
  return <GalleryCarousel items={galleryItems} />;
};
