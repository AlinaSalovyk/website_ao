import { DegreePrograms } from "@/components/sections/DegreePrograms";
import { getDepartmentPrograms } from "@/routes/departments/departments-programs";

const programsData = getDepartmentPrograms("management");

export const MMDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
