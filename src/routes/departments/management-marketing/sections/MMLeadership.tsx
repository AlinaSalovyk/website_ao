import type { JSX } from "react";

import { Leadership } from "@/components/sections/Leadership";
import type { LeadershipData } from "@/components/sections/leadership.types";

const leadershipData: LeadershipData = {
  title: "Керівництво кафедри",
  members: [
    {
      id: 1,
      name: "Козак Людмила Василівна",
      role: "Завідувач кафедри, доктор економічних наук, доцент кафедри економічної теорії, менеджменту і маркетингу",
      email: "lyudmyla.kozak@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 16.30",
      image: "/images/InstituteManagement/Kozak.webp",
    },
    {
      id: 2,
      name: "Фоміних Мар’яна Василівна",
      role: "Методист кафедри",
      email: "kafedra.et@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 16.30",
      image: "/images/InstituteManagement/fominyh.webp",
    },
  ],
};

export const MMLeadership = (): JSX.Element => {
  return <Leadership data={leadershipData} />;
};
