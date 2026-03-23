/**
 * MagneticButton — wrapper that creates a magnetic pull effect.
 * Element subtly moves toward the cursor on hover.
 * Uses CSS transforms for GPU-accelerated movement.
 */
import { useCallback, useRef, type JSX, type ReactNode } from "react";

type MagneticTag = "div" | "button" | "a";

type ElementForTag<T extends MagneticTag> = T extends "div"
  ? HTMLDivElement
  : T extends "button"
    ? HTMLButtonElement
    : HTMLAnchorElement;

interface MagneticButtonProps<T extends MagneticTag = "div"> {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: T;
  [key: string]: unknown;
}

export const MagneticButton = <T extends MagneticTag = "div">({
  children,
  className = "",
  strength = 0.3,
  as,
  ...rest
}: MagneticButtonProps<T>): JSX.Element => {
  const Tag = (as ?? "div") as MagneticTag;
  const elRef = useRef<HTMLElement | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!elRef.current) return;
      const rect = elRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      elRef.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    },
    [strength],
  );

  const handleMouseLeave = useCallback(() => {
    if (!elRef.current) return;
    elRef.current.style.transform = "translate(0, 0)";
  }, []);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        elRef.current = node;
      }}
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
