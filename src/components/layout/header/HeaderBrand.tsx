import type { JSX, ReactNode } from "react";
import { Logo } from "@/components/icons/Logo";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";

interface HeaderBrandProps {
  isLight: boolean;
  isSticky: boolean;
  onOpenMenu: () => void;
  customLogo?: ReactNode;
  logoSrc?: string;
  locale?: Locale;
}

export const HeaderBrand = ({
  isLight,
  isSticky,
  onOpenMenu,
  customLogo,
  logoSrc,
  locale = "uk",
}: HeaderBrandProps): JSX.Element => {
  const t = getTranslations(locale);
  const resolvedLogoSrc =
    logoSrc ??
    (locale === "en"
      ? "/images/logo/logo-icon-eng-transparent.webp"
      : "/images/logo/logo-icon.webp");

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {/* Hamburger Drawer Menu Toggle Button */}
      <button
        onClick={onOpenMenu}
        className={`rounded-full p-2.5 flex items-center justify-center transition-all duration-200 cursor-pointer border ${
          isLight || (isSticky && isLight)
            ? "border-slate-300/80 text-slate-800 hover:bg-slate-100 hover:border-slate-400"
            : "border-white/20 text-white hover:bg-white/10 hover:border-white/40"
        }`}
        aria-label={t.common.openMenu}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 8H20M4 12H20M4 16H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Brand Logo Link */}
      <a
        aria-label={t.common.homePage}
        href={getLocalizedPath("/", locale)}
        className="inline-flex items-center cursor-pointer group transition-transform duration-200 hover:scale-[1.03]"
      >
        {customLogo ??
          (resolvedLogoSrc ? (
            <img
              src={resolvedLogoSrc}
              alt={t.common.logoAlt}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={`w-auto object-contain transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-md ${
                isSticky ? "h-10 sm:h-11 md:h-12" : "h-12 sm:h-14 md:h-16"
              }`}
            />
          ) : (
            <Logo
              className={`w-auto transition-all duration-300 ${
                isSticky ? "h-9 sm:h-10 md:h-11" : "h-11 sm:h-13 md:h-15"
              }`}
            />
          ))}
      </a>
    </div>
  );
};
