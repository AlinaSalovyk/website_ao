import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { ITHeroWithAbout } from "./it-analytics/sections/ITHeroWithAbout";
import { ITEducationalPrograms } from "./it-analytics/sections/ITEducationalPrograms";
import { ITDegreePrograms } from "./it-analytics/sections/ITDegreePrograms";
import { ITLeadership } from "./it-analytics/sections/ITLeadership";
import { ITScientificActivity } from "./it-analytics/sections/ITScientificActivity";
import { ITNewsAndEvents } from "./it-analytics/sections/ITNewsAndEvents";
import { Footer } from "@/components/layout/Footer";

export const ITDepartmentPage = (): JSX.Element => {
    return (
        <MainLayout>
            {/* Section 1: Hero with About */}
            <ITHeroWithAbout />

            {/* Section 2: Educational Programs */}
            <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                <ITEducationalPrograms />
            </section>

            {/* Section 3: Degree Programs List */}
            <ITDegreePrograms />

            {/* Section 4: Leadership */}
            <ITLeadership />

            {/* Section 4: Scientific Activity */}
            <ITScientificActivity />

            {/* Section 5: News and Events */}
            <ITNewsAndEvents />

            {/* Footer */}
            <Footer />
        </MainLayout>
    );
};
