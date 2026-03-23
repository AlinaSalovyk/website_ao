import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";

import { Logo } from "@/components/icons/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";

const Menu = lazy(() =>
  import("@/routes/Menu/Menu").then((m) => ({ default: m.Menu })),
);

interface HeaderProps {
  variant?: "default" | "light";
  headerPosition?: "relative" | "absolute";
  customLogo?: ReactNode;
  logoSrc?: string;
  locale?: Locale;
  currentPath?: string;
}

const SCROLL_THRESHOLD = 50;

export const Header = ({
  variant = "default",
  headerPosition = "relative",
  customLogo,
  logoSrc = "/images/logo/logo-icon.webp",
  locale = "uk",
  currentPath = "/",
}: HeaderProps): JSX.Element => {
  const t = getTranslations(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollState, setScrollState] = useState<"top" | "hidden" | "visible">(
    "top",
  );
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    const next: "top" | "hidden" | "visible" =
      currentScrollY <= SCROLL_THRESHOLD
        ? "top"
        : currentScrollY > lastScrollY.current
          ? "hidden"
          : "visible";

    setScrollState((prev) => (prev === next ? prev : next));
    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    lastScrollY.current = window.scrollY;
    handleScroll();
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
      {isMenuOpen && (
        <Suspense fallback={null}>
          <Menu onClose={() => setIsMenuOpen(false)} locale={locale} />
        </Suspense>
      )}
      <header
        className={`${positionClass} ${bgClass} w-full flex justify-between items-center px-4 md:px-9 py-0 z-50 transition-transform duration-300`}
      >
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`rounded-xl border p-2 flex items-center justify-center transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 text-white hover:bg-white/10"}`}
          aria-label={t.common.openMenu}
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
          <a
            aria-label={t.common.homePage}
            href={getLocalizedPath("/", locale)}
            className="inline-block cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
          >
            {customLogo ??
              (logoSrc ? (
                <img
                  src={logoSrc}
                  alt={t.common.logoAlt}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  width={80}
                  height={80}
                />
              ) : (
                <Logo className="h-7 sm:h-9 md:h-10 w-auto" />
              ))}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            locale={locale}
            currentPath={currentPath}
            variant={variant}
          />
          <a
            href={getLocalizedPath("/contacts", locale)}
            className={`rounded-[20px] border px-3 md:px-5 py-2 uppercase text-[11px] tracking-normal md:tracking-[0.15em] font-medium transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 bg-transparent text-white hover:bg-white/10"}`}
          >
            {t.common.contacts}
          </a>
        </div>
      </header>
    </>
  );
};
