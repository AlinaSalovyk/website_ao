import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

export interface GalleryImage {
  id: string;
  src: string;
  thumbnailSrc?: string;
  largeSrc?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ImageExpansionSliderProps {
  images: GalleryImage[];
  initialIndex?: number;
  locale?: "uk" | "en";
  className?: string;
}

export function ImageExpansionSlider({
  images,
  initialIndex = 0,
  locale = "uk",
  className = "",
}: ImageExpansionSliderProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [visibleItems, setVisibleItems] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVisibleItems(3);
      } else if (window.innerWidth >= 640) {
        setVisibleItems(2);
      } else {
        setVisibleItems(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalImages = images?.length || 0;
  const maxIdx = Math.max(0, totalImages - visibleItems);
  const totalDots = maxIdx + 1;

  // Handle slide navigation
  const handleNext = useCallback(() => {
    if (totalDots <= 1) return;
    setCurrentIdx((prev) => (prev < maxIdx ? prev + 1 : 0));
  }, [totalDots, maxIdx]);

  const handlePrev = useCallback(() => {
    if (totalDots <= 1) return;
    setCurrentIdx((prev) => (prev > 0 ? prev - 1 : maxIdx));
  }, [totalDots, maxIdx]);

  // Modal navigation
  const handleModalNext = useCallback(() => {
    if (totalImages <= 1) return;
    setSelectedImageIndex((prev) => (prev !== null && prev < totalImages - 1 ? prev + 1 : 0));
  }, [totalImages]);

  const handleModalPrev = useCallback(() => {
    if (totalImages <= 1) return;
    setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : totalImages - 1));
  }, [totalImages]);

  // Keyboard navigation for fullscreen lightbox modal
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (e.key === "ArrowRight") {
        handleModalNext();
      } else if (e.key === "ArrowLeft") {
        handleModalPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, handleModalNext, handleModalPrev]);

  // Smooth scroll slider to active index
  useEffect(() => {
    if (sliderRef.current && sliderRef.current.children.length > 0) {
      const card = sliderRef.current.children[0] as HTMLElement;
      if (card) {
        const cardWidth = card.clientWidth + 24; // card width + flex gap
        sliderRef.current.scrollTo({
          left: currentIdx * cardWidth,
          behavior: "smooth",
        });
      }
    }
  }, [currentIdx]);

  if (!images || totalImages === 0) {
    return null;
  }

  const activeModalImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  // Single Image view
  if (totalImages === 1) {
    const single = images[0];
    return (
      <div className={`w-full ${className}`}>
        <div
          onClick={() => setSelectedImageIndex(0)}
          className="group relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/80 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
        >
          <img
            src={single.largeSrc || single.src}
            alt={single.alt}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 z-10">
            {single.caption && (
              <p className="text-white text-sm font-medium leading-snug drop-shadow-md line-clamp-2 max-w-2xl">
                {single.caption}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(0);
              }}
              aria-label={locale === "en" ? "View full size" : "Переглянути у повному розмірі"}
              className="px-3 py-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md shrink-0 ml-auto"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Fullscreen" : "На весь екран"}</span>
            </button>
          </div>
        </div>

        {/* Fullscreen Lightbox Modal */}
        {selectedImageIndex !== null && activeModalImage && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedImageIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={locale === "en" ? "Photo Viewer" : "Перегляд фотографії"}
          >
            <button
              type="button"
              className="absolute top-6 right-6 w-10 h-10 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-white border border-slate-700 transition-all z-50 cursor-pointer shadow-lg active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(null);
              }}
              aria-label={locale === "en" ? "Close gallery" : "Закрити галерею"}
            >
              <X className="w-5 h-5" />
            </button>

            <div
              className="relative max-w-full max-h-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeModalImage.largeSrc || activeModalImage.src}
                alt={activeModalImage.alt}
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-slate-800"
              />
              {activeModalImage.caption && (
                <p className="mt-4 text-center text-sm sm:text-base font-medium text-slate-200 max-w-3xl px-4">
                  {activeModalImage.caption}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multiple Images slider layout
  return (
    <div className={`w-full font-sans select-none transition-all ${className}`}>
      {/* Slider Carousel Container */}
      <div
        ref={sliderRef}
        className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => setSelectedImageIndex(idx)}
            className="w-full sm:w-[48%] lg:w-[31.8%] shrink-0 snap-start group relative aspect-[1.5/1] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5"
          >
            {/* Background Image with Zoom & Dark Vignette */}
            <div className="absolute inset-0 z-0">
              <img
                src={img.thumbnailSrc || img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
            </div>

            {/* Badge / Counter */}
            <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
              <span className="text-blue-400">✦</span>
              <span>
                {idx + 1} / {totalImages}
              </span>
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-5">
              {img.caption && (
                <p className="text-xs sm:text-sm font-semibold text-white mb-3 leading-snug line-clamp-2" title={img.caption}>
                  {img.caption}
                </p>
              )}
              <button
                type="button"
                className="w-fit px-3.5 py-1.5 bg-white/95 hover:bg-white text-slate-950 font-bold text-[11px] tracking-tight rounded-lg transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3 text-blue-600" />
                <span>{locale === "en" ? "View photo" : "Переглянути"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Footer Controls - Only shown when items overflow visible screen width */}
      {totalDots > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/90 relative z-20">
          {/* Step Indicators with white backdrop pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            {Array.from({ length: totalDots }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIdx === idx ? "w-6 bg-blue-600 shadow-2xs" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={
                  locale === "en" ? `Go to page ${idx + 1}` : `Перейти до сторінки ${idx + 1}`
                }
              />
            ))}
          </div>

          {/* Arrow Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-slate-200/90 bg-white hover:bg-blue-600 hover:border-blue-600 text-slate-700 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              aria-label={locale === "en" ? "Previous photo" : "Попередня фотографія"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-slate-200/90 bg-white hover:bg-blue-600 hover:border-blue-600 text-slate-700 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              aria-label={locale === "en" ? "Next photo" : "Наступна фотографія"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {selectedImageIndex !== null && activeModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedImageIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={locale === "en" ? "Photo Viewer" : "Перегляд фотографії"}
        >
          {/* Close Button */}
          <button
            type="button"
            className="absolute top-6 right-6 w-10 h-10 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-white border border-slate-700 transition-all z-50 shadow-lg cursor-pointer active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex(null);
            }}
            aria-label={locale === "en" ? "Close gallery" : "Закрити галерею"}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Arrow */}
          <button
            type="button"
            className="absolute left-4 sm:left-10 w-12 h-12 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-white border border-slate-700 transition-all z-50 shadow-lg active:scale-95 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleModalPrev();
            }}
            aria-label={locale === "en" ? "Previous photo" : "Попередня фотографія"}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Image & Caption Container */}
          <div
            className="relative max-w-full max-h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeModalImage.largeSrc || activeModalImage.src}
              alt={activeModalImage.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-slate-800"
            />
            <div className="mt-4 text-center max-w-2xl px-4">
              {activeModalImage.caption && (
                <p className="text-base font-medium text-white mb-2 leading-snug">
                  {activeModalImage.caption}
                </p>
              )}
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {selectedImageIndex + 1} {locale === "en" ? "of" : "з"} {totalImages}
              </p>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            className="absolute right-4 sm:right-10 w-12 h-12 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-white border border-slate-700 transition-all z-50 shadow-lg active:scale-95 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleModalNext();
            }}
            aria-label={locale === "en" ? "Next photo" : "Наступна фотографія"}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
