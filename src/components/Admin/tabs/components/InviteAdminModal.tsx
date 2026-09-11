import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send, UserPlus } from "lucide-react";
import type { Role } from "../../types/api.types";

interface InviteAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onEmailChange: (email: string) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  inviting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function InviteAdminModal({
  open,
  onOpenChange,
  email,
  onEmailChange,
  role,
  onRoleChange,
  inviting,
  onSubmit,
}: InviteAdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-[460px] shadow-2xl backdrop-blur-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <UserPlus className="text-primary" size={20} />
            Запросити адміністратора
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 mt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Електронна пошта (Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="new.admin@university.edu.ua"
              className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Вибір ролі
            </label>
            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  role === "news_editor" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  checked={role === "news_editor"}
                  onChange={() => onRoleChange("news_editor")}
                  className="mt-0.5 text-primary"
                />
                <div>
                  <div className="text-xs font-bold text-foreground">Редактор новин</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Має доступ лише до керування новинами та пов’язаним медіаконтентом.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  role === "chatbot_admin" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  checked={role === "chatbot_admin"}
                  onChange={() => onRoleChange("chatbot_admin")}
                  className="mt-0.5 text-primary"
                />
                <div>
                  <div className="text-xs font-bold text-foreground">Адміністратор чат-бота</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Має доступ до адміністративного функціоналу чат-бота, аналітики та бази знань.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={inviting || !email.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {inviting ? "Надсилаємо..." : "Надіслати запрошення"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
