"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

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

export const Departments = () => {
    const [activeId, setActiveId] = useState(DEPARTMENTS[0].id);
    const activeDepartment = DEPARTMENTS.find((d) => d.id === activeId);

    return (
        <section className="w-full bg-layout-bg py-20 min-h-[600px] flex items-center">
            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col md:flex-row gap-12 md:gap-20">
                {/* Left Side: Department List */}
                <div className="flex flex-col gap-6 md:w-1/3">
                    {DEPARTMENTS.map((dept) => (
                        <button
                            key={dept.id}
                            onClick={() => setActiveId(dept.id)}
                            className="group relative text-left py-2 focus:outline-none transition-colors duration-300"
                        >
                            <span
                                className={cn(
                                    "relative z-10 text-lg md:text-xl font-medium transition-colors duration-300",
                                    activeId === dept.id
                                        ? "text-white"
                                        : "text-[#8F8F95] group-hover:text-white"
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
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-normal mb-8">
                                Наші освітні програми:
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {activeDepartment?.programs.bachelor && (
                                    <div className="space-y-4">
                                        <h4 className="text-xl md:text-2xl font-light text-[#E4E4E7]">
                                            Бакалаврат
                                        </h4>
                                        <ul className="space-y-2">
                                            {activeDepartment.programs.bachelor.map((program, idx) => (
                                                <li
                                                    key={idx}
                                                    className="text-[#A1A1AA] text-sm md:text-base flex items-start gap-2"
                                                >
                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#A1A1AA] shrink-0" />
                                                    {program}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {activeDepartment?.programs.master && (
                                    <div className="space-y-4">
                                        <h4 className="text-xl md:text-2xl font-light text-[#E4E4E7]">
                                            Магістратура
                                        </h4>
                                        <ul className="space-y-2">
                                            {activeDepartment.programs.master.map((program, idx) => (
                                                <li
                                                    key={idx}
                                                    className="text-[#A1A1AA] text-sm md:text-base flex items-start gap-2"
                                                >
                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#A1A1AA] shrink-0" />
                                                    {program}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {activeDepartment?.programs.phd && (
                                    <div className="space-y-4">
                                        <h4 className="text-xl md:text-2xl font-light text-[#E4E4E7]">
                                            Аспірантура
                                        </h4>
                                        <ul className="space-y-2">
                                            {activeDepartment.programs.phd.map((program, idx) => (
                                                <li
                                                    key={idx}
                                                    className="text-[#A1A1AA] text-sm md:text-base flex items-start gap-2"
                                                >
                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#A1A1AA] shrink-0" />
                                                    {program}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};