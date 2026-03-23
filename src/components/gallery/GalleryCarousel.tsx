import type { JSX, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowIcon,
  GalleryDialog,
  VideoUnavailableIcon,
} from "@/components/gallery/components";
import type { GalleryCarouselProps } from "@/components/gallery/types";
import { getTranslations } from "@/i18n";

const SCROLL_EDGE_OFFSET = 5;

export function GalleryCarousel({
  items,
  title,
  locale,
}: GalleryCarouselProps): JSX.Element {
  const t = getTranslations(locale);
  const displayTitle = title ?? t.galleryUI.title;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAmountRef = useRef(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogIndex, setDialogIndex] = useState(0);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());

  const openGallery = (index: number) => {
    // Pause and reset any playing preview video before opening the dialog
    const videos = containerRef.current?.querySelectorAll("video");
    videos?.forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
    setDialogIndex(index);
    setDialogOpen(true);
  };

  // Cache scroll amount on mount and resize to avoid layout thrashing on every click
  const updateScrollAmount = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const firstItem = container.firstElementChild as HTMLDivElement | null;
    if (!firstItem) return;
    const itemWidth = firstItem.getBoundingClientRect().width;
    const styles = window.getComputedStyle(container);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    scrollAmountRef.current = itemWidth + gap;
  }, []);

  useEffect(() => {
    updateScrollAmount();
    window.addEventListener("resize", updateScrollAmount);
    return () => window.removeEventListener("resize", updateScrollAmount);
  }, [updateScrollAmount]);

  const scrollTo = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    if (maxScrollLeft <= 0) return;

    const scrollAmount = scrollAmountRef.current;
    if (scrollAmount <= 0) return;

    if (direction === "left") {
      if (container.scrollLeft <= SCROLL_EDGE_OFFSET) {
        container.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
      } else {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }
      return;
    }

    if (container.scrollLeft >= maxScrollLeft - SCROLL_EDGE_OFFSET) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleGalleryKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollTo("left");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollTo("right");
    }
  };

  return (
    <section
      className="w-full bg-pure-white pt-20 pb-32 md:pb-48 text-pure-black"
      aria-label={t.galleryUI.ariaLabel}
    >
      <div className="container mx-auto flex flex-col px-4 md:px-9">
        <header className="mx-auto mb-2 flex w-full flex-col">
          <div className="mb-10 flex w-full justify-center border-b border-pure-black pb-4">
            <h2 className="text-center text-4xl font-bold md:text-5xl lg:text-6xl">
              {displayTitle}
            </h2>
          </div>

          <div className="flex w-full justify-end px-10 md:px-4">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => scrollTo("left")}
                aria-label={t.galleryUI.scrollLeft}
                className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center p-0 hover:bg-transparent focus:outline-none"
              >
                <div className="transition-transform duration-300 group-hover:-translate-x-1">
                  <ArrowIcon direction="left" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => scrollTo("right")}
                aria-label={t.galleryUI.scrollRight}
                className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center p-0 hover:bg-transparent focus:outline-none"
              >
                <div className="transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowIcon direction="right" />
                </div>
              </button>
            </div>
          </div>
        </header>

        <div
          ref={containerRef}
          className="scrollbar-hide flex w-full max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4 outline-none md:gap-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          role="region"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={handleGalleryKeyDown}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => openGallery(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openGallery(index);
                }
              }}
              aria-label={`${item.type === "video" ? t.galleryUI.openVideo : t.galleryUI.openImage}: ${item.alt}`}
              className="group h-[170px] w-[280px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[8px] bg-gray-100 sm:h-[199px] sm:w-[327px]"
              onMouseEnter={(e) => {
                const video = e.currentTarget.querySelector("video");
                video?.play().catch(() => {});
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget.querySelector("video");
                if (video) {
                  video.pause();
                  video.currentTime = 0;
                }
              }}
            >
              {item.type === "video" ? (
                videoErrors.has(item.id) ? (
                  <span className="flex flex-col items-center justify-center h-full w-full text-gray-400 text-xs gap-1">
                    <VideoUnavailableIcon />
                    <span>{t.galleryUI.videoUnavailable}</span>
                  </span>
                ) : (
                  <video
                    src={item.src}
                    muted
                    playsInline
                    preload="metadata"
                    className="pointer-events-none h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    width={327}
                    height={199}
                    onError={() => {
                      setVideoErrors((prev) => new Set(prev).add(item.id));
                    }}
                  />
                )
              ) : (
                <img
                  src={item.src}
                  alt={item.alt}
                  className="pointer-events-none h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="eager"
                  decoding="async"
                  width={327}
                  height={199}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <GalleryDialog
        items={items}
        open={dialogOpen}
        initialIndex={dialogIndex}
        onOpenChange={setDialogOpen}
        locale={locale}
      />
    </section>
  );
}
