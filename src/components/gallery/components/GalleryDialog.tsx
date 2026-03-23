import { useCallback, useEffect, useRef, useState, type JSX } from "react";

import { ToolbarButton } from "@/components/gallery/components/ToolbarButton";
import {
  useFullscreen,
  useKeyboardNavigation,
} from "@/components/gallery/hooks";
import type { GalleryItem } from "@/components/gallery/types";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type GalleryDialogProps = {
  items: GalleryItem[];
  open: boolean;
  initialIndex: number;
  onOpenChange: (open: boolean) => void;
  locale?: Locale;
};

export function GalleryDialog({
  items,
  open,
  initialIndex,
  onOpenChange,
  locale,
}: GalleryDialogProps): JSX.Element {
  const t = getTranslations(locale);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(contentRef);

  /* Reset state when dialog opens */
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [open, initialIndex]);

  /* Scroll active thumbnail into view */
  useEffect(() => {
    const activeThumb = thumbsRef.current?.children[currentIndex] as
      | HTMLElement
      | undefined;
    activeThumb?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex]);

  const goTo = useCallback(
    (direction: "prev" | "next") => {
      setIsZoomed(false);
      setCurrentIndex((prev) =>
        direction === "prev"
          ? prev <= 0
            ? items.length - 1
            : prev - 1
          : prev >= items.length - 1
            ? 0
            : prev + 1,
      );
    },
    [items.length],
  );

  const goPrev = useCallback(() => goTo("prev"), [goTo]);
  const goNext = useCallback(() => goTo("next"), [goTo]);

  useKeyboardNavigation(open, goPrev, goNext);

  const currentItem = items[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/[0.96]" />
        <DialogPrimitive.Content
          ref={contentRef}
          aria-label={t.galleryUI.dialog.viewerAriaLabel}
          className="fixed inset-0 z-50 flex flex-col outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Accessible title & description (visually hidden) */}
          <DialogPrimitive.Title className="sr-only">
            {t.galleryUI.dialog.viewerTitle}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {currentIndex + 1} {t.galleryUI.dialog.imageOf} {items.length}:{" "}
            {currentItem?.alt}
          </DialogPrimitive.Description>

          {/* Toolbar */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3">
            <span className="select-none text-sm text-white/70">
              {currentIndex + 1} / {items.length}
            </span>

            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={toggleFullscreen}
                label={
                  isFullscreen
                    ? t.galleryUI.dialog.exitFullscreen
                    : t.galleryUI.dialog.fullscreen
                }
              >
                {isFullscreen ? (
                  <Minimize className="size-5" />
                ) : (
                  <Maximize className="size-5" />
                )}
              </ToolbarButton>

              <ToolbarButton
                onClick={() => setIsZoomed((z) => !z)}
                label={
                  isZoomed
                    ? t.galleryUI.dialog.zoomOut
                    : t.galleryUI.dialog.zoomIn
                }
              >
                {isZoomed ? (
                  <ZoomOut className="size-5" />
                ) : (
                  <ZoomIn className="size-5" />
                )}
              </ToolbarButton>

              <DialogClose asChild>
                <button
                  type="button"
                  aria-label={t.galleryUI.dialog.close}
                  className="cursor-pointer rounded p-2 text-white/85 transition-colors hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </DialogClose>
            </div>
          </div>

          {/* Main image area */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <button
              type="button"
              onClick={goPrev}
              aria-label={t.galleryUI.dialog.prevImage}
              className="absolute left-2 z-10 cursor-pointer rounded-full p-2 text-white/70 transition-colors hover:text-white md:left-4"
            >
              <ChevronLeft className="size-7" />
            </button>

            <div className="flex h-full w-full items-center justify-center px-12 md:px-16">
              <img
                src={currentItem?.src}
                alt={currentItem?.alt}
                className={cn(
                  "max-h-full max-w-full select-none object-contain transition-transform duration-300",
                  isZoomed && "scale-150",
                )}
                draggable={false}
              />
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label={t.galleryUI.dialog.nextImage}
              className="absolute right-2 z-10 cursor-pointer rounded-full p-2 text-white/70 transition-colors hover:text-white md:right-4"
            >
              <ChevronRight className="size-7" />
            </button>
          </div>

          {/* Caption */}
          <div className="bg-gradient-to-t from-black/60 to-transparent px-5 py-3 text-center">
            <p className="text-sm text-white/90">{currentItem?.alt}</p>
          </div>

          {/* Thumbnails */}
          <div className="bg-black/70 px-4 py-3">
            <div
              ref={thumbsRef}
              className="scrollbar-hide mx-auto flex max-w-3xl gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsZoomed(false);
                  }}
                  aria-label={`${t.galleryUI.dialog.goToImage} ${index + 1}`}
                  className={cn(
                    "shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-colors",
                    index === currentIndex
                      ? "border-destructive"
                      : "border-transparent hover:border-white/30",
                  )}
                >
                  <img
                    src={item.src}
                    alt=""
                    className="h-16 w-24 object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
