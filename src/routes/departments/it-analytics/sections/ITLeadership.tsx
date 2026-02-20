import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const leadershipData = [
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
];

export const ITLeadership = (): JSX.Element => {
    return (
        <section className="w-full bg-pure-white flex flex-col relative">
            <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 md:px-9 py-20 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-pure-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-[72px] tracking-[0] leading-tight xl:leading-[86px] mb-10 self-end text-right">
                    Керівництво кафедри
                </h2>
                <Separator className="w-full bg-pure-black h-px mb-16" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 xl:gap-20 w-full">
                    {leadershipData.map((member) => (
                        <div key={member.id} className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-8 xl:gap-8 w-full lg:pl-10 xl:pl-16">
                            <div className="w-full sm:w-40 lg:w-44 xl:w-52 2xl:w-[220px] aspect-[4/5] overflow-hidden flex-shrink-0 rounded-lg bg-gray-100">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            "https://via.placeholder.com/400x500?text=No+Image";
                                    }}
                                />
                            </div>

                            <div className="flex flex-col items-start text-left flex-1 h-full justify-between py-1">
                                <div className="mb-6">
                                    <h3 className="font-semibold text-pure-black text-lg lg:text-xl tracking-[0] leading-6 mb-2">
                                        {member.name}
                                    </h3>
                                    <p className="font-normal text-pure-black text-sm tracking-[0] leading-5">
                                        {member.role}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col">
                                        <p className="font-medium text-pure-black text-sm tracking-[0] leading-5 mb-1">
                                            Контактна інформація:
                                        </p>
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="font-normal text-pure-black text-sm tracking-[0] leading-5 hover:text-leadership-link transition-colors block"
                                        >
                                            e-mail: {member.email}
                                        </a>
                                    </div>

                                    <div className="flex flex-col">
                                        <p className="font-medium text-pure-black text-sm tracking-[0] leading-5 mb-1">
                                            Офісні години:
                                        </p>
                                        <p className="font-normal text-pure-black text-sm tracking-[0] leading-5">
                                            {member.officeHours}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};