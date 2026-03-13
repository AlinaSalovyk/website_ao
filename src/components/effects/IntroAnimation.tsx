/**
 * IntroAnimation — Premium full-screen intro with cinematic typography,
 * sequential handwriting effect, shimmering gradient, and glowing particles.
 */
import { useEffect, useRef, useState, useCallback, useMemo, type JSX } from "react";

const STORAGE_KEY = "itb_intro_seen";
const LINE_1 = "Навчально-науковий інститут";
const LINE_2 = "інформаційних технологій та бізнесу".toUpperCase();

const LINE_DRAW_DURATION = 3000;
const LINE_2_DELAY = 1800;
const FILL_DURATION = 1000;
const PAUSE_BEFORE_FADE = 800;
const FADE_OUT = 1400;

const HandwrittenLine = ({
  text,
  y,
  delay,
  completed,
  svgFontSize,
  fontFamily,
  fontStyle = "normal",
  fontWeight = 400,
  letterSpacing = "normal",
  opacity = 1,
}: {
  text: string;
  y: number;
  delay: number;
  completed: boolean;
  svgFontSize: number;
  fontFamily: string;
  fontStyle?: string;
  fontWeight?: number;
  letterSpacing?: string;
  opacity?: number;
}) => {
  const chars = text.split("");
  const charCount = chars.length;
  const tspanRefs = useRef<(SVGTSpanElement | null)[]>([]);

  const [animState, setAnimState] = useState<"idle" | "stroking" | "filling" | "done">("idle");
  const rafRef = useRef(0);
  const startRef = useRef(0);

  const charPathLength = svgFontSize * 5;

  useEffect(() => {
    if (completed) {
      setAnimState("done");
      return;
    }
    const t = setTimeout(() => {
      setAnimState("stroking");
      startRef.current = performance.now();
    }, delay);
    return () => clearTimeout(t);
  }, [delay, completed]);

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
        const offset = charPathLength * (1 - eased);

        tspan.style.strokeDashoffset = `${offset}`;
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setAnimState("filling");
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animState, charCount, charPathLength]);

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
        fill: isDone || isFilling ? "url(#animated-silver-gradient)" : "transparent",
        stroke: isDone ? "transparent" : "var(--color-pure-white)",
        strokeWidth: isDone ? 0 : 1.5,
        opacity,
        filter: isDone || isFilling ? "url(#glow)" : "drop-shadow(0 0 8px var(--color-glass-light-border))",
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

export const IntroAnimation = (): JSX.Element => {
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const totalDrawTime = LINE_2_DELAY + LINE_DRAW_DURATION + FILL_DURATION + PAUSE_BEFORE_FADE;

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

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
        setShouldShow(true);
        document.body.style.overflow = "hidden";
      } else {
        setShouldShow(false);
        document.documentElement.classList.remove('intro-active', 'intro-transitioning');
      }
    } catch {
      setShouldShow(false);
      document.documentElement.classList.remove('intro-active', 'intro-transitioning');
    }
  }, []);

  const skip = useCallback(() => setCompleted(true), []);

  useEffect(() => {
    if (fading) return;
    const delay = completed ? 300 : totalDrawTime;
    const t = setTimeout(() => setFading(true), delay);
    return () => clearTimeout(t);
  }, [completed, fading, totalDrawTime]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldShow) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.paddingRight = "";
      document.documentElement.classList.remove('intro-active', 'intro-transitioning');
    }
    return () => {
      document.body.style.paddingRight = "";
    };
  }, [shouldShow]);

  useEffect(() => {
    if (!fading) return;
    document.documentElement.classList.remove('intro-active');
    document.documentElement.classList.add('intro-transitioning');
    const showSiteTimer = setTimeout(() => {
      document.documentElement.classList.remove('intro-transitioning');
    }, FADE_OUT + 1000);

    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
      setHidden(true);
      setShouldShow(false);
    }, FADE_OUT + 50);

    return () => {
      clearTimeout(t);
      clearTimeout(showSiteTimer);
    };
  }, [fading]);

  useEffect(() => {
    if (shouldShow !== true || completed) return;
    const events = ["click", "scroll", "keydown", "touchstart", "wheel"] as const;
    const handler = () => skip();
    events.forEach((e) => window.addEventListener(e, handler, { once: true, passive: true }));
    return () => { events.forEach((e) => window.removeEventListener(e, handler)); };
  }, [shouldShow, completed, skip]);

  const seo = (
    <h1 className="sr-only">
      Навчально-науковий інститут інформаційних технологій та бізнесу
    </h1>
  );

  if (shouldShow === false || shouldShow === null || hidden) return <>{seo}</>;

  return (
    <>
      {seo}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Montserrat:wght@300&display=swap');
        
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
          backgroundColor: "var(--color-intro-bg)",
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, var(--color-glass-bg) 0%, transparent 60%)",
            filter: "blur(90px)",
          }}
        />

        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--max-opacity': p.opacity,
              opacity: 0,
              boxShadow: "0 0 10px 2px var(--color-glass-light-border)",
              animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
            } as React.CSSProperties}
          />
        ))}

        <svg
          viewBox="0 0 1400 300"
          className="relative w-[95vw] max-w-[1400px] h-auto drop-shadow-2xl"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="animated-silver-gradient" x1="0%" y1="0%" x2="200%" y2="0%">
              <stop offset="0%" stopColor="var(--color-pure-white)" />
              <stop offset="25%" stopColor="var(--color-intro-silver)" />
              <stop offset="50%" stopColor="var(--color-pure-white)" />
              <stop offset="75%" stopColor="var(--color-intro-silver)" />
              <stop offset="100%" stopColor="var(--color-pure-white)" />
              <animate attributeName="x1" values="0%;-100%" dur="8s" repeatCount="indefinite" />
              <animate attributeName="x2" values="200%;100%" dur="8s" repeatCount="indefinite" />
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
            svgFontSize={28}
            fontFamily="'Montserrat', sans-serif"
            fontWeight={300}
            letterSpacing="0.35em"
            opacity={0.85}
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
            className="text-[10px] tracking-[0.4em] uppercase"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              color: "var(--color-glass-light-border)",
              transition: "color 0.4s ease",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--color-star)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--color-glass-light-border)"; }}
          >
            пропустити
          </span>
          <div className="w-10 h-[1px] mx-auto mt-3"
            style={{
              background: "linear-gradient(90deg, transparent, var(--color-glass-light-border), transparent)",
            }}
          />
        </button>
      </div>
    </>
  );
};