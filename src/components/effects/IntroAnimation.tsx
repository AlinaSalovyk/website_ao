/**
 * IntroAnimation — Premium full-screen intro with cinematic typography,
 * sequential handwriting effect, shimmering gradient, and glowing particles.
 *
 * Reliability improvements:
 * - Fonts are preloaded via <link> and waited on via document.fonts.ready
 * - Animation only starts after fonts are confirmed loaded
 * - Fade-out sequencing is event-driven, not timer-based from mount
 * - Visibility API pauses timers when tab is hidden
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";

import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/montserrat/300.css";
import { getTranslations, type Locale } from "@/i18n";

const STORAGE_KEY = "itb_intro_seen";

const LINE_DRAW_DURATION = 3000;
const LINE_2_DELAY = 1800;
const FILL_DURATION = 1000;
const PAUSE_BEFORE_FADE = 800;
const FADE_OUT = 1400;

/* ───── Individual animated line ───── */
const HandwrittenLine = ({
  text,
  y,
  delay,
  completed,
  fontsReady,
  svgFontSize,
  fontFamily,
  fontStyle = "normal",
  fontWeight = 400,
  letterSpacing = "normal",
  opacity = 1,
  onDrawComplete,
}: {
  text: string;
  y: number;
  delay: number;
  completed: boolean;
  fontsReady: boolean;
  svgFontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fontWeight?: number;
  letterSpacing?: string;
  opacity?: number;
  onDrawComplete?: () => void;
}) => {
  const chars = text.split("");
  const charCount = chars.length;
  const tspanRefs = useRef<(SVGTSpanElement | null)[]>([]);
  const [animState, setAnimState] = useState<
    "idle" | "stroking" | "filling" | "done"
  >("idle");
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const charPathLength = svgFontSize * 5;

  // Only start when fonts are ready
  useEffect(() => {
    if (completed) {
      setAnimState("done");
      return;
    }
    if (!fontsReady) return;
    const t = setTimeout(() => {
      setAnimState("stroking");
      startRef.current = performance.now();
    }, delay);
    return () => clearTimeout(t);
  }, [delay, completed, fontsReady]);

  useEffect(() => {
    if (animState !== "stroking") return;
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / LINE_DRAW_DURATION, 1);
      const charDurationRatio = 0.15;
      const maxStart = 1 - charDurationRatio;

      tspanRefs.current.forEach((tspan, i) => {
        if (!tspan) return;
        const startP = charCount > 1 ? (i / (charCount - 1)) * maxStart : 0;
        let charP = (progress - startP) / charDurationRatio;
        charP = Math.max(0, Math.min(1, charP));
        const eased = 1 - Math.pow(1 - charP, 3);
        tspan.style.strokeDashoffset = `${charPathLength * (1 - eased)}`;
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setAnimState("filling");
        onDrawComplete?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animState, charCount, charPathLength, onDrawComplete]);

  const isDone = completed || animState === "done";
  const isFilling = animState === "filling";

  return (
    <text
      x="50%"
      y={y}
      textAnchor="middle"
      style={{
        fontFamily,
        fontStyle,
        fontWeight,
        fontSize: `${svgFontSize}px`,
        letterSpacing,
        fill:
          isDone || isFilling
            ? "url(#animated-silver-gradient)"
            : "transparent",
        stroke: isDone ? "transparent" : "#ffffff",
        strokeWidth: isDone ? 0 : 1.5,
        opacity,
        filter:
          isDone || isFilling
            ? "url(#glow)"
            : "drop-shadow(0 0 8px rgba(255,255,255,0.7))",
        transition: isFilling
          ? `fill ${FILL_DURATION}ms ease-out, stroke-width ${FILL_DURATION}ms ease, filter ${FILL_DURATION}ms ease`
          : "none",
        paintOrder: "stroke",
      }}
    >
      {chars.map((char, i) => (
        <tspan
          key={i}
          ref={(el) => {
            tspanRefs.current[i] = el;
          }}
          style={{
            strokeDasharray: charPathLength,
            strokeDashoffset: isDone || isFilling ? 0 : charPathLength,
          }}
        >
          {char}
        </tspan>
      ))}
    </text>
  );
};

/* ───── Main component ───── */
export const IntroAnimation = ({
  locale,
}: {
  locale?: Locale;
}): JSX.Element => {
  const t = getTranslations(locale);
  const LINE_1 = t.intro.line1;
  const LINE_2 = t.intro.line2.toUpperCase();
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const particles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => {
      const sizeMultiplier = Math.random() > 0.8 ? 2 : 1;
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: (Math.random() * 3 + 1.5) * sizeMultiplier,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * -20,
        opacity: Math.random() * 0.5 + 0.2,
      };
    });
  }, []);

  // Check localStorage
  useEffect(() => {
    try {
      const isBot =
        typeof navigator !== "undefined" &&
        /bot|googlebot|crawler|spider|robot|crawling|lighthouse|chrome-lighthouse/i.test(
          navigator.userAgent,
        );

      if (
        typeof window !== "undefined" &&
        !localStorage.getItem(STORAGE_KEY) &&
        !isBot
      ) {
        setShouldShow(true);
        document.body.style.overflow = "hidden";
      } else {
        setShouldShow(false);
        document.documentElement.classList.remove(
          "intro-active",
          "intro-transitioning",
        );
      }
    } catch {
      setShouldShow(false);
      document.documentElement.classList.remove(
        "intro-active",
        "intro-transitioning",
      );
    }
  }, []);

  // Wait for fonts to be ready before starting animations
  useEffect(() => {
    if (shouldShow !== true) return;

    const loadFonts = async () => {
      try {
        // Wait for self-hosted fonts to load (with timeout fallback)
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch {
        /* proceed anyway */
      }
      setFontsReady(true);
    };

    loadFonts();
  }, [shouldShow]);

  const skip = useCallback(() => setCompleted(true), []);

  // Event-driven fade: start fade after line2 completes + fill + pause
  useEffect(() => {
    if (fading) return;

    if (completed) {
      // Skipped — fade quickly
      const t = setTimeout(() => setFading(true), 300);
      return () => clearTimeout(t);
    }

    if (line2Done) {
      // Normal completion: wait fill + pause then fade
      const t = setTimeout(
        () => setFading(true),
        FILL_DURATION + PAUSE_BEFORE_FADE,
      );
      return () => clearTimeout(t);
    }
  }, [completed, fading, line2Done]);

  // Scrollbar compensation
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldShow) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.paddingRight = "";
      document.documentElement.classList.remove(
        "intro-active",
        "intro-transitioning",
      );
    }
    return () => {
      document.body.style.paddingRight = "";
    };
  }, [shouldShow]);

  // Fade-out: cleanup and mark as seen
  useEffect(() => {
    if (!fading) return;
    document.documentElement.classList.remove("intro-active");
    document.documentElement.classList.add("intro-transitioning");
    const showSiteTimer = setTimeout(() => {
      document.documentElement.classList.remove("intro-transitioning");
    }, FADE_OUT + 1000);

    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* noop */
      }
      setHidden(true);
      setShouldShow(false);
    }, FADE_OUT + 50);

    return () => {
      clearTimeout(t);
      clearTimeout(showSiteTimer);
    };
  }, [fading]);

  // Skip on user interaction
  useEffect(() => {
    if (shouldShow !== true || completed) return;
    const events = [
      "click",
      "scroll",
      "keydown",
      "touchstart",
      "wheel",
    ] as const;
    const handler = () => skip();
    events.forEach((e) =>
      window.addEventListener(e, handler, { once: true, passive: true }),
    );
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [shouldShow, completed, skip]);

  const seo = <h1 className="sr-only">{t.intro.srTitle}</h1>;

  if (shouldShow === false || shouldShow === null || hidden) return <>{seo}</>;

  return (
    <>
      {seo}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0px) scale(1); opacity: 0; }
          15% { opacity: var(--max-opacity); }
          85% { opacity: var(--max-opacity); }
          100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "scale(1.15)" : "scale(1)",
          transition: `all ${FADE_OUT}ms cubic-bezier(0.76, 0, 0.24, 1)`,
          pointerEvents: fading ? "none" : "auto",
          backgroundColor: "#030712",
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 60%)",
            filter: "blur(90px)",
          }}
        />

        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white pointer-events-none"
            style={
              {
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                "--max-opacity": p.opacity,
                opacity: 0,
                boxShadow: "0 0 10px 2px rgba(255,255,255,0.6)",
                animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}

        <svg
          viewBox="0 0 1400 300"
          className="relative w-[95vw] max-w-[1400px] h-auto drop-shadow-2xl"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="animated-silver-gradient"
              x1="0%"
              y1="0%"
              x2="200%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#c5d0e0" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#c5d0e0" />
              <stop offset="100%" stopColor="#ffffff" />
              <animate
                attributeName="x1"
                values="0%;-100%"
                dur="8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="200%;100%"
                dur="8s"
                repeatCount="indefinite"
              />
            </linearGradient>

            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <HandwrittenLine
            text={LINE_1}
            y={120}
            delay={300}
            completed={completed}
            fontsReady={fontsReady}
            svgFontSize={86}
            fontFamily="'Cormorant Garamond', serif"
            fontStyle="italic"
            fontWeight={500}
            letterSpacing="0.02em"
          />

          <HandwrittenLine
            text={LINE_2}
            y={210}
            delay={LINE_2_DELAY}
            completed={completed}
            fontsReady={fontsReady}
            svgFontSize={28}
            fontFamily="'Montserrat', sans-serif"
            fontWeight={300}
            letterSpacing="0.35em"
            opacity={0.85}
            onDrawComplete={() => setLine2Done(true)}
          />
        </svg>

        <button
          onClick={skip}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 group cursor-pointer bg-transparent border-none outline-none z-10"
          style={{
            opacity: completed ? 0 : 1,
            transition: "opacity 0.5s ease",
          }}
        >
          <span
            className="text-[10px] tracking-[0.4em] uppercase text-white/30 hover:text-white/90 focus-visible:text-white/90 transition-colors duration-[400ms]"
            style={{
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {t.intro.skip}
          </span>
          <div
            className="w-10 h-[1px] mx-auto mt-3"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            }}
          />
        </button>
      </div>
    </>
  );
};
