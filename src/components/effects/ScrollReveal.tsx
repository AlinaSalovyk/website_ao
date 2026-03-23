/**
 * ScrollReveal — wrapper component for scroll-triggered animations.
 * Supports multiple animation variants with configurable delays.
 */
import type { CSSProperties, JSX, ReactNode } from "react";

import {
  useScrollReveal,
  type ScrollRevealOptions,
} from "@/hooks/useScrollReveal";

export type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "zoom-out"
  | "flip-up";

interface ScrollRevealProps extends ScrollRevealOptions {
  children: ReactNode;
  variant?: RevealVariant;
  duration?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const VARIANT_STYLES: Record<
  RevealVariant,
  { hidden: CSSProperties; visible: CSSProperties }
> = {
  "fade-up": {
    hidden: { opacity: 0, transform: "translateY(40px)" },
    visible: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-down": {
    hidden: { opacity: 0, transform: "translateY(-40px)" },
    visible: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-left": {
    hidden: { opacity: 0, transform: "translateX(-40px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
  "fade-right": {
    hidden: { opacity: 0, transform: "translateX(40px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
  "zoom-in": {
    hidden: { opacity: 0, transform: "scale(0.9)" },
    visible: { opacity: 1, transform: "scale(1)" },
  },
  "zoom-out": {
    hidden: { opacity: 0, transform: "scale(1.1)" },
    visible: { opacity: 1, transform: "scale(1)" },
  },
  "flip-up": {
    hidden: {
      opacity: 0,
      transform: "perspective(600px) rotateX(15deg) translateY(20px)",
    },
    visible: {
      opacity: 1,
      transform: "perspective(600px) rotateX(0deg) translateY(0)",
    },
  },
};

export const ScrollReveal = ({
  children,
  variant = "fade-up",
  duration = 700,
  className = "",
  delay = 0,
  threshold,
  rootMargin,
  once = true,
}: ScrollRevealProps): JSX.Element => {
  const { ref, isRevealed } = useScrollReveal({
    threshold,
    rootMargin,
    once,
    delay,
  });
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(isRevealed ? styles.visible : styles.hidden),
        transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1), transform ${duration}ms cubic-bezier(0.16,1,0.3,1)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
};
