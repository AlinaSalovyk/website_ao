import type { JSX } from "react";

import { Footer } from "@/components/layout/Footer";
import type { Locale } from "@/i18n";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { MainLayout } from "@/layouts/MainLayout";
import { Education } from "@/routes/institute/sections/Education";
import { GeneralInfo } from "@/routes/institute/sections/GeneralInfo";
import { InstituteHero } from "@/routes/institute/sections/InstituteHero";
import { InstituteLeadership } from "@/routes/institute/sections/InstituteLeadership";
import { ScientificActivity } from "@/routes/institute/sections/ScientificActivity";
import { StudentLife } from "@/routes/institute/sections/StudentLife";

interface InstitutePageProps {
  locale?: Locale;
}

export const InstitutePage = ({
  locale = "uk",
}: InstitutePageProps): JSX.Element => {
  return (
    <LocaleProvider locale={locale}>
      <MainLayout>
        <InstituteHero />
        <GeneralInfo />
        <Education />
        <StudentLife />
        <ScientificActivity />
        <InstituteLeadership />
        <Footer />
      </MainLayout>
    </LocaleProvider>
  );
};
