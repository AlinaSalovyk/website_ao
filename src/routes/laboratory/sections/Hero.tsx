import type { JSX } from "react";

const tags = ["РОБОТОТЕХНІКА", "ВБУДОВАНІ СИСТЕМИ", "EMBEDDED AI", "ПРОТОТИПУВАННЯ"];

export const Hero = (): JSX.Element => {
    return (
        <section className="relative w-full overflow-hidden">
            {/* Background Gradients & Images */}
            <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms] bg-black"
            />

            <div
                className="absolute -top-0 left-1/2 -translate-x-1/4 w-[600px] xl:w-[900px] 2xl:w-[1250px] h-auto xl:h-[600px] 2xl:h-[780px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:400ms]"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 60%, transparent 90%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 90%)'
                }}
            >
                <img
                    className="w-full h-full object-contain"
                    alt="Element black chrome"
                    src="/images/Home/3d-black-chrome-shape.png"
                    style={{ filter: 'hue-rotate(-30deg) brightness(1.2) saturate(2.0)' }}
                />
            </div>

            {/* Hero Title */}
            <div className="relative min-h-[500px] lg:min-h-[calc(100vh-80px)] max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col justify-end pb-4 lg:pb-6 z-10 translate-y-0 animate-fade-in opacity-0 [--animation-delay:200ms] mt-16 lg:mt-24">
                <div className="relative z-10 pt-32 lg:pt-0">
                    <div className="flex justify-start items-baseline w-full flex-wrap gap-x-3 gap-y-2">
                        <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
                            Науково-дослідна
                        </span>
                    </div>
                    <div className="flex justify-start items-baseline w-full flex-wrap gap-x-4 gap-y-2">
                        <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
                            лабораторія
                        </span>
                        <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
                            робототехніки
                        </span>
                    </div>

                    <div className="flex justify-start items-baseline w-full flex-wrap gap-x-4 gap-y-2">
                        <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
                            та вбудованих
                        </span>
                        <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
                            систем
                        </span>
                    </div>

                    <div className="flex justify-start items-baseline w-full flex-wrap gap-x-4 gap-y-2">
                        <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
                            з прикладним AI
                        </span>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="relative w-full py-16 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9">
                    {/* Blue Line + Tags */}
                    <div className="mb-12">
                        {/* Blue horizontal line */}
                        <div className="w-full h-[1px] bg-pure-white/60 mb-6"></div>

                        {/* Tags */}
                        <div className="flex items-center flex-wrap gap-y-2">
                            {tags.map((tag, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="w-1 h-1 xl:w-1.5 xl:h-1.5 2xl:w-[5px] 2xl:h-[5px] bg-pure-white rounded-full flex-shrink-0"></span>
                                        <span className="font-medium text-pure-white text-[9px] xl:text-[10px] 2xl:text-[11px] tracking-[0.1em] uppercase">
                                            {tag}
                                        </span>
                                    </span>
                                    <span className="text-pure-white mx-4 text-xs">/</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description Section with Image */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                        {/* Left Column - Text */}
                        <div className="flex flex-col gap-8 lg:gap-10 w-full">
                            <p className="font-['Roboto',sans-serif] text-pure-white text-lg md:text-xl lg:text-[22px] xl:text-2xl 2xl:text-[26px] leading-[1.6]">
                                Науково-дослідна лабораторія робототехніки та вбудованих систем з прикладним AI — це простір для створення практичних апаратно-програмних рішень на перетині інженерії, штучного інтелекту та швидкого прототипування.
                            </p>
                            <p className="font-['Roboto',sans-serif] text-pure-white text-lg md:text-xl lg:text-[22px] xl:text-2xl 2xl:text-[26px] leading-[1.6] text-white/80">
                                Лабораторія працює з реальними R&D-проєктами у сфері робототехніки, embedded-систем, IoT та прикладного AI, залучаючи студентів і дослідників до повного циклу розробки — від ідеї й прототипу до тестування та малосерійного виготовлення — формуючи прикладні інженерні навички, затребувані сучасним технологічним ринком.
                            </p>
                        </div>

                        {/* Right Column - Image */}
                        <div className="hidden lg:flex justify-end w-full">
                            <div className="w-full max-w-[400px] 2xl:max-w-[460px] h-auto aspect-[480/678] relative overflow-hidden rounded-[20px]">
                                <img
                                    src="/images/Home/sphere.jpg"
                                    alt="Abstract 3D sphere"
                                    className="w-full h-full object-cover mix-blend-lighten opacity-90"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
