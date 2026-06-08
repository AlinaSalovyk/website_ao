import {
  BarChart3, FileText, MessageCircle,
  LogOut, Activity, MessageSquareDashed,
  Shield, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

/** Identifies one of the six admin panel tabs. */
export type Tab = "overview" | "documents" | "queries" | "prompts" | "audit" | "admins";

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Аналітика", icon: <BarChart3 size={18} strokeWidth={1.8} /> },
  { id: "documents", label: "Документи", icon: <FileText size={18} strokeWidth={1.8} /> },
  { id: "queries", label: "Запити", icon: <MessageCircle size={18} strokeWidth={1.8} /> },
  { id: "prompts", label: "A/B Промпти", icon: <MessageSquareDashed size={18} strokeWidth={1.8} /> },
  { id: "audit", label: "Audit Log", icon: <Shield size={18} strokeWidth={1.8} /> },
  { id: "admins", label: "Адміністратори", icon: <Users size={18} strokeWidth={1.8} /> },
];

/**
 * Fixed-position vertical navigation sidebar for the admin panel.
 *
 * Features:
 * - Animated active indicator that slides between nav items (Framer Motion `layoutId`)
 * - Responsive: icon-only on narrow screens, icon + label on `md` and wider
 * - Collapsible helper info box explaining the panel's purpose
 * - Logout button at the bottom
 *
 * @param active   - Currently active tab.
 * @param onChange - Called when the user clicks a navigation item.
 * @param onLogout - Called when the user clicks the logout button.
 */
export function Sidebar({
  active,
  onChange,
  onLogout,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-white/[0.06] bg-[#0e1114]/95 backdrop-blur-xl md:w-[240px]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400">
          <Activity size={18} strokeWidth={2} />
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-semibold text-white leading-none">Admin Panel</div>
          <div className="mt-0.5 text-[10px] text-zinc-600">University Chatbot</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <span className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
          Навігація
        </span>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200",
              active === item.id
                ? "text-white"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
            )}
          >
            {active === item.id && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/15 to-blue-600/5 ring-1 ring-blue-500/20"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className={cn("relative z-10", active === item.id && "text-blue-400")}>{item.icon}</span>
            <span className="relative z-10 hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mx-3 mb-4 hidden rounded-xl border border-blue-500/10 bg-blue-500/5 p-3 text-left md:block">
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-blue-400">
          Довідка
        </label>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Ця панель призначена для керування базою знань чат-бота, аналізу ефективності та перегляду запитів користувачів.
        </p>
      </div>

      <div className="border-t border-white/[0.06] px-3 py-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-zinc-600 transition-all hover:bg-red-500/8 hover:text-red-400"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span className="hidden md:inline">Вийти</span>
        </button>
      </div>
    </aside>
  );
}
