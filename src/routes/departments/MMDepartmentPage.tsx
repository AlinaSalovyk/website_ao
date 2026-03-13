import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { MMHeroWithAbout } from "./management-marketing/sections/MMHeroWithAbout";
import { MMEducationalPrograms } from "./management-marketing/sections/MMEducationalPrograms";
import { MMDegreePrograms } from "./management-marketing/sections/MMDegreePrograms";
import { MMLeadership } from "./management-marketing/sections/MMLeadership";
import { MMScientificActivity } from "./management-marketing/sections/MMScientificActivity";
import { MMNewsAndEvents } from "./management-marketing/sections/MMNewsAndEvents";
import { Footer } from "@/components/layout/Footer";

export const MMDepartmentPage = (): JSX.Element => {
    return (
        <MainLayout headerPosition="absolute">
            {/* Section 1: Hero with About */}
            <MMHeroWithAbout />

            {/* Section 2: Educational Programs */}
            <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                <MMEducationalPrograms />
            </section>

            {/* Section 3: Degree Programs List */}
            <MMDegreePrograms />

            {/* Section 4: Leadership */}
            <MMLeadership />

            {/* Section 4: Scientific Activity */}
            <MMScientificActivity />

            {/* Section 5: News and Events */}
            <MMNewsAndEvents />

            {/* Footer */}
            <Footer />
        </MainLayout>
    );
};
