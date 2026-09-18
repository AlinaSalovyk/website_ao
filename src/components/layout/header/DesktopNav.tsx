import type { JSX } from "react";
import { ChevronDown } from "lucide-react";
import type { NavDropdownItem } from "./headerNavigation";

interface DesktopNavProps {
  navDropdowns: NavDropdownItem[];
  isLight: boolean;
  currentPath?: string;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, targetHash?: string) => void;
}

export const DesktopNav = ({
  navDropdowns,
  isLight,
  currentPath = "/",
  onNavClick,
}: DesktopNavProps): JSX.Element => {
  return (
    <nav
      aria-label="Desktop Main Navigation"
      className="hidden lg:flex items-center gap-1 xl:gap-2 px-3 py-1.5 rounded-full bg-slate-100/10 backdrop-blur-md border border-slate-200/10"
    >
      {navDropdowns.map((drop) => {
        const hasItems = drop.items.length > 0;
        const isActive =
          currentPath === drop.mainHref ||
          (drop.mainHref !== "/" && currentPath?.startsWith(drop.mainHref));

        return (
          <div key={drop.id} className="relative group">
            <a
              href={drop.mainHref}
              onClick={(e) => onNavClick(e, drop.hash)}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                isActive
                  ? isLight
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-900 shadow-xs"
                  : isLight
                  ? "text-slate-700 hover:text-blue-600 hover:bg-slate-100/80"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{drop.label}</span>
              {hasItems && (
                <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 group-hover:opacity-100 transition-transform duration-200" />
              )}
            </a>

            {/* Dropdown Menu Panel */}
            {hasItems && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div
                  className={`w-64 sm:w-72 p-2 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                    isLight
                      ? "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
                      : "bg-slate-900/95 border-slate-800 text-white shadow-black/50"
                  }`}
                >
                  {drop.items.map((sub, idx) => (
                    <a
                      key={idx}
                      href={sub.href}
                      onClick={(e) => onNavClick(e, sub.hash)}
                      className={`flex flex-col gap-0.5 p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                        isLight
                          ? "hover:bg-blue-50/80 text-slate-800 hover:text-blue-700"
                          : "hover:bg-slate-800/80 text-slate-200 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        {sub.label}
                      </span>
                      {sub.desc && (
                        <span className="text-[11px] opacity-70 leading-snug line-clamp-1 font-normal">
                          {sub.desc}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
