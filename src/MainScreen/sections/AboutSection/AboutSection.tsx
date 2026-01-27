import type { JSX } from "react";

const tags = ["ІТ", "БІЗНЕС", "МЕНЕДЖМЕНТ", "ФІНАНСИ", "МАРКЕТИНГ"];

export const AboutSection = (): JSX.Element => {
    return (
        <section className="relative w-full max-w-[1440px] mx-auto px-9 py-16">
            {/* Tags Line */}
            <div className="flex items-center mb-12">
                {tags.map((tag, index) => (
                    <div key={index} className="flex items-center">
                        <span className="inline-flex items-center gap-2">
                            <span className="w-[5px] h-[5px] bg-[#4a6cf7] rounded-full flex-shrink-0"></span>
                            <span className="font-['Atyp_Text-Medium',Helvetica] text-white text-[11px] tracking-[0.1em] uppercase">
                                {tag}
                            </span>
                        </span>
                        <span className="text-white/40 mx-4 text-xs">/</span>
                    </div>
                ))}
            </div>

            {/* Description Section with Image */}
            <div className="grid grid-cols-2 gap-16 items-start">
                {/* Left Column - Text */}
                <div className="flex flex-col gap-10 max-w-[580px]">
                    <p className="font-['Atyp_Text-Regular',Helvetica] text-[#8b9dc3] text-[18px] leading-[1.7]">
                        Інститут інформаційних технологій та бізнесу — простір, де народжуються лідери цифрової ери. Ми поєднуємо технології, бізнес та інновації, щоб готувати фахівців, які не просто адаптуються до змін, а й створюють їх.
                    </p>
                    <p className="font-['Atyp_Text-Regular',Helvetica] text-[#8b9dc3] text-[18px] leading-[1.7]">
                        Наші студенти отримують актуальні знання та практичний досвід у ІТ, аналітиці, управлінні й підприємництві. Співпраця з провідними компаніями дає їм конкурентні переваги у світі технологій та бізнесу.
                    </p>
                </div>

                {/* Right Column - Blue Sphere Image */}
                <div className="flex justify-end">
                    <img
                        src="https://c.animaapp.com/mkvpx7lhh8vezq/img/image.png"
                        alt="Abstract 3D sphere"
                        className="w-[420px] h-[420px] object-cover"
                    />
                </div>
            </div>
        </section>
    );
};
