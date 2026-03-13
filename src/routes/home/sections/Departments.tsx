import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { Sparkles, ChevronDown } from "lucide-react";

interface DepartmentData {
    id: string;
    title: string;
    programs: {
        bachelor?: string[];
        master?: string[];
        phd?: string[];
    };
}

const DEPARTMENTS: DepartmentData[] = [
    {
        id: "finance",
        title: "Кафедра фінансів та бізнесу",
        programs: {
            bachelor: [
                'ОПП "Фінанси та бізнес-аналітика"',
                'ОПП "Підприємництво та торгівля"',
                'ОПП "Підприємництво та управління бізнесом"',
            ],
            master: [
                'ОПП "Фінанси та бізнес-аналітика"',
                'ОПП "Підприємництво та торгівля"',
                'ОПП "Підприємництво та управління бізнесом"',
            ],
        },
    },
    {
        id: "management",
        title: "Кафедра менеджменту та маркетингу",
        programs: {
            bachelor: ['ОПП "Data-маркетинг та аналітика"'],
            master: [
                'ОПП "HR-менеджмент"',
                'ОПП "Менеджмент продажів та логістика"',
            ],
            phd: ['ОПП "Менеджмент"'],
        },
    },
    {
        id: "it",
        title: "Кафедра інформаційних технологій та аналітики даних",
        programs: {
            bachelor: [
                'ОПП "Робототехніка та машинне навчання"',
                'ОПП "Штучний інтелект та аналітика даних"',
                'ОПП "Комп\'ютерні науки"',
                'ОПП "Економічна кібернетика"',
            ],
            master: ['ОПП "Управління проєктами"'],
            phd: ['ОПП "Прикладна математика"'],
        },
    },
    {
        id: "math",
        title: "Кафедра математики та інтелектуальних обчислень",
        programs: {
            phd: ['ОПП "Прикладна математика"'],
        },
    },
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <section className="w-full bg-layout-bg py-24 min-h-[600px] flex items-center relative overflow-hidden">
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
            <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 relative z-10">
                <ScrollReveal variant="fade-up" className="w-full">
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
                                <ChevronDown className={cn("w-5 h-5 text-blue-400 transition-transform duration-300 shrink-0", isDropdownOpen && "rotate-180")} />
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
                                        {DEPARTMENTS.map((dept) => (
                                            <button
                                                key={dept.id}
                                                onClick={() => {
                                                    setActiveId(dept.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left p-4 rounded-xl transition-colors duration-200 text-sm md:text-base",
                                                    activeId === dept.id ? "bg-blue-500/15 text-white shadow-[inset_0_0_0_1px_var(--color-indicator-active-border)]" : "text-separator-gray hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                {dept.title}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Desktop Sidebar Sidebar (md and up) */}
                        <div className="hidden md:flex flex-col w-[350px] lg:w-[450px] shrink-0 border-l border-white/5 relative">
                            {DEPARTMENTS.map((dept) => {
                                const isActive = activeId === dept.id;
                                return (
                                    <button
                                        key={dept.id}
                                        onClick={() => setActiveId(dept.id)}
                                        className="group relative text-left py-5 pl-8 pr-4 focus:outline-none transition-all duration-300 w-full"
                                    >
                                        <div className={cn(
                                            "relative z-10 text-xl font-light transition-colors duration-400 tracking-wide",
                                            isActive
                                                ? "text-white drop-shadow-[0_0_8px_var(--color-glass-light-border)]"
                                                : "text-separator-gray group-hover:text-white"
                                        )}>
                                            {dept.title}
                                        </div>

                                        <div className={cn(
                                            "absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                            isActive && "opacity-100 bg-white/[0.04] backdrop-blur-sm"
                                        )} />

                                        {isActive && (
                                            <motion.div
                                                layoutId="active-dept-indicator-desktop"
                                                className="absolute top-0 left-[-1px] w-[2px] h-full bg-gradient-to-b from-blue-400 to-cyan-300 shadow-[0_0_12px_var(--color-indicator-glow)] z-20"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Side: High-end Glassmorphism Panel */}
                        <div className="flex-1 w-full relative z-10">
                            <motion.div 
                                layout 
                                className="relative z-0 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-10 lg:p-12 shadow-2xl flex flex-col overflow-hidden"
                                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                            >
                                
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                
                                <motion.div layout="position" className="flex items-center gap-3 mb-8 md:mb-10 shrink-0">
                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-base md:text-lg font-medium text-white/80 tracking-wide">
                                        Наші освітні програми
                                    </h2>
                                </motion.div>
                                <div className="relative w-full">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        <motion.div
                                            key={activeId}
                                            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                                            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                            exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
                                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                            className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10 xl:gap-16 w-full"
                                        >
                                            {activeDepartment?.programs.bachelor && (
                                                <ProgramLevel title="Бакалаврат" items={activeDepartment.programs.bachelor} parentId={activeDepartment.id} />
                                            )}
                                            {activeDepartment?.programs.master && (
                                                <ProgramLevel title="Магістратура" items={activeDepartment.programs.master} parentId={activeDepartment.id} />
                                            )}
                                            {activeDepartment?.programs.phd && (
                                                <ProgramLevel title="Аспірантура" items={activeDepartment.programs.phd} parentId={activeDepartment.id} />
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>
                        
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};