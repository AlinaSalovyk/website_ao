import type { JSX } from "react";
import { Separator } from "@/components/ui/separator";
import { partnerLogos } from "@/components/icons/PartnerLogos";
import React from "react";

export const ITEducationalPrograms = (): JSX.Element => {
    return (
        <section className="w-full items-center justify-center px-0 py-20 bg-pure-white flex flex-col">
            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9">
                <header className="flex flex-col items-start mb-8 animate-fade-in opacity-0">
                    <h2 className="[font-family:'Roboto',Helvetica] font-medium text-pure-black text-3xl md:text-5xl xl:text-7xl 2xl:text-[80px] text-left tracking-[0] leading-tight xl:leading-[80px] whitespace-normal md:whitespace-nowrap">
                        Загальна інформація про кафедру
                    </h2>
                </header>

                <Separator className="w-full h-px bg-pure-black mb-16" />

                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[500px_1fr] gap-10 lg:gap-20 mb-20">
                    {/* Left Column - Image */}
                    <div className="w-full md:w-2/3 lg:w-full mx-auto lg:mx-0 h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden">
                        <img
                            src="/images/information.jpg"
                            alt="Abstract blue graphic"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Right Column - Text Content */}
                    <div className="flex flex-col gap-12">
                        {/* Main Intro Text */}
                        <p className="font-['Roboto',sans-serif] text-pure-black -400 text-lg md:text-xl lg:text-2xl leading-relaxed">
                            Ми готуємо висококваліфікованих фахівців у сфері штучного інтелекту, робототехніки, аналітики даних та машинного навчання. Наші студенти не просто засвоюють теорію, а й отримують реальний досвід, працюючи над актуальними проєктами та співпрацюючи з провідними компаніями.
                        </p>

                        {/* Two Columns Text */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-4">
                                <p className="font-['Roboto',sans-serif] text-pure-black text-sm md:text-base leading-relaxed">
                                    Наші викладачі — це не лише теоретики, а й практики, які постійно вдосконалюють свої навички в реальному секторі економіки, міжнародних наукових проєктах та стажуваннях. Вони навчають студентів не просто аналізувати дані, а створювати інтелектуальні системи, які прогнозують, оптимізують та приймають рішення.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <p className="font-['Roboto',sans-serif] text-pure-black text-sm md:text-base leading-relaxed">
                                    Освітні програми кафедри охоплюють широкий спектр дисциплін — від основ програмування до складних алгоритмів штучного інтелекту. Особлива увага приділяється практичному застосуванню набутих знань, які роблять вас затребуваними на ринку праці. Ми вважаємо, що справжній фахівець не є лише виконавцем, а є новатором, який шукає нестандартні рішення та втілює сміливі ідеї.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Marquee Animation Section */}
            <div className="w-full overflow-hidden py-12 bg-pure-white">
                <div className="flex items-center gap-16 animate-marquee-seamless">
                    {[...Array(18)].map((_, setIndex) => (
                        <React.Fragment key={setIndex}>
                            {partnerLogos}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
};
