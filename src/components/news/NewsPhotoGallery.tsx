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
import { NewsLightGallery, type LightGalleryItem } from "@/components/ui/news-light-gallery";

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

  const titleUK = articleTitle(article, "uk") || "Фотографія новини";
  const titleEN = articleTitle(article, "en") || titleUK || "News photo";

  let galleryItems: LightGalleryItem[] = [];

  // 1. Primary: Structured v22 gallery images table records
  if (images && images.length > 0) {
    galleryItems = images.map((img) => {
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
  } 
  // 2. Secondary fallback: Legacy string array gallery URLs (from Admin "Галерея додаткових фото")
  else if (article.gallery && article.gallery.length > 0) {
    galleryItems = article.gallery
      .filter((urlStr) => Boolean(urlStr && urlStr.trim()))
      .map((urlStr, idx) => {
        const fullSrc = getFullImageUrl(urlStr);
        return {
          id: `gallery-legacy-${idx}`,
          src: fullSrc,
          thumbnailSrc: fullSrc,
          largeSrc: fullSrc,
          alt: `${locale === "en" ? titleEN : titleUK} - ${idx + 1}`,
          caption: "",
        };
      });
  }

  // If no photos exist in either source, hide the section
  if (galleryItems.length === 0) {
    return null;
  }

  return (
    <div className={`w-full mt-10 md:mt-14 ${className}`}>
      <div className="flex items-center gap-2 mb-4 font-serif font-bold text-xl md:text-2xl text-slate-900">
        <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
        <span>{t.newsPage.photoGallery}</span>
      </div>

      <NewsLightGallery items={galleryItems} locale={locale} />
    </div>
  );
}
