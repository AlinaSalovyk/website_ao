import type { JSX } from "react";
import { ArrowRightIcon } from "lucide-react";

export const Leadership = (): JSX.Element => {
    return (
        <section className="w-full bg-pure-white text-pure-black pt-10 pb-20 px-4 md:px-9">
            <div className="container mx-auto flex flex-col">
                {/* Header */}
                <div className="flex justify-end w-full mb-16 md:mb-20 border-b border-pure-black pb-4">
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold font-['Roboto',sans-serif] text-right">
                        Керівництво лабораторії
                    </h2>
                </div>

                <div className="flex justify-center w-full">
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 md:items-start max-w-4xl px-4">
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                            <div className="w-full aspect-square md:w-[240px] md:h-[260px] md:aspect-auto rounded-2xl overflow-hidden bg-gray-200">
                                <img
                                    src="/images/InstituteManagement/Melnychuk.jpg"
                                    alt="Мельничук Олександр Павлович"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-8 md:gap-10 pt-2">
                            <div>
                                <h3 className="font-['Roboto',sans-serif] font-bold text-xl md:text-2xl mb-2">
                                    Мельничук Олександр Павлович
                                </h3>
                                <p className="font-['Roboto',sans-serif] text-sm md:text-base text-black/80">
                                    Викладач, фахівець-практик
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="font-['Roboto',sans-serif] text-sm text-black mb-1 font-semibold">
                                        Контактна інформація:
                                    </p>
                                    <a href="mailto:oleksandr.melnychuk@oa.edu.ua" className="font-['Roboto',sans-serif] text-sm text-black hover:underline block">
                                        e-mail: oleksandr.melnychuk@oa.edu.ua
                                    </a>
                                </div>

                                <div>
                                    <p className="font-['Roboto',sans-serif] text-sm text-black mb-1 font-semibold">
                                        Офісні години:
                                    </p>
                                    <p className="font-['Roboto',sans-serif] text-sm text-black">
                                        понеділок - п'ятниця: 8.30-17.30
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
