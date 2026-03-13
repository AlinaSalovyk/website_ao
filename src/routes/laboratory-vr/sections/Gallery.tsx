import type { JSX } from "react";

import { GalleryCarousel } from "@/components/gallery";

const galleryImages = [
  {
    id: "vr-lab-1",
    src: "/images/Gallery/roboto.png",
    alt: "VR-лабораторія: робоча зона з обладнанням",
  },
  {
    id: "vr-lab-2",
    src: "/images/Gallery/roboto1.png",
    alt: "VR-лабораторія: навчальний стенд",
  },
  {
    id: "vr-lab-3",
    src: "/images/Gallery/roboto2.png",
    alt: "VR-лабораторія: технічне обладнання",
  },
  {
    id: "vr-lab-4",
    src: "/images/Gallery/roboto3.png",
    alt: "VR-лабораторія: простір для практики",
  },
  {
    id: "vr-lab-5",
    src: "/images/Gallery/roboto.png",
    alt: "VR-лабораторія: лабораторний стенд",
  },
  {
    id: "vr-lab-6",
    src: "/images/Gallery/roboto1.png",
    alt: "VR-лабораторія: навчальна зона",
  },
];

export const Gallery = (): JSX.Element => {
  return <GalleryCarousel items={galleryImages} />;
};
