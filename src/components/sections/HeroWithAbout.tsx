import { lazy, Suspense, type JSX } from "react";

const ParticleCanvas = lazy(() =>
  import("@/components/effects/ParticleCanvas").then((m) => ({
    default: m.ParticleCanvas,
  })),
);
import type { HeroWithAboutData } from "@/components/sections/hero-with-about.types";
import { InnovationsBadge } from "@/components/ui/InnovationsBadge";
import type { Locale } from "@/i18n";

interface HeroWithAboutProps {
  data: HeroWithAboutData;
  locale?: Locale;
}

const defaultShapeImage = {
  src: "/images/IT/3D Black Chrome Shape1.webp",
  alt: "Element black chrome",
  width: 1426,
  height: 1456,
};

export const HeroWithAbout = ({
  data,
  locale,
}: HeroWithAboutProps): JSX.Element => {
  const {
    heroTitle,
    heroDescription,
    cta,
    breadcrumbLabel,
    aboutParagraphs,
    aboutImage,
    sectionId = "about",
    backgroundShapeImage = defaultShapeImage,
    backgroundShapeFilter = "hue-rotate(-50deg) brightness(1.0) saturate(9.0)",
  } = data;

  return (
    <section className="relative w-full overflow-hidden">
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

      <div
        className="absolute -top- left-1/2 -translate-x-1/4 w-[600px] xl:w-[900px] 2xl:w-[1250px] h-auto xl:h-[600px] 2xl:h-[780px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:400ms]"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 10%, transparent 90%)",
        }}
      >
        <img
          className="w-full h-full object-contain"
          alt={backgroundShapeImage.alt}
          src={backgroundShapeImage.src}
          style={{ filter: backgroundShapeFilter }}
          decoding="async"
          fetchPriority="high"
          width={backgroundShapeImage.width ?? 1426}
          height={backgroundShapeImage.height ?? 1456}
        />
      </div>

      <div className="relative min-h-[500px] lg:min-h-[calc(113vh-80px)] max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col justify-end pb-4 lg:pb-1 z-10 translate-y-0 animate-fade-in opacity-0 [--animation-delay:200ms]">
        <div className="relative z-10 pt-80 lg:pt-0">
          <div className="flex justify-start items-baseline w-full flex-wrap gap-x-3 gap-y-2 mb-8">
            <h1 className="font-bold text-pure-white text-5xl md:text-6xl lg:text-7xl 2xl:text-[100px] leading-[1.0] tracking-[-0.02em]">
              {heroTitle}
            </h1>
          </div>

          <InnovationsBadge locale={locale} className="mb-8" />

          <div className="w-full h-[0.9px] bg-pure-white/35 mb-10"></div>

          <div className="flex flex-col md:flex-row justify-between items-end w-full gap-8 mt-8">
            <p className="max-w-xl text-sm md:text-base leading-relaxed text-gray-200 ml-1">
              {heroDescription}
            </p>

            <div className="flex flex-col w-auto min-w-[200px] mb-6">
              <a
                href={cta.href}
                className="group flex items-center justify-between w-full pb-5 border-b border-pure-white text-pure-white text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                <span>{cta.label}</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        id={sectionId}
        className="relative w-full py-16 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]"
      >
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-15 items-center">
            <div className="flex flex-col gap-4 lg:gap-5 w-full">
              <div className="mb-2">
                <div className="flex items-center flex-wrap gap-y-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-1 h-1 xl:w-1.5 xl:h-1.5 2xl:w-[5px] 2xl:h-[5px] bg-pure-white rounded-full flex-shrink-0"></span>
                      <span className="font-medium text-pure-white text-[9px] xl:text-[10px] 2xl:text-[11px] tracking-[0.1em] uppercase">
                        {breadcrumbLabel}
                      </span>
                    </span>
                    <span className="text-pure-white mx-2 text-xs">/</span>
                  </div>
                </div>
              </div>

              <div className="text-2xl md:text-3xl lg:text-4xl font-normal leading-relaxed text-gray-100">
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={index} className={index === 0 ? "mb-8" : ""}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex justify-end -translate-y-12">
              <img
                src={aboutImage.src}
                alt={aboutImage.alt}
                className="w-full xl:w-[300px] 2xl:w-[400px] aspect-[3/4] object-cover rounded-2xl shadow-lg"
                loading="lazy"
                decoding="async"
                width={aboutImage.width ?? 4096}
                height={aboutImage.height ?? 2732}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
