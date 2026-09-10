import React, { useCallback, useRef } from "react";
import LightGallery from "lightgallery/react";
import type { LightGallery as LightGalleryInstance } from "lightgallery/lightgallery";
import lgZoom from "lightgallery/plugins/zoom";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgFullscreen from "lightgallery/plugins/fullscreen";
import lgRotate from "lightgallery/plugins/rotate";
import lgAutoplay from "lightgallery/plugins/autoplay";
import lgPager from "lightgallery/plugins/pager";

// LightGallery Styles
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-fullscreen.css";
import "lightgallery/css/lg-rotate.css";
import "lightgallery/css/lg-autoplay.css";
import "lightgallery/css/lg-pager.css";

import { ImageIcon, Maximize2 } from "lucide-react";
import { escapeHtml } from "@/lib/news-api";

export interface LightGalleryItem {
  id: string;
  src: string;
  thumbnailSrc?: string;
  largeSrc?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface NewsLightGalleryProps {
  items: LightGalleryItem[];
  locale?: "uk" | "en";
  className?: string;
}

export function NewsLightGallery({
  items,
  locale = "uk",
  className = "",
}: NewsLightGalleryProps) {
  const lightGalleryRef = useRef<LightGalleryInstance | null>(null);

  // Store instance reference on init WITHOUT auto-opening
  const onInit = useCallback((detail: { instance: LightGalleryInstance } | null) => {
    if (detail?.instance) {
      lightGalleryRef.current = detail.instance;
    }
  }, []);

  const openGalleryAtIndex = (index: number) => {
    if (lightGalleryRef.current) {
      lightGalleryRef.current.openGallery(index);
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  // Format dynamic elements for LightGallery
  const dynamicEl = items.map((item) => {
    const fullImg = item.largeSrc || item.src;
    const thumbImg = item.thumbnailSrc || item.src;
    const safeCaption = item.caption ? escapeHtml(item.caption) : "";
    const safeAlt = item.alt ? escapeHtml(item.alt) : "";

    const subHtmlContent = safeCaption
      ? `<div className="lg-sub-html-inner"><h4 className="text-sm font-semibold text-white">${safeCaption}</h4></div>`
      : safeAlt
      ? `<div className="lg-sub-html-inner"><p className="text-xs text-slate-300">${safeAlt}</p></div>`
      : undefined;

    return {
      src: fullImg,
      thumb: thumbImg,
      subHtml: subHtmlContent,
      alt: item.alt,
    };
  });

  const total = items.length;

  return (
    <div className={`w-full font-sans select-none ${className}`}>
      {/* Hidden LightGallery React Component instance */}
      <LightGallery
        onInit={onInit}
        plugins={[lgZoom, lgThumbnail, lgFullscreen, lgRotate, lgAutoplay, lgPager]}
        dynamic={true}
        dynamicEl={dynamicEl}
        elementClassNames="hidden"
        speed={400}
        mode="lg-slide"
        download={true}
        counter={true}
        enableSwipe={true}
        enableDrag={true}
        swipeToClose={true}
        keyPress={true}
        ariaLabelledby="lg-gallery-title"
        ariaDescribedby="lg-gallery-desc"
        slideShowInterval={4000}
        progressBar={true}
        autoplayControls={true}
        appendSubHtmlTo=".lg-item"
      />

      {/* Inline Presentation Layout */}
      {total === 1 ? (
        <div
          onClick={() => openGalleryAtIndex(0)}
          className="group relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300"
        >
          <img
            src={items[0].src}
            alt={items[0].alt}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 z-10">
            {items[0].caption ? (
              <p className="text-white text-sm font-semibold leading-snug drop-shadow-sm line-clamp-2 max-w-2xl">
                {items[0].caption}
              </p>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openGalleryAtIndex(0);
              }}
              className="px-3.5 py-1.5 bg-white/95 hover:bg-white text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shrink-0 ml-auto cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{locale === "en" ? "Fullscreen" : "На весь екран"}</span>
            </button>
          </div>
        </div>
      ) : total === 2 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => openGalleryAtIndex(idx)}
              className="group relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300"
            >
              <img
                src={item.thumbnailSrc || item.src}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                {item.caption ? (
                  <p className="text-white text-xs font-semibold line-clamp-1 mr-2" title={item.caption}>
                    {item.caption}
                  </p>
                ) : (
                  <div />
                )}
                <span className="p-1.5 rounded-lg bg-white/90 text-slate-950 shadow-xs shrink-0 ml-auto">
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Main Lead Photo (First item, spans 2 cols on tablet/desktop if total >= 3) */}
          <div
            onClick={() => openGalleryAtIndex(0)}
            className="sm:col-span-2 group relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300"
          >
            <img
              src={items[0].thumbnailSrc || items[0].src}
              alt={items[0].alt}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
              {items[0].caption ? (
                <p className="text-white text-xs sm:text-sm font-semibold line-clamp-1 mr-2" title={items[0].caption}>
                  {items[0].caption}
                </p>
              ) : (
                <div />
              )}
              <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 ml-auto">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{locale === "en" ? "View photo" : "Переглянути"}</span>
              </span>
            </div>
          </div>

          {/* Secondary Thumbnail Stack */}
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
            {items.slice(1, 3).map((item, idx) => {
              const actualIdx = idx + 1;
              const isLastVisible = actualIdx === 2 && total > 3;
              const remainingCount = total - 3;

              return (
                <div
                  key={item.id || actualIdx}
                  onClick={() => openGalleryAtIndex(actualIdx)}
                  className="group relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300"
                >
                  <img
                    src={item.thumbnailSrc || item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {isLastVisible && remainingCount > 0 ? (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 transition-colors group-hover:bg-slate-950/60">
                      <span className="text-xl sm:text-2xl font-bold text-white">+{remainingCount + 1}</span>
                      <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider mt-0.5">
                        {locale === "en" ? "More photos" : "Більше фото"}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <span className="p-1.5 rounded-lg bg-white/95 text-slate-950 shadow-xs block">
                        <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
