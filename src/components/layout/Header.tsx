import { useState, useEffect, useRef, useCallback, type ReactNode, type JSX } from "react";

import { Menu } from "@/routes/Menu/Menu";
import { Logo } from "@/components/icons/Logo";

interface HeaderProps {
  variant?: "default" | "light";
  headerPosition?: "relative" | "absolute";
  customLogo?: ReactNode;
  logoSrc?: string;
}

const SCROLL_THRESHOLD = 50;

export const Header = ({
  variant = "default",
  headerPosition = "relative",
  customLogo,
  logoSrc,
}: HeaderProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollState, setScrollState] = useState<"top" | "hidden" | "visible">("top");
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY <= SCROLL_THRESHOLD) {
      setScrollState("top");
    } else if (currentScrollY > lastScrollY.current) {
      setScrollState("hidden");
    } else {
      setScrollState("visible");
    }

    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const isSticky = scrollState !== "top";
  const isRelativeHeader = headerPosition === "relative";

  const positionClass = isSticky
    ? isRelativeHeader
      ? `sticky top-0 left-0 ${scrollState === "visible" ? "translate-y-0" : "-translate-y-full"}`
      : `fixed top-0 left-0 ${scrollState === "visible" ? "translate-y-0" : "-translate-y-full"}`
    : headerPosition;

  const bgClass = isSticky
    ? variant === "light"
      ? "bg-pure-white/80 backdrop-blur-md shadow-sm"
      : "bg-layout-bg/80 backdrop-blur-md shadow-sm"
    : "";

  return (
    <>
      {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}
      <header
        className={`${positionClass} ${bgClass} w-full flex justify-between items-center px-4 md:px-9 py-5 z-50 transition-transform duration-300`}
      >
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`rounded-xl border p-2 flex items-center justify-center transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 text-white hover:bg-white/10"}`}
          aria-label="Відкрити меню"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 8H19M5 12H19M5 16H19"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex justify-center flex-1 md:flex-none">
          <a aria-label="Головна сторінка" href="/" className="inline-block cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
            {customLogo ??
              (logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Логотип Інституту інформаційних технологій та бізнесу НаУОА"
                  className="h-8 md:h-10 w-auto"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  width={83}
                  height={32}
                />
              ) : (
                <Logo className="h-7 sm:h-9 md:h-10 w-auto" />
              ))}
          </a>
        </div>

        <a
          href="/contacts"
          className={`rounded-[20px] border px-3 md:px-5 py-2 uppercase text-[11px] tracking-normal md:tracking-[0.15em] font-medium transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 bg-transparent text-white hover:bg-white/10"}`}
        >
          КОНТАКТИ
        </a>
      </header>
    </>
  );
};
