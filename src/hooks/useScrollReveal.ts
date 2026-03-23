/**
 * useScrollReveal — IntersectionObserver-based scroll reveal hook.
 * Triggers a CSS class toggle when an element enters the viewport.
 * Uses GPU-accelerated transforms for smooth 60fps animations.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
}

export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -60px 0px",
    once = true,
    delay = 0,
  } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            timerRef.current = setTimeout(() => setIsRevealed(true), delay);
          } else {
            setIsRevealed(true);
          }
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsRevealed(false);
        }
      });
    },
    [once, delay],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });
    observer.observe(el);
    return () => {
      clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [handleIntersect, threshold, rootMargin]);

  return { ref, isRevealed };
};
