import type { JSX } from "react";

import { GalleryCarousel } from "@/components/gallery";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const Gallery = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  const galleryImages = [
    {
      id: "vr-lab-1",
      src: "/images/Gallery/roboto.webp",
      alt: t.laboratoryVr.gallery[0],
    },
    {
      id: "vr-lab-2",
      src: "/images/Gallery/roboto1.webp",
      alt: t.laboratoryVr.gallery[1],
    },
    {
      id: "vr-lab-3",
      src: "/images/Gallery/roboto2.webp",
      alt: t.laboratoryVr.gallery[2],
    },
    {
      id: "vr-lab-4",
      src: "/images/Gallery/roboto3.webp",
      alt: t.laboratoryVr.gallery[3],
    },
    {
      id: "vr-lab-5",
      src: "/images/Gallery/roboto.webp",
      alt: t.laboratoryVr.gallery[4],
    },
    {
      id: "vr-lab-6",
      src: "/images/Gallery/roboto1.webp",
      alt: t.laboratoryVr.gallery[5],
    },
  ];

  return <GalleryCarousel items={galleryImages} locale={locale} />;
};
