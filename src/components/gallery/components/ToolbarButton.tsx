import type { ReactNode } from "react";

export function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="cursor-pointer rounded p-2 text-white/85 transition-colors hover:text-white"
    >
      {children}
    </button>
  );
}
