import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

export const ITScientificActivity = (): JSX.Element => {
    return (
        <section className="w-full bg-pure-white flex flex-col relative overflow-hidden">
            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 pt-20 pb-0">
                <header className="flex flex-col items-start relative w-full gap-8 translate-y-[-1rem] animate-fade-in opacity-0">
                    <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-pure-black text-4xl md:text-5xl lg:text-7xl xl:text-8xl 2xl:text-[132px] tracking-[0] leading-tight xl:leading-[144px] whitespace-normal md:whitespace-nowrap uppercase">
                        НАУКОВА ДІЯЛЬНІСТЬ
                    </h2>
                    <Separator className="w-full bg-separator-gray h-px" />
                </header>

                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20 mt-16">
                    <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3">
                        <img
                            src="/images/IT/sphere1.jpg"
                            alt="Abstract sphere"
                            className="w-full h-auto rounded-lg object-cover aspect-[4/3]"
                        />
                    </div>
                    <div className="w-full lg:w-3/5 lg:-mt-50">
                        <p className="font-normal text-pure-black text-lg xl:text-xl 2xl:text-3xl tracking-[0] leading-10 xl:leading-10">
                            Викладачі кафедри працюють над науково-<br />
                            дослідною темою «Математичні  методи, моделі та<br />
                            інформаційні технології в освіті, науці, бізнесі»,<br />
                            0123U103522, доктор фізико-математичних наук, <br />
                            професор Нікітін Анатолій  Володимирович.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
