/**
 * AnimatedCounter — counts up from 0 to target value when scrolled into view.
 * Supports numeric targets with suffix (e.g., "500+" → counts to 500, then shows "+").
 */
import { useEffect, useState, type JSX } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface AnimatedCounterProps {
  value: string;        // e.g. "500+", "#1", "30+"
  duration?: number;    // animation duration in ms
  className?: string;
}

export const AnimatedCounter = ({
  value,
  duration = 2000,
  className = "",
}: AnimatedCounterProps): JSX.Element => {
  const { ref, isRevealed } = useScrollReveal({ threshold: 0.3, once: true });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!isRevealed) return;

    // Parse numeric portion and suffix
    const match = value.match(/^(#?)(\d+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1];
    const target = parseInt(match[2], 10);
    const suffix = match[3];
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      setDisplayValue(`${prefix}${current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isRevealed, value, duration]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
};
