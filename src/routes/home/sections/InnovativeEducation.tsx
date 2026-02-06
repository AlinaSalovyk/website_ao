import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const statsData = [
    {
        number: "500+",
        description:
            "Успішних випускників щороку, які стають лідерами у сфері IT, фінансів та управління.",
        imageSrc: "https://c.animaapp.com/mkvpx7lhh8vezq/img/container-1.svg",
    },
    {
        number: "#1",
        description:
            "Серед інноваційних навчальних програм у сфері цифрової економіки та підприємництва. Співпраця з 30+ компаніями Реальні кейси, стажування та можливості для міжнародного навчання.",
    },
];

export const InnovativeEducation = (): JSX.Element => {
    return (
        <section className="w-full bg-pure-white flex flex-col relative overflow-hidden">
            <div
                className="relative w-full h-[700px] xl:h-[1000px] 2xl:h-[1400px]"
            >
                <div
                    className="absolute left-0 right-0 pointer-events-none bg-innovative-education -bottom-[275px] h-full"
                />

                <div
                    className="flex flex-col mx-auto w-full h-full items-start px-9 pt-20 relative z-[1] max-w-7xl 2xl:max-w-screen-2xl"
                >
                    <header className="flex flex-col items-start relative w-full gap-8 translate-y-[-1rem] animate-fade-in opacity-0">
                        <h1 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-pure-black text-5xl lg:text-7xl xl:text-8xl 2xl:text-[132px] tracking-[0] leading-tight xl:leading-[144px] whitespace-nowrap">
                            ІННОВАЦІЙНА ОСВІТА
                        </h1>
                        <Separator className="w-full bg-separator-gray h-px" />
                        <p className="max-w-xs xl:max-w-sm 2xl:max-w-[400px] [font-family:'Atyp_Text-Regular',Helvetica] font-normal text-pure-black text-lg xl:text-xl 2xl:text-2xl tracking-[0] leading-7 xl:leading-8">
                            Створюємо майбутнє разом: технології, бізнес та аналітика в єдиному
                            просторі.
                        </p>
                    </header>

                    <div className="flex items-start justify-end gap-16 xl:gap-32 2xl:gap-[200px] w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms] mt-16 flex-1">
                        {statsData.map((stat, index) => (
                            <Card
                                key={index}
                                className="flex flex-col max-w-xs xl:max-w-sm 2xl:max-w-[400px] w-full border-50 shadow-none bg-transparent"
                            >
                                <CardContent className="flex flex-col items-start gap-4 p-0">
                                    <div className="flex items-start w-full">
                                        <h2 className="[font-family:'Atyp_Text-Semibold',Helvetica] font-normal text-pure-black text-7xl xl:text-9xl 2xl:text-[140px] tracking-tight xl:tracking-[-4.80px] leading-tight xl:leading-[120px] whitespace-nowrap">
                                            {stat.number}
                                        </h2>
                                    </div>
                                    <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-pure-black text-lg tracking-[0] leading-[24px] whitespace-pre-line">
                                        {stat.description}
                                    </p>
                                    {stat.imageSrc && (
                                        <img
                                            className="w-full max-w-48 xl:max-w-64 xl:max-w-[300px]"
                                            alt="Decorative container"
                                            src={stat.imageSrc}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};