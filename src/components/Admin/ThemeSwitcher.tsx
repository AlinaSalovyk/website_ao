import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion } from "motion/react";
import {
  getSavedTheme,
  setTheme,
  listenToSystemTheme,
  type ThemeMode,
} from "./theme";

interface ThemeSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function ThemeSwitcher({ className = "", compact = false }: ThemeSwitcherProps) {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const initialMode = getSavedTheme();
    setMode(initialMode);
    setTheme(initialMode);

    const unsubscribe = listenToSystemTheme(() => {
      // Re-apply if in system mode
    });
    return () => unsubscribe();
  }, []);

  const handleSelect = (newMode: ThemeMode) => {
    setMode(newMode);
    setTheme(newMode);
  };

  const options: Array<{ id: ThemeMode; label: string; icon: typeof Sun }> = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              title={`Тема: ${opt.label}`}
              className={`relative flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${
                isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-switcher-compact-active"
                  className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={14} className="relative z-10" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between rounded-xl bg-muted/50 p-1 border border-border/60 ${className}`}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = mode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-switcher-active"
                className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={13} className="relative z-10" />
            <span className="relative z-10 text-[11px]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
