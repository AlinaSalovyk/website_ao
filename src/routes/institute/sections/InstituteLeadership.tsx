import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, type JSX } from "react";

import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

interface LeadershipMember {
  id: number;
  name: string;
  role: string;
  email: string;
  officeHours: string;
  image: string;
}

const MEMBER_IMAGES = [
  "/images/InstituteManagement/novoseletskyy.webp",
  "/images/InstituteManagement/shulyk.webp",
  "/images/InstituteManagement/cherniavskyi.webp",
  "/images/InstituteManagement/Kozak.webp",
  "/images/InstituteManagement/novak.webp",
  "/images/InstituteManagement/haletska.webp",
];
const MEMBER_EMAILS = [
  "oleksandr.novoseletskyy@oa.edu.ua",
  "yulia.shulyk@oa.edu.ua",
  "andrii.cherniavskyi@oa.edu.ua",
  "lyudmyla.kozak@oa.edu.ua",
  "anna.novak@oa.edu.ua",
  "dekanat.ekonomichnyi@oa.edu.ua",
];

export const InstituteLeadership = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const leadershipData: LeadershipMember[] = t.instituteLeadership.map(
    (m, i) => ({
      id: i + 1,
      name: m.name,
      role: m.role,
      email: MEMBER_EMAILS[i],
      officeHours: m.officeHours,
      image: MEMBER_IMAGES[i],
    }),
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % leadershipData.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + leadershipData.length) % leadershipData.length,
    );
  };

  const currentMember = leadershipData[currentIndex];

  return (
    // Using a grey background similar to the screenshot
    <section className="w-full bg-white flex flex-col relative pt-20 pb-32 md:pb-48 transition-colors duration-300">
      <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 md:px-9">
        {/* Header - Right Aligned as per grey screenshot */}
        <h2 className="font-bold text-4xl md:text-5xl lg:text-6xl text-black text-right mb-10">
          {t.institute.leadership.heading}
        </h2>
        <Separator className="w-full bg-black/40 h-px mb-16" />

        {/* Content Container */}
        <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16 w-full animate-fade-in">
            {/* Image */}
            <div className="w-full md:w-[350px] aspect-square md:aspect-[4/5] overflow-hidden rounded-xl flex-shrink-0 bg-gray-300 shadow-lg">
              <img
                src={currentMember.image}
                alt={currentMember.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={200}
                height={200}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Text Info */}
            <div className="flex flex-col text-left py-4 flex-1">
              {/* Name */}
              <h3 className="font-bold text-2xl md:text-3xl text-black mb-1">
                {currentMember.name}
              </h3>

              {/* Role */}
              <p className="text-sm md:text-base text-black/80 mb-10 leading-relaxed max-w-lg">
                {currentMember.role}
              </p>

              {/* Contact Info */}
              <div className="flex flex-col gap-6">
                <div>
                  <p className="font-bold text-sm text-black mb-1">
                    {t.institute.leadership.contactInfo}
                  </p>
                  <a
                    href={`mailto:${currentMember.email}`}
                    className="text-sm text-black hover:underline"
                  >
                    e-mail: {currentMember.email}
                  </a>
                </div>

                <div>
                  <p className="font-bold text-sm text-black mb-1">
                    {t.institute.leadership.officeHours}
                  </p>
                  <p className="text-sm text-black">
                    {currentMember.officeHours}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-8 mt-16 md:mt-20">
            <button
              onClick={handlePrev}
              className="p-3 hover:bg-black/10 rounded-full transition-colors group cursor-pointer"
              aria-label="Previous member"
            >
              <ArrowLeft className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="p-3 hover:bg-black/10 rounded-full transition-colors group cursor-pointer"
              aria-label="Next member"
            >
              <ArrowRight className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
