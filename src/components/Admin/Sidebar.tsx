import {
  BarChart3, FileText, MessageCircle,
  LogOut, Activity, MessageSquareDashed,
  Newspaper, Shield, Users,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { Role } from "./types/api.types";

import { useNewsStats } from "./news/hooks/useNewsStats";
import { NewsSubNav, type NewsSubTab } from "./news/components/NewsSubNav";
import { NewsQuickActions } from "./news/components/NewsQuickActions";
import { EditorStatsWidget } from "./news/components/EditorStatsWidget";
import { useConfirm } from "./context/ConfirmContext";

/** Identifies one of the admin panel tabs. */
export type Tab = "overview" | "documents" | "news" | "queries" | "prompts" | "audit" | "admins";

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const ALL_ITEMS: Record<Tab, NavItem> = {
  overview: { id: "overview", label: "Аналітика", icon: <BarChart3 size={18} strokeWidth={1.8} /> },
  queries: { id: "queries", label: "Запити", icon: <MessageCircle size={18} strokeWidth={1.8} /> },
  news: { id: "news", label: "Новини", icon: <Newspaper size={18} strokeWidth={1.8} /> },
  documents: { id: "documents", label: "База знань", icon: <FileText size={18} strokeWidth={1.8} /> },
  prompts: { id: "prompts", label: "A/B Промпти", icon: <MessageSquareDashed size={18} strokeWidth={1.8} /> },
  audit: { id: "audit", label: "Audit Log", icon: <Shield size={18} strokeWidth={1.8} /> },
  admins: { id: "admins", label: "Адміністратори", icon: <Users size={18} strokeWidth={1.8} /> },
};

function getNavGroups(role: Role): NavGroup[] {
  if (role === "news_editor") {
    return [
      {
        items: [ALL_ITEMS.news],
      },
    ];
  }

  if (role === "chatbot_admin") {
    return [
      {
        title: "Аналітика та моніторинг",
        items: [ALL_ITEMS.overview, ALL_ITEMS.queries],
      },
      {
        title: "База знань",
        items: [ALL_ITEMS.documents],
      },
      {
        title: "Налаштування",
        items: [ALL_ITEMS.prompts],
      },
    ];
  }

  // Super Admin
  return [
    {
      title: "Аналітика та моніторинг",
      items: [ALL_ITEMS.overview, ALL_ITEMS.queries],
    },
    {
      title: "Контент та знання",
      items: [ALL_ITEMS.news, ALL_ITEMS.documents],
    },
    {
      title: "Система та адміністрування",
      items: [ALL_ITEMS.prompts, ALL_ITEMS.audit, ALL_ITEMS.admins],
    },
  ];
}

export function Sidebar({
  active,
  onChange,
  onLogout,
  role = "super_admin",
  userEmail,
  newsSubTab = "all",
  onSelectNewsSubTab,
  onCreateArticle,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  onLogout: () => void;
  role?: Role;
  userEmail?: string;
  newsSubTab?: NewsSubTab;
  onSelectNewsSubTab?: (sub: NewsSubTab) => void;
  onCreateArticle?: () => void;
}) {
  const { stats, loading: statsLoading } = useNewsStats();
  const confirm = useConfirm();

  const navGroups = getNavGroups(role);

  const roleLabel =
    role === "super_admin"
      ? "Головний адмін"
      : role === "news_editor"
      ? "Редактор новин"
      : "Адмін чат-бота";

  const showNewsSubNav = active === "news" || role === "news_editor";

  const handleNavClick = async (targetTab: Tab) => {
    if (active === targetTab) return;
    if ((window as any).__admin_has_unsaved_changes) {
      const ok = await confirm({
        title: "Незбережені зміни",
        description: "У вас є незбережені зміни в новині. Ви дійсно бажаєте перейти до іншого розділу?",
        confirmText: "Перейти",
        cancelText: "Залишитися",
        variant: "warning",
      });
      if (!ok) return;
    }
    onChange(targetTab);
  };

  const handleSubTabClick = async (sub: NewsSubTab) => {
    if (newsSubTab === sub) return;
    if ((window as any).__admin_has_unsaved_changes) {
      const ok = await confirm({
        title: "Незбережені зміни",
        description: "У вас є незбережені зміни в новині. Ви дійсно бажаєте перейти?",
        confirmText: "Перейти",
        cancelText: "Залишитися",
        variant: "warning",
      });
      if (!ok) return;
    }
    onSelectNewsSubTab?.(sub);
  };

  const handleCreateArticle = async () => {
    if ((window as any).__admin_has_unsaved_changes) {
      const ok = await confirm({
        title: "Незбережені зміни",
        description: "У вас є незбережені зміни в поточній новині. Створити нову новину?",
        confirmText: "Створити нову",
        cancelText: "Скасувати",
        variant: "warning",
      });
      if (!ok) return;
    }
    onCreateArticle?.();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl md:w-[240px] text-sidebar-foreground transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Activity size={18} strokeWidth={2} />
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-semibold text-foreground leading-none">Admin Panel</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">University Chatbot</div>
        </div>
      </div>

      {/* Quick Action Button for News Editors */}
      {showNewsSubNav && onCreateArticle && (
        <NewsQuickActions onCreateArticle={handleCreateArticle} />
      )}

      {/* Navigation list */}
      <nav className="flex flex-1 flex-col gap-3 px-3 py-2 overflow-y-auto">
        {role === "news_editor" ? (
          <div className="flex flex-col gap-1">
            <span className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Розділи новин
            </span>
            {onSelectNewsSubTab && (
              <NewsSubNav
                activeSubTab={newsSubTab}
                onSelectSubTab={handleSubTabClick}
                draftsCount={stats.drafts}
                standalone={true}
              />
            )}
          </div>
        ) : (
          navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-1">
              {group.title && (
                <span className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
                  {group.title}
                </span>
              )}
              {group.items.map((item) => {
                const isItemActive = active === item.id;
                return (
                  <div key={item.id} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 cursor-pointer",
                        isItemActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {isItemActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className={cn("relative z-10", isItemActive && "text-primary")}>{item.icon}</span>
                      <span className="relative z-10 hidden md:inline">{item.label}</span>
                    </button>

                    {/* Render sub-navigation for News if news tab is active */}
                    {item.id === "news" && showNewsSubNav && onSelectNewsSubTab && (
                      <NewsSubNav
                        activeSubTab={newsSubTab}
                        onSelectSubTab={handleSubTabClick}
                        draftsCount={stats.drafts}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </nav>

      {/* Editor Statistics Widget */}
      {showNewsSubNav && (
        <EditorStatsWidget stats={stats} loading={statsLoading} />
      )}

      {/* User Info Card */}
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

      {/* Logout button */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          type="button"
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
