export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "admin_theme";

/**
 * Gets saved theme preference or defaults to 'system'.
 */
export function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode;
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "system";
}

/**
 * Resolves the effective theme ('light' or 'dark') taking System preference into account.
 */
export function getResolvedTheme(mode: ThemeMode = getSavedTheme()): "light" | "dark" {
  if (mode === "system") {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }
  return mode;
}

/**
 * Applies the effective theme class (.dark or .light) to the document root / target element.
 */
export function applyTheme(mode: ThemeMode): "light" | "dark" {
  const resolved = getResolvedTheme(mode);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
  }
  return resolved;
}

/**
 * Saves theme choice and updates DOM.
 */
export function setTheme(mode: ThemeMode): "light" | "dark" {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, mode);
  }
  return applyTheme(mode);
}

/**
 * Subscribes to OS color scheme changes for 'system' mode.
 */
export function listenToSystemTheme(onChange: (resolved: "light" | "dark") => void): () => void {
  if (typeof window === "undefined") return () => {};
  
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (getSavedTheme() === "system") {
      const resolved = applyTheme("system");
      onChange(resolved);
    }
  };

  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}
