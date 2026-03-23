import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ToolbarButton } from "@/components/gallery/components/ToolbarButton";
import { VideoUnavailableIcon } from "@/components/gallery/components/VideoUnavailableIcon";
import { useFullscreen, useKeyboardNavigation } from "@/components/gallery/hooks";
import type { GalleryItem } from "@/components/gallery/types";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
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
};

export function GalleryDialog({
  items,
  open,
  initialIndex,
  onOpenChange,
}: GalleryDialogProps): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [thumbErrors, setThumbErrors] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      videoRef.current?.pause();
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
  const isVideo = currentItem?.type === "video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/[0.96]" />
        <DialogPrimitive.Content
          ref={contentRef}
          aria-label="Перегляд зображення галереї"
          className="fixed inset-0 z-50 flex flex-col outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Accessible title & description (visually hidden) */}
          <DialogPrimitive.Title className="sr-only">
            Перегляд галереї
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Зображення {currentIndex + 1} з {items.length}: {currentItem?.alt}
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
                    ? "Вийти з повноекранного режиму"
                    : "Повноекранний режим"
                }
              >
                {isFullscreen ? (
                  <Minimize className="size-5" />
                ) : (
                  <Maximize className="size-5" />
                )}
              </ToolbarButton>

              {!isVideo && (
                <ToolbarButton
                  onClick={() => setIsZoomed((z) => !z)}
                  label={isZoomed ? "Зменшити" : "Збільшити"}
                >
                  {isZoomed ? (
                    <ZoomOut className="size-5" />
                  ) : (
                    <ZoomIn className="size-5" />
                  )}
                </ToolbarButton>
              )}

              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="Закрити галерею"
                  className="cursor-pointer rounded p-2 text-white/85 transition-colors hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </DialogClose>
            </div>
          </div>

          {/* Main image area */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden"
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Попереднє зображення"
              className="absolute left-2 z-10 cursor-pointer rounded-full p-2 text-white/70 transition-colors hover:text-white md:left-4"
            >
              <ChevronLeft className="size-7" />
            </button>

            <div className="flex h-full w-full items-center justify-center px-12 md:px-16">
              {isVideo ? (
                currentItem?.id && videoErrors.has(currentItem.id) ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-white/60">
                    <VideoUnavailableIcon size={48} />
                    <span className="text-sm">Відео недоступне</span>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    key={currentItem?.id}
                    src={currentItem?.src}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full select-none object-contain"
                    onError={() => {
                      if (currentItem?.id) {
                        setVideoErrors((prev) => new Set(prev).add(currentItem.id));
                      }
                    }}
                  />
                )
              ) : (
                <img
                  src={currentItem?.src}
                  alt={currentItem?.alt}
                  className={cn(
                    "max-h-full max-w-full select-none object-contain transition-transform duration-300",
                    isZoomed && "scale-150",
                  )}
                  draggable={false}
                />
              )}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Наступне зображення"
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
                    videoRef.current?.pause();
                    setCurrentIndex(index);
                    setIsZoomed(false);
                  }}
                  aria-label={`Перейти до ${item.type === "video" ? "відео" : "зображення"} ${index + 1}`}
                  className={cn(
                    "shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-colors",
                    index === currentIndex
                      ? "border-destructive"
                      : "border-transparent hover:border-white/30",
                  )}
                >
                  {item.type === "video" ? (
                    thumbErrors.has(item.id) ? (
                      <span className="flex items-center justify-center h-16 w-24 bg-white/10 text-white/40 text-[10px]">
                        Відео
                      </span>
                    ) : (
                      <video
                        src={item.src}
                        muted
                        playsInline
                        preload="none"
                        className="h-16 w-24 object-cover"
                        onError={() => {
                          setThumbErrors((prev) => new Set(prev).add(item.id));
                        }}
                      />
                    )
                  ) : (
                    <img
                      src={item.src}
                      alt=""
                      className="h-16 w-24 object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
