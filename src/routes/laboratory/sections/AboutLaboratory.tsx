import { type JSX } from "react";

import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const AboutLaboratory = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);
  return (
    <section className="w-full bg-pure-white text-pure-black pt-20 pb-10 2xl:pt-24 2xl:pb-12">
      <div className="container mx-auto px-4 md:px-9 flex flex-col">
        {/* Header */}
        <div className="flex justify-end mb-16 md:mb-24 border-b border-pure-black pb-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-bold">
            {t.laboratory.about.title}
          </h2>
        </div>

        {/* Content Block 1: Problems and Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-pure-black pb-16 md:pb-24 mb-16 md:mb-24">
          <div className="lg:col-span-4">
            <h3 className="text-2xl md:text-3xl font-bold">
              {t.laboratory.about.problems}
            </h3>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base md:text-lg leading-relaxed">
              {t.laboratory.about.problemsText}
            </p>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/images/EducationalPrograms/BachelorsDegree.webp"
                alt={t.laboratory.about.imageAlts.problems}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={340}
                height={400}
              />
            </div>
          </div>
        </div>

        {/* Content Block 2: Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-pure-black pb-16 md:pb-24 mb-16 md:mb-24">
          <div className="lg:col-span-4">
            <h3 className="text-2xl md:text-3xl font-bold">
              {t.laboratory.about.architecture}
            </h3>
          </div>
          <div className="lg:col-span-5">
            <ul className="list-disc pl-5 space-y-6 text-base md:text-lg leading-relaxed">
              {t.laboratory.about.architectureItems.map((item, index) => (
                <li key={index}>
                  <strong>{item.title}</strong>
                  <br /> {item.description}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/images/EducationalPrograms/Magistracy.webp"
                alt={t.laboratory.about.imageAlts.architecture}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={340}
                height={400}
              />
            </div>
          </div>
        </div>

        {/* Content Block 3: Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-16 md:pb-24">
          <div className="lg:col-span-4">
            <h3 className="text-2xl md:text-3xl font-bold">
              {t.laboratory.about.examples}
            </h3>
          </div>
          <div className="lg:col-span-5">
            <ul className="list-disc pl-5 space-y-2 text-base md:text-lg leading-relaxed">
              {t.laboratory.about.exampleItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <div className="mt-8 italic text-sm md:text-base text-black">
              <p style={{ whiteSpace: "pre-line" }}>
                {t.laboratory.about.disclaimer}
              </p>
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/images/EducationalPrograms/PostgraduateStudies.webp"
                alt={t.laboratory.about.imageAlts.examples}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={340}
                height={400}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
