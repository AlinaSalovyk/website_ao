# News Gallery: Replace LightGallery with the Custom Gallery

**Status:** Implemented
**Branch:** `refactor/custom-gallery`

## 1. Goal

News articles show their photo gallery with the third-party `lightgallery` package. The laboratory pages use our own gallery in `src/components/gallery/`. The goal is one gallery viewer for the whole site:

- The news article gallery opens our `GalleryDialog` instead of LightGallery.
- `GalleryDialog` gains the features LightGallery gives us today.
- The `lightgallery` dependency is removed.

### Why

| Problem with LightGallery today | Detail |
|---|---|
| Every photo downloads when the page loads | The article page hydrates with `client:load`. LightGallery builds its hidden viewer at that moment, and its thumbnail plugin creates an `<img>` for every photo (up to 30), so the grid's `loading="lazy"` has no effect. |
| License | `lightgallery` is GPLv3 or a paid commercial license. We pass no `licenseKey`, so every article page logs `license key is not valid for production use`. |
| Two different viewers | News and lab pages look and behave differently. |
| Broken caption styles | Captions are built as HTML strings that use `className=` (a React prop) instead of `class=`, so their Tailwind classes never apply. |

## 2. Decisions

| Topic | Decision |
|---|---|
| Captions | **In scope.** The dialog shows the photo caption, falling back to alt text. |
| Mobile and viewer features | **Add:** swipe, swipe down to close, zoom with panning, slideshow. **Keep:** fullscreen and the counter, which `GalleryDialog` already has. **Not needed:** rotate, download. See section 5.3. |
| Chat button over the dialog | **Out of scope.** No changes to `src/components/Chat/`. |
| Thumbnails | **Frontend only.** `GalleryItem` gets an optional `thumbnailSrc` mapped from the API's `thumbnail_url`. The backend is not changed in this migration; see section 6. |
| Lab pages | They use the same `GalleryDialog`, so they get the new viewer features too. `GalleryCarousel` keeps its current look. |

## 3. How news photos work today

```
Admin: ArticleGalleryManager
  └─ POST /news/{id}/gallery  (JPG/PNG/WebP, max 30 per article)
       └─ Backend: one WebP per photo (max 3840 px wide, quality 95)
            └─ Local disk or Cloudflare R2: news/articles/{newsId}/gallery/{uuid}.webp

Public article page
  ArticlePage
   └─ NewsPhotoGallery            maps API data → LightGalleryItem[]
       └─ NewsLightGallery        1 / 2 / 3+ photo grid + hidden LightGallery (dynamic mode)
```

The API returns `url`, `thumbnail_url` and `large_url` for each photo, but **all three point to the same file**. LightGallery uses that file for the grid tiles, the full-screen viewer and the thumbnail strip.

Articles created before the gallery table existed may keep photos in the older `article.gallery` field, a plain list of URLs with no alt text or captions. `NewsPhotoGallery` uses it only when `gallery_images` is empty. That fallback stays.

## 4. Target design

```
ArticlePage                         (unchanged)
 └─ NewsPhotoGallery                maps API data → GalleryItem[]
     └─ NewsGalleryGrid (new)       same 1 / 2 / 3+ layouts, opens the dialog
         └─ GalleryDialog           src/components/gallery, shared with lab pages

Laboratory pages                    (unchanged)
 └─ GalleryCarousel
     └─ GalleryDialog
```

### 4.1 `GalleryItem` type

`src/components/gallery/types.ts`. All new fields are optional, so the lab pages need no changes.

```ts
export type GalleryItem = {
  id: string;
  /** Shown in the viewer: large image or video file. */
  src: string;
  alt: string;
  type?: "image" | "video";
  /** Grid tiles and dialog thumbnail strip. Falls back to `src`. */
  thumbnailSrc?: string;
  /** Text under the media in the dialog. Falls back to `alt`. */
  caption?: string;
};
```

### 4.2 Mapping news data to `GalleryItem`

Done in `NewsPhotoGallery`, replacing the `LightGalleryItem` mapping. The existing alt and caption locale fallbacks stay as they are.

| `GalleryItem` | From `NewsGalleryImage` | From the older `article.gallery` URL list |
|---|---|---|
| `id` | `id` | `gallery-legacy-{index}` |
| `src` | `large_url`, else `url` | the URL |
| `thumbnailSrc` | `thumbnail_url`, else `url` | the URL |
| `alt` | `alt_en` / `alt_uk`, with the current title fallback | `{article title} - {n}` |
| `caption` | `caption_en` / `caption_uk` | none |
| `type` | `"image"` | `"image"` |

All URLs keep going through `getFullImageUrl`. `width` and `height` are dropped because nothing used them, and the backend stores 0 for both anyway.

## 5. Implementation

### 5.1 Export the dialog

`src/components/gallery/index.ts`: export `GalleryDialog` and a `GalleryDialogProps` type, so news code imports from `@/components/gallery` rather than the internal `components/` folder.

### 5.2 Captions and thumbnails in `GalleryDialog`

- Caption area: show `caption || alt`. Keep `alt` in the screen-reader description.
- Thumbnail strip: image thumbnails use `thumbnailSrc ?? src` and keep `loading="lazy"`.
- `GalleryCarousel` tiles: use `thumbnailSrc ?? src`. This changes nothing on lab pages, which don't set `thumbnailSrc`.

Radix only mounts the dialog content while it is open, so thumbnails download only after the user opens the gallery. This removes the page-load download on its own.

### 5.3 Viewer features

Every feature is on for every gallery. Zoom and pan reset when the user moves to another item (`goTo` and thumbnail clicks already reset zoom).

| Feature | Status | Behaviour | Images | Videos |
|---|---|---|---|---|
| Counter | Keep | "current / total" in the top-left of the toolbar. Must update on every kind of navigation: arrows, keyboard, swipe, thumbnails, slideshow. | ✓ | ✓ |
| Fullscreen | Keep, small fix | The toolbar button toggles browser fullscreen for the dialog (`useFullscreen`). Fix: hide the button when fullscreen isn't supported (see notes). | ✓ | ✓ |
| Swipe / drag | Add | Horizontal drag of 50 px or more that is mostly horizontal → previous/next. Works for touch and mouse (pointer events). Disabled while zoomed. | ✓ | ✓ |
| Swipe down to close | Add | Downward drag of 100 px or more that is mostly vertical closes the dialog. Disabled while zoomed. Same as LightGallery's `swipeToClose`. | ✓ | ✓ |
| Zoom | Improve | Toolbar button toggles 1× ↔ 2× centred. Add double-click / double-tap to toggle 2× at the pointer position. | ✓ | – |
| Pan when zoomed | Add | Dragging moves the image. Clamp it so its edges can't be dragged past the edges of the viewing area. Replaces today's `scale-150` inside `overflow-hidden`, which leaves the edges of a zoomed photo unreachable. | ✓ | – |
| Slideshow | Add | Play/pause button. Advances every 4 s, loops, and shows a thin progress bar. Shown only when the gallery has 2+ items and no videos. | ✓ | – |

Not needed: rotate and download. LightGallery offers both today, but they are intentionally dropped.

Implementation notes:

- **Fullscreen support:** `useFullscreen` calls `requestFullscreen()` and silently ignores failures, so on browsers without element fullscreen (for example iPhone Safari) the button does nothing. Render it only when `document.fullscreenEnabled` is true. LightGallery's fullscreen plugin makes the same check.
- **Gestures:** attach pointer handlers to the main media area and set `touch-action: none` on it. The dialog already locks page scrolling, so no page gesture is lost.
- **Transform order:** use `translate(x, y) scale(s)` so panning follows the pointer at any zoom level.
- **Slideshow rules:**
  - Manual navigation (arrows, swipe, thumbnails, keyboard) restarts the 4 s timer and keeps the slideshow running.
  - Zooming, pressing pause, or closing the dialog stops it.
  - The "no videos" rule avoids timing video playback. News galleries are images only, and each lab gallery is either all images or all videos.
- **Pinch-to-zoom:** optional. It isn't needed for parity with what we use from LightGallery today.

New translations in both `src/i18n/translations/uk.ts` and `en.ts`, under `galleryUI.dialog`:

| Key | uk | en |
|---|---|---|
| `playSlideshow` | Запустити слайдшоу | Start slideshow |
| `pauseSlideshow` | Зупинити слайдшоу | Pause slideshow |

### 5.4 New `NewsGalleryGrid`

Create `src/components/news/article/NewsGalleryGrid.tsx` to replace `src/components/ui/news-light-gallery.tsx`.

- **Same layouts:** 1 photo, 2 photos, and 3+ photos (one large photo plus two small ones, with a "+N more" overlay on the last visible tile). The "+N" tile opens the third photo, as it does now.
- **Dialog:** keep `open` and `index` in component state and render `<GalleryDialog items open initialIndex onOpenChange locale />`. It replaces the LightGallery instance, its five plugins, its six CSS imports, and the `lg-on` open/close callbacks.
- **Accessibility:** tiles become `<button type="button">` with `aria-label={`${t.galleryUI.openImage}: ${alt}`}`. Today they are `div`s that can't be reached with the keyboard. Remove the nested button inside the single-photo tile.
- **Images:** the single photo and the large photo use `src`; the small tiles use `thumbnailSrc ?? src`. All use `loading="lazy"` and `decoding="async"`.
- **Captions:** render them as normal React text. The `escapeHtml` calls and HTML-string captions go away; React escapes text itself.
- **Hard-coded text:** move it to the translation files under `newsPage`:

| Key | uk | en |
|---|---|---|
| `galleryFullscreen` | На весь екран | Fullscreen |
| `galleryViewPhoto` | Переглянути | View photo |
| `galleryMorePhotos` | Більше фото | More photos |

### 5.5 `NewsPhotoGallery`

- Build `GalleryItem[]` using the mapping in section 4.2.
- Render `<NewsGalleryGrid items={galleryItems} locale={locale} />`.
- The heading, the empty-gallery check and the fallback to the older URL list stay as they are.

### 5.6 Remove LightGallery

1. Delete `src/components/ui/news-light-gallery.tsx`.
2. Run `npm uninstall lightgallery`.
3. Search `src/` for `lightgallery` and `LightGallery`. There should be no results.

The `body.lg-on` selectors in `src/components/Chat/chatbot.css` will no longer match anything. They stay because the chat button is out of scope. `escapeHtml` in `src/lib/news-api.ts` loses its only caller in the app but can stay.

## 6. Thumbnails: why frontend only

- The backend returns one file per photo, so the new `thumbnailSrc` field points at the same file as `src` for now.
- Loading thumbnails only after the dialog opens removes the main cost: up to 30 full-size downloads on every article view.
- Once the backend stores real sizes, no frontend change is needed: `thumbnail_url` and `large_url` are already mapped.

Backend follow-up (separate task):

- Generate real sizes at upload, for example 640 px and 1920 px. `imageproc.Processor.Process()` already produces multiple widths but is never called.
- Return separate `thumbnail_url` and `large_url`.
- Store width and height. `ValidateGalleryImageFile` never sets them today.
- Create the smaller sizes for photos that are already uploaded.

## 7. Suggested commits

1. `feat(gallery)`: `GalleryItem` fields, dialog export, captions and thumbnails (5.1, 5.2).
2. `feat(gallery)`: swipe, swipe down to close, zoom with panning (5.3).
3. `feat(gallery)`: slideshow, fullscreen support check and translations (5.3).
4. `refactor(news)`: `NewsGalleryGrid`, `NewsPhotoGallery` mapping, news translations (5.4, 5.5).
5. `chore(deps)`: remove `lightgallery` (5.6).

## 8. Testing checklist

**News article page**

- [ ] Articles with 1, 2, 3, 4 and 10+ photos show the right layout. The "+N" tile opens the third photo.
- [ ] An older article that stores photos only in `article.gallery` still shows its gallery.
- [ ] Captions and alt text show correctly in Ukrainian and English. With no caption, the alt text is shown.
- [ ] DevTools → Network: loading the article requests only the visible grid images. Opening the dialog loads thumbnails lazily.
- [ ] No LightGallery license warning in the console.

**Viewer**

- [ ] Keyboard: Tab to a tile → Enter opens → arrow keys move → Esc closes → focus returns to the tile.
- [ ] Mobile: swipe left/right changes photo; swipe down closes; swipe does nothing while zoomed.
- [ ] Zoom: button and double-tap/double-click; dragging pans without showing empty space past the edges; zoom resets on the next photo.
- [ ] Counter: shows "current / total" and updates on arrows, keyboard, swipe, thumbnail clicks and slideshow.
- [ ] Fullscreen: the button enters and leaves fullscreen, and its icon and label switch. The button is hidden on browsers without fullscreen support (iPhone Safari).
- [ ] No rotate or download buttons.
- [ ] Slideshow: advances every 4 s and loops; manual navigation restarts the timer; zoom, pause and close stop it.

**Lab pages and build**

- [ ] VR lab (images): all new features work.
- [ ] Robotics lab (videos): no zoom or slideshow; swipe, counter and fullscreen work; videos play.
- [ ] `npm run build` and `npx astro check` pass.

## 9. Out of scope / follow-ups

- Chat button showing over the gallery dialog (decided: no change).
- Backend image sizes and width/height (section 6).
- Admin preview in `ArticleGalleryManager`: its own overlay has no Esc, no keyboard focus handling and no previous/next. It could reuse `GalleryDialog`.
- Lab gallery content: photos and videos are hard-coded and stored in `public/images/Labs/`. The admin panel has no way to manage them.
- Older `article.gallery` data: convert it into the gallery table, or keep the fallback. The old sidebar upload code in `ArticleFormSidebar` (`handleGalleryUpload`) is no longer displayed and can be removed.
