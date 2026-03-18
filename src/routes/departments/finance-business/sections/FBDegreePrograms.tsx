import { DegreePrograms } from "@/components/sections/DegreePrograms";
import { getDepartmentPrograms } from "@/routes/departments/departments-programs";

const programsData = getDepartmentPrograms("finance");

export const FBDegreePrograms = () => {
  return <DegreePrograms programsData={programsData} />;
};
