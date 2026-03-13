import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { MICHeroWithAbout } from "./math-computing/sections/MICHeroWithAbout";
import { MICEducationalPrograms } from "./math-computing/sections/MICEducationalPrograms";
import { MICDegreePrograms } from "./math-computing/sections/MICDegreePrograms";
import { MICLeadership } from "./math-computing/sections/MICLeadership";
import { MICScientificActivity } from "./math-computing/sections/MICScientificActivity";
import { MICNewsAndEvents } from "./math-computing/sections/MICNewsAndEvents";
import { Footer } from "@/components/layout/Footer";

export const MICDepartmentPage = (): JSX.Element => {
    return (
        <MainLayout headerPosition="absolute">
            {/* Section 1: Hero with About */}
            <MICHeroWithAbout />

            {/* Section 2: Educational Programs */}
            <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                <MICEducationalPrograms />
            </section>

            {/* Section 3: Degree Programs List */}
            <MICDegreePrograms />

            {/* Section 4: Leadership */}
            <MICLeadership />

            {/* Section 4: Scientific Activity */}
            <MICScientificActivity />

            {/* Section 5: News and Events */}
            <MICNewsAndEvents />

            {/* Footer */}
            <Footer />
        </MainLayout>
    );
};
