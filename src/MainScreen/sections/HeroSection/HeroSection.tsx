import type { JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const departments = [
    {
        title: "Кафедра фінансів та бізнесу",
        categories: [
            "БІЗНЕС",
            "ФІНАНСИ",
            "ОБЛІК ТА ОПОДАТКУВАННЯ",
            "ПІДПРИЄМНИЦТВО ТА ТОРГІВЛЯ",
        ],
        backgroundImage:
            // фотки не стають нормально шлях до них \public\images\Departments в подальшому треба буде замінити можливо 
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/container-3.svg",
        animationDelay: "0ms",
    },
    {
        title: "Кафедра менеджменту та маркетингу",
        categories: [
            "DATА-МАРКЕТИНГ",
            "АНАЛІТИКА",
            "HR-МЕНЕДЖМЕНТ",
            "МЕНЕДЖМЕНТ ПРОДАЖІВ",
        ],
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/container-2.svg",
        animationDelay: "200ms",
    },
    {
        title: "Кафедра інформаційних технологій та аналітики даних",
        categories: [
            "РОБОТОТЕХНІКА",
            "ШТУЧНИЙ ІНТЕЛЕКТ",
            "ІТ",
            "ЕКОНОМІЧНА КІБЕРНЕТИКА",
        ],
        backgroundImage:
            "https://c.animaapp.com/mkvpx7lhh8vezq/img/container-4.svg",
        animationDelay: "400ms",
    },
];

export const HeroSection = (): JSX.Element => {
    return (
        <section className="w-full bg-iitwoodsmoke flex flex-col items-center justify-center">
            <div className="flex flex-col w-full max-w-[1440px] px-9">
                <div className="flex flex-col gap-[500px] w-full">
                    {departments.map((department, index) => (
                        <article
                            key={index}
                            className="relative w-[1350px] h-[900px] bg-cover bg-centrе translate-y-[2rem] animate-fade-in opacity-0"
                            style={
                                {
                                    backgroundImage: `url(${department.backgroundImage})`,
                                    "--animation-delay": department.animationDelay,
                                } as React.CSSProperties
                            }
                        >
                            <div className="flex w-full items-center justify-between px-0 py-3 relative top-[35px] bg-iitwoodsmoke border-t border-[#42474c]">
                                <div className="flex flex-col items-start">
                                    <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-white text-2xl leading-[30px] max-w-[450px]">
                                        {department.title}
                                    </h2>
                                </div>

                                <nav className="flex items-center justify-center">
                                    <ul className="flex items-center gap-6">
                                        {department.categories.map((category, catIndex) => (
                                            <li key={catIndex}>
                                                <Badge
                                                    variant="outline"
                                                    className="h-auto bg-transparent hover:bg-transparent border-none px-0 py-0 cursor-pointer transition-colors hover:text-white"
                                                >
                                                    <span className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-iitpale-sky text-[11.2px] tracking-[0.36px] leading-[14.4px] whitespace-nowrap">
                                                        {category}
                                                    </span>
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                <Button
                                    variant="outline"
                                    className="h-auto rounded-full border-white bg-transparent hover:bg-white/10 pt-1.5 pb-1 px-[11px] transition-colors"
                                >
                                    <span className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-white text-xs leading-[14px] whitespace-nowrap">
                                        ПЕРЕГЛЯНУТИ ІНФОРМАЦІЮ
                                    </span>
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};
