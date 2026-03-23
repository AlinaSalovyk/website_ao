import { lazy, Suspense, useEffect, useRef, type JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { InnovationsBadge } from "@/components/ui/InnovationsBadge";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";

const ParticleCanvas = lazy(() =>
  import("@/components/effects/ParticleCanvas").then((m) => ({
    default: m.ParticleCanvas,
  })),
);

export const HeroWithAbout = ({ locale }: { locale?: Locale }): JSX.Element => {
  const t = getTranslations(locale);

  const tags = t.home.hero.tags;
  const ctaLine = t.home.hero.ctaLine;
  const titleLines = [t.home.hero.titleLine];
  const shapeRef = useRef<HTMLDivElement>(null);

  /* Parallax effect on the 3D chrome shape — moves slower on scroll */
  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (shapeRef.current) {
          const scrollY = window.scrollY;
          shapeRef.current.style.transform = `translate(-25%, 0) translateY(${scrollY * 0.15}px)`;
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* Flat index counter for stagger delays */
  let wordIndex = 0;

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Gradient */}
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

      {/* 3D Chrome Shape — with parallax effect */}
      <div
        ref={shapeRef}
        className="absolute -top-0 left-1/2 -translate-x-1/4 w-[400px] md:w-[600px] xl:w-[900px] 2xl:w-[1250px] h-auto xl:h-[600px] 2xl:h-[780px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:400ms] parallax-slow"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 10%, transparent 90%)",
        }}
      >
        <img
          className="w-full h-full object-contain"
          alt="Element black chrome"
          src="/images/Home/3d-black-chrome-shape.webp"
          width={800}
          height={834}
          fetchPriority="high"
          decoding="async"
          style={{
            filter: "hue-rotate(-20deg) brightness(1.55) saturate(2.0)",
          }}
        />
      </div>

      {/* Hero Title — stagger-animated words */}
      <div className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[calc(100vh-80px)] max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col justify-end items-center pb-0 lg:pb-2 z-10">
        <div
          className="relative z-10 pt-48 lg:pt-32 w-full flex flex-col items-center text-center"
          style={{ perspective: "600px" }}
        >
          {/* Main Call to Action Line */}
          <div className="flex justify-center items-baseline w-full flex-wrap gap-x-3 md:gap-x-4 gap-y-1 md:gap-y-2 mb-2 md:mb-4 lg:mb-4">
            {ctaLine.map((word) => {
              const delay = wordIndex * 120;
              wordIndex++;
              return (
                <span
                  key={word}
                  className="font-bold text-4xl md:text-5xl lg:text-6xl 2xl:text-[80px] leading-[1.05] tracking-[-0.02em] gradient-text-hero-call"
                  style={{
                    opacity: 0,
                    animation: `hero-word-enter 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards, gradient-shift 7s ease-in-out infinite`,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>

          {/* Sub lines */}
          {titleLines.map((line, lineIdx) => (
            <div
              key={lineIdx}
              className="flex justify-center items-baseline w-full flex-wrap gap-x-2 md:gap-x-3 gap-y-1 md:gap-y-2"
            >
              {line.map((word) => {
                const delay = wordIndex * 120;
                wordIndex++;
                return (
                  <span
                    key={word}
                    className="font-bold text-pure-white text-3xl md:text-4xl lg:text-5xl 2xl:text-[64px] leading-[1.05] tracking-[-0.02em]"
                    style={{
                      opacity: 0,
                      animation: `hero-word-enter 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ))}
          <div
            className="mt-6 md:mt-12"
            style={{
              opacity: 0,
              animation: `hero-word-enter 1s cubic-bezier(0.16,1,0.3,1) ${wordIndex * 120 + 200}ms forwards`,
            }}
          >
            <InnovationsBadge locale={locale} />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="relative w-full pt-16 md:pt-24 pb-10 md:pb-16 mt-4 lg:mt-8">
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9">
          {/* Blue Line + Glassmorphism Tags */}
          <ScrollReveal variant="fade-up" duration={600}>
            <div className="mb-8 md:mb-12">
              <div className="w-full h-[1px] bg-pure-white/60 mb-4 md:mb-6"></div>
              {/* Tags with glassmorphism background */}
              <div className="flex items-center flex-wrap gap-y-2 glass-panel rounded-xl px-3 md:px-4 py-2.5 md:py-3">
                {tags.map((tag, index) => (
                  <div key={index} className="flex items-center">
                    <span className="inline-flex items-center gap-1.5 md:gap-2">
                      <span className="w-1 h-1 xl:w-1.5 xl:h-1.5 2xl:w-[5px] 2xl:h-[5px] bg-pure-white rounded-full flex-shrink-0"></span>
                      <span className="font-medium text-pure-white text-[8px] md:text-[9px] xl:text-[10px] 2xl:text-[11px] tracking-[0.1em] uppercase">
                        {tag}
                      </span>
                    </span>
                    <span className="text-pure-white mx-2 md:mx-4 text-xs">
                      /
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Description Section with Image */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 items-center">
            {/* Left Column - Text */}
            <div className="flex flex-col gap-6 md:gap-8 w-full border-l-[3px] border-brand-blue-light/30 pl-5 md:pl-8 py-2">
              <p className="text-pure-white/90 text-lg md:text-xl xl:text-2xl 2xl:text-3xl leading-[1.6] md:leading-[1.7] font-light tracking-wide">
                {t.home.hero.aboutParagraph1}
              </p>
              <p className="text-pure-white/90 text-lg md:text-xl xl:text-2xl 2xl:text-3xl leading-[1.6] md:leading-[1.7] font-light tracking-wide">
                {t.home.hero.aboutParagraph2}
              </p>
            </div>

            {/* Right Column - Image with zoom effect */}
            <ScrollReveal
              variant="fade-left"
              delay={300}
              className="hidden lg:flex justify-end"
            >
              <div className="img-zoom-container rounded-2xl shadow-lg overflow-hidden">
                <img
                  src="/images/Home/pexels-mikae.webp"
                  alt={t.home.hero.studentsWorking}
                  className="w-full xl:w-[300px] 2xl:w-[400px] aspect-[3/4] object-cover"
                  width={800}
                  height={1067}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
