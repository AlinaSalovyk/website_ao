import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
} from "@/components/icons/social";

interface LeadershipMember {
  id: number;
  name: string;
  role: string;
  email: string;
  officeHours: string;
  image: string;
}

const leadershipData: LeadershipMember[] = [
  {
    id: 1,
    name: "Новоселецький Олександр Миколайович",
    role: "Директор Інституту ІТ та бізнесу, кандидат економічних наук, доцент кафедри інформаційних технологій та аналітики даних",
    email: "oleksandr.novoseletskyy@oa.edu.ua",
    officeHours:
      "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
    image: "/images/InstituteManagement/novoseletskyy.jpg",
  },
  {
    id: 2,
    name: "Шулик Юлія Віталіївна",
    role: "Заступник директора з навчально-наукової роботи, кандидат економічних наук, доцент, завідувач кафедри фінансів та бізнесу",
    email: "yulia.shulyk@oa.edu.ua",
    officeHours: "понеділок-п'ятниця: 8.30-17.30, обідня перерва 12.30-13.30",
    image: "/images/InstituteManagement/shulyk.jpg",
  },
  {
    id: 3,
    name: "Чернявський Андрій Володимирович",
    role: "Заступник директора з навчально-виховної роботи, викладач кафедри інформаційних технологій та аналітики даних",
    email: "andrii.cherniavskyi@oa.edu.ua",
    officeHours:
      "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
    image: "/images/InstituteManagement/cherniavskyi.jpg",
  },
  {
    id: 4,
    name: "Козак Людмила Василівна",
    role: "Заступник директора з питань якості освіти, доктор економічних наук, доцент кафедри менеджменту та маркетингу",
    email: "lyudmyla.kozak@oa.edu.ua",
    officeHours:
      "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
    image: "/images/InstituteManagement/Kozak.jpg",
  },
  {
    id: 5,
    name: "Новак Анна Федорівна",
    role: "Заступник директора з профорієнтаційної роботи, викладач кафедри фінансів та бізнесу",
    email: "anna.novak@oa.edu.ua",
    officeHours:
      "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
    image: "/images/InstituteManagement/novak.jpg",
  },
  {
    id: 6,
    name: "Галецька Тамара Володимирівна",
    role: "Старший лаборант",
    email: "dekanat.ekonomichnyi@oa.edu.ua",
    officeHours:
      "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
    image: "/images/InstituteManagement/haletska.jpg",
  },
];

export const InstituteLeadership = (): JSX.Element => {
  return (
    <section
      id="leadership"
      className="w-full bg-white flex flex-col relative py-20"
    >
      <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 md:px-9">
        {/* Header */}
        <h2 className="font-bold text-4xl md:text-5xl lg:text-[60px] text-black text-right mb-10 tracking-tight">
          Керівництво інституту
        </h2>
        <Separator className="w-full bg-black/40 h-px mb-16" />

        {/* Grid Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 lg:gap-x-32 gap-y-16 lg:gap-y-24 w-full lg:px-12 xl:px-20">
          {leadershipData.map((member) => (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row items-start gap-6 lg:gap-10 w-full group"
            >
              {/* Image */}
              <div className="w-full sm:w-[220px] h-[280px] overflow-hidden rounded-[20px] flex-shrink-0 bg-gray-200">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover grayscale-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/220x280?text=No+Image";
                  }}
                />
              </div>

              {/* Text Info */}
              <div className="flex flex-col text-left py-2 flex-1 h-full">
                {/* Name */}
                <h3 className="font-bold text-[15px] md:text-[17px] text-black mb-1.5">
                  {member.name}
                </h3>

                {/* Role */}
                <p className="text-[10px] md:text-[11px] text-black max-w-[320px] leading-snug mb-10 font-medium">
                  {member.role}
                </p>

                {/* Contact Info */}
                <div className="flex flex-col mb-8 mt-auto">
                  <p className="text-[11px] md:text-[12px] text-black mb-0.5">
                    Контактна інформація:
                  </p>
                  <a
                    href={`mailto:${member.email}`}
                    className="text-[11px] md:text-[12px] text-black hover:underline"
                  >
                    e-mail: {member.email}
                  </a>
                </div>

                {/* Social Links */}
                <div className="flex gap-4 lg:gap-6 mt-auto">
                  <a
                    href="#"
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-pure-black flex items-center justify-center transition-all hover:bg-pure-black group/social"
                  >
                    <div className="w-9 h-9 lg:w-20 lg:h-30 group-hover/social:invert group-hover/social:brightness-0 group-hover/social:filter transition-all flex items-center justify-center translate-y-[1px]">
                      <InstagramIcon
                        iconColor="fill-pure-black"
                        borderColor="fill-transparent"
                        iconSize="size-full"
                      />
                    </div>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-pure-black flex items-center justify-center transition-all hover:bg-pure-black group/social"
                  >
                    <div className="w-9 h-9 lg:w-20 lg:h-30 group-hover/social:invert group-hover/social:brightness-0 group-hover/social:filter transition-all flex items-center justify-center translate-y-[1px]">
                      <FacebookIcon
                        iconColor="fill-pure-black"
                        borderColor="fill-transparent"
                        iconSize="size-full"
                      />
                    </div>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-pure-black flex items-center justify-center transition-all hover:bg-pure-black group/social"
                  >
                    <div className="w-9 h-9 lg:w-20 lg:h-30 group-hover/social:invert group-hover/social:brightness-0 group-hover/social:filter transition-all flex items-center justify-center translate-y-[1px]">
                      <LinkedInIcon
                        iconColor="fill-pure-black"
                        borderColor="fill-transparent"
                        iconSize="size-full"
                      />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
