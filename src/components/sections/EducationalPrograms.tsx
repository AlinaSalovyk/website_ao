import type { JSX } from "react";

import { PartnersCarousel } from "@/components/sections/PartnersCarousel";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { EducationalProgramsData } from "./educational-programs.types";

interface EducationalProgramsProps {
  data: EducationalProgramsData;
}

const titleAlignClasses: Record<"left" | "right", string> = {
  left: "text-left",
  right: "self-end text-right",
};

export const EducationalPrograms = ({
  data,
}: EducationalProgramsProps): JSX.Element => {
  const {
    sectionId = "general-info",
    title,
    titleAlign = "right",
    introText,
    columns,
    image,
  } = data;

  return (
    <section
      id={sectionId}
      className="w-full items-center justify-center px-0 py-20 bg-pure-white flex flex-col"
    >
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9">
        <header className="flex flex-col items-start mb-8 animate-fade-in opacity-0">
          <h2
            className={cn(
              "font-medium text-pure-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-[72px] tracking-[0] leading-tight xl:leading-[86px] whitespace-normal xl:whitespace-nowrap",
              titleAlignClasses[titleAlign],
            )}
          >
            {title}
          </h2>
        </header>

        <Separator className="w-full h-px bg-pure-black mb-16" />

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[500px_1fr] gap-10 lg:gap-20 mb-20">
          <div className="w-full md:w-2/3 lg:w-full mx-auto lg:mx-0 h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden">
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              width={image.width ?? 564}
              height={image.height ?? 681}
            />
          </div>

          <div className="flex flex-col gap-12">
            <p className="text-pure-black/50 text-lg md:text-xl lg:text-2xl leading-relaxed">
              {introText}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {columns.map((text, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <p className="text-pure-black text-sm md:text-base leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PartnersCarousel />
    </section>
  );
};
