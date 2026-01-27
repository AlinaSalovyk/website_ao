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
      "Серед інноваційних навчальних програм у сфері цифрової економіки та підприємництва.\nСпівпраця з 30+ компаніями\nРеальні кейси, стажування та можливості для міжнародного навчання.",
  },
];

export const NewsAndEventsSection = (): JSX.Element => {
  return (
    <section className="w-full bg-white flex flex-col relative">
      <div className="flex flex-col max-w-[1440px] mx-auto w-full items-start gap-[52px] px-9 py-20 relative z-[1]">
        <header className="flex flex-col items-start relative w-full gap-10 translate-y-[-1rem] animate-fade-in opacity-0">
          <div className="flex flex-col items-start gap-10 w-full">
            <h1 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-black text-[120px] tracking-[0] leading-[144px] whitespace-nowrap">
              ІННОВАЦІЙНА ОСВІТА
            </h1>
            <Separator className="w-full max-w-[1314px] bg-iitpale-sky h-px" />
          </div>
          <p className="max-w-[364px] [font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-2xl tracking-[0] leading-8">
            Створюємо майбутнє разом: технології, бізнес та аналітика в єдиному
            просторі.
          </p>
        </header>

        <div className="flex items-start justify-end gap-[133px] w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
          {statsData.map((stat, index) => (
            <Card
              key={index}
              className="flex flex-col max-w-[404px] w-full border-0 shadow-none bg-transparent"
            >
              <CardContent className="flex flex-col items-start gap-8 p-0">
                <div className="flex items-start w-full">
                  <h2 className="[font-family:'Atyp_Text-Semibold',Helvetica] font-normal text-black text-[160px] tracking-[-4.80px] leading-[144px] whitespace-nowrap">
                    {stat.number}
                  </h2>
                </div>
                <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-xl tracking-[0] leading-[26px] whitespace-pre-line">
                  {stat.description}
                </p>
                {stat.imageSrc && (
                  <img
                    className="w-full"
                    alt="Decorative container"
                    src={stat.imageSrc}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-center w-full relative translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <img
          className="w-full object-cover"
          alt="Background container"
          src="https://c.animaapp.com/mkvpx7lhh8vezq/img/container.png"
        />
      </div>
    </section>
  );
};
