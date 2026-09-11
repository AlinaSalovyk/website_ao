import {
  BarChart3, FileText, MessageCircle,
  LogOut, Activity, MessageSquareDashed,
  Newspaper, Shield, Users, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { Role } from "./types/api.types";

/** Identifies one of the admin panel tabs. */
export type Tab = "overview" | "documents" | "news" | "queries" | "prompts" | "audit" | "admins";

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Аналітика", icon: <BarChart3 size={18} strokeWidth={1.8} /> },
  { id: "documents", label: "Документи", icon: <FileText size={18} strokeWidth={1.8} /> },
  { id: "news", label: "Новини", icon: <Newspaper size={18} strokeWidth={1.8} /> },
  { id: "queries", label: "Запити", icon: <MessageCircle size={18} strokeWidth={1.8} /> },
  { id: "prompts", label: "A/B Промпти", icon: <MessageSquareDashed size={18} strokeWidth={1.8} /> },
  { id: "audit", label: "Audit Log", icon: <Shield size={18} strokeWidth={1.8} /> },
  { id: "admins", label: "Адміністратори", icon: <Users size={18} strokeWidth={1.8} /> },
];

export function Sidebar({
  active,
  onChange,
  onLogout,
  role = "super_admin",
  userEmail,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  onLogout: () => void;
  role?: Role;
  userEmail?: string;
}) {
  const filteredNav = NAV.filter((item) => {
    if (role === "super_admin") return true;
    if (role === "news_editor") return item.id === "news";
    if (role === "chatbot_admin") {
      return item.id === "overview" || item.id === "documents" || item.id === "queries" || item.id === "prompts";
    }
    return false;
  });

  const roleLabel =
    role === "super_admin"
      ? "Головний адмін"
      : role === "news_editor"
      ? "Редактор новин"
      : "Адмін чат-бота";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl md:w-[240px] text-sidebar-foreground transition-colors duration-200">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Activity size={18} strokeWidth={2} />
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-semibold text-foreground leading-none">Admin Panel</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">University Chatbot</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <span className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground opacity-80">
          Навігація
        </span>
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 cursor-pointer",
              active === item.id
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            {active === item.id && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className={cn("relative z-10", active === item.id && "text-primary")}>{item.icon}</span>
            <span className="relative z-10 hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      {userEmail && (
        <div className="mx-3 mb-2 hidden md:block rounded-xl border border-sidebar-border bg-card/60 p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-foreground">{userEmail}</div>
              <div className="text-[10px] text-muted-foreground font-semibold">{roleLabel}</div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Switcher */}
      <div className="px-3 pb-2">
        <ThemeSwitcher />
      </div>

      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span className="hidden md:inline">Вийти</span>
        </button>
      </div>
    </aside>
  );
}
