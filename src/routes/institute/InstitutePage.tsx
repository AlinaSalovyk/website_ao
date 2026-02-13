import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { InstituteHero } from "@/routes/institute/sections/InstituteHero";
import { GeneralInfo } from "@/routes/institute/sections/GeneralInfo";
import { Education } from "@/routes/institute/sections/Education";
import { StudentLife } from "@/routes/institute/sections/StudentLife";
import { ScientificActivity } from "@/routes/institute/sections/ScientificActivity";
import { InstituteLeadership } from "@/routes/institute/sections/InstituteLeadership";
import { Footer } from "@/components/layout/Footer";

export const InstitutePage = (): JSX.Element => {
    return (
        <MainLayout>
            <InstituteHero />
            <GeneralInfo />
            <Education />
            <StudentLife />
            <ScientificActivity />
            <InstituteLeadership />
            <Footer />
        </MainLayout>
    );
};
