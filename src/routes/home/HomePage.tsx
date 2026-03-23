import type { JSX } from "react";

import { Footer } from "@/components/layout/Footer";
import type { Locale } from "@/i18n";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { MainLayout } from "@/layouts/MainLayout";
import { Departments } from "@/routes/home/sections/Departments";
import { EducationalPrograms } from "@/routes/home/sections/EducationalPrograms";
import { HeroWithAbout } from "@/routes/home/sections/HeroWithAbout";
import { InnovativeEducation } from "@/routes/home/sections/InnovativeEducation";
import { InstituteLeadership } from "@/routes/home/sections/InstituteLeadership";
import { NewsAndEvents } from "@/routes/home/sections/NewsAndEvents";

interface HomePageProps {
  locale?: Locale;
}

export const HomePage = ({ locale = "uk" }: HomePageProps): JSX.Element => {
  return (
    <LocaleProvider locale={locale}>
      <MainLayout headerPosition="absolute" locale={locale}>
        {/* Section 1: Hero with About */}
        <HeroWithAbout />

        {/* Section 2: Educational Programs */}
        <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
          <EducationalPrograms />
        </section>

        {/* Section 3: Departments */}
        <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
          <Departments />
        </section>

        {/* Section 4: Institute Leadership */}
        <InstituteLeadership />

        {/* Section 5: Innovative Education */}
        <InnovativeEducation />

        {/* Section 6: News and Events */}
        <NewsAndEvents />

        {/* Footer */}
        <Footer />
      </MainLayout>
    </LocaleProvider>
  );
};
