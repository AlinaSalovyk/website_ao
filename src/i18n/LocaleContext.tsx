import { createContext, useContext } from "react";

import type { Locale, Translations } from "@/i18n";
import { DEFAULT_LOCALE, getTranslations } from "@/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: getTranslations(DEFAULT_LOCALE),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = getTranslations(locale);
  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LocaleContext);
}
