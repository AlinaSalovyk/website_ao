import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { ProgramLevel } from "@/components/sections/degree-programs.types";
import { DEPARTMENTS } from "@/routes/departments/departments-programs";

const PROGRAM_PREFIX_BY_TYPE = {
  OPP: "ОПП",
  ONP: "ОНП",
} as const;

const LEVELS: ProgramLevel["title"][] = [
  "Бакалаврат",
  "Магістратура",
  "Аспірантура",
];

const ProgramLevel = ({ title, items, parentId }: { title: string; items: string[]; parentId: string }) => (
    <div className="space-y-5">
        <h3 className="text-sm md:text-base font-semibold text-blue-400 uppercase tracking-[0.15em]">
            {title}
        </h3>
        <ul className="space-y-3 relative">
            {items.map((program, idx) => (
                <motion.li
                    key={`${parentId}-${program}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (idx * 0.05), duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="group flex items-start gap-3 w-full"
                >
                    <div className="mt-2 w-[1.5px] h-3 bg-white/20 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_var(--color-indicator-glow)] transition-all duration-300 shrink-0 rounded-full" />
                    <span className="text-text-muted-light text-base md:text-lg font-light leading-relaxed group-hover:text-white transition-colors duration-300">
                        {program}
                    </span>
                </motion.li>
            ))}
        </ul>
    </div>
);

export const Departments = () => {
  const [activeId, setActiveId] = useState(DEPARTMENTS[0].id);
  const activeDepartment = DEPARTMENTS.find((d) => d.id === activeId);

  return (
    <section
      aria-labelledby="departments-programs-heading"
      className="w-full bg-layout-bg py-20 min-h-[600px] flex items-center"
    >
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col md:flex-row gap-12 md:gap-20">
        {/* Left Side: Department List */}
        <div className="flex flex-col gap-6 md:w-1/3">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setActiveId(dept.id)}
              className="group relative text-left py-2 focus:outline-none transition-colors duration-300 min-h-[72px] flex items-center cursor-pointer"
            >
              <span
                className={cn(
                  "relative z-10 text-lg md:text-xl font-medium transition-colors duration-300",
                  activeId === dept.id
                    ? "text-white"
                    : "text-[#8F8F95] group-hover:text-white",
                )}
              >
                {dept.title}
              </span>
              {activeId === dept.id && (
                <motion.div
                  layoutId="active-department-underline"
                  className="absolute bottom-0 left-0 w-full h-[1px] bg-white"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {/* Hover line for inactive items */}
              {activeId !== dept.id && (
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#323237] group-hover:bg-[#52525b] transition-colors duration-300" />
              )}
            </button>
          ))}
        </div>

        {/* Right Side: Educational Programs */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-white space-y-10"
            >
              <h2
                id="departments-programs-heading"
                className="text-2xl md:text-3xl lg:text-4xl font-normal mb-8"
              >
                Наші освітні програми:
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {LEVELS.map((levelTitle) => {
                  const level = activeDepartment?.programs.find(
                    (programLevel) => programLevel.title === levelTitle,
                  );

                  if (!level) {
                    return null;
                  }

                  return (
                    <div key={`${activeId}-${level.id}`} className="space-y-4">
                      <h3 className="text-xl md:text-2xl font-light text-[#E4E4E7]">
                        {level.title}
                      </h3>
                      <ul className="space-y-2">
                        {level.programs.map((program) => (
                          <li
                            key={`${activeId}-${level.id}-${program.title}`}
                            className="text-[#A1A1AA] text-sm md:text-base flex items-start gap-2"
                          >
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-[#A1A1AA] shrink-0" />
                            {(() => {
                              const programPrefix =
                                PROGRAM_PREFIX_BY_TYPE[program.programType];
                              const programText = `${programPrefix} ${program.title}`;

                              return program.link ? (
                                <a
                                  href={program.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-white transition-colors duration-200"
                                >
                                  {programText}
                                </a>
                              ) : (
                                <span>{programText}</span>
                              );
                            })()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
