import { DegreePrograms } from "@/components/sections/DegreePrograms";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { getLocalizedDepartmentPrograms } from "@/routes/departments/departments-programs";

export const MICDegreePrograms = ({ locale }: { locale?: Locale }) => {
  const t = getTranslations(locale);
  const programsData = getLocalizedDepartmentPrograms("math", t);
  return <DegreePrograms programsData={programsData} locale={locale} />;
};
