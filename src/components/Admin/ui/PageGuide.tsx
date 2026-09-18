import { Info, ChevronDown, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, type ReactNode } from "react";

export interface PageGuideItem {
  title: string;
  desc: string;
  type?: "info" | "tip" | "warning";
}

export interface PageGuideCategory {
  id: string;
  label: string;
  icon?: ReactNode;
  items: PageGuideItem[];
}

export interface PageGuideProps {
  title?: string;
  summary?: string;
  categories?: PageGuideCategory[];
  items?: PageGuideItem[];
  children?: ReactNode;
  defaultOpen?: boolean;
}

export function PageGuide({
  title = "Як користуватися цією сторінкою",
  summary,
  categories,
  items,
  children,
  defaultOpen = false,
}: PageGuideProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTabId, setActiveTabId] = useState<string>(
    categories && categories.length > 0 ? categories[0].id : ""
  );

  const activeCategory = categories?.find((c) => c.id === activeTabId) || categories?.[0];
  const activeItems = activeCategory ? activeCategory.items : items || [];

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card overflow-hidden shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-medium text-foreground transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Info size={15} />
          </div>
          <div className="flex flex-col items-start min-w-0 mt-0.5">
            <span className="font-semibold text-primary shrink-0 text-xs sm:text-sm tracking-tight">
              {title}
            </span>
            {summary && (
              <span className="text-muted-foreground text-[11px] sm:text-[12px] font-normal opacity-90 leading-snug mt-0.5">
                {summary}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary transition-colors">
          <span>{isOpen ? "Згорнути" : "Інструкція"}</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-3 border-t border-primary/15 bg-muted/30 text-[12px] leading-relaxed text-foreground">
              {/* Category Tab Switchers if categories exist */}
              {categories && categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-4 p-1 bg-card rounded-xl border border-border/80 shadow-xs">
                  {categories.map((cat) => {
                    const isActive = cat.id === (activeCategory?.id || activeTabId);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveTabId(cat.id)}
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                          isActive
                            ? "text-primary shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="guide-tab-active"
                            className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/25"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          {cat.icon}
                          <span>{cat.label}</span>
                        </span>
                        <span
                          className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {cat.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Items Grid for active tab or flat items */}
              {activeItems && activeItems.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory?.id || "flat-items"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
                  >
                    {activeItems.map((it, idx) => {
                      const isWarning = it.type === "warning";
                      const isTip = it.type === "tip";

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col justify-start rounded-xl border p-3.5 shadow-2xs transition-all ${
                            isWarning
                              ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10"
                              : isTip
                              ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            {isWarning ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30">
                                <AlertTriangle size={12} />
                              </span>
                            ) : isTip ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                <Lightbulb size={12} />
                              </span>
                            ) : (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary border border-primary/20">
                                0{idx + 1}
                              </span>
                            )}
                            <h4 className="text-xs font-semibold text-foreground tracking-tight leading-tight">
                              {it.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">
                            {it.desc}
                          </p>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              ) : (
                children
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
