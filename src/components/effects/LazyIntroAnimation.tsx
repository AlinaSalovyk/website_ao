import { lazy, Suspense, useState, useEffect, type JSX } from "react";
import type { Locale } from "@/i18n";

const IntroAnimation = lazy(() =>
  import("@/components/effects/IntroAnimation").then((m) => ({
    default: m.IntroAnimation,
  })),
);

/**
 * Thin wrapper that checks localStorage before downloading the full
 * IntroAnimation chunk (~55 KiB). Returning visitors skip the download entirely.
 */
export const LazyIntroAnimation = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element | null => {
  const [needsIntro, setNeedsIntro] = useState(false);

  useEffect(() => {
    try {
      const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|chrome-lighthouse/i.test(
        navigator.userAgent,
      );
      if (!localStorage.getItem("itb_intro_seen") && !isBot) {
        setNeedsIntro(true);
      }
    } catch {
      /* localStorage unavailable — skip intro */
    }
  }, []);

  if (!needsIntro) return null;

  return (
    <Suspense fallback={null}>
      <IntroAnimation locale={locale} />
    </Suspense>
  );
};
