import type { JSX } from "react";
import { Leadership } from "@/components/sections/Leadership";
import type { LeadershipData } from "@/components/sections/leadership.types";

const leadershipData: LeadershipData = {
  title: "Керівництво кафедри",
  members: [
    {
      id: 1,
      name: "Шулик Юлія Віталіївна",
      role: "Завідувач кафедри, кандидат економічних наук, доцент кафедри фінансів та бізнесу",
      email: "yulia.shulyk@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 16.30",
      image: "/images/InstituteManagement/shulyk.jpg",
    },
    {
      id: 2,
      name: "Гонтар Мирослава Валеріївна",
      role: "Методист кафедри",
      email: "kafedra.finansiv@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 16.30",
      image: "/images/InstituteManagement/hontar.jpg",
    },
  ],
};

export const FBLeadership = (): JSX.Element => {
  return <Leadership data={leadershipData} />;
};
