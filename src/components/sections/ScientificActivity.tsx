import type { JSX } from "react";

import type { ScientificActivityData } from "@/components/sections/scientific-activity.types";
import { Separator } from "@/components/ui/separator";

interface ScientificActivityProps {
  data: ScientificActivityData;
}

const headingVariantClasses: Record<"compact" | "display", string> = {
  compact:
    "font-medium text-pure-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-[72px] tracking-[0] leading-tight xl:leading-[86px] whitespace-normal md:whitespace-nowrap self-end text-right",
  display:
    "font-medium text-pure-black text-4xl md:text-5xl lg:text-7xl xl:text-8xl 2xl:text-[132px] tracking-[0] leading-tight xl:leading-[144px] whitespace-normal md:whitespace-nowrap uppercase",
};

const contentSpacingClasses: Record<"my" | "mt", string> = {
  my: "my-16",
  mt: "mt-16",
};

const imageFitClasses: Record<"cover" | "contain", string> = {
  cover: "object-cover",
  contain: "object-contain",
};

export const ScientificActivity = ({
  data,
}: ScientificActivityProps): JSX.Element => {
  const {
    sectionId,
    title,
    description,
    image,
    headingVariant = "display",
    contentSpacing = "my",
    imageFit = "cover",
  } = data;

  return (
    <section
      id={sectionId}
      className="w-full bg-pure-white flex flex-col relative overflow-hidden"
    >
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 pt-20 pb-32 md:pb-48">
        <header className="flex flex-col items-start relative w-full gap-8 translate-y-[-1rem] animate-fade-in opacity-0">
          <h2 className={headingVariantClasses[headingVariant]}>{title}</h2>
          <Separator className="w-full bg-separator-gray h-px" />
        </header>

        <div
          className={`flex flex-col lg:flex-row items-center gap-10 lg:gap-20 ${contentSpacingClasses[contentSpacing]}`}
        >
          <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3">
            <img
              src={image.src}
              alt={image.alt}
              className={`w-full h-auto rounded-lg aspect-[4/3] ${imageFitClasses[imageFit]}`}
              loading="lazy"
              decoding="async"
              width={image.width ?? 684}
              height={image.height ?? 672}
            />
          </div>
          <div className="w-full lg:w-3/5">
            <p className="font-normal text-pure-black text-lg xl:text-xl 2xl:text-3xl tracking-[0] leading-relaxed xl:leading-10">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
