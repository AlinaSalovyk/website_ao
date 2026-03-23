import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { DepartmentSelector } from "@/components/sections/DepartmentSelector";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { getDepartments } from "@/routes/departments/departments-programs";

export const Departments = ({ locale }: { locale?: Locale }) => {
  const t = getTranslations(locale);
  return (
    <section className="w-full bg-layout-bg pt-24 pb-24 lg:pt-32 lg:pb-32 flex items-start justify-center relative overflow-hidden">
      <div className="absolute top-96 lg:top-48 -right-24 lg:right-10 xl:right-32 2xl:right-48 w-96 h-96 scale-150 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute top-48 lg:top-36 right-24 lg:right-72 xl:right-96 2xl:right-1/3 w-64 h-64 scale-150 bg-purple-600/10 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 relative z-10">
        <ScrollReveal variant="fade-up" className="w-full">
          <DepartmentSelector
            departments={getDepartments(t)}
            heading={t.home.departments.heading}
            locale={locale}
          />
        </ScrollReveal>
      </div>
    </section>
  );
};
