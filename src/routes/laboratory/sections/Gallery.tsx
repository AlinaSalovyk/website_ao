import type { JSX } from "react";

import { GalleryCarousel } from "@/components/gallery";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const Gallery = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  const galleryImages = [
    {
      id: "lab-1",
      src: "/images/Gallery/roboto.webp",
      alt: t.laboratory.gallery[0],
    },
    {
      id: "lab-2",
      src: "/images/Gallery/roboto1.webp",
      alt: t.laboratory.gallery[1],
    },
    {
      id: "lab-3",
      src: "/images/Gallery/roboto2.webp",
      alt: t.laboratory.gallery[2],
    },
    {
      id: "lab-4",
      src: "/images/Gallery/roboto3.webp",
      alt: t.laboratory.gallery[3],
    },
    {
      id: "lab-5",
      src: "/images/Gallery/roboto.webp",
      alt: t.laboratory.gallery[4],
    },
    {
      id: "lab-6",
      src: "/images/Gallery/roboto1.webp",
      alt: t.laboratory.gallery[5],
    },
  ];

  return <GalleryCarousel items={galleryImages} locale={locale} />;
};
