import type { JSX } from "react";

const tags = ["ІТ", "БІЗНЕС", "МЕНЕДЖМЕНТ", "ФІНАНСИ", "МАРКЕТИНГ"];

export const HeroWithAbout = (): JSX.Element => {
  return (
    <section className="relative w-full">
      {/* Background Gradients & Images */}
      <div
        className="absolute top-0 left-0 w-full h-[1800px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms]"
        style={{
          background:
            "linear-gradient(180deg, #01133C00 0%, #011C58 50%, #0332A2 100%)",
        }}
      />

      <img
        className="absolute top left-1/2 -translate-x-1/4 w-[1250px] h-[780px] object-contain pointer-events-none opacity-0 animate-fade-in [--animation-delay:400ms]"
        alt="Element black chrome"
        src="/images/3d-black-chrome-shape.png"
      />

      {/* Hero Title */}
      <div className="relative min-h-[calc(100vh-80px)] max-w-[1440px] mx-auto px-9 flex flex-col justify-end pb-20 z-10 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
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
      </div>

      {/* About Section */}
      <div className="relative w-full py-16 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <div className="max-w-[1440px] mx-auto px-9">
          {/* Blue Line + Tags */}
          <div className="mb-12">
            {/* Blue horizontal line */}
            <div className="w-full h-[1px] bg-white/60 mb-6"></div>

            {/* Tags */}
            <div className="flex items-center">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-[5px] h-[5px] bg-white rounded-full flex-shrink-0"></span>
                    <span className="font-['Atyp_Text-Medium',Helvetica] text-white text-[11px] tracking-[0.1em] uppercase">
                      {tag}
                    </span>
                  </span>
                  <span className="text-white mx-4 text-xs">/</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description Section with Image */}
          <div className="grid grid-cols-2 gap-16 items-center">
            {/* Left Column - Text */}
            <div className="flex flex-col gap-10 max-w-[580px]">
              <p className="font-['Atyp_Text-Regular',Helvetica] text-[#8b9dc3] text-[18px] leading-[1.7]">
                Інститут інформаційних технологій та бізнесу — простір, де народжуються лідери цифрової ери. Ми поєднуємо технології, бізнес та інновації, щоб готувати фахівців, які не просто адаптуються до змін, а й створюють їх.
              </p>
              <p className="font-['Atyp_Text-Regular',Helvetica] text-[#8b9dc3] text-[18px] leading-[1.7]">
                Наші студенти отримують актуальні знання та практичний досвід у IT, аналітиці, управлінні й підприємництві. Співпраця з провідними компаніями дає їм конкурентні переваги у світі технологій та бізнесу.
              </p>
            </div>

            {/* Right Column - Blue Sphere Image */}
            <div className="flex justify-end">
              <img
                src="/images/sphere.jpg"
                alt="Abstract 3D sphere"
                className="w-[420px] h-auto object-contain mix-blend-lighten"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};