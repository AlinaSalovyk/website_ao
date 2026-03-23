import { lazy, Suspense, type JSX } from "react";

import { InnovationsBadge } from "@/components/ui/InnovationsBadge";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const ParticleCanvas = lazy(() =>
  import("@/components/effects/ParticleCanvas").then((m) => ({
    default: m.ParticleCanvas,
  })),
);
export const InstituteHero = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  return (
    <section className="relative w-full overflow-hidden -mt-24 md:-mt-28">
      {/* Background Gradients & Images */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms] bg-hero-gradient" />

      {/* Interactive Particle Canvas */}
      <div className="absolute inset-0 pointer-events-none z-[2]">
        <Suspense fallback={null}>
          <ParticleCanvas
            particleColor="rgba(100, 160, 255, 0.5)"
            lineColor="rgba(100, 160, 255, 0.12)"
            maxParticles={120}
            connectionDistance={140}
            mouseRadius={180}
          />
        </Suspense>
      </div>

      <div className="relative z-10 w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col pt-70 lg:pt-90 pb-10 lg:pb-16">
        {/* Title Section */}
        <h1 className="flex flex-col w-full mb-8 font-bold text-4xl md:text-4xl lg:text-7xl xl:text-8xl leading-[1.1] tracking-[-0.02em] uppercase text-left">
          <span>{t.institute.hero.title}</span>
          <span className="text-gray-200">{t.institute.hero.subtitle}</span>
        </h1>

        <InnovationsBadge
          locale={locale}
          className="mb-8 animate-fade-in opacity-0 [--animation-delay:200ms]"
        />

        <div className="w-full h-[1px] bg-white/20 mb-8"></div>

        <p className="text-xs md:text-sm text-white max-w-3xl mb-20 leading-relaxed opacity-80">
          {t.institute.hero.tagline}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1.9fr_1fr] gap-10 lg:gap-32 items-start">
          <div className="flex flex-col gap-10">
            <a
              href="#general-info"
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-white mb-2 hover:text-blue-400 transition-colors text-left"
            >
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <span>{t.institute.hero.aboutUs}</span>
            </a>

            <div className="flex flex-col gap-8">
              <p className="text-xl md:text-2xl lg:text-3xl leading-snug text-white">
                {t.institute.hero.paragraph1}
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl leading-snug text-white">
                {t.institute.hero.paragraph2}
              </p>
            </div>
          </div>

          <div className="hidden lg:block relative w-full xl:w-[320px] 2xl:w-[400px] aspect-[3/4] rounded-xl overflow-hidden lg:-mt-20 mx-auto animate-fade-in opacity-0 [--animation-delay:400ms]">
            <img
              src="/images/IT/ScientificActivity.webp"
              alt="Digital Innovation"
              className="w-full h-full object-cover"
              decoding="async"
              fetchPriority="high"
              width={2731}
              height={4096}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
