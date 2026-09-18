import { Newspaper, FileEdit, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JSX } from "react";
import { motion } from "motion/react";

export type NewsSubTab = "all" | "drafts" | "categories";

interface NewsSubNavProps {
  activeSubTab: NewsSubTab;
  onSelectSubTab: (subTab: NewsSubTab) => void;
  draftsCount?: number;
  standalone?: boolean;
}

export function NewsSubNav({
  activeSubTab,
  onSelectSubTab,
  draftsCount = 0,
  standalone = false,
}: NewsSubNavProps): JSX.Element {
  const iconSize = standalone ? 18 : 16;

  const items: { id: NewsSubTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "all",
      label: "Усі новини",
      icon: <Newspaper size={iconSize} strokeWidth={1.8} />,
    },
    {
      id: "drafts",
      label: "Мої чернетки",
      icon: <FileEdit size={iconSize} strokeWidth={1.8} />,
      badge: draftsCount,
    },
    {
      id: "categories",
      label: "Категорії та теги",
      icon: <FolderTree size={iconSize} strokeWidth={1.8} />,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-1 my-1",
        standalone ? "px-0" : "pl-2.5 border-l-2 border-primary/20 ml-4"
      )}
    >
      {items.map((item) => {
        const isActive = activeSubTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSubTab(item.id)}
            className={cn(
              "relative flex w-full items-center justify-between text-left font-medium transition-all duration-150 cursor-pointer",
              standalone
                ? "rounded-xl px-3 py-2.5 text-[13px]"
                : "rounded-lg px-2.5 py-1.5 text-[12px]",
              isActive
                ? standalone
                  ? "text-primary font-semibold"
                  : "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {standalone && isActive && (
              <motion.div
                layoutId="sidebar-active-subnav"
                className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <span className={cn("shrink-0", isActive && "text-primary")}>{item.icon}</span>
              <span className="truncate hidden md:inline">{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={cn(
                  "relative z-10 hidden md:inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
