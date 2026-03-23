/**
 * MagneticButton — wrapper that creates a magnetic pull effect.
 * Element subtly moves toward the cursor on hover.
 * Uses CSS transforms for GPU-accelerated movement.
 */
import { useCallback, useRef, type JSX, type ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "div" | "button" | "a";
  [key: string]: unknown;
}

export const MagneticButton = ({
  children,
  className = "",
  strength = 0.3,
  as: Tag = "div",
  ...rest
}: MagneticButtonProps): JSX.Element => {
  const ref = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    },
    [strength],
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0, 0)";
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-magnetic
      {...rest}
    >
      {children}
    </Tag>
  );
};
