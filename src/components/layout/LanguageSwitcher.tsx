import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/i18n";
import { LOCALES, getAlternatePath } from "@/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  uk: "UA",
  en: "EN",
};

interface LanguageSwitcherProps {
  locale: Locale;
  currentPath: string;
  variant?: "default" | "light";
}

export function LanguageSwitcher({
  locale,
  currentPath,
  variant = "default",
}: LanguageSwitcherProps) {
  const borderColor =
    variant === "light" ? "border-pure-black/80" : "border-white/80";
  const textColor = variant === "light" ? "text-pure-black" : "text-white";
  const hoverBg =
    variant === "light" ? "hover:bg-pure-black/10" : "hover:bg-white/10";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`rounded-xl border p-2 px-3 flex items-center gap-1.5 text-[11px] tracking-[0.08em] font-medium uppercase transition-colors cursor-pointer outline-none ${borderColor} ${textColor} ${hoverBg}`}
        aria-label="Switch language"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {LOCALE_LABELS[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[6rem]">
        {LOCALES.map((loc) => (
          <DropdownMenuItem key={loc} asChild disabled={loc === locale}>
            <a
              href={getAlternatePath(currentPath, loc)}
              className={`cursor-pointer ${loc === locale ? "font-semibold" : ""}`}
            >
              {LOCALE_LABELS[loc]}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
