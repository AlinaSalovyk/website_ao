import { useCallback, useEffect, useState, type RefObject } from "react";

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Element fullscreen is missing on some browsers (e.g. iPhone Safari)
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(Boolean(document.fullscreenEnabled));
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      targetRef.current
        ?.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, [targetRef]);

  return { isFullscreen, isSupported, toggle } as const;
}
