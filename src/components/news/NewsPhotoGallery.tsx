import React from "react";
import { ImageIcon } from "lucide-react";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import {
  articleTitle,
  getFullImageUrl,
  type NewsArticle,
  type NewsGalleryImage,
} from "@/lib/news-api";
import { ImageExpansionSlider, type GalleryImage } from "@/components/ui/image-expansion";

interface NewsPhotoGalleryProps {
  article: NewsArticle;
  images?: NewsGalleryImage[];
  locale?: Locale;
  className?: string;
}

export function NewsPhotoGallery({
  article,
  images = article.gallery_images,
  locale = "uk",
  className = "",
}: NewsPhotoGalleryProps) {
  const t = getTranslations(locale);

  if (!images || images.length === 0) {
    return null;
  }

  const titleUK = articleTitle(article, "uk") || "Фотографія новини";
  const titleEN = articleTitle(article, "en") || titleUK || "News photo";

  // Map backend NewsGalleryImage records to UI primitive GalleryImage with locale fallbacks
  const galleryItems: GalleryImage[] = images.map((img) => {
    let alt = "";
    let caption = "";

    if (locale === "en") {
      alt = img.alt_en?.trim() || img.alt_uk?.trim() || titleEN;
      caption = img.caption_en?.trim() || img.caption_uk?.trim() || "";
    } else {
      alt = img.alt_uk?.trim() || titleUK;
      caption = img.caption_uk?.trim() || "";
    }

    const rawSrc = img.url || `/api/v1/news/${img.news_id || article.id}/gallery/${img.id}/file`;
    const fullSrc = getFullImageUrl(rawSrc);

    return {
      id: img.id,
      src: fullSrc,
      thumbnailSrc: img.thumbnail_url ? getFullImageUrl(img.thumbnail_url) : fullSrc,
      largeSrc: img.large_url ? getFullImageUrl(img.large_url) : fullSrc,
      alt,
      caption,
      width: img.width,
      height: img.height,
    };
  });

  return (
    <div className={`w-full mt-10 md:mt-14 ${className}`}>
      <div className="flex items-center gap-2 mb-4 font-serif font-bold text-xl md:text-2xl text-slate-900 dark:text-white">
        <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
        <span>{t.newsPage.photoGallery}</span>
      </div>

      <ImageExpansionSlider images={galleryItems} locale={locale} />
    </div>
  );
}
