import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { FBHeroWithAbout } from "./finance-business/sections/FBHeroWithAbout";
import { FBEducationalPrograms } from "./finance-business/sections/FBEducationalPrograms";
import { FBDegreePrograms } from "./finance-business/sections/FBDegreePrograms";
import { FBLeadership } from "./finance-business/sections/FBLeadership";
import { FBScientificActivity } from "./finance-business/sections/FBScientificActivity";
import { FBNewsAndEvents } from "./finance-business/sections/FBNewsAndEvents";
import { Footer } from "@/components/layout/Footer";

export const FBDepartmentPage = (): JSX.Element => {
    return (
        <MainLayout headerPosition="absolute">
            {/* Section 1: Hero with About */}
            <FBHeroWithAbout />

            {/* Section 2: Educational Programs */}
            <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                <FBEducationalPrograms />
            </section>

            {/* Section 3: Degree Programs List */}
            <FBDegreePrograms />

            {/* Section 4: Leadership */}
            <FBLeadership />

            {/* Section 4: Scientific Activity */}
            <FBScientificActivity />

            {/* Section 5: News and Events */}
            <FBNewsAndEvents />

            {/* Footer */}
            <Footer />
        </MainLayout>
    );
};
