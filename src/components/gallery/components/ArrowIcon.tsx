import type { JSX } from "react";

import { cn } from "@/lib/utils";

export function ArrowIcon({
  direction,
}: {
  direction: "left" | "right";
}): JSX.Element {
  const isLeft = direction === "left";
  return (
    <svg
      width="42"
      height="14"
      viewBox="0 0 42 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "h-auto text-black opacity-90",
        isLeft
          ? "w-[20px] xl:w-[38px] 2xl:w-[36px]"
          : "w-[40px] xl:w-[48px] 2xl:w-[36px]",
      )}
      aria-hidden="true"
    >
      <path
        d={isLeft ? "M42 7H2M2 7L8 1M2 7L8 13" : "M0 7H40M40 7L34 1M40 7L34 13"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
