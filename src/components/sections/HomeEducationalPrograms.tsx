import type { JSX } from "react";

import type { HomeEducationalProgramsData } from "@/components/sections/home-educational-programs.types";
import { PartnersCarousel } from "@/components/sections/PartnersCarousel";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface HomeEducationalProgramsProps {
  data: HomeEducationalProgramsData;
}

export const HomeEducationalPrograms = ({
  data,
}: HomeEducationalProgramsProps): JSX.Element => {
  const {
    sectionId = "educational-programs",
    title,
    specialitiesLabel = "Перелік спеціальностей",
    programs,
  } = data;

  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-heading`}
      className="w-full items-center justify-center px-0 py-20 bg-pure-white flex flex-col"
    >
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9">
        <header className="flex flex-col items-end mb-16 translate-y-[-1rem] animate-fade-in opacity-0 w-full">
          <h2
            id={`${sectionId}-heading`}
            className="font-medium text-pure-black text-3xl md:text-5xl xl:text-7xl 2xl:text-[80px] text-right tracking-[0] leading-tight xl:leading-[80px] w-full"
          >
            {title}
          </h2>
        </header>
        <div className="flex flex-col gap-0">
          {programs.map((program) => (
            <div key={program.id} id={program.id}>
              <Separator className="w-full h-px bg-pure-black" />
              <Card className="border-0 shadow-none rounded-none bg-pure-white">
                <CardContent className="p-0 bg-pure-white">
                  <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_340px] gap-8 py-8">
                    <div className="flex flex-col items-start">
                      <h3 className="font-medium text-pure-black text-xl xl:text-2xl 2xl:text-[28px] tracking-[0] leading-snug xl:leading-[34px] whitespace-nowrap">
                        {program.title}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end justify-between pr-0 lg:pr-10">
                      <div className="flex flex-col items-start w-full max-w-md ml-auto lg:mr-12">
                        <p className="font-normal text-pure-black text-sm tracking-[0] leading-6 mb-2">
                          {specialitiesLabel}
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          {program.specialities.map((speciality) => (
                            <li
                              key={`${program.id}-${speciality.name}`}
                              className="font-normal text-pure-black text-sm tracking-[0] leading-6"
                            >
                              {speciality.link ? (
                                <a
                                  href={speciality.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-blue-600 transition-colors"
                                >
                                  {speciality.name}
                                </a>
                              ) : (
                                <span>{speciality.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-start justify-end">
                      <img
                        className="w-64 xl:w-72 2xl:w-[340px] h-72 xl:h-80 2xl:h-[400px] rounded-lg object-cover"
                        alt={program.title}
                        src={program.image}
                        loading="lazy"
                        decoding="async"
                        width={340}
                        height={400}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <PartnersCarousel />
    </section>
  );
};
