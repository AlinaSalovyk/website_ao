/**
 * CursorEffects — custom cursor with trailing ring effect and mobile tap ripples.
 * Renders a trailing ring on non-touch (pointer: fine) devices.
 * Renders an expanding tap ripple on touch (mobile/tablet) devices.
 * Uses CSS transforms for GPU-accelerated movement.
 */
import { useEffect, useRef, useState, type JSX } from "react";

export const CursorEffects = (): JSX.Element | null => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [isPointerDevice, setIsPointerDevice] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [taps, setTaps] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    let currentIsPointer = mq.matches;
    setIsPointerDevice(currentIsPointer);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      currentIsPointer = e.matches;
      setIsPointerDevice(e.matches);
    };
    mq.addEventListener("change", handleMediaChange);

    const handleTouchStart = (e: TouchEvent) => {
      if (currentIsPointer) return; // Ignore on PC

      const touch = e.touches[0];
      if (!touch) return;

      const newTap = { id: Date.now(), x: touch.clientX, y: touch.clientY };
      setTaps((prev) => [...prev, newTap]);

      setTimeout(() => {
        setTaps((prev) => prev.filter((t) => t.id !== newTap.id));
      }, 600);
    };

    let rafId = 0;
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let movedOnce = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!currentIsPointer) return;

      if (!movedOnce) {
        movedOnce = true;
        setHasMoved(true);
        ringX = e.clientX;
        ringY = e.clientY;
      }

      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
      }
    };

    const animateRing = () => {
      if (currentIsPointer) {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        if (ringRef.current) {
          ringRef.current.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
        }
      }
      rafId = requestAnimationFrame(animateRing);
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (!currentIsPointer) return;
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-magnetic], [role='button']")) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    rafId = requestAnimationFrame(animateRing);

    return () => {
      mq.removeEventListener("change", handleMediaChange);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Mobile/Tablet Tap Ripple Animation */}
      {!isPointerDevice &&
        taps.map((tap) => (
          <div
            key={tap.id}
            className="fixed z-[9999] pointer-events-none rounded-full border-2 border-blue-500 bg-blue-500/30"
            style={{
              left: tap.x - 25,
              top: tap.y - 25,
              width: 50,
              height: 50,
              animation:
                "ripple-expand 0.6s cubic-bezier(0, 0, 0.2, 1) forwards",
            }}
          />
        ))}

      {/* PC Custom Cursor */}
      {isPointerDevice && (
        <div
          style={{ opacity: hasMoved ? 1 : 0, transition: "opacity 0.2s ease" }}
        >
          <div
            ref={dotRef}
            className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference hidden md:block"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--color-cursor-dot)",
              transition: isHovering ? "width 0.3s, height 0.3s" : "none",
            }}
            aria-hidden="true"
          />
          <div
            ref={ringRef}
            className="fixed top-0 left-0 z-[9998] pointer-events-none mix-blend-difference hidden md:block"
            style={{
              width: isHovering ? 44 : 40,
              height: isHovering ? 44 : 40,
              borderRadius: "50%",
              border: `1.5px solid rgba(255,255,255,${isHovering ? 0.6 : 0.4})`,
              backgroundColor: isHovering
                ? "rgba(255,255,255,0.05)"
                : "transparent",
              transition:
                "width 0.3s ease, height 0.3s ease, border-color 0.3s ease, background-color 0.3s ease",
            }}
            aria-hidden="true"
          />
        </div>
      )}
    </>
  );
};
