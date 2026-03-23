/**
 * MagneticButton — wrapper that creates a magnetic pull effect.
 * Element subtly moves toward the cursor on hover.
 * Uses CSS transforms for GPU-accelerated movement.
 */
import {
  useCallback,
  useRef,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
} from "react";

type MagneticTag = "div" | "button" | "a";

type MagneticButtonProps<T extends MagneticTag = "div"> = {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "children" | "className">;

export const MagneticButton = <T extends MagneticTag = "div">({
  children,
  className = "",
  strength = 0.3,
  as,
  ...rest
}: MagneticButtonProps<T>): JSX.Element => {
  const tag = as ?? "div";
  const elRef = useRef<HTMLElement | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
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

  if (tag === "button") {
    const buttonProps = rest as Omit<
      ComponentPropsWithoutRef<"button">,
      "children" | "className"
    >;
    return (
      <button
        ref={(node: HTMLButtonElement | null) => {
          elRef.current = node;
        }}
        className={`transition-transform duration-300 ease-out ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        data-magnetic
        {...buttonProps}
      >
        {children}
      </button>
    );
  }

  if (tag === "a") {
    const anchorProps = rest as Omit<
      ComponentPropsWithoutRef<"a">,
      "children" | "className"
    >;
    return (
      <a
        ref={(node: HTMLAnchorElement | null) => {
          elRef.current = node;
        }}
        className={`transition-transform duration-300 ease-out ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        data-magnetic
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  const divProps = rest as Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "className"
  >;
  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        elRef.current = node;
      }}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-magnetic
      {...divProps}
    >
      {children}
    </div>
  );
};
