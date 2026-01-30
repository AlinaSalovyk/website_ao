import { useState, type ReactNode, type JSX } from "react";
import { Menu } from "../routes/Menu/Menu";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  return (
    <div
      className="bg-layout-bg overflow-hidden w-full min-w-[1440px] flex justify-center"
      data-model-id="530:5377"
    >
      {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}
      <div className="flex w-full relative flex-col items-start min-h-screen">
        {/* Header */}
        <header className="relative w-full flex justify-between items-center px-9 py-5 z-50 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          <button
            onClick={handleMenuClick}
            className="rounded-[20px] border border-white/80 bg-transparent text-white px-5 py-2 uppercase text-[11px] tracking-[0.15em] font-medium hover:bg-white/10 transition-colors"
          >
            МЕНЮ
          </button>

          {/* Logo */}
          <svg
            width="83"
            height="32"
            viewBox="0 0 83 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-auto"
          >
            <path
              d="M45.6854 0.0372467H13.75V8.37522H45.6854V0.0372467Z"
              fill="white"
            />
            <path
              d="M25.452 13.0111H13.6533V21.3491H25.452V31.9728H33.79V21.3491H45.5887V13.0111H33.79H25.452Z"
              fill="white"
            />
            <path
              d="M81.4999 8.37522V0.0372467H49.5645V31.9727H81.4999V13.011H57.9185V8.37522H81.4999ZM73.1619 21.349V23.6186H57.9185V21.349H73.1619Z"
              fill="white"
            />
            <path
              d="M9.83797 0.0372467H1.5V31.9727H9.83797V0.0372467Z"
              fill="white"
            />
          </svg>

          <button className="rounded-[20px] border border-white/80 bg-transparent text-white px-5 py-2 uppercase text-[11px] tracking-[0.15em] font-medium hover:bg-white/10 transition-colors">
            КОНТАКТИ
          </button>
        </header>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
};