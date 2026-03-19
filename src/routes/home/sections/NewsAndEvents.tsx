import type { JSX } from "react";
import { motion } from "motion/react";
import { ArrowRightIcon, ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { cn } from "@/lib/utils";

const newsItems = [
    {
        id: 1,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage: "/images/Home/news-background.webp",
        link: "Дізнатися більше",
    },
    {
        id: 2,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage: "/images/Home/news-background-1.webp",
        link: "Дізнатися більше",
    },
    {
        id: 3,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage: "/images/Home/news-background-2.webp",
        link: "Дізнатися більше",
    },
    {
        id: 4,
        badge: "НОВИНА ТИЖНЯ",
        date: "Feb 19",
        title: "When an Award-Winning\nWebsite Pays for Itself\n(Twice)",
        readTime: "MIN READ",
        backgroundImage: "/images/Home/news-background-3.webp",
        link: "Дізнатися більше",
    },
];

const BentoCard = ({ item, className, isLarge = false }: { item: typeof newsItems[0], className?: string, isLarge?: boolean }) => {
    return (
        <div className={cn("w-full h-full flex flex-col", className)}>
            <ScrollReveal variant="fade-up" delay={item.id * 100} className="w-full h-full flex-1">
                <motion.a 
                    href="#"
                    whileHover="hover"
                    className={cn(
                        "relative flex flex-col justify-end w-full h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group cursor-pointer border border-black/5 flex-1 shadow-xl bg-gray-900 isolate",
                        isLarge ? "min-h-[280px] md:min-h-full" : "min-h-[220px] md:min-h-full"
                    )}
                >
                    {/* Background Image */}
                    <div 
                        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
                        style={{ backgroundImage: `url(${item.backgroundImage})` }}
                    />

                    {/* Gradient Overlays for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                    
                    {/* Subtle Hover Glow */}
                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 mix-blend-overlay z-10 transition-opacity duration-500 pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-20 p-5 md:p-8 flex flex-col h-full w-full justify-between">
                        
                        {/* Top Info */}
                        <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-auto mt-1 md:mt-2">
                            <div className="backdrop-blur-md bg-white/10 border border-white/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shrink-0">
                                <span className="text-white text-[9px] md:text-[10px] lg:text-xs font-semibold tracking-wider uppercase">
                                    {item.badge}
                                </span>
                            </div>
                            <div className="backdrop-blur-md bg-black/30 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 shrink-0">
                                <span className="text-white/80 text-[9px] md:text-[10px] lg:text-xs font-medium tracking-wider uppercase">
                                    {item.date}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/50" />
                                <span className="text-white/80 text-[9px] md:text-[10px] lg:text-xs font-medium tracking-wider uppercase">
                                    {item.readTime}
                                </span>
                            </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="flex flex-col gap-2 md:gap-4 mt-6 md:mt-8">
                            <h3 className={cn(
                                "font-semibold text-white tracking-tight text-balance",
                                isLarge ? "text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight" : "text-lg md:text-2xl lg:text-3xl leading-snug"
                            )}>
                                {item.title}
                            </h3>

                            <div className="flex items-center gap-2.5 md:gap-3 mt-1 md:mt-4">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
                                    <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-black group-hover:text-white transition-colors" />
                                </div>
                                <span className="text-sm md:text-base font-medium text-white/90 group-hover:text-white relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-white group-hover:after:w-full after:transition-all after:duration-300">
                                    {item.link}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.a>
            </ScrollReveal>
        </div>
    );
};

export const NewsAndEvents = (): JSX.Element => {
    return (
        <section id="news" className="w-full bg-pure-white py-16 md:py-24 relative overflow-hidden">
            {/* Background creative flares */}
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-blue-50 rounded-full blur-[80px] md:blur-[120px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 relative z-10">
                
                {/* Header */}
                <ScrollReveal variant="fade-up">
                    <header className="flex flex-col md:flex-row items-start md:items-end justify-between w-full mb-10 md:mb-16 gap-6 md:gap-8">
                        <div className="flex flex-col items-start gap-3 w-full md:w-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-pulse"></span>
                                Актуально
                            </div>
                            <h2 className="font-semibold text-pure-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
                                Новини та події
                            </h2>
                        </div>

                        <a
                            href="#"
                            className="group flex items-center justify-center gap-3 bg-pure-black text-white px-6 py-3.5 rounded-full font-medium text-sm md:text-base hover:bg-gray-800 transition-colors duration-300 w-full md:w-max"
                        >
                            Всі новини
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </header>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 auto-rows-auto md:auto-rows-[350px]">
                    <BentoCard 
                        item={newsItems[0]} 
                        isLarge={true}
                        className="col-span-1 md:col-span-2 md:row-span-2" 
                    />
                    <BentoCard 
                        item={newsItems[1]} 
                        className="col-span-1 row-span-1" 
                    />
                    <BentoCard 
                        item={newsItems[2]} 
                        className="col-span-1 row-span-1" 
                    />
                    <BentoCard 
                        item={newsItems[3]} 
                        className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1" 
                    />
                    
                </div>
            </div>
        </section>
    );
};
