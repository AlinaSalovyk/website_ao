import { Info, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, type ReactNode } from "react";

export function PageGuide({
  title = "Як користуватися цією сторінкою",
  summary,
  items,
  children,
  defaultOpen = false,
}: {
  title?: string;
  summary?: string;
  items?: Array<{ title: string; desc: string }>;
  children?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card overflow-hidden shadow-sm">
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
            <span className="font-semibold text-primary shrink-0 text-xs sm:text-sm tracking-tight">{title}</span>
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
            <div className="p-4 pt-3 border-t border-primary/15 bg-muted/40 text-[12px] leading-relaxed text-foreground">
              {items && items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col justify-start rounded-xl border border-border bg-card p-3.5 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary border border-primary/20">
                          0{idx + 1}
                        </span>
                        <h4 className="text-xs font-semibold text-foreground tracking-tight leading-tight">
                          {it.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">
                        {it.desc}
                      </p>
                    </div>
                  ))}
                </div>
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
