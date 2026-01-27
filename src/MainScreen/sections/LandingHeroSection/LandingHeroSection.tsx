import type { JSX } from "react";

export const LandingHeroSection = (): JSX.Element => {
    return (
        <section className="relative w-full min-h-[calc(100vh-80px)] max-w-[1440px] mx-auto px-9 flex flex-col justify-end pb-20">
            {/* Hero Title - At the bottom of the viewport */}
            <div className="relative z-10">
                {/* Line 1: "Обирай" left, "навчання," center, "яке" right */}
                <div className="flex justify-between items-baseline w-full">
                    <span className="font-['Atyp_Display-Regular',Helvetica] text-white text-[64px] leading-[1.05] tracking-[-0.01em] italic">
                        Обирай
                    </span>
                    <div className="flex items-baseline">
                        <span className="font-['Atyp_Display-Regular',Helvetica] text-white text-[64px] leading-[1.05] tracking-[-0.01em] italic">
                            навчання,
                        </span>
                        <span className="font-['Atyp_Display-Regular',Helvetica] text-white text-[64px] leading-[1.05] tracking-[-0.01em] italic ml-20">
                            яке
                        </span>
                    </div>
                </div>

                {/* Line 2: "відповідає" left, "викликам" right */}
                <div className="flex justify-between items-baseline w-full">
                    <span className="font-['Atyp_Display-Regular',Helvetica] text-white text-[64px] leading-[1.05] tracking-[-0.01em] italic">
                        відповідає
                    </span>
                    <span className="font-['Atyp_Display-Regular',Helvetica] text-white text-[64px] leading-[1.05] tracking-[-0.01em] italic">
                        викликам
                    </span>
                </div>

                {/* Line 3: "майбутнього!" left only */}
                <div className="flex justify-start">
                    <span className="font-['Atyp_Display-Regular',Helvetica] text-white text-[64px] leading-[1.05] tracking-[-0.01em] italic">
                        майбутнього!
                    </span>
                </div>
            </div>
        </section>
    );
};
