/**
 * DepartmentSelector — Reusable tabbed glassmorphism component that
 * shows department educational programs with a sidebar / mobile dropdown.
 *
 * Usage:
 *   import { DepartmentSelector } from "@/components/sections/DepartmentSelector";
 *   import { DEPARTMENTS } from "@/routes/departments/departments-programs";
 *
 *   <DepartmentSelector departments={DEPARTMENTS} />
 *   <DepartmentSelector departments={DEPARTMENTS} defaultDepartmentId="finance" />
 */
import { ArrowRight, ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";
import type {
  DepartmentData,
  DepartmentId,
} from "@/routes/departments/departments-programs";
import type { ProgramLevelProgram } from "@/components/sections/degree-programs.types";

/* ── Sub-component: Single program level (Бакалаврат / Магістратура / etc.) ── */
const ProgramLevel = ({
  title,
  items,
  parentId,
  locale,
}: {
  title: string;
  items: ProgramLevelProgram[];
  parentId: string;
  locale?: Locale;
}) => {
  const t = getTranslations(locale);
  return (
    <div className="space-y-5">
      <h3 className="text-sm md:text-base font-semibold text-blue-400 uppercase tracking-[0.18em]">
        {title}
      </h3>
      <ul className="space-y-3 relative">
        {items.map((program, idx) => {
          const programPrefix =
            program.programType === "OPP"
              ? t.educationLevels.opp
              : t.educationLevels.onp;

          return (
            <motion.li
              key={`${parentId}-${program.title}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1 + idx * 0.05,
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="group w-full"
            >
              {program.link ? (
                <a
                  href={program.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${programPrefix} ${program.title}`}
                  className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-left transition-all duration-300 hover:border-[var(--color-brand-blue-soft)] hover:bg-[rgba(14,82,255,0.08)] hover:shadow-[0_0_24px_rgba(14,82,255,0.16)] cursor-pointer"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400/75 transition-transform duration-300 group-hover:scale-125 group-hover:bg-[var(--color-brand-blue-light)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-normal leading-relaxed text-white/45 md:text-[0.8rem]">
                      {programPrefix}
                    </span>
                    <span className="text-sm font-light leading-relaxed text-white/90 transition-colors duration-300 group-hover:text-white md:text-base">
                      {program.title}
                    </span>
                  </span>
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-white/25 transition-colors duration-300 group-hover:text-blue-400" />
                </a>
              ) : (
                <span className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-left">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white/35" />
                  <span className="min-w-0">
                    <span className="block text-xs font-normal leading-relaxed text-white/45 md:text-[0.8rem]">
                      {programPrefix}
                    </span>
                    <span className="text-sm font-light leading-relaxed text-white/88 md:text-base">
                      {program.title}
                    </span>
                  </span>
                </span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

/* ── Props ── */
export interface DepartmentSelectorProps {
  /** Array of departments to display (defaults to all departments from data file) */
  departments: DepartmentData[];
  /** Which department tab to select initially */
  defaultDepartmentId?: DepartmentId;
  /** Heading text shown above the programs list */
  heading?: string;
  /** Whether to show the "Дізнатися більше про кафедру" link */
  showDepartmentLink?: boolean;
  /** Extra class names for the root wrapper */
  className?: string;
  /** Locale for translations */
  locale?: Locale;
}

/* ── Main component ── */
export const DepartmentSelector = ({
  departments,
  defaultDepartmentId,
  heading,
  showDepartmentLink = true,
  className,
  locale,
}: DepartmentSelectorProps) => {
  const t = getTranslations(locale);
  const resolvedHeading = heading ?? t.home.departments.heading;
  const tabPanelId = useId();
  const [activeId, setActiveId] = useState<DepartmentId>(
    defaultDepartmentId ?? departments[0]?.id ?? ("it" as DepartmentId),
  );
  const activeDepartment = departments.find((d) => d.id === activeId);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <div className={cn("w-full", className)}>
      <div className="flex flex-col md:flex-row gap-8 md:gap-10 lg:gap-14 items-start relative w-full">
        {/* Mobile Dropdown Menu (< md) */}
        <div className="w-full md:hidden relative z-50" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            className="w-full flex items-center justify-between text-left bg-white/[0.03] border border-white/10 p-5 rounded-2xl backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 shadow-lg transition-colors hover:bg-white/[0.05]"
          >
            <span className="text-white text-base font-medium pr-4">
              {activeDepartment?.title}
            </span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-blue-400 transition-transform duration-300 shrink-0",
                isDropdownOpen && "rotate-180",
              )}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                role="listbox"
                aria-label={resolvedHeading}
                className="absolute top-[calc(100%+8px)] left-0 w-full bg-dark-panel/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_10px_40px_var(--color-shadow-dropdown)] overflow-hidden z-[100]"
              >
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    role="option"
                    aria-selected={activeId === dept.id}
                    onClick={() => {
                      setActiveId(dept.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-colors duration-200 text-sm md:text-base",
                      activeId === dept.id
                        ? "bg-blue-500/15 text-white shadow-[inset_0_0_0_1px_var(--color-indicator-active-border)]"
                        : "text-separator-gray hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {dept.title}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Sidebar (md and up)  */}
        <div
          role="tablist"
          aria-label={resolvedHeading}
          aria-orientation="vertical"
          className="hidden md:flex flex-col w-[320px] lg:w-[390px] shrink-0 border-l border-white/5 relative self-start"
        >
          {departments.map((dept) => {
            const isActive = activeId === dept.id;
            return (
              <button
                key={dept.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tabPanelId}-panel`}
                id={`${tabPanelId}-tab-${dept.id}`}
                onClick={() => setActiveId(dept.id)}
                className="group relative flex min-h-[96px] items-center text-left py-5 pl-8 pr-6 transition-all duration-300 w-full lg:min-h-[104px] lg:pr-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-inset focus-visible:rounded-lg"
              >
                <div
                  className={cn(
                    "relative z-10 max-w-full overflow-hidden text-lg font-light leading-[1.4] transition-colors duration-400 tracking-[0.01em] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] lg:text-[1.25rem]",
                    isActive
                      ? "text-white drop-shadow-[0_0_8px_var(--color-glass-light-border)]"
                      : "text-separator-gray group-hover:text-white",
                  )}
                >
                  {dept.title}
                </div>

                <div
                  className={cn(
                    "absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    isActive && "opacity-100 bg-white/[0.04] backdrop-blur-sm",
                  )}
                />

                {isActive && (
                  <motion.div
                    layoutId="active-dept-indicator-desktop"
                    className="absolute top-0 left-[-1px] w-[2px] h-full bg-gradient-to-b from-blue-400 to-cyan-300 shadow-[0_0_12px_var(--color-indicator-glow)] z-20"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Glassmorphism Panel */}
        <div
          className="flex-1 w-full relative z-10"
          role="tabpanel"
          id={`${tabPanelId}-panel`}
          aria-labelledby={`${tabPanelId}-tab-${activeId}`}
        >
          <motion.div
            layout
            className="relative z-0 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-10 lg:p-12 shadow-2xl flex flex-col overflow-hidden"
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <motion.div
              layout="position"
              className="flex items-center gap-3 mb-8 md:mb-10 shrink-0"
            >
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-base md:text-lg font-medium text-white/80 tracking-wide">
                {resolvedHeading}
              </h2>
            </motion.div>

            <div className="relative w-full">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="w-full flex flex-col"
                >
                  <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] md:p-7 lg:p-8">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10 gap-y-8 w-full xl:gap-y-10">
                      {activeDepartment?.programs.map((level, index, levels) => (
                        <div
                          key={level.id}
                          className={cn(
                            levels.length % 2 === 1 && index === levels.length - 1 && "xl:col-span-2 xl:max-w-[50%]",
                          )}
                        >
                          <ProgramLevel
                            title={level.title}
                            items={level.programs}
                            parentId={activeDepartment.id}
                            locale={locale}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link to department page */}
                  {showDepartmentLink && activeDepartment?.departmentLink && (
                    <div className="mt-2 pt-6 border-t border-white/10 w-full">
                      <div className="flex items-center justify-end rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 md:px-5">
                      <a
                        href={getLocalizedPath(
                          activeDepartment.departmentLink,
                          locale ?? "uk",
                        )}
                        className="group inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 md:text-base"
                      >
                        {t.departments.learnMoreAbout}
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transform group-hover:translate-x-1 transition-transform" />
                      </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </MotionConfig>
  );
};
