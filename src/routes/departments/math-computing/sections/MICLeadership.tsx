import type { JSX } from "react";

import { Leadership } from "@/components/sections/Leadership";
import type { LeadershipData } from "@/components/sections/leadership.types";

const leadershipData: LeadershipData = {
  title: "Керівництво кафедри",
  members: [
    {
      id: 1,
      name: "Нікітін Анатолій Володимирович",
      role: "Завідувач кафедри, доктор фізико-математичних наук, професор",
      email: "anatolii.nikitin@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 16.30",
      image: "/images/InstituteManagement/nikitin.jpg",
    },
    {
      id: 2,
      name: "Ясінська Яніна Сергіївна",
      role: "Старший лаборант",
      email: "kafedra.mio@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 12.30",
      image: "/images/InstituteManagement/yasinska_ya.jpg",
    },
  ],
};

export const MICLeadership = (): JSX.Element => {
  return <Leadership data={leadershipData} />;
};
