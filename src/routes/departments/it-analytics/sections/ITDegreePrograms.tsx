import { DegreePrograms } from "@/components/sections/DegreePrograms";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { getLocalizedDepartmentPrograms } from "@/routes/departments/departments-programs";

export const ITDegreePrograms = ({ locale }: { locale?: Locale }) => {
  const t = getTranslations(locale);
  const programsData = getLocalizedDepartmentPrograms("it", t);
  return <DegreePrograms programsData={programsData} locale={locale} />;
};
