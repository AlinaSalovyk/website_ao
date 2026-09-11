import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { lazy, Suspense, useState } from "react";
import { getLoginUrl } from "./api";

const ParticleCanvas = lazy(() =>
  import("@/components/effects/ParticleCanvas").then((m) => ({
    default: m.ParticleCanvas,
  })),
);

export function LoginScreen({ onAuth: _onAuth }: { onAuth: () => void }) {
  const [oauthError, setOauthError] = useState(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const search = new URLSearchParams(window.location.search);
    const errParam = search.get("error");
    if (errParam) return errParam;
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const match = hash.match(/error=([^&]+)/);
      if (match) {
        try {
          return decodeURIComponent(match[1].replace(/\+/g, " "));
        } catch {
          return match[1];
        }
      }
    }
    return null;
  });

  const handleOAuthLogin = async () => {
    setOauthError(false);
    setUrlErrorMessage(null);
    try {
      const url = await getLoginUrl();
      window.location.href = url;
    } catch {
      setOauthError(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-foreground px-4 overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <ParticleCanvas
            particleColor="rgba(80, 140, 255, 0.4)"
            lineColor="rgba(80, 140, 255, 0.08)"
            maxParticles={90}
            connectionDistance={120}
            mouseRadius={160}
          />
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.07] blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/[0.05] blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center backdrop-blur-2xl shadow-xl text-card-foreground">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
          >
            <Shield size={32} strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-1 text-2xl font-bold tracking-tight text-foreground"
          >
            Адмін-панель
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6 text-xs leading-relaxed text-muted-foreground"
          >
            Увійдіть за допомогою акаунту Google для доступу до панелі.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={handleOAuthLogin}
              size="lg"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:from-blue-500 hover:to-blue-400 transition-all duration-300 cursor-pointer"
            >
              <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Увійти з Google
            </Button>

            {urlErrorMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left shadow-lg backdrop-blur-xl"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-0.5">Доступ обмежено</h4>
                  <p className="text-xs leading-relaxed text-foreground/90 font-medium">
                    {urlErrorMessage}
                  </p>
                </div>
              </motion.div>
            )}

            {oauthError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-left">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-xs leading-relaxed text-amber-300/90">
                  Не вдалося розпочати авторизацію через Google OAuth. Зверніться до адміністратора.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-8 text-center text-xs text-muted-foreground/80"
        >
          <p className="mb-1 uppercase tracking-[0.15em] text-[10px] font-bold text-muted-foreground">
            Система управління ресурсами
          </p>
          <p className="px-2 text-[11px] leading-relaxed">
            Доступ надається авторизованим адміністраторам з ролями Головний адміністратор, Редактор новин або Адміністратор чат-бота.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
