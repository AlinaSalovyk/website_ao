/**
 * Footer — Gooey liquid footer with animated particles at the top edge,
 * preserving all original footer content (cards, contacts, nav, socials, copyright).
 * Uses SVG filter for the liquid/metaball effect and CSS animations for particles.
 */
import { useEffect, useRef, type JSX } from "react";

import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { getSocialIcons } from "@/components/icons/SocialIcons";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import { SOCIAL_URLS } from "@/lib/social-links";
import { ArrowUpRight } from "lucide-react";

interface FooterProps {
  hideMainContent?: boolean;
  locale?: Locale;
}

const useGooeyParticles = (
  containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const generateParticles = () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Responsive particle density based on screen width
      const width = typeof window !== "undefined" ? window.innerWidth : 1280;
      let count = 35; // Mobile default (lightweight, clean)
      if (width >= 1920) {
        count = 90; // Ultra-wide 2K/4K (rich, dense, lively)
      } else if (width >= 1440) {
        count = 80; // Large Desktop
      } else if (width >= 1024) {
        count = 65; // Laptop / Desktop
      } else if (width >= 768) {
        count = 50; // Tablet
      }

      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const span = document.createElement("span");
        span.classList.add("gooey-particle");
        // Quantize subpixel parameters to clean steps to eliminate subpixel rounding jitter
        const size = (1.8 + Math.floor(Math.random() * 8) * 0.4).toFixed(1);
        const [distMin, distMax] =
          width >= 1920 ? [8, 10]        // Ultra-wide — full range 
            : width >= 1440 ? [8, 13]      // Large Desktop
              : width >= 1024 ? [2, 2]      // Laptop / Desktop
                : width >= 768 ? [8, 10]       // Tablet 
                  : [2, 4];                       // Mobile 
        const distance = parseFloat((distMin + Math.random() * (distMax - distMin)).toFixed(1));
        const position = (Math.round((Math.random() * 100) * 10) / 10).toFixed(1);
        const time = (3.5 + Math.round(Math.random() * 45) / 10).toFixed(1);
        const delay = (-1 * (Math.round(Math.random() * 100) / 10)).toFixed(1);
        span.style.setProperty("--dim", `${size}rem`);
        span.style.setProperty("--uplift", `${distance}rem`);
        span.style.setProperty("--pos-x", `${position}%`);
        span.style.setProperty("--dur", `${time}s`);
        span.style.setProperty("--delay", `${delay}s`);
        span.style.bottom = "3rem";
        fragment.appendChild(span);
      }
      container.appendChild(fragment);
    };

    generateParticles();

    let currentBucket =
      window.innerWidth >= 1920
        ? "wide"
        : window.innerWidth >= 1440
          ? "desktop-large"
          : window.innerWidth >= 1024
            ? "desktop"
            : window.innerWidth >= 768
              ? "tablet"
              : "mobile";

    const handleResize = () => {
      const w = window.innerWidth;
      const newBucket =
        w >= 1920
          ? "wide"
          : w >= 1440
            ? "desktop-large"
            : w >= 1024
              ? "desktop"
              : w >= 768
                ? "tablet"
                : "mobile";
      if (newBucket !== currentBucket) {
        currentBucket = newBucket;
        generateParticles();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [containerRef]);
};

export const Footer = ({
  hideMainContent = false,
  locale = "uk",
}: FooterProps): JSX.Element => {
  const t = getTranslations(locale);

  const navigationItems = [
    {
      label: t.footer.navHome,
      href: getLocalizedPath("/", locale),
    },
    {
      label: t.footer.navAbout,
      href: getLocalizedPath("/institute", locale),
    },
    {
      label: t.footer.navPrograms,
      href: getLocalizedPath("/", locale) + "#educational-programs",
    },
    {
      label: t.footer.navNews,
      href: getLocalizedPath("/news", locale),
    },
  ];

  // Links synced directly from global configuration
  const footerSocialLinkByAlt: Partial<
    Record<"Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "YouTube", string>
  > = {
    Instagram: SOCIAL_URLS.instagram,
    Facebook: SOCIAL_URLS.facebook,
    TikTok: SOCIAL_URLS.tiktok,
  };

  const footerVisibleSocials = Object.keys(footerSocialLinkByAlt) as (
    | "Instagram"
    | "Facebook"
    | "LinkedIn"
    | "TikTok"
    | "YouTube"
  )[];

  const footerSocials = getSocialIcons(
    "fill-white",
    "fill-transparent",
    "size-full",
    footerVisibleSocials,
  );

  const particleContainerRef = useRef<HTMLDivElement>(null);

  useGooeyParticles(particleContainerRef);

  return (
    <div
      className="w-full relative z-0 bg-transparent"
      style={{ overflowX: "clip", overflowY: "visible" }}
    >
      <div className="w-full pt-[5rem] md:pt-[6rem] relative">
        <footer
          className="w-full relative flex flex-col items-center pt-16 md:pt-24 pb-6"
          style={
            {
              "--footer-color": "var(--color-brand-blue)",
              background:
                "linear-gradient(180deg, var(--footer-color) 0%, var(--color-footer-gradient-mid) 30%, var(--color-pure-black) 100%)",
            } as React.CSSProperties
          }
        >
          {/* Gooey Liquid Top Animation & Solid Blue Surface */}
          <div
            className="absolute top-0 w-[120%] left-[-10%] h-[5.2rem] md:h-[6.2rem] pointer-events-none"
            style={{
              filter: "url('#liquid-effect')",
              WebkitFilter: "url('#liquid-effect')",
              transform: "translateY(-98%)",
              background: "var(--footer-color, #0e52ff)",
              zIndex: 0,
              overflow: "visible",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div
              ref={particleContainerRef}
              className="w-full h-full relative"
              style={{ overflow: "visible" }}
            />
          </div>

          <svg
            className="absolute pointer-events-none opacity-0 w-0 h-0 overflow-hidden"
            width="0"
            height="0"
            aria-hidden="true"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter
                id="liquid-effect"
                x="-20%"
                y="-300%"
                width="140%"
                height="500%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="6"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6"
                  result="liquid"
                />
              </filter>
            </defs>
          </svg>

          <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9 relative z-10 flex flex-col gap-16 md:gap-24">
            {/* Embedded Contact/Info Cards */}
            {!hideMainContent && (
              <ScrollReveal variant="fade-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full">
                  {/* Card 1: About */}
                  <a
                    href={getLocalizedPath("/institute", locale)}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[340px] hover:bg-white/15 transition-colors duration-500 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    <div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-6">
                        {t.footer.aboutBadge}
                      </div>
                      <p className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight">
                        {t.footer.aboutHeadingLines.map((line, i) => (
                          <span key={i}>
                            {i > 0 && <br className="hidden md:block" />}
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed mt-10 md:mt-12 font-medium">
                      {t.footer.aboutDescription}
                    </p>
                  </a>

                  {/* Card 2: Contact CTA */}
                  <a
                    href={getLocalizedPath("/contacts", locale)}
                    className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[340px] hover:border-white/40 transition-colors duration-500 group shadow-xl relative overflow-hidden isolate no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none -z-10 group-hover:bg-white/20 transition-colors duration-700" />

                    <div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-6">
                        {t.footer.ctaBadge}
                      </div>
                      <p className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight">
                        {t.footer.ctaHeadingLines.map((line, i) => (
                          <span key={i}>
                            {i > 0 && <br className="hidden md:block" />}
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>

                    <div className="flex flex-row items-end justify-between mt-10 md:mt-12">
                      <span
                        className="text-5xl md:text-6xl lg:text-7xl font-normal text-white/40 tracking-tighter select-none"
                        style={{ whiteSpace: "pre-line" }}
                        aria-hidden="true"
                      >
                        {t.footer.ctaDecoration}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-white text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xl shrink-0"
                      >
                        <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8" />
                      </span>
                    </div>
                  </a>
                </div>
              </ScrollReveal>
            )}

            {/* Footer Navigation & Details */}
            <div className="flex flex-col w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 justify-between w-full">
                {/* Nav */}
                <nav aria-label={t.footer.navAriaLabel} className="flex flex-col gap-4">
                  <p className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest">
                    {t.footer.navigation}
                  </p>
                  <div className="flex flex-col gap-3">
                    {navigationItems.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.href}
                        className="text-white hover:text-brand-blue-soft text-sm font-medium transition-colors duration-300 w-fit"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </nav>

                {/* Contacts */}
                <div className="flex flex-col gap-4">
                  <p className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest">
                    {t.footer.contactsLabel}
                  </p>
                  <div className="flex flex-col gap-3">
                    <a
                      href="https://www.oa.edu.ua"
                      className="text-white hover:text-brand-blue-soft text-sm font-medium transition-colors duration-300 w-fit"
                    >
                      www.oa.edu.ua
                    </a>
                    <a
                      href="mailto:press@oa.edu.ua"
                      className="text-white hover:text-brand-blue-soft text-sm font-medium transition-colors duration-300 w-fit"
                    >
                      press@oa.edu.ua
                    </a>
                    <a
                      href="tel:+380678792526"
                      className="text-white hover:text-brand-blue-soft text-sm font-medium transition-colors duration-300 w-fit"
                    >
                      +38 067 879 2526
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-4">
                  <p className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest">
                    {t.footer.address}
                  </p>
                  <a
                    href="https://maps.google.com/?q=35800+Ostroh+2+Seminarska+St"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-brand-blue-soft text-sm font-medium leading-relaxed transition-colors duration-300 w-fit"
                  >
                    {t.footer.addressLine1}
                    <br />
                    {t.footer.addressLine2}
                  </a>
                </div>

                {/* Socials */}
                <div className="flex flex-col gap-4 lg:items-end w-full">
                  <p className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest lg:text-right w-full">
                    {t.footer.socials}
                  </p>
                  <div className="flex items-center gap-4">
                    {footerSocials.map((icon, index) => {
                      const linkHref =
                        footerSocialLinkByAlt[
                        icon.alt as keyof typeof footerSocialLinkByAlt
                        ] || "#";
                      const isExternal = linkHref.startsWith("http");

                      return (
                        <a
                          key={index}
                          href={linkHref}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[1.5px] border-white/30 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all duration-300 group shadow-lg"
                          aria-label={icon.alt}
                        >
                          <div className="w-8 h-8 md:w-10 md:h-10 transition-all duration-300 flex items-center justify-center">
                            {icon.icon}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Separator className="w-full bg-white/15 mt-12 md:mt-16 mb-6" />

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                <span className="font-light text-white/50 text-[10px] md:text-xs tracking-wide text-center">
                  {t.footer.copyright} © {new Date().getFullYear()}
                </span>
                <button className="font-light text-white/50 text-[10px] md:text-xs tracking-wide hover:text-white transition-colors">
                  {t.common.cookiePreference}
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
