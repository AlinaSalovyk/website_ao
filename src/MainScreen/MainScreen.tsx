import { AboutSection } from "./sections/AboutSection/AboutSection";
import { EducationalProgramsSection } from "./sections/EducationalProgramsSection/EducationalProgramsSection";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { InnovationStatsSection } from "./sections/InnovationStatsSection/InnovationStatsSection";
import { InstituteLeadershipSection } from "./sections/InstituteLeadershipSection.tsx/InstituteLeadershipSection";
import { LandingHeroSection } from "./sections/LandingHeroSection/LandingHeroSection";
import { NewsAndEventsSection } from "./sections/NewsAndEventsSection/NewsAndEventsSection";
import type { JSX } from "react";
import { MainLayout } from "../layouts/MainLayout";

export const MainScreen = (): JSX.Element => {
  return (
    <MainLayout>
      {/* Section 1: Landing Hero - Title only */}
      <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
        <LandingHeroSection />
      </section>

      {/* Section 2: About - Tags + Description + Image */}
      <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <AboutSection />
      </section>

      <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
        <InnovationStatsSection />
      </section>

      <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <HeroSection />
      </section>

      <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
        <NewsAndEventsSection />
      </section>

      <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
        <EducationalProgramsSection />
      </section>

      <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1000ms] flex-1 flex flex-col">
        <InstituteLeadershipSection />
      </section>
    </MainLayout>
  );
};