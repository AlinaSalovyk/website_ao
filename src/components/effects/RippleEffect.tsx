/**
 * RippleEffect — Material-style click ripple.
 * Wraps children with a relative container and spawns
 * expanding circles on click using CSS animations.
 */
import { useCallback, useRef, useState, type JSX, type ReactNode } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleEffectProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export const RippleEffect = ({
  children,
  className = "",
  color = "rgba(255, 255, 255, 0.3)",
}: RippleEffectProps): JSX.Element => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = ++rippleIdRef.current;

    setRipples((prev) => [...prev, { id, x, y, size }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-[ripple-expand_0.6s_ease-out_forwards]"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
};
