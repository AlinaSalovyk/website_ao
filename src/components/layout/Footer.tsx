/**
 * Footer — Gooey liquid footer with animated particles at the top edge,
 * preserving all original footer content (cards, contacts, nav, socials, copyright).
 * Uses SVG filter for the liquid/metaball effect and CSS animations for particles.
 */
import { getSocialIcons } from "@/components/icons/SocialIcons";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, type JSX } from "react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { ArrowUpRight } from "lucide-react";
import { SOCIAL_URLS } from "@/lib/social-links";

const navigationItems = [
  { label: "ГОЛОВНА", href: "/", isActive: true },
  { label: "ПРО ІНСТИТУТ", href: "/institute", isActive: false },
  { label: "ОСВІТНІ ПРОГРАМИ", href: "/#educational-programs", isActive: false },
  { label: "НОВИНИ ТА ПОДІЇ", href: "/#news", isActive: false },
];

interface FooterProps {
  hideMainContent?: boolean;
}

const useGooeyParticles = (containerRef: React.RefObject<HTMLDivElement | null>, count: number = 60) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.classList.add("gooey-particle");
      const size = 2 + Math.random() * 5;
      const distance = 8 + Math.random() * 12;
      const position = Math.random() * 100;
      const time = 3 + Math.random() * 4;
      const delay = -1 * (Math.random() * 10);
      span.style.setProperty("--dim", `${size}rem`);
      span.style.setProperty("--uplift", `${distance}rem`);
      span.style.setProperty("--pos-x", `${position}%`);
      span.style.setProperty("--dur", `${time}s`);
      span.style.setProperty("--delay", `${delay}s`);
      fragment.appendChild(span);
    }
    container.appendChild(fragment);

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [containerRef, count]);
};

export const Footer = ({ hideMainContent = false }: FooterProps): JSX.Element => {

  // Links synced directly from global configuration
  const footerSocialLinkByAlt: Partial<Record<"Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "YouTube", string>> = {
    Instagram: SOCIAL_URLS.instagram,
    Facebook: SOCIAL_URLS.facebook,
    TikTok: SOCIAL_URLS.tiktok,
  };

  const footerVisibleSocials = Object.keys(footerSocialLinkByAlt) as ("Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "YouTube")[];

  const footerSocials = getSocialIcons(
    "fill-white",
    "fill-transparent",
    "size-full",
    footerVisibleSocials
  );

  const particleContainerRef = useRef<HTMLDivElement>(null);

  useGooeyParticles(particleContainerRef, 120);

  return (
    <section
      className="w-full relative bg-transparent"
      style={{ overflowX: 'clip', overflowY: 'visible' }}
    >
      {/* Matches gooey height so the transition is flush without a black stripe gap */}
      <div className="w-full pt-[5rem] md:pt-[6rem] relative">
        <footer
          className="w-full relative flex flex-col items-center pt-16 md:pt-24 pb-6"
          style={{
            '--footer-color': 'var(--color-brand-blue)',
            background: 'linear-gradient(180deg, var(--footer-color) 0%, var(--color-footer-gradient-mid) 30%, var(--color-pure-black) 100%)'
          } as React.CSSProperties}
        >
          {/* Gooey Liquid Top Animation */}
          <div
            className="absolute top-0 w-[120%] left-[-10%] h-[5rem] md:h-[6rem] z-0 pointer-events-none"
            style={{
              filter: "url('#liquid-effect')",
              transform: 'translateY(-98%)',
              background: 'var(--footer-color)'
            }}
          >
            <div ref={particleContainerRef} className="w-full h-full relative" />
          </div>

          <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} version="1.1" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="liquid-effect">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="liquid" />
              </filter>
            </defs>
          </svg>

          <div className="w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-9 relative z-10 flex flex-col gap-16 md:gap-24">

            {/* Embedded Contact/Info Cards */}
            {!hideMainContent && (
              <ScrollReveal variant="fade-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full">

                  {/* Card 1: About */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[340px] hover:bg-white/15 transition-colors duration-500 shadow-xl">
                    <div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-6">
                        Про інститут
                      </div>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight">
                        Розвиток та Інновації <br className="hidden md:block" />в ІТ та Бізнесі
                      </h2>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed mt-10 md:mt-12 font-medium">
                      Бізнес й аналітика, Комп&apos;ютерні науки, Фінанси та банківська справа, Маркетинг, Менеджмент, Прикладна математика
                    </p>
                  </div>

                  {/* Card 2: Contact CTA */}
                  <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[340px] hover:border-white/40 transition-colors duration-500 group shadow-xl relative overflow-hidden isolate">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none -z-10 group-hover:bg-white/20 transition-colors duration-700" />

                    <div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-6">
                        Давай тримати контакт
                      </div>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight">
                        Нумо змінювати світ <br className="hidden md:block" /> разом з нами!
                      </h2>
                    </div>

                    <div className="flex flex-row items-end justify-between mt-10 md:mt-12">
                      <span className="text-5xl md:text-6xl lg:text-7xl font-normal text-white/40 tracking-tighter select-none">Start<br />Studying</span>
                      <a href="/contacts" aria-label="Зв'язатись з нами" className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-white text-blue-600 hover:scale-105 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-xl shrink-0">
                        <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8" />
                      </a>
                    </div>
                  </div>

                </div>
              </ScrollReveal>
            )}

            {/* Footer Navigation & Details */}
            <div className="flex flex-col w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 justify-between w-full">

                {/* Nav */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest">Навігація</h4>
                  <div className="flex flex-col gap-3">
                    {navigationItems.map((item, idx) => (
                      <a key={idx} href={item.href} className="text-white hover:text-brand-blue-soft text-sm font-medium transition-colors duration-300 w-fit">
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Contacts */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest">Контакти</h4>
                  <div className="flex flex-col gap-3">
                    <a href="https://www.oa.edu.ua" className="text-white hover:text-brand-blue-soft text-sm font-medium transition-colors duration-300 w-fit">www.oa.edu.ua</a>
                    <a href="mailto:press@oa.edu.ua" className="text-white hover:text-brand-blue-soft text-sm font-medium transition-colors duration-300 w-fit">press@oa.edu.ua</a>
                    <span className="text-white text-sm font-medium">+38 067 879 2526</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest">Адреса</h4>
                  <a
                    href="https://www.google.com/maps/place/...Острог"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-brand-blue-soft text-sm font-medium leading-relaxed transition-colors duration-300 w-fit"
                  >
                    35800, м. Острог<br />
                    вул. Семінарська, 2
                  </a>
                </div>

                {/* Socials */}
                <div className="flex flex-col gap-4 lg:items-end w-full">
                  <h4 className="text-white/50 font-semibold text-[10px] md:text-xs uppercase tracking-widest lg:text-right w-full">Соцмережі</h4>
                  <div className="flex items-center gap-4">
                    {footerSocials.map((icon, index) => {
                      const linkHref = footerSocialLinkByAlt[icon.alt as keyof typeof footerSocialLinkByAlt] || "#";
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
                  Національний університет &quot;Острозька академія&quot; © {new Date().getFullYear()}
                </span>
                <button className="font-light text-white/50 text-[10px] md:text-xs tracking-wide hover:text-white transition-colors">
                  Cookie Preference
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};