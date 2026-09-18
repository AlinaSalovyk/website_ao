import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { Menu } from "@/routes/Menu/Menu";
import { HeaderBrand } from "./header/HeaderBrand";
import { DesktopNav } from "./header/DesktopNav";
import { HeaderActions } from "./header/HeaderActions";
import { getHeaderNavigation } from "./header/headerNavigation";

interface HeaderProps {
  variant?: "default" | "light";
  headerPosition?: "relative" | "absolute";
  customLogo?: ReactNode;
  logoSrc?: string;
  locale?: Locale;
  currentPath?: string;
  hasEnglishTranslation?: boolean;
}

const SCROLL_THRESHOLD = 40;

export const Header = ({
  variant = "default",
  headerPosition = "relative",
  customLogo,
  logoSrc,
  locale = "uk",
  currentPath = "/",
  hasEnglishTranslation,
}: HeaderProps): JSX.Element => {
  const t = getTranslations(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollState, setScrollState] = useState<"top" | "hidden" | "visible">(
    "top"
  );
  const lastScrollY = useRef(0);

  // Lock body scroll when drawer menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleScroll = useCallback(() => {
    if (isMenuOpen) return;
    const currentScrollY = window.scrollY;

    const next: "top" | "hidden" | "visible" =
      currentScrollY <= SCROLL_THRESHOLD
        ? "top"
        : currentScrollY > lastScrollY.current
        ? "hidden"
        : "visible";

    setScrollState((prev) => (prev === next ? prev : next));
    lastScrollY.current = currentScrollY;
  }, [isMenuOpen]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    lastScrollY.current = window.scrollY;
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const isSticky = scrollState !== "top";
  const isLight = variant === "light";

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetHash?: string
  ) => {
    if (targetHash && typeof window !== "undefined") {
      const isHome =
        window.location.pathname === "/" ||
        window.location.pathname === "/en/";
      if (isHome) {
        const el = document.querySelector(targetHash);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const navDropdowns = getHeaderNavigation(t, locale);

  return (
    <>
      {isMenuOpen && (
        <Menu onClose={() => setIsMenuOpen(false)} locale={locale} />
      )}

      {/* Floating Header Capsule Outer Container */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none ${
          scrollState === "hidden" ? "-translate-y-full" : "translate-y-0"
        } ${isSticky ? "pt-3 px-3 sm:px-6" : "pt-0 px-0"}`}
      >
        <header
          className={`pointer-events-auto transition-all duration-300 mx-auto flex items-center justify-between ${
            isSticky
              ? `w-full max-w-6xl rounded-full py-3 px-5 md:px-7 shadow-xl border backdrop-blur-xl ${
                  isLight
                    ? "bg-white/90 border-slate-200/90 text-slate-900 shadow-slate-200/50"
                    : "bg-slate-950/90 border-white/15 text-white shadow-slate-950/40"
                }`
              : `w-full px-4 sm:px-8 md:px-10 py-5 sm:py-6 ${
                  headerPosition === "absolute" ? "absolute top-0 left-0" : "relative"
                } ${
                  isLight
                    ? "bg-white/90 border-b border-slate-200/80 text-slate-900"
                    : "bg-transparent text-white"
                }`
          }`}
        >
          {/* Brand & Logo */}
          <HeaderBrand
            isLight={isLight}
            isSticky={isSticky}
            onOpenMenu={() => setIsMenuOpen(true)}
            customLogo={customLogo}
            logoSrc={logoSrc}
            locale={locale}
          />

          {/* Desktop Navigation Links */}
          <DesktopNav
            navDropdowns={navDropdowns}
            isLight={isLight}
            currentPath={currentPath}
            onNavClick={handleNavClick}
          />

          {/* Actions & CTA */}
          <HeaderActions
            isLight={isLight}
            locale={locale}
            currentPath={currentPath}
            hasEnglishTranslation={hasEnglishTranslation}
          />
        </header>
      </div>
    </>
  );
};
