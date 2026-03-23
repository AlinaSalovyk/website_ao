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
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { Locale } from "@/i18n";
import { getLocalizedPath, getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";
import type {
  DepartmentData,
  DepartmentId,
} from "@/routes/departments/departments-programs";

/* ── Sub-component: Single program level (Бакалаврат / Магістратура / etc.) ── */
const ProgramLevel = ({
  title,
  items,
  parentId,
  locale,
}: {
  title: string;
  items: any[];
  parentId: string;
  locale?: Locale;
}) => {
  const t = getTranslations(locale);
  return (
    <div className="space-y-5">
      <h3 className="text-sm md:text-base font-semibold text-blue-400 uppercase tracking-[0.15em]">
        {title}
      </h3>
      <ul className="space-y-3 relative">
        {items.map((program, idx) => {
          const programPrefix =
            program.programType === "OPP"
              ? t.educationLevels.opp
              : t.educationLevels.onp;
          const programText = `${programPrefix} ${program.title}`;

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
              className="group flex items-start gap-3 w-full"
            >
              <div className="mt-2 w-[1.5px] h-3 bg-white/20 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_var(--color-indicator-glow)] transition-all duration-300 shrink-0 rounded-full" />

              {program.link ? (
                <a
                  href={program.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted-light text-base md:text-lg font-light leading-relaxed hover:text-white transition-colors duration-300"
                >
                  {programText}
                </a>
              ) : (
                <span className="text-text-muted-light text-base md:text-lg font-light leading-relaxed group-hover:text-white transition-colors duration-300">
                  {programText}
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
    <div className={cn("w-full", className)}>
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 lg:gap-24 items-start relative w-full">
        {/* Mobile Dropdown Menu (< md) */}
        <div className="w-full md:hidden relative z-50" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between text-left bg-white/[0.03] border border-white/10 p-5 rounded-2xl backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-lg transition-colors hover:bg-white/[0.05]"
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
                className="absolute top-[calc(100%+8px)] left-0 w-full bg-dark-panel/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_10px_40px_var(--color-shadow-dropdown)] overflow-hidden z-[100]"
              >
                {departments.map((dept) => (
                  <button
                    key={dept.id}
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
        <div className="hidden md:flex flex-col w-[350px] lg:w-[450px] shrink-0 border-l border-white/5 relative self-start">
          {departments.map((dept) => {
            const isActive = activeId === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setActiveId(dept.id)}
                className="group relative text-left py-5 pl-8 pr-4 focus:outline-none transition-all duration-300 w-full"
              >
                <div
                  className={cn(
                    "relative z-10 text-xl font-light transition-colors duration-400 tracking-wide",
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
        <div className="flex-1 w-full relative z-10">
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
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10 xl:gap-16 w-full mb-8">
                    {activeDepartment?.programs.map((level) => (
                      <ProgramLevel
                        key={level.id}
                        title={level.title}
                        items={level.programs}
                        parentId={activeDepartment.id}
                        locale={locale}
                      />
                    ))}
                  </div>

                  {/* Link to department page */}
                  {showDepartmentLink && activeDepartment?.departmentLink && (
                    <div className="mt-4 pt-6 border-t border-white/10 w-full flex justify-end">
                      <a
                        href={getLocalizedPath(
                          activeDepartment.departmentLink,
                          locale ?? "uk",
                        )}
                        className="group flex items-center gap-2 text-sm md:text-base font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {t.departments.learnMoreAbout}
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transform group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
