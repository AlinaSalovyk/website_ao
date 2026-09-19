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
  disabled?: boolean;
}

export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const {
    threshold = 0,
    rootMargin = "0px 0px 100px 0px",
    once = true,
    delay = 0,
    disabled = false,
  } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(disabled);
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
    if (disabled) {
      setIsRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // Fallback if IntersectionObserver is not supported or reduced motion is preferred
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsRevealed(true);
      return;
    }

    // Check if element is already in or near viewport on mount
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top <= vh + 100 && rect.bottom >= -100) {
      if (delay > 0) {
        timerRef.current = setTimeout(() => setIsRevealed(true), delay);
      } else {
        setIsRevealed(true);
      }
      if (once) {
        // Already revealed on mount, no need to observe
        return () => clearTimeout(timerRef.current);
      }
    }

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });
    observer.observe(el);
    return () => {
      clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [disabled, handleIntersect, threshold, rootMargin, delay, once]);

  return { ref, isRevealed: disabled || isRevealed };
};
