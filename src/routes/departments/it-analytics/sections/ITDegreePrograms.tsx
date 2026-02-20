import React, { useState } from 'react';
import type { JSX } from "react";
import { cn } from "@/lib/utils";

interface ProgramLevel {
    id: string;
    title: string;
    programs: string[];
}

const programsData: ProgramLevel[] = [
    {
        id: "01",
        title: "Бакалаврат",
        programs: [
            "освітньо-професійна програма \"Робототехніка та машинне навчання\"",
            "освітньо-професійна програма \"Штучний інтелект та аналітика даних\"",
            "освітньо-професійна програма \"Комп'ютерні науки\"",
            "освітньо-професійна програма \"Економічна кібернетика\""
        ]
    },
    {
        id: "02",
        title: "Магістратура",
        programs: [
            "освітньо-професійна програма \"Управління проєктами\""
        ]
    },
    {
        id: "03",
        title: "Аспірантура",
        programs: [
            "освітньо-наукова програма \"Прикладна математика\""
        ]
    }
];

export const ITDegreePrograms = (): JSX.Element => {
    const [openItems, setOpenItems] = useState<string[]>(["01"]);

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    return (
        <section
            className="w-full py-24 text-white"
            style={{
                background: 'linear-gradient(to bottom, #000000 0%, #01133C 100%)'
            }}
        >
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9">
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-16 lg:gap-24">

                    {/* Title Section */}
                    <div>
                        <h2 className="font-['Roboto',sans-serif] font-medium text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-white">
                            Наші<br />освітні<br />програми
                        </h2>
                    </div>

                    {/* Accordion List */}
                    <div className="flex flex-col">
                        {programsData.map((level) => (
                            <div key={level.id} className="border-b border-white/20 last:border-0">
                                <button
                                    onClick={() => toggleItem(level.id)}
                                    className="w-full flex items-center justify-between py-8 group text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-6">
                                        <span className="text-blue-600 font-mono text-sm md:text-base tracking-widest">
                                            {level.id}
                                        </span>
                                        <span className="text-2xl md:text-3xl font-['Roboto',sans-serif]">
                                            {level.title}
                                        </span>
                                    </div>
                                    <div className="relative flex items-center justify-center w-6 h-6">
                                        {/* Horizontal line (always visible) */}
                                        <div className="absolute w-6 h-[1px] bg-white transition-transform duration-300" />
                                        {/* Vertical line (rotates to horizontal when open) */}
                                        <div
                                            className={cn(
                                                "absolute w-6 h-[1px] bg-white transition-transform duration-300",
                                                openItems.includes(level.id) ? "rotate-0" : "-rotate-90"
                                            )}
                                        />
                                    </div>
                                </button>

                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        openItems.includes(level.id) ? "max-h-[500px] opacity-100 pb-8" : "max-h-0 opacity-0"
                                    )}
                                >
                                    <ul className="pl-12 md:pl-14 space-y-3">
                                        {level.programs.map((program, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 shrink-0 opacity-60" />
                                                <span className="text-gray-300 font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed">
                                                    {program}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                        <div className="border-b border-white/20" />
                    </div>
                </div>
            </div>
        </section>
    );
};
