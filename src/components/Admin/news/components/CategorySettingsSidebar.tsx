import { Settings as SettingsIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { PREDEFINED_ICONS } from "../../constants/icons";
import { AnimatedSection, GlassCard } from "../../ui";
import { HexagonColorPicker } from "../HexagonColorPicker";
import type { AdminNewsCategory } from "../../api";

interface CategorySettingsSidebarProps {
  cat: Partial<AdminNewsCategory>;
  setCat: Dispatch<SetStateAction<Partial<AdminNewsCategory>>>;
}

export function CategorySettingsSidebar({
  cat,
  setCat,
}: CategorySettingsSidebarProps) {
  return (
    <AnimatedSection i={4}>
      <GlassCard>
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/40">
          <SettingsIcon size={18} className="text-emerald-500" />
          <h3 className="text-base font-semibold text-foreground">Налаштування розділу</h3>
        </div>

        <div className="space-y-5">
          {/* Status */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Статус відображення
            </label>
            <select
              value={cat.status}
              onChange={(e) =>
                setCat((prev: Partial<AdminNewsCategory>) => ({ ...prev, status: e.target.value as any }))
              }
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="visible">Видима (Опубліковано)</option>
              <option value="hidden">Прихована (Драфт)</option>
              <option value="archived">В архіві</option>
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Акцентний колір (HEX)
            </label>
            <div className="flex items-center gap-3">
              <HexagonColorPicker
                color={cat.color || "#2563eb"}
                onChange={(color) => setCat((prev: Partial<AdminNewsCategory>) => ({ ...prev, color }))}
              />
              <input
                type="text"
                value={cat.color || "#2563eb"}
                onChange={(e) => setCat((prev: Partial<AdminNewsCategory>) => ({ ...prev, color: e.target.value }))}
                className="flex-1 rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none uppercase font-mono shadow-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Icon Grid */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Іконка категорії
            </label>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 max-h-52 overflow-y-auto pr-1 p-1 bg-background/50 rounded-xl border border-border/50">
              {PREDEFINED_ICONS.map((pi) => {
                const IconComp = pi.icon;
                const isSelected = cat.icon === pi.name;
                return (
                  <button
                    key={pi.name}
                    type="button"
                    title={pi.label}
                    onClick={() => setCat((prev: Partial<AdminNewsCategory>) => ({ ...prev, icon: pi.name }))}
                    className={`p-2 flex items-center justify-center rounded-lg transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 border-primary text-primary shadow-sm scale-105"
                        : "bg-card border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>
    </AnimatedSection>
  );
}
