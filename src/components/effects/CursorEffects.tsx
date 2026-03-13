/**
 * CursorEffects — custom cursor with trailing ring effect.
 * Only renders on non-touch (pointer: fine) devices.
 * Uses CSS transforms for GPU-accelerated movement.
 */
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

export const CursorEffects = (): JSX.Element | null => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse)
    const mq = window.matchMedia("(pointer: fine)");
    setIsPointerDevice(mq.matches);
    if (!mq.matches) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
      }
    };

    // Smooth trailing ring via rAF
    let rafId = 0;
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    // Detect hover on interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-magnetic], [role='button']")) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    rafId = requestAnimationFrame(animateRing);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isPointerDevice) return null;

  return (
    <>
      {/* Cursor dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "var(--color-cursor-dot)",
          transition: isHovering ? "width 0.3s, height 0.3s" : "none",
        }}
        aria-hidden="true"
      />
      {/* Trailing ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none mix-blend-difference"
        style={{
          width: isHovering ? 50 : 40,
          height: isHovering ? 50 : 40,
          borderRadius: "50%",
          border: `1.5px solid rgba(255,255,255,${isHovering ? 0.8 : 0.4})`,
          transition: "width 0.3s ease, height 0.3s ease, border-color 0.3s ease",
        }}
        aria-hidden="true"
      />
    </>
  );
};
