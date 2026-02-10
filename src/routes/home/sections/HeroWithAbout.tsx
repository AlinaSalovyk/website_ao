import type { JSX } from "react";

const tags = ["ІТ", "БІЗНЕС", "МЕНЕДЖМЕНТ", "ФІНАНСИ", "МАРКЕТИНГ"];

export const HeroWithAbout = (): JSX.Element => {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Gradients & Images */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms] bg-hero-gradient"
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
          style={{ filter: 'hue-rotate(-20deg) brightness(1.55) saturate(2.0)' }}
        />
      </div>

      {/* Hero Title */}
      <div className="relative min-h-[500px] lg:min-h-[calc(100vh-80px)] max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col justify-end pb-4 lg:pb-6 z-10 translate-y-0 animate-fade-in opacity-0 [--animation-delay:200ms]">
        <div className="relative z-10 pt-32 lg:pt-0">
          <div className="flex justify-start items-baseline w-full flex-wrap gap-x-3 gap-y-2">
            <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
              Обирай
            </span>
            <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
              навчання,
            </span>
            <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
              яке
            </span>
          </div>
          <div className="flex justify-start items-baseline w-full flex-wrap gap-x-4 gap-y-2">
            <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
              відповідає
            </span>
            <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
              викликам
            </span>
          </div>

          <div className="flex justify-start">
            <span className="font-['Roboto',sans-serif] font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
              майбутнього!
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Column - Text */}
            <div className="flex flex-col gap-8 lg:gap-10 max-w-full lg:max-w-lg 2xl:max-w-[580px]">
              <p className="font-['Roboto',sans-serif] text-pure-white text-base xl:text-lg 2xl:text-[18px] leading-[1.7]">
                Інститут інформаційних технологій та бізнесу — простір, де народжуються лідери цифрової ери. Ми поєднуємо технології, бізнес та інновації, щоб готувати фахівців, які не просто адаптуються до змін, а й створюють їх.
              </p>
              <p className="font-['Roboto',sans-serif] text-pure-white text-base xl:text-lg 2xl:text-[18px] leading-[1.7]">
                Наші студенти отримують актуальні знання та практичний досвід у IT, аналітиці, управлінні й підприємництві. Співпраця з провідними компаніями дає їм конкурентні переваги у світі технологій та бізнесу.
              </p>
            </div>

            {/* Right Column - Blue Sphere Image */}
            <div className="hidden lg:flex justify-end">
              <img
                src="/images/Home/sphere.jpg"
                alt="Abstract 3D sphere"
                className="w-full xl:w-80 2xl:w-[420px] h-auto object-contain mix-blend-lighten"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};