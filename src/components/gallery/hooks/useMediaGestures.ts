import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const ZOOM_SCALE = 2;
/** Movement (px) after which a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 8;
const SWIPE_THRESHOLD = 50;
const SWIPE_CLOSE_THRESHOLD = 100;
const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_DISTANCE = 30;
/** Bottom strip of a video that holds its native controls (seek bar, volume). */
const VIDEO_CONTROLS_HEIGHT = 64;

type Point = { x: number; y: number };

const ORIGIN: Point = { x: 0, y: 0 };

type Gesture = {
  pointerId: number;
  start: Point;
  startOffset: Point;
  /** Set once the pointer moves past DRAG_THRESHOLD. */
  dragAxis: "x" | "y" | null;
};

type UseMediaGesturesOptions = {
  /** Viewing area. Takes the pointer handlers; zoomed media is clamped to it. */
  stageRef: RefObject<HTMLElement | null>;
  /** Zoomable image. */
  mediaRef: RefObject<HTMLElement | null>;
  zoomEnabled: boolean;
  /** Zoom and pan reset whenever this changes (the current item's index). */
  resetKey: number;
  onSwipe: (direction: "prev" | "next") => void;
  onSwipeDown: () => void;
  onZoom: () => void;
};

const clamp = (value: number, limit: number) =>
  Math.min(limit, Math.max(-limit, value));

function isOnVideoControls(event: ReactPointerEvent<HTMLElement>): boolean {
  const target = event.target;
  if (!(target instanceof HTMLVideoElement)) return false;
  return (
    event.clientY >
    target.getBoundingClientRect().bottom - VIDEO_CONTROLS_HEIGHT
  );
}

/**
 * Swipe left/right to navigate, swipe down to close, double-tap to zoom at
 * the pointer and drag to pan while zoomed. Works for touch and mouse.
 */
export function useMediaGestures({
  stageRef,
  mediaRef,
  zoomEnabled,
  resetKey,
  onSwipe,
  onSwipeDown,
  onZoom,
}: UseMediaGesturesOptions) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>(ORIGIN);
  const [isDragging, setIsDragging] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const gestureRef = useRef<Gesture | null>(null);
  const lastTapRef = useRef<(Point & { time: number }) | null>(null);
  const suppressClickRef = useRef(false);

  // Reset during render so the next item never paints zoomed
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setScale(1);
    setOffset(ORIGIN);
    setIsDragging(false);
  }

  const isZoomed = scale > 1;

  /* Keep the edges of the scaled media from moving inside the stage */
  const clampOffset = useCallback(
    (point: Point, atScale: number): Point => {
      const stage = stageRef.current;
      const media = mediaRef.current;
      if (!stage || !media) return ORIGIN;
      const maxX = Math.max(
        0,
        (media.offsetWidth * atScale - stage.clientWidth) / 2,
      );
      const maxY = Math.max(
        0,
        (media.offsetHeight * atScale - stage.clientHeight) / 2,
      );
      return { x: clamp(point.x, maxX), y: clamp(point.y, maxY) };
    },
    [stageRef, mediaRef],
  );

  const resetView = useCallback(() => {
    gestureRef.current = null;
    lastTapRef.current = null;
    setScale(1);
    setOffset(ORIGIN);
    setIsDragging(false);
  }, []);

  /** Toggles 1× ↔ 2×, centred or around `point` (client coordinates). */
  const toggleZoom = useCallback(
    (point?: Point) => {
      onZoom();
      if (isZoomed) {
        setScale(1);
        setOffset(ORIGIN);
        return;
      }

      let next = ORIGIN;
      const media = mediaRef.current;
      if (point && media) {
        // Keep the spot under the pointer in place while scaling from the centre
        const rect = media.getBoundingClientRect();
        next = clampOffset(
          {
            x: (1 - ZOOM_SCALE) * (point.x - (rect.left + rect.width / 2)),
            y: (1 - ZOOM_SCALE) * (point.y - (rect.top + rect.height / 2)),
          },
          ZOOM_SCALE,
        );
      }
      setScale(ZOOM_SCALE);
      setOffset(next);
    },
    [isZoomed, mediaRef, clampOffset, onZoom],
  );

  /* Re-clamp when the stage size changes (window resize, fullscreen) */
  useEffect(() => {
    if (!isZoomed) return;
    const handleResize = () => setOffset((o) => clampOffset(o, scale));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isZoomed, scale, clampOffset]);

  const cancelGesture = () => {
    gestureRef.current = null;
    setIsDragging(false);
    if (!isZoomed) setOffset(ORIGIN);
  };

  const handleTap = (event: ReactPointerEvent<HTMLElement>) => {
    if (!zoomEnabled) return;
    const tap = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    const last = lastTapRef.current;
    if (
      last &&
      tap.time - last.time < DOUBLE_TAP_DELAY &&
      Math.hypot(tap.x - last.x, tap.y - last.y) < DOUBLE_TAP_DISTANCE
    ) {
      lastTapRef.current = null;
      toggleZoom(tap);
    } else {
      lastTapRef.current = tap;
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    suppressClickRef.current = false;
    if (gestureRef.current) {
      // A second finger: pinch-to-zoom isn't supported, so drop the gesture
      cancelGesture();
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isOnVideoControls(event)) return;

    gestureRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      startOffset: offset,
      dragAxis: null,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (event.pointerType === "mouse" && event.buttons === 0) {
      // The button was released outside the page
      cancelGesture();
      return;
    }

    const dx = event.clientX - gesture.start.x;
    const dy = event.clientY - gesture.start.y;

    if (!gesture.dragAxis) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      gesture.dragAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      // Captured only once dragging, so taps still reach the video controls
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    if (isZoomed) {
      setOffset(
        clampOffset(
          { x: gesture.startOffset.x + dx, y: gesture.startOffset.y + dy },
          scale,
        ),
      );
    } else {
      setOffset(
        gesture.dragAxis === "x"
          ? { x: dx, y: 0 }
          : { x: 0, y: Math.max(0, dy) },
      );
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gestureRef.current = null;

    if (!gesture.dragAxis) {
      handleTap(event);
      return;
    }

    setIsDragging(false);
    suppressClickRef.current = true;
    if (isZoomed) return;

    // Snap back even after a swipe: a one-item gallery keeps the same item
    setOffset(ORIGIN);
    const dx = event.clientX - gesture.start.x;
    const dy = event.clientY - gesture.start.y;
    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      onSwipe(dx < 0 ? "next" : "prev");
    } else if (dy >= SWIPE_CLOSE_THRESHOLD && dy > Math.abs(dx)) {
      onSwipeDown();
    }
  };

  /* A drag must not also count as a click (e.g. play/pause on a video) */
  const onClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const mediaStyle: CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
  };

  return {
    isZoomed,
    isDragging,
    mediaStyle,
    toggleZoom,
    resetView,
    stageHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: cancelGesture,
      onClickCapture,
    },
  } as const;
}
