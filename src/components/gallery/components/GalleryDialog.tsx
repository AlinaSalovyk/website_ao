import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";

import { ToolbarButton } from "@/components/gallery/components/ToolbarButton";
import { VideoUnavailableIcon } from "@/components/gallery/components/VideoUnavailableIcon";
import {
  useFullscreen,
  useKeyboardNavigation,
  useMediaGestures,
  useSlideshow,
} from "@/components/gallery/hooks";
import type { GalleryDialogProps } from "@/components/gallery/types";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";

export function GalleryDialog({
  items,
  open,
  initialIndex,
  onOpenChange,
  locale,
}: GalleryDialogProps): JSX.Element {
  const t = getTranslations(locale);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [thumbErrors, setThumbErrors] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    isFullscreen,
    isSupported: isFullscreenSupported,
    toggle: toggleFullscreen,
  } = useFullscreen(contentRef);

  const currentItem = items[currentIndex];
  const isVideo = currentItem?.type === "video";
  // Only for image galleries, so the timer never cuts a video short
  const canSlideshow =
    items.length > 1 && items.every((item) => item.type !== "video");

  const goTo = useCallback(
    (direction: "prev" | "next") => {
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
  const stopSlideshow = useCallback(() => setIsPlaying(false), []);

  const {
    isZoomed,
    isDragging,
    mediaStyle,
    toggleZoom,
    resetView,
    stageHandlers,
  } = useMediaGestures({
    stageRef,
    mediaRef: imageRef,
    zoomEnabled: !isVideo,
    resetKey: currentIndex,
    onSwipe: goTo,
    onSwipeDown: () => onOpenChange(false),
    onZoom: stopSlideshow,
  });

  /* Reset state when dialog opens or closes */
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
    resetView();
    setIsPlaying(false);
  }, [open, initialIndex, resetView]);

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

  useKeyboardNavigation(open, goPrev, goNext);
  useSlideshow(open && isPlaying, currentIndex, goNext, progressRef);

  const toggleSlideshow = () => {
    if (!isPlaying) resetView();
    setIsPlaying((playing) => !playing);
  };

  const mediaClassName = cn(
    "max-h-full max-w-full select-none object-contain",
    !isDragging && "transition-transform duration-300",
  );

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

          {/* Slideshow progress */}
          {isPlaying && (
            <div
              ref={progressRef}
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-20 h-0.5 origin-left bg-destructive"
              style={{ transform: "scaleX(0)" }}
            />
          )}

          {/* Toolbar */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3">
            <span className="select-none text-sm text-white/70">
              {currentIndex + 1} / {items.length}
            </span>

            <div className="flex items-center gap-1">
              {canSlideshow && (
                <ToolbarButton
                  onClick={toggleSlideshow}
                  label={
                    isPlaying
                      ? t.galleryUI.dialog.pauseSlideshow
                      : t.galleryUI.dialog.playSlideshow
                  }
                >
                  {isPlaying ? (
                    <Pause className="size-5" />
                  ) : (
                    <Play className="size-5" />
                  )}
                </ToolbarButton>
              )}

              {isFullscreenSupported && (
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
              )}

              {!isVideo && (
                <ToolbarButton
                  onClick={() => toggleZoom()}
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
              )}

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
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <button
              type="button"
              onClick={goPrev}
              aria-label={t.galleryUI.dialog.prevImage}
              className="absolute left-2 z-10 cursor-pointer rounded-full p-2 text-white/70 transition-colors hover:text-white md:left-4"
            >
              <ChevronLeft className="size-7" />
            </button>

            <div
              ref={stageRef}
              className={cn(
                "flex h-full w-full touch-none items-center justify-center px-12 md:px-16",
                isZoomed && (isDragging ? "cursor-grabbing" : "cursor-grab"),
              )}
              {...stageHandlers}
            >
              {isVideo ? (
                currentItem?.id && videoErrors.has(currentItem.id) ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-white/60">
                    <VideoUnavailableIcon size={48} />
                    <span className="text-sm">
                      {t.galleryUI.videoUnavailable}
                    </span>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    key={currentItem?.id}
                    src={currentItem?.src}
                    controls
                    autoPlay
                    playsInline
                    className={mediaClassName}
                    style={mediaStyle}
                    onError={() => {
                      if (currentItem?.id) {
                        setVideoErrors((prev) =>
                          new Set(prev).add(currentItem.id),
                        );
                      }
                    }}
                  />
                )
              ) : (
                <img
                  ref={imageRef}
                  key={currentItem?.id}
                  src={currentItem?.src}
                  alt={currentItem?.alt}
                  className={mediaClassName}
                  style={mediaStyle}
                  draggable={false}
                />
              )}
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
            <p className="text-sm text-white/90">
              {currentItem?.caption || currentItem?.alt}
            </p>
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
                  }}
                  aria-label={`${item.type === "video" ? t.galleryUI.dialog.goToVideo : t.galleryUI.dialog.goToImage} ${index + 1}`}
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
                        {t.galleryUI.videoLabel}
                      </span>
                    ) : (
                      <video
                        src={item.src}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-16 w-24 object-cover"
                        onError={() => {
                          setThumbErrors((prev) => new Set(prev).add(item.id));
                        }}
                      />
                    )
                  ) : (
                    <img
                      src={item.thumbnailSrc ?? item.src}
                      alt=""
                      role="presentation"
                      aria-hidden="true"
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
