import { toast } from "sonner";
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
  hasEnglishTranslation?: boolean;
}

export function LanguageSwitcher({
  locale,
  currentPath,
  variant = "default",
  hasEnglishTranslation = true,
}: LanguageSwitcherProps) {
  let effectivePath = currentPath;
  if (
    typeof window !== "undefined" &&
    window.location.search &&
    !effectivePath.includes("?")
  ) {
    effectivePath = effectivePath + window.location.search;
  }

  const borderColor =
    variant === "light" ? "border-pure-black/80" : "border-white/80";
  const textColor = variant === "light" ? "text-pure-black" : "text-white";
  const hoverBg =
    variant === "light" ? "hover:bg-pure-black/10" : "hover:bg-white/10";

  const handleLanguageClick = (
    _e: React.MouseEvent<HTMLAnchorElement>,
    _targetLoc: Locale
  ) => {
    // Navigation proceeds to target locale URL.
    // If article is untranslated, SSR handles redirect to ?untranslated=1
    // displaying the English notice banner with OK dismiss button.
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`rounded-full border py-1.5 px-3.5 flex items-center gap-1.5 text-[11px] tracking-[0.08em] font-semibold uppercase transition-all duration-200 cursor-pointer outline-none shadow-2xs ${borderColor} ${textColor} ${hoverBg}`}
        aria-label={locale === "uk" ? "Змінити мову" : "Switch language"}
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
        {LOCALES.map((loc) =>
          loc === locale ? (
            <DropdownMenuItem key={loc} disabled>
              <span className="font-semibold">{LOCALE_LABELS[loc]}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={loc} asChild>
              <a
                href={getAlternatePath(effectivePath, loc)}
                onClick={(e) => handleLanguageClick(e, loc)}
                className="cursor-pointer"
              >
                {LOCALE_LABELS[loc]}
              </a>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
