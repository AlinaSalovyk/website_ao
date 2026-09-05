import { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { validateInviteToken, getLoginUrl } from "./services/general.api";
import type { Role } from "./types/api.types";
import { ADMIN_PATH } from "./services/client";

export function AcceptInvitePage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("news_editor");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const match = hash.match(/error=([^&]+)/);
      if (match) {
        setError(decodeURIComponent(match[1]));
        setLoading(false);
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const errParam = params.get("error");
    if (errParam) {
      setError(errParam);
      setLoading(false);
      return;
    }

    const tok = params.get("token");
    setToken(tok);

    if (!tok) {
      setError("Токен запрошення відсутній у посиланні");
      setLoading(false);
      return;
    }

    async function checkToken() {
      try {
        const res = await validateInviteToken(tok!);
        setValid(res.valid);
        setEmail(res.email);
        setRole(res.role);
        setExpiresAt(res.expires_at);
      } catch (err: any) {
        setValid(false);
        setError(err?.message || "Запрошення недійсне, анульоване або його термін дії закінчився.");
      } finally {
        setLoading(false);
      }
    }

    checkToken();
  }, []);

  const handleGoogleActivate = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const url = await getLoginUrl(token);
      window.location.href = url;
    } catch {
      setError("Не вдалося ініціалізувати вхід через Google OAuth");
      setSubmitting(false);
    }
  };

  const roleLabel =
    role === "super_admin"
      ? "Головний адміністратор"
      : role === "news_editor"
      ? "Редактор новин"
      : "Адміністратор чат-бота";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-foreground px-4 overflow-hidden antialiased">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-2xl shadow-2xl text-card-foreground">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShieldCheck size={32} />
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Запрошення до адмін-панелі
          </h1>
          <p className="mb-6 text-xs text-muted-foreground leading-relaxed">
            Активація облікового запису адміністратора через Google OAuth
          </p>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-primary" size={28} />
              <p className="text-xs text-muted-foreground">Перевірка токена запрошення...</p>
            </div>
          ) : error || !valid ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-left">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-destructive">Запрошення недійсне</div>
                  <div className="text-xs text-destructive/90 mt-1 leading-relaxed">{error}</div>
                </div>
              </div>
              <a
                href={`/admin-${ADMIN_PATH}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                Повернутися до входу
              </a>
            </div>
          ) : (
            <div className="space-y-5 text-left">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-muted-foreground">Запрошений Email:</span>
                  <span className="font-bold text-foreground truncate max-w-[200px]">{email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-muted-foreground">Призначена роль:</span>
                  <span className="font-semibold text-primary">{roleLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Дійсне до:</span>
                  <span className="text-muted-foreground">{new Date(expiresAt).toLocaleString("uk-UA")}</span>
                </div>
              </div>

              <div className="rounded-xl bg-muted/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Щоб підтвердити та активувати запрошення, увійдіть через свій акаунт Google. Електронна адреса в Google має збігатися з <strong className="text-foreground">{email}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleActivate}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 text-xs font-bold shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-blue-400 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {submitting ? "Активація..." : "Увійти з Google для активації"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
