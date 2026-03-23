import type { JSX } from "react";

import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const StudentLife = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  return (
    <section
      id="student-life"
      className="w-full bg-white py-24 overflow-hidden"
    >
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col">
        {/* Section Title */}
        <div className="flex justify-end mb-16 md:mb-24 border-b border-black pb-4">
          <h2 className="font-bold text-4xl md:text-5xl lg:text-6xl text-black text-right">
            {t.institute.studentLife.title}
          </h2>
        </div>

        <div className="flex flex-col gap-8 lg:gap-12">
          {/* Row 1: Text Left, Image Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="order-2 lg:order-1 flex flex-col gap-6">
              <p className="text-base md:text-lg leading-relaxed text-gray-800">
                {t.institute.studentLife.paragraph1}
              </p>
            </div>
            <div className="order-1 lg:order-2 w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
              {/* Placeholder generic student image */}
              <img
                src="/images/TheInstitute/StudentLife.webp"
                alt={t.institute.studentLife.imageAlts.studentsWorkingTogether}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={4096}
                height={2731}
              />
            </div>
          </div>

          {/* Row 2: Image Left, Text Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="order-1 w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
              {/* Placeholder generic laptop image */}
              <img
                src="/images/TheInstitute/Pexels.webp"
                alt={t.institute.studentLife.imageAlts.studentWorkingOnLaptop}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={4096}
                height={2731}
              />
            </div>
            <div className="order-2 flex flex-col gap-6">
              <p className="text-sm md:text-base leading-relaxed text-gray-800">
                {t.institute.studentLife.paragraph2}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
