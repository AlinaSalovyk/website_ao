import { DegreePrograms } from "@/components/sections/DegreePrograms";
import { getDepartmentPrograms } from "@/routes/departments/departments-programs";

const programsData = getDepartmentPrograms("it");

export const ITDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
