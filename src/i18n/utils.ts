import type { Locale } from "@/i18n/config";
import { en } from "@/i18n/translations/en";
import type { Translations } from "@/i18n/translations/uk";
import { uk } from "@/i18n/translations/uk";

const translations: Record<Locale, Translations> = { uk, en };

export function getTranslations(locale?: Locale): Translations {
  return translations[locale ?? "uk"];
}
