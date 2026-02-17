import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { HeroWithAbout } from "./sections/HeroWithAbout";
import { EducationalPrograms } from "./sections/EducationalPrograms";
import { Departments } from "./sections/Departments";
import { InstituteLeadership } from "./sections/InstituteLeadership";
import { InnovativeEducation } from "./sections/InnovativeEducation";
import { NewsAndEvents } from "./sections/NewsAndEvents";
import { Footer } from "@/components/layout/Footer";

export const HomePage = (): JSX.Element => {
    return (
        <MainLayout headerPosition="absolute">
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
    );
};