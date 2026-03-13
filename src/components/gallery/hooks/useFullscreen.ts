import { useCallback, useEffect, useState } from "react";

export function useFullscreen(
  targetRef: React.RefObject<HTMLElement | null>,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
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
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, [targetRef]);

  return { isFullscreen, toggle } as const;
}
