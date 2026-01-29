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

export const NewsAndEventsSection = (): JSX.Element => {
  return (
    <section className="w-full bg-white flex flex-col relative">
      <div className="flex flex-col max-w-[1440px] mx-auto w-full px-9 py-20 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
        <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-black text-[72px] tracking-[0] leading-[86px] mb-10 self-end text-right">
          Керівництво інституту
        </h2>
        <Separator className="w-full bg-black h-px mb-16" />

        <div className="flex items-start w-full gap-[200px]">
          <div className="flex flex-col items-start w-[260px] flex-shrink-0">
            <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-sm tracking-[0] leading-6 italic mb-4">
              У світі, що стрімко змінюється, знання – це не просто сила, а ключ до можливостей. Наш інститут навчає не лише адаптуватися до майбутнього, а й створювати його.
            </p>
            <div className="flex flex-col w-full">
              <a
                href="#"
                className="flex items-center justify-between w-full [font-family:'Atyp_Text-Medium',Helvetica] font-medium text-black text-sm tracking-[0] leading-5 hover:opacity-70 transition-opacity group pb-2 border-b border-black"
              >
                <span>Дізнатися більше</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center gap-[5px] self-center" style={{ height: '109px' }}>
            <div className="w-[2px] h-[40px] rounded-[2px]" style={{ backgroundColor: '#8F8F95' }} />
            <div className="w-[2px] h-[18px] rounded-[2px]" style={{ backgroundColor: '#323237' }} />
            <div className="w-[2px] h-[18px] rounded-[2px]" style={{ backgroundColor: '#323237' }} />
            <div className="w-[2px] h-[18px] rounded-[2px]" style={{ backgroundColor: '#323237' }} />
          </div>

          <div className="flex items-start gap-8 flex-1">
            <div className="w-[200px] h-[240px] overflow-hidden flex-shrink-0 rounded-sm">
              <img
                src="/images/novoseletskyy.jpg"
                alt="Новоселецький Олександр Миколайович"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col items-start">
              <div className="mb-8">
                <h3 className="[font-family:'Atyp_Display-Semibold',Helvetica] font-semibold text-black text-xl tracking-[0] leading-7 mb-2">
                  Новоселецький Олександр Миколайович
                </h3>
                <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-sm tracking-[0] leading-5">
                  Директор Інституту ІТ та бізнесу, кандидат економічних наук, доцент<br />
                  кафедри інформаційних технологій та аналітики даних
                </p>
              </div>

              <div className="mb-4">
                <p className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-black text-sm tracking-[0] leading-5 mb-0">
                  Контактна інформація:
                </p>
                <a
                  href="mailto:oleksandr.novoseletskyi@oa.edu.ua"
                  className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-sm tracking-[0] leading-5 underline hover:text-[#0e52ff] transition-colors"
                >
                  e-mail: oleksandr.novoseletskyi@oa.edu.ua
                </a>
              </div>

              <div>
                <p className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-black text-sm tracking-[0] leading-5 mb-0">
                  Офісні години:
                </p>
                <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-sm tracking-[0] leading-5">
                  понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="relative w-full"
        style={{ height: '1400px' }}
      >
        <div
          className="absolute left-10 right-10 pointer-events-none"
          style={{
            bottom: '-300px',
            height: '100%',
            backgroundImage: 'url(/images/InnovativeEducationBackground.jpg)',
            //backgroundRepeat: 'no-repeat',
            backgroundSize: '100% auto',
          }}
        />

        <div
          className="flex flex-col mx-auto w-full h-full items-start px-9 pt-20 relative z-[1]"
          style={{ maxWidth: '1440px' }}
        >
          <header className="flex flex-col items-start relative w-full gap-8 translate-y-[-1rem] animate-fade-in opacity-0">
            <h1 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-black text-[120px] tracking-[0] leading-[144px] whitespace-nowrap">
              ІННОВАЦІЙНА ОСВІТА
            </h1>
            <Separator className="w-full bg-[#8F8F95] h-px" />
            <p className="max-w-[400px] [font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-2xl tracking-[0] leading-8">
              Створюємо майбутнє разом: технології, бізнес та аналітика в єдиному
              просторі.
            </p>
          </header>

          <div className="flex items-start justify-end gap-[200px] w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms] mt-16 flex-1">
            {statsData.map((stat, index) => (
              <Card
                key={index}
                className="flex flex-col max-w-[400px] w-full border-50 shadow-none bg-transparent"
              >
                <CardContent className="flex flex-col items-start gap-4 p-0">
                  <div className="flex items-start w-full">
                    <h2 className="[font-family:'Atyp_Text-Semibold',Helvetica] font-normal text-black text-[140px] tracking-[-4.80px] leading-[120px] whitespace-nowrap">
                      {stat.number}
                    </h2>
                  </div>
                  <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-black text-lg tracking-[0] leading-[24px] whitespace-pre-line">
                    {stat.description}
                  </p>
                  {stat.imageSrc && (
                    <img
                      className="w-full max-w-[300px]"
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
