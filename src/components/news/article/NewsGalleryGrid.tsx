import { useState, type JSX, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";

import { GalleryDialog, type GalleryItem } from "@/components/gallery";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";

interface NewsGalleryGridProps {
  items: GalleryItem[];
  locale?: Locale;
}

const tileClassName =
  "group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 text-left shadow-sm transition-all duration-300 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

const imageClassName =
  "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105";

function TileGradient(): JSX.Element {
  return (
    <span className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
  );
}

function TileImage({ src, alt }: { src: string; alt: string }): JSX.Element {
  return (
    <img
      src={src}
      alt={alt}
      className={imageClassName}
      loading="lazy"
      decoding="async"
    />
  );
}

function ExpandIcon(): JSX.Element {
  return <Maximize2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />;
}

/** 1 / 2 / 3+ photo layouts; each tile opens the shared gallery dialog. */
export function NewsGalleryGrid({
  items,
  locale = "uk",
}: NewsGalleryGridProps): JSX.Element | null {
  const t = getTranslations(locale);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogIndex, setDialogIndex] = useState(0);

  if (items.length === 0) {
    return null;
  }

  const openGallery = (index: number) => {
    setDialogIndex(index);
    setDialogOpen(true);
  };

  const tile = (
    index: number,
    className: string,
    children: ReactNode,
    ariaLabel = `${t.galleryUI.openImage}: ${items[index].alt}`,
  ) => (
    <button
      key={items[index].id}
      type="button"
      onClick={() => openGallery(index)}
      aria-label={ariaLabel}
      className={cn(tileClassName, className)}
    >
      {children}
    </button>
  );

  const total = items.length;
  const [first] = items;
  let layout: ReactNode;

  if (total === 1) {
    layout = tile(
      0,
      "aspect-[16/9] sm:aspect-[21/9]",
      <>
        <TileImage src={first.src} alt={first.alt} />
        <TileGradient />
        <span className="absolute right-4 bottom-4 left-4 z-10 flex items-end justify-between gap-4">
          {first.caption && (
            <span className="line-clamp-2 max-w-2xl text-sm leading-snug font-semibold text-white drop-shadow-sm">
              {first.caption}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-all group-hover:bg-white">
            <ExpandIcon />
            <span>{t.newsPage.galleryFullscreen}</span>
          </span>
        </span>
      </>,
    );
  } else if (total === 2) {
    layout = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item, index) =>
          tile(
            index,
            "aspect-[16/10]",
            <>
              <TileImage src={item.thumbnailSrc ?? item.src} alt={item.alt} />
              <TileGradient />
              <span className="absolute right-3 bottom-3 left-3 z-10 flex items-center justify-between">
                {item.caption && (
                  <span
                    className="mr-2 line-clamp-1 text-xs font-semibold text-white"
                    title={item.caption}
                  >
                    {item.caption}
                  </span>
                )}
                <span className="ml-auto shrink-0 rounded-lg bg-white/90 p-1.5 text-slate-950 shadow-xs">
                  <ExpandIcon />
                </span>
              </span>
            </>,
          ),
        )}
      </div>
    );
  } else {
    // "+N" counts every photo from the third one on, including the tile it covers
    const moreCount = total - 2;

    layout = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tile(
          0,
          "aspect-[16/10] sm:col-span-2",
          <>
            <TileImage src={first.src} alt={first.alt} />
            <TileGradient />
            <span className="absolute right-3.5 bottom-3.5 left-3.5 z-10 flex items-center justify-between">
              {first.caption && (
                <span
                  className="mr-2 line-clamp-1 text-xs font-semibold text-white sm:text-sm"
                  title={first.caption}
                >
                  {first.caption}
                </span>
              )}
              <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xs">
                <ExpandIcon />
                <span>{t.newsPage.galleryViewPhoto}</span>
              </span>
            </span>
          </>,
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          {items.slice(1, 3).map((item, offset) => {
            const index = offset + 1;
            const showMore = index === 2 && total > 3;

            return tile(
              index,
              "aspect-[16/10]",
              <>
                <TileImage src={item.thumbnailSrc ?? item.src} alt={item.alt} />
                <TileGradient />
                {showMore ? (
                  <span className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/70 text-white backdrop-blur-xs transition-colors group-hover:bg-slate-950/60">
                    <span className="text-xl font-bold text-white sm:text-2xl">
                      +{moreCount}
                    </span>
                    <span className="mt-0.5 text-[11px] font-semibold tracking-wider text-blue-300 uppercase">
                      {t.newsPage.galleryMorePhotos}
                    </span>
                  </span>
                ) : (
                  <span className="absolute right-2.5 bottom-2.5 z-10">
                    <span className="block rounded-lg bg-white/95 p-1.5 text-slate-950 shadow-xs">
                      <ExpandIcon />
                    </span>
                  </span>
                )}
              </>,
              showMore
                ? `${t.galleryUI.openImage}: ${item.alt} (+${moreCount} ${t.newsPage.galleryMorePhotos})`
                : undefined,
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans select-none">
      {layout}

      <GalleryDialog
        items={items}
        open={dialogOpen}
        initialIndex={dialogIndex}
        onOpenChange={setDialogOpen}
        locale={locale}
      />
    </div>
  );
}
