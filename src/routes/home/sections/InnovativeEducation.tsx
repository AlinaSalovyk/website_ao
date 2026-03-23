import { motion } from "motion/react";
import type { JSX } from "react";

import { AnimatedCounter } from "@/components/effects/AnimatedCounter";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";

export const InnovativeEducation = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);

  const statsData = t.home.innovation.stats.map((stat, index) => ({
    number: stat.number,
    description: stat.description,
    colSpan:
      index === 0
        ? "lg:col-span-2"
        : index === 1
          ? "lg:col-span-1"
          : "lg:col-span-3",
    bgVariant:
      index === 0
        ? "bg-blue-50/50 hover:bg-blue-50/80"
        : index === 1
          ? "bg-indigo-50/50 hover:bg-indigo-50/80"
          : "bg-purple-50/40 hover:bg-purple-50/60",
  }));

  return (
    <section className="w-full bg-[#fcfcfd] flex flex-col relative overflow-hidden py-16 md:py-20">
      {/* Premium Animated Background Layer with Glass Noise */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/15 blur-[120px] animate-slow-spin" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[140px] animate-slow-spin-reverse" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-purple-500/15 blur-[100px] animate-pulse-slow" />

        {/* Premium Texture Overlay (Noise) */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="flex flex-col mx-auto w-full h-full items-start px-4 md:px-9 relative z-10 max-w-7xl 2xl:max-w-screen-2xl">
        {/* Header Section */}
        <ScrollReveal variant="fade-up" className="w-full">
          <header className="flex flex-col items-start relative w-full gap-4 md:gap-6 mb-10 lg:mb-12">
            <div className="w-full overflow-hidden">
              <h2 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-[clamp(1.75rem,7vw,6.5rem)] tracking-tight leading-[1.05] drop-shadow-sm uppercase whitespace-nowrap">
                {t.home.innovation.heading}
              </h2>
            </div>
            <Separator className="w-full bg-gradient-to-r from-blue-600 via-indigo-400 to-transparent h-[2px] opacity-20" />
            <p className="max-w-lg lg:max-w-2xl font-light text-gray-600 text-base md:text-lg lg:text-xl tracking-wide leading-relaxed">
              {(() => {
                const desc: string = t.home.innovation.description;
                const tech: string = t.home.innovation.descriptionTech;
                const biz: string = t.home.innovation.descriptionBusiness;
                const analytics: string =
                  t.home.innovation.descriptionAnalytics;

                const parts: (string | JSX.Element)[] = [];
                let remaining: string = desc;

                const techIdx = remaining.indexOf(tech);
                if (techIdx !== -1) {
                  parts.push(remaining.substring(0, techIdx));
                  parts.push(
                    <span key="tech" className="font-semibold text-blue-700">
                      {tech}
                    </span>,
                  );
                  remaining = remaining.substring(techIdx + tech.length);
                }

                const bizIdx = remaining.indexOf(biz);
                if (bizIdx !== -1) {
                  parts.push(remaining.substring(0, bizIdx));
                  parts.push(
                    <span key="biz" className="font-semibold text-indigo-700">
                      {biz}
                    </span>,
                  );
                  remaining = remaining.substring(bizIdx + biz.length);
                }

                const analyticsIdx = remaining.indexOf(analytics);
                if (analyticsIdx !== -1) {
                  parts.push(remaining.substring(0, analyticsIdx));
                  parts.push(
                    <span
                      key="analytics"
                      className="font-semibold text-purple-700"
                    >
                      {analytics}
                    </span>,
                  );
                  remaining = remaining.substring(
                    analyticsIdx + analytics.length,
                  );
                }

                parts.push(remaining);
                return parts;
              })()}
            </p>
          </header>
        </ScrollReveal>

        {/* Bento Grid Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 w-full mt-8 flex-1">
          {statsData.map((stat, index) => (
            <ScrollReveal
              key={index}
              variant="fade-up"
              delay={index * 150}
              className={cn("w-full h-full", stat.colSpan)}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full"
              >
                <Card
                  className={cn(
                    "flex flex-col h-full w-full border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_20px_40px_rgba(79,70,229,0.15)] transition-all duration-500 backdrop-blur-2xl rounded-[2rem] overflow-hidden group relative",
                    stat.bgVariant,
                  )}
                >
                  <CardContent className="flex flex-col justify-between h-full p-6 md:p-8 lg:p-10 relative z-10">
                    {/* Subtle internal animated gradient glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2rem] pointer-events-none" />

                    {/* Decorative premium glass reflection across the top */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-50" />

                    <div className="flex items-start w-full mb-4 lg:mb-8 relative">
                      <AnimatedCounter
                        value={stat.number}
                        duration={2000 + index * 500}
                        className="font-bold text-pure-black text-6xl md:text-7xl lg:text-[6rem] xl:text-[7rem] tracking-tighter leading-none"
                      />
                      {/* Decorative plus/hash accent */}
                      <span className="absolute -top-3 -right-3 md:-top-4 md:-right-6 text-blue-600/10 font-black text-6xl md:text-7xl lg:text-[8rem] select-none pointer-events-none">
                        {stat.number.replace(/[0-9]/g, "") ||
                          stat.number.charAt(0)}
                      </span>
                    </div>

                    <p className="font-medium text-gray-700 text-base md:text-lg lg:text-xl tracking-normal leading-relaxed relative max-w-[90%]">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
