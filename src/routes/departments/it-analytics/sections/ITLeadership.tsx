import type { JSX } from "react";
import { Leadership } from "@/components/sections/Leadership";
import type { LeadershipData } from "@/components/sections/leadership.types";

const leadershipData: LeadershipData = {
  title: "Керівництво кафедри",
  members: [
    {
      id: 1,
      name: "Кривицька Ольга Романівна",
      role: "Завідувач кафедри, доктор економічних наук, професор",
      email: "olha.kryvytska@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 16.30",
      image: "/images/IT/kryvytska.jpg",
    },
    {
      id: 2,
      name: "Поручник Сніжана Анатоліївна",
      role: "Старший лаборант",
      email: "kafedra.mmite@oa.edu.ua",
      officeHours: "понеділок - п'ятниця: 8.30 – 16.30",
      image: "/images/IT/poruchnyk.jpg",
    },
  ],
};

export const ITLeadership = (): JSX.Element => {
  return <Leadership data={leadershipData} />;
};
