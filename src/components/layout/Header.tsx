import { useState, type ReactNode, type JSX } from "react";
import { Menu } from "@/routes/Menu/Menu";
import { Logo } from "@/components/icons/Logo";

interface HeaderProps {
  variant?: "default" | "light";
  headerPosition?: "relative" | "absolute";
  customLogo?: ReactNode;
  logoSrc?: string;
}

export const Header = ({ variant = "default", headerPosition = "relative", customLogo, logoSrc }: HeaderProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logo = customLogo ?? (logoSrc ? (
    <img src={logoSrc} alt="Logo" className="h-8 md:h-10 w-auto" loading="lazy" decoding="async" width={83} height={32} />
  ) : (
    <Logo />
  ));

  return (
    <>
      {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}
      <header className={`${headerPosition} w-full flex justify-between items-center px-4 md:px-9 py-5 z-50`}>
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`rounded-[20px] border px-5 py-2 uppercase text-[11px] tracking-[0.15em] font-medium transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 bg-transparent text-white hover:bg-white/10"}`}
        >
          МЕНЮ
        </button>

        <div className="flex justify-center flex-1 md:flex-none">
          <a href="/" className="inline-block cursor-pointer">
            {logo}
          </a>
        </div>

        <a href="/contacts" className={`rounded-[20px] border px-3 md:px-5 py-2 uppercase text-[11px] tracking-normal md:tracking-[0.15em] font-medium transition-colors cursor-pointer ${variant === "light" ? "border-pure-black/80 text-pure-black hover:bg-pure-black/10" : "border-white/80 bg-transparent text-white hover:bg-white/10"}`}>
          КОНТАКТИ
        </a>
      </header>
    </>
  );
};
