import { DegreePrograms } from "@/components/sections/DegreePrograms";
import { getDepartmentPrograms } from "@/routes/departments/departments-programs";

const programsData = getDepartmentPrograms("math");

export const MICDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
