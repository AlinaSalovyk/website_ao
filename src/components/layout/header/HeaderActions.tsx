import type { JSX } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";

interface HeaderActionsProps {
  isLight: boolean;
  locale?: Locale;
  currentPath?: string;
  hasEnglishTranslation?: boolean;
}

export const HeaderActions = ({
  isLight,
  locale = "uk",
  currentPath = "/",
  hasEnglishTranslation,
}: HeaderActionsProps): JSX.Element => {
  const t = getTranslations(locale);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Language Switcher */}
      <LanguageSwitcher
        locale={locale}
        currentPath={currentPath}
        variant={isLight ? "light" : "default"}
        hasEnglishTranslation={hasEnglishTranslation}
      />

      {/* Contacts CTA Button */}
      <a
        href={getLocalizedPath("/contacts", locale)}
        className={`rounded-full px-4 md:px-5 py-2 text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm hover:scale-[1.03] active:scale-[0.98] ${
          isLight
            ? "bg-slate-900 text-white hover:bg-blue-600 shadow-slate-950/20"
            : "bg-white text-slate-950 hover:bg-blue-500 hover:text-white shadow-white/10"
        }`}
      >
        {t.common.contacts}
      </a>
    </div>
  );
};
