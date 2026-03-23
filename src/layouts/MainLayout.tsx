import { useState, type JSX, type ReactNode } from "react";

import { Logo } from "@/components/icons/Logo";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import { Menu } from "@/routes/Menu/Menu";

interface MainLayoutProps {
  children: ReactNode;
  variant?: "default" | "light";
  customLogo?: ReactNode;
  headerPosition?: "relative" | "absolute";
  locale?: Locale;
}

export const MainLayout = ({
  children,
  variant = "default",
  customLogo,
  headerPosition = "relative",
  locale = "uk",
}: MainLayoutProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = getTranslations(locale);

  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  return (
    <div
      className={`overflow-hidden w-full min-h-screen flex justify-center ${variant === "light" ? "bg-pure-white" : "bg-layout-bg"}`}
    >
      {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}
      <div className="flex w-full relative flex-col items-start min-h-screen">
        {/* Header */}
        <header
          className={`${headerPosition} w-full flex justify-between items-center px-4 md:px-9 py-5 z-50`}
        >
          <button
            onClick={handleMenuClick}
            className={`rounded-[20px] border px-5 py-2 uppercase text-[11px] tracking-[0.15em] font-medium transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 bg-transparent text-white hover:bg-white/10"}`}
          >
            {t.common.menu}
          </button>

          {/* Logo */}
          <div className="flex justify-center flex-1 md:flex-none">
            <a
              href={getLocalizedPath("/", locale)}
              className="inline-block cursor-pointer"
            >
              {customLogo ? customLogo : <Logo />}
            </a>
          </div>

          <a
            href={getLocalizedPath("/contacts", locale)}
            className={`rounded-[20px] border px-3 md:px-5 py-2 uppercase text-[11px] tracking-normal md:tracking-[0.15em] font-medium transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 bg-transparent text-white hover:bg-white/10"}`}
          >
            {t.common.contacts}
          </a>
        </header>

        {/* Page Content */}
        <main id="main-content" className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
