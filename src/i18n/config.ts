export const LOCALES = ["uk", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uk";

/** Maps default-locale paths to English-locale paths */
const SLUG_MAP: Record<string, string> = {
  "/": "/",
  "/institute": "/institute",
  "/contacts": "/contacts",
  "/finance-and-business": "/finance-and-business",
  "/information-technologies-and-data-analytics":
    "/information-technologies-and-data-analytics",
  "/management-and-marketing": "/management-and-marketing",
  "/mathematics-and-intelligent-computing":
    "/mathematics-and-intelligent-computing",
  "/laboratory": "/laboratory",
  "/laboratory-vr": "/laboratory-vr",
  "/news": "/news",
};

/** OG locale strings */
export const OG_LOCALES: Record<Locale, string> = {
  uk: "uk_UA",
  en: "en_US",
};

/**
 * Build a locale-aware path.
 *
 * - For the default locale (`uk`) paths stay as-is: `/contacts`
 * - For other locales the prefix is added: `/en/contacts`
 * - Hash fragments and query strings are preserved.
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  // Separate hash and query
  const hashIdx = path.indexOf("#");
  const queryIdx = path.indexOf("?");
  const splitIdx =
    hashIdx >= 0 && queryIdx >= 0
      ? Math.min(hashIdx, queryIdx)
      : hashIdx >= 0
        ? hashIdx
        : queryIdx >= 0
          ? queryIdx
          : path.length;

  const basePath = path.slice(0, splitIdx);
  const suffix = path.slice(splitIdx);

  if (locale === DEFAULT_LOCALE) {
    return `${basePath}${suffix}`;
  }

  // Strip any existing locale prefix
  const cleanPath = basePath.replace(/^\/(uk|en)(\/|$)/, "/");
  const slug = SLUG_MAP[cleanPath] ?? cleanPath;
  const localized = slug === "/" ? `/${locale}` : `/${locale}${slug}`;
  return `${localized}${suffix}`;
}

/**
 * Get the path in the other locale (for the language switcher).
 * Preserves query parameters and handles preview routes specially.
 */
export function getAlternatePath(
  currentPath: string,
  targetLocale: Locale,
): string {
  if (
    currentPath.includes("/preview/") ||
    currentPath.includes("preview_session=")
  ) {
    const hashIdx = currentPath.indexOf("#");
    const hash = hashIdx >= 0 ? currentPath.slice(hashIdx) : "";
    const pathNoHash =
      hashIdx >= 0 ? currentPath.slice(0, hashIdx) : currentPath;

    const queryIdx = pathNoHash.indexOf("?");
    const basePath =
      queryIdx >= 0 ? pathNoHash.slice(0, queryIdx) : pathNoHash;
    const queryString = queryIdx >= 0 ? pathNoHash.slice(queryIdx + 1) : "";

    const params = new URLSearchParams(queryString);
    if (targetLocale === DEFAULT_LOCALE) {
      params.delete("locale");
    } else {
      params.set("locale", targetLocale);
    }
    const newQuery = params.toString();
    const cleanBasePath = basePath.replace(/^\/(uk|en)(\/|$)/, "/");
    return `${cleanBasePath}${newQuery ? "?" + newQuery : ""}${hash}`;
  }

  // Strip existing locale prefix to get the canonical path
  const cleaned = currentPath.replace(/^\/(uk|en)(\/|$)/, "/");
  return getLocalizedPath(cleaned, targetLocale);
}
