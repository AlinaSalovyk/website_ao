import type { JSX } from "react";

import { GalleryCarousel } from "@/components/gallery";
import type { GalleryItem } from "@/components/gallery";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const Gallery = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  const galleryItems: GalleryItem[] = [
    {
      id: "robo-1",
      src: "/images/Labs/robo/IMG_0790.mp4",
      alt: t.laboratory.gallery[0],
      type: "video",
    },
    {
      id: "robo-2",
      src: "/images/Labs/robo/IMG_2695.mp4",
      alt: t.laboratory.gallery[1],
      type: "video",
    },
    {
      id: "robo-3",
      src: "/images/Labs/robo/IMG_3382.mp4",
      alt: t.laboratory.gallery[2],
      type: "video",
    },
    {
      id: "robo-4",
      src: "/images/Labs/robo/IMG_7281.mp4",
      alt: t.laboratory.gallery[3],
      type: "video",
    },
    {
      id: "robo-7",
      src: "/images/Labs/robo/video_2026-02-02_21-37-00.mp4",
      alt: t.laboratory.gallery[4],
      type: "video",
    },
    {
      id: "robo-8",
      src: "/images/Labs/robo/video_2026-02-02_21-37-22.mp4",
      alt: t.laboratory.gallery[5],
      type: "video",
    },
    {
      id: "robo-9",
      src: "/images/Labs/robo/video_2026-02-02_21-37-49.mp4",
      alt: t.laboratory.gallery[6],
      type: "video",
    },
    {
      id: "robo-10",
      src: "/images/Labs/robo/video_2026-02-02_21-40-37.mp4",
      alt: t.laboratory.gallery[7],
      type: "video",
    },
    {
      id: "robo-11",
      src: "/images/Labs/robo/video_2026-03-04_10-55-39.mp4",
      alt: t.laboratory.gallery[8],
      type: "video",
    },
    {
      id: "robo-12",
      src: "/images/Labs/robo/video_2026-03-18_18-19-11.mp4",
      alt: t.laboratory.gallery[9],
      type: "video",
    },
    {
      id: "robo-13",
      src: "/images/Labs/robo/video_2026-03-18_18-19-25.mp4",
      alt: t.laboratory.gallery[10],
      type: "video",
    },
  ];

  return <GalleryCarousel items={galleryItems} locale={locale} />;
};
