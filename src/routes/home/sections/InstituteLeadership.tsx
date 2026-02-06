import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

export const InstituteLeadership = (): JSX.Element => {
    return (
        <section className="w-full bg-pure-white flex flex-col relative">
            <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-9 py-20 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                <h2 className="font-medium text-pure-black text-4xl lg:text-5xl xl:text-6xl 2xl:text-[72px] tracking-[0] leading-tight xl:leading-[86px] mb-10 self-end text-right">
                    Директор інституту
                </h2>
                <Separator className="w-full bg-pure-black h-px mb-16" />

                <div className="flex items-start w-full gap-16 xl:gap-32 2xl:gap-[200px]">
                    <div className="flex flex-col items-start w-48 xl:w-56 2xl:w-[260px] flex-shrink-0">
                        <p className="font-normal text-pure-black text-sm tracking-[0] leading-6 italic mb-4">
                            У світі, що стрімко змінюється, знання – це не просто сила, а ключ до можливостей. Наш інститут навчає не лише адаптуватися до майбутнього, а й створювати його.
                        </p>
                        <div className="flex flex-col w-full">
                            <a
                                href="#"
                                className="flex items-center justify-between w-full font-medium text-pure-black text-sm tracking-[0] leading-5 hover:opacity-70 transition-opacity group pb-2 border-b border-pure-black"
                            >
                                <span>Дізнатися більше</span>
                                <span className="transition-transform group-hover:translate-x-1">→</span>
                            </a>
                        </div>
                    </div>


                    <div className="flex items-start gap-8 ml-auto">
                        <div className="w-40 xl:w-48 2xl:w-[200px] h-48 xl:h-56 2xl:h-[240px] overflow-hidden flex-shrink-0 rounded-sm">
                            <img
                                src="/images/Home/novoseletskyy.jpg"
                                alt="Новоселецький Олександр Миколайович"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex flex-col items-start text-left">
                            <div className="mb-8">
                                <h3 className="font-semibold text-pure-black text-xl tracking-[0] leading-7 mb-2">
                                    Новоселецький Олександр Миколайович
                                </h3>
                                <p className="font-normal text-pure-black text-sm tracking-[0] leading-5">
                                    Директор Інституту ІТ та бізнесу, кандидат економічних наук, доцент<br />
                                    кафедри інформаційних технологій та аналітики даних
                                </p>
                            </div>

                            <div className="mb-4">
                                <p className="font-medium text-pure-black text-sm tracking-[0] leading-5 mb-0">
                                    Контактна інформація:
                                </p>
                                <a
                                    href="mailto:oleksandr.novoseletskyi@oa.edu.ua"
                                    className="font-normal text-pure-black text-sm tracking-[0] leading-5 underline hover:text-leadership-link transition-colors"
                                >
                                    e-mail: oleksandr.novoseletskyi@oa.edu.ua
                                </a>
                            </div>

                            <div>
                                <p className="font-medium text-pure-black text-sm tracking-[0] leading-5 mb-0">
                                    Офісні години:
                                </p>
                                <p className="font-normal text-pure-black text-sm tracking-[0] leading-5">
                                    понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};