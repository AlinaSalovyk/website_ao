import { useEffect, type RefObject } from "react";

export const SLIDESHOW_INTERVAL = 4000;

/**
 * Calls `onAdvance` every `SLIDESHOW_INTERVAL` ms while `playing` and fills
 * the progress bar in step with it. Changing `restartKey` (the current index)
 * restarts the timer, so manual navigation gives each item a full interval.
 */
export function useSlideshow(
  playing: boolean,
  restartKey: number,
  onAdvance: () => void,
  progressRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!playing) return;

    const animation = progressRef.current?.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: SLIDESHOW_INTERVAL, easing: "linear", fill: "forwards" },
    );
    const timer = window.setTimeout(onAdvance, SLIDESHOW_INTERVAL);

    return () => {
      window.clearTimeout(timer);
      animation?.cancel();
    };
  }, [playing, restartKey, onAdvance, progressRef]);
}
