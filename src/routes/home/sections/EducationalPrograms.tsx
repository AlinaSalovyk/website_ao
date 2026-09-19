import { ArrowRight } from "lucide-react";
import { lazy, Suspense, useRef, type JSX } from "react";
import React from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { partnerLogos } from "@/components/icons/PartnerLogos";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const MorphParticles = lazy(() =>
  import("@/components/effects/MorphParticles").then((m) => ({
    default: m.MorphParticles,
  })),
);

interface Specialty {
  name: string;
  link?: string;
}

interface EducationalProgram {
  title: string;
  specialities: Specialty[];
  image: string;
}

export const EducationalPrograms = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const sectionRef = useRef<HTMLElement>(null);
  const bachelorRef = useRef<HTMLDivElement>(null);
  const masterRef = useRef<HTMLDivElement>(null);
  const postgradRef = useRef<HTMLDivElement>(null);

  const images = [
    "/images/EducationalPrograms/BachelorsDegree.webp",
    "/images/EducationalPrograms/Magistracy.webp",
    "/images/EducationalPrograms/PostgraduateStudies.webp"
  ];

  const educationalPrograms: EducationalProgram[] = [
    {
      title: t.educationLevels.bachelor,
      specialities: [
        { name: t.homeSpecialities.bachelor[0], link: "https://vstup.oa.edu.ua/specialnosti/kompyuterni-nauki" },
        { name: t.homeSpecialities.bachelor[1], link: "https://vstup.oa.edu.ua/specialnosti/robotics_and_machine_learning" },
        { name: t.homeSpecialities.bachelor[2], link: "https://vstup.oa.edu.ua/specialnosti/finansi-bankivska-sprava-ta-strahuvannya" },
        { name: t.homeSpecialities.bachelor[3], link: "https://vstup.oa.edu.ua/specialnosti/business_and_trade" },
        { name: t.homeSpecialities.bachelor[4], link: "https://vstup.oa.edu.ua/specialnosti/data-marketing-ta-analitika" },
      ],
      image: images[0],
    },
    {
      title: t.educationLevels.master,
      specialities: [
        { name: t.homeSpecialities.master[0], link: "https://vstup.oa.edu.ua/specialnosti/upravlinnya-proektami" },
        { name: t.homeSpecialities.master[1], link: "https://vstup.oa.edu.ua/specialnosti/finansi-bankivska-sprava-ta-strahuvannya" },
        { name: t.homeSpecialities.master[2], link: "https://vstup.oa.edu.ua/specialnosti/menedzhment-prodazhiv-ta-logistika" },
        { name: t.homeSpecialities.master[3], link: "https://vstup.oa.edu.ua/specialnosti/hr-menedzhment" },
        { name: t.homeSpecialities.master[4], link: "https://vstup.oa.edu.ua/specialnosti/oblik-i-opodatkuvannya" },
      ],
      image: images[1],
    },
    {
      title: t.educationLevels.postgraduate,
      specialities: [
        { name: t.homeSpecialities.postgraduate[0], link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/f1_prykladna_matematyka/" },
        { name: t.homeSpecialities.postgraduate[1], link: "https://www.oa.edu.ua/ua/osvita/ects/info_prog/doc/itb/d3_menedzhment/" },
      ],
      image: images[2],
    },
  ];

  return (
    <section
      id="educational-programs"
      ref={sectionRef}
      className="w-full min-h-screen items-center justify-center px-0 py-20 bg-pure-white flex flex-col relative overflow-hidden"
    >
      <Suspense fallback={null}>
        <MorphParticles
          images={images}
          targetRefs={[bachelorRef, masterRef, postgradRef]}
          sectionRef={sectionRef}
          resolution={2}
          particleSize={1.5}
        />
      </Suspense>

      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9 flex flex-col lg:items-center relative z-10">
        <ScrollReveal variant="fade-up">
          <header className="flex flex-col items-center mb-16 lg:mb-24 w-full text-center relative z-[20]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              {t.home.educationalPrograms.badge}
            </div>
            <h2 className="font-semibold text-pure-black text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] w-full max-w-3xl">
              {t.home.educationalPrograms.heading}
            </h2>
          </header>
        </ScrollReveal>

        <div className="flex flex-col gap-20 lg:gap-32 w-full">
          {educationalPrograms.map((program, index) => {
            const isEven = index % 2 === 0;
            const currentRef = index === 0 ? bachelorRef : index === 1 ? masterRef : postgradRef;

            return (
              <ScrollReveal
                key={index}
                variant="fade-up"
                delay={100}
                className="w-full relative"
              >
                <div
                  className="flex flex-col lg:flex-row gap-8 lg:gap-16 xl:gap-20 items-center lg:items-center w-full"
                >
                  <div
                    className={`w-full max-w-[280px] lg:max-w-none lg:w-4/12 xl:w-3/12 mx-auto relative z-[1] ${!isEven ? "lg:order-2" : ""}`}
                  >
                    <div className="w-full aspect-square rounded-[2rem] shadow-sm bg-gray-50/50 flex items-center justify-center relative border border-gray-100/50 p-3 lg:p-4">
                      <div
                        ref={currentRef}
                        className="w-full h-full rounded-[1.5rem]"
                      />
                    </div>
                  </div>

                  <div
                    className={`w-full lg:w-8/12 xl:w-9/12 flex flex-col justify-center relative z-[20] bg-pure-white/80 backdrop-blur-md lg:backdrop-blur-none lg:bg-transparent rounded-2xl p-4 lg:p-0 ${!isEven ? "lg:order-1" : ""}`}
                  >
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 lg:mb-10 text-pure-black tracking-tight">
                      {program.title}
                    </h3>
                    <div className="flex flex-col border-t border-gray-200 w-full">
                      {program.specialities.map((specialty, idx) => {
                        const Wrapper = specialty.link ? "a" : "div";
                        return (
                          <Wrapper
                            key={idx}
                            href={specialty.link}
                            target={specialty.link ? "_blank" : undefined}
                            rel={specialty.link ? "noopener noreferrer" : undefined}
                            className="group flex items-center justify-between py-5 md:py-6 border-b border-gray-200 hover:border-blue-600 transition-colors cursor-pointer"
                          >
                            <span className="text-pure-black text-sm md:text-base xl:text-lg font-medium leading-relaxed pr-6 group-hover:text-blue-600 transition-colors">
                              {specialty.name}
                            </span>
                            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all shrink-0" />
                          </Wrapper>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      <div className="w-full overflow-hidden mt-24 py-12 bg-pure-white border-t border-gray-100 relative z-[20]">
        <div className="flex items-center gap-16 animate-marquee-seamless">
          {[...Array(6)].map((_, setIndex) => (
            <React.Fragment key={setIndex}>{partnerLogos}</React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};