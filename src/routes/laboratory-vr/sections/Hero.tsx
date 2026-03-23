import type { JSX } from "react";

import { ParticleCanvas } from "@/components/effects/ParticleCanvas";
import { InnovationsBadge } from "@/components/ui/InnovationsBadge";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

export const Hero = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Gradients & Images */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms] bg-black" />

      {/* Interactive Particle Canvas */}
      <div className="absolute inset-0 pointer-events-none z-[2]">
        <ParticleCanvas
          particleColor="rgba(100, 160, 255, 0.5)"
          lineColor="rgba(100, 160, 255, 0.12)"
          maxParticles={120}
          connectionDistance={140}
          mouseRadius={180}
        />
      </div>

      <div
        className="absolute -top-0 left-1/2 -translate-x-1/4 w-[600px] xl:w-[900px] 2xl:w-[1250px] h-auto xl:h-[600px] 2xl:h-[780px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:400ms]"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 10%, transparent 90%)",
        }}
      >
        <img
          className="w-full h-full object-contain"
          alt=""
          role="presentation"
          aria-hidden="true"
          src="/images/Home/3d-black-chrome-shape.webp"
          style={{ filter: "hue-rotate(-30deg) brightness(1.2) saturate(2.0)" }}
          decoding="async"
          fetchPriority="high"
          width={1401}
          height={1462}
        />
      </div>

      {/* Hero Title */}
      <div className="relative min-h-[500px] lg:min-h-[calc(100vh-80px)] max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col justify-end pb-4 lg:pb-6 z-10 translate-y-0 animate-fade-in opacity-0 [--animation-delay:200ms] mt-16 lg:mt-24">
        <div className="relative z-10 pt-32 lg:pt-0">
          <h1 className="font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
            {t.laboratoryVr.hero.title}
          </h1>

          <InnovationsBadge locale={locale} className="mt-8" />
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
              {t.laboratoryVr.hero.tags.map((tag) => (
                <div key={tag} className="flex items-center">
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
              <p className="text-pure-white text-lg md:text-xl lg:text-[22px] xl:text-2xl 2xl:text-[26px] leading-[1.6]">
                {t.laboratoryVr.hero.paragraph1}
              </p>
              <p className="text-pure-white text-lg md:text-xl lg:text-[22px] xl:text-2xl 2xl:text-[26px] leading-[1.6] text-white/80">
                {t.laboratoryVr.hero.paragraph2}
              </p>
            </div>

            {/* Right Column - Image */}
            <div className="hidden lg:flex justify-end w-full">
              <div className="w-full max-w-[400px] 2xl:max-w-[460px] h-auto aspect-[480/678] relative overflow-hidden rounded-[20px]">
                <img
                  src="/images/Labs/laboratory-vr-hero-img.webp"
                  alt="VR laboratory visualization"
                  className="w-full h-full object-cover mix-blend-lighten opacity-90"
                  loading="lazy"
                  decoding="async"
                  width={736}
                  height={1040}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
