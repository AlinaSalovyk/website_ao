import type { JSX } from "react";

export const InstituteHero = (): JSX.Element => {
    return (
        <section className="relative w-full overflow-hidden -mt-24 md:-mt-28">
            {/* Background Gradients & Images */}
            <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms] bg-hero-gradient"
            />

            <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col pt-70 pb-20">

                {/* Title Section */}
                <div className="flex flex-col w-full mb-10 font-['Roboto',sans-serif] font-bold text-4xl md:text-4xl lg:text-7xl xl:text-8xl leading-[1.1] tracking-[-0.02em] uppercase text-left">
                    <span>Про інститут</span>
                    <span className="text-gray-200">Інформаційних технологій та Бізнесу</span>
                </div>

                <div className="w-full h-[1px] bg-white/20 mb-8"></div>

                <p className="font-['Roboto',sans-serif] text-xs md:text-sm text-white max-w-3xl mb-20 leading-relaxed opacity-80">
                    Місце де існує поєднання інноваційної освіти, практичного досвіду та наукових<br />
                    досліджень, що формують фахівців нового покоління для цифрової економіки.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">

                    <div className="flex flex-col gap-10">
                        <button
                            onClick={() => document.getElementById('general-info')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 text-xs uppercase tracking-widest text-white mb-2 hover:text-blue-400 transition-colors text-left"
                        >
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            <span>Про нас /</span>
                        </button>

                        <div className="flex flex-col gap-8">
                            <p className="font-['Roboto',sans-serif] text-xl md:text-2xl lg:text-3xl leading-snug text-white">
                                Інститут інформаційних технологій та бізнесу — простір, де народжуються лідери цифрової ери. Ми поєднуємо технології, бізнес та інновації, щоб готувати фахівців, які не просто адаптуються до змін, а й створюють їх.
                            </p>
                            <p className="font-['Roboto',sans-serif] text-xl md:text-2xl lg:text-3xl leading-snug text-white">
                                Наші студенти отримують актуальні знання та практичний досвід у ІТ, аналітиці, управлінні й підприємництві. Співпраця з провідними компаніями дає їм конкурентні переваги у світі технологій та бізнесу.
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full max-w-[300px] lg:max-w-[500px] aspect-[500/647] rounded-xl overflow-hidden mt-10 lg:-mt-20 mx-auto lg:ml-auto">
                        <img
                            src="/images/IT/ScientificActivity.jpg"
                            alt="Digital Innovation"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
