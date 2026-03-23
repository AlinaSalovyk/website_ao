import type { JSX } from "react";

import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const GeneralInfo = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  return (
    <section
      id="general-info"
      className="w-full bg-white py-24 relative overflow-hidden"
    >
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col">
        {/* Title */}
        <h2 className="font-bold text-4xl md:text-5xl lg:text-6xl text-black mb-12">
          {t.institute.generalInfo.title}
        </h2>

        <Separator className="bg-black/20 h-[1px] w-full mb-12" />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20 items-stretch">
          {/* Left Column: Text Content (Span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-12">
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              {t.institute.generalInfo.subtitle}
            </p>

            {/* Text Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <p className="text-sm md:text-base leading-relaxed text-gray-800">
                {t.institute.generalInfo.paragraph1}
              </p>
              <p className="text-sm md:text-base leading-relaxed text-gray-800">
                {t.institute.generalInfo.paragraph2}
              </p>
            </div>
          </div>

          {/* Right Column: Image (Span 1) */}
          <div className="relative w-full h-full min-h-[400px] lg:min-h-auto rounded-lg overflow-hidden">
            <img
              src="/images/TheInstitute/GeneralInformation.webp"
              alt="General Information"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              width={377}
              height={548}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
