import { useState, useRef, type MouseEvent } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadershipMember {
    id: number;
    name: string;
    role: string;
    email: string;
    officeHours: string;
    image: string;
}

const leadershipData: LeadershipMember[] = [
    {
        id: 1,
        name: "Новоселецький Олександр Миколайович",
        role: "Директор Інституту ІТ та бізнесу, кандидат економічних наук, доцент кафедри інформаційних технологій та аналітики даних",
        email: "oleksandr.novoseletskyi@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/novoseletskyy.jpg"
    },
    {
        id: 2,
        name: "Шулик Юлія Віталіївна",
        role: "Заступник директора з навчально-наукової роботи, кандидат економічних наук, доцент, завідувач кафедри фінансів та бізнесу",
        email: "yulia.shulyk@oa.edu.ua",
        officeHours: "понеділок-п'ятниця: 8.30-17.30, обідня перерва 12.30-13.30",
        image: "/images/InstituteManagement/shulyk.jpg"
    },
    {
        id: 3,
        name: "Чернявський Андрій Володимирович",
        role: "Заступник директора з навчально-виховної роботи, викладач кафедри інформаційних технологій та аналітики даних",
        email: "andrii.cherniavskyi@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/cherniavskyi.jpg"
    },
    {
        id: 4,
        name: "Козак Людмила Василівна",
        role: "Заступник директора з питань якості освіти, доктор економічних наук, доцент кафедри менеджменту та маркетингу",
        email: "lyudmyla.kozak@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/Kozak.jpg"
    },
    {
        id: 5,
        name: "Новак Анна Федорівна",
        role: "Заступник директора з профорієнтаційної роботи, викладач кафедри фінансів та бізнесу",
        email: "anna.novak@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/novak.jpg"
    },
    {
        id: 6,
        name: "Галецька Тамара Володимирівна",
        role: "Старший лаборант",
        email: "dekanat.ekonomichnyi@oa.edu.ua",
        officeHours: "понеділок - п'ятниця: 8.30-17.30, обідня перерва: 12.30-13.30",
        image: "/images/InstituteManagement/haletska.jpg"
    }
];

export const InstituteLeadership = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentMember = leadershipData[currentIndex];

    // 3D Mouse Tilt Interactive Effect
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <section id="leadership" className="w-full bg-pure-white py-24 relative overflow-hidden">
            {/* Soft creative background flare */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 md:px-9 relative z-10">
                <ScrollReveal variant="fade-up" className="w-full">

                    {/* Header */}
                    <header className="flex flex-col items-center mb-16 lg:mb-24 w-full text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            Наша команда
                        </div>
                        <h2 className="font-semibold text-pure-black text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
                            Керівництво інституту
                        </h2>
                    </header>

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center justify-center w-full max-w-5xl mx-auto">

                        {/* Interactive 3D Image Card */}
                        <div className="w-full max-w-[340px] md:max-w-[400px] lg:w-5/12 shrink-0 flex justify-center" style={{ perspective: "1000px" }}>
                            <motion.div
                                ref={cardRef}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    rotateX,
                                    rotateY,
                                    transformStyle: "preserve-3d",
                                }}
                                className="relative w-full aspect-[4/5] rounded-[2rem] shadow-2xl bg-white border border-gray-100 cursor-crosshair group overflow-hidden"
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.img
                                        key={currentMember.id}
                                        src={currentMember.image}
                                        alt={currentMember.name}
                                        initial={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                                        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ transform: "translateZ(30px)" }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=No+Image';
                                        }}
                                    />
                                </AnimatePresence>
                                
                                {/* 3D Glow overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ transform: "translateZ(50px)" }} />
                            </motion.div>
                        </div>

                        {/* Member Details & Creative Navigation */}
                        <div className="w-full lg:w-7/12 flex flex-col items-center lg:items-start text-center lg:text-left mt-8 lg:mt-0">

                            {/* Dynamically sizing wrapper to completely eliminate jiggle and empty space */}
                            <motion.div layout className="relative w-full flex flex-col items-center lg:items-start">
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.div
                                        key={currentMember.id}
                                        initial={{ opacity: 0, filter: "blur(4px)", x: 20 }}
                                        animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                                        exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
                                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                        className="w-full flex flex-col items-center lg:items-start"
                                    >
                                        <h3 className="font-bold text-2xl md:text-4xl lg:text-5xl text-pure-black mb-3 md:mb-4 tracking-tight leading-tight px-2 md:px-0">
                                            {currentMember.name}
                                        </h3>
                                        
                                        <p className="text-base md:text-xl text-gray-500 font-light mb-8 md:mb-10 max-w-lg leading-relaxed px-4 md:px-0">
                                            {currentMember.role}
                                        </p>

                                        {/* Premium Floating Contact Panel */}
                                        <div className="flex flex-col gap-4 md:gap-5 bg-white border border-gray-100 shadow-[0_8px_30px_var(--color-shadow-card)] p-5 md:p-8 rounded-2xl md:rounded-[1.5rem] w-full max-w-[360px] md:max-w-md mx-auto lg:mx-0">
                                            
                                            <div className="flex flex-row items-center md:items-start justify-start gap-3 md:gap-4 text-left">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                    <Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[10px] md:text-xs text-blue-500 font-semibold uppercase tracking-wider mb-0.5 md:mb-1">Електронна пошта</span>
                                                    <a href={`mailto:${currentMember.email}`} className="text-sm md:text-base text-gray-900 font-medium hover:text-blue-600 transition-colors break-words overflow-hidden">
                                                        {currentMember.email}
                                                    </a>
                                                </div>
                                            </div>
                                            
                                            <div className="h-px w-full bg-gray-100"></div>

                                            <div className="flex flex-row items-center md:items-start justify-start gap-3 md:gap-4 text-left">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[10px] md:text-xs text-blue-500 font-semibold uppercase tracking-wider mb-0.5 md:mb-1">Офісні години</span>
                                                    <span className="text-xs md:text-base text-gray-900 font-medium leading-snug">
                                                        {currentMember.officeHours}
                                                    </span>
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </motion.div>

                            {/* The 'Wow' Nav: Interactive Avatar Dock */}
                            <div className="mt-2 md:mt-8 lg:mt-12 w-full max-w-[340px] md:max-w-md mx-auto lg:mx-0 relative z-20">
                                <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-widest mb-3 md:mb-4">
                                    Вся команда інституту
                                </p>
                                <div className="bg-white border border-gray-100 shadow-[0_8px_30px_var(--color-shadow-card-alt)] p-2 md:p-2.5 rounded-full flex gap-2 md:gap-3 items-center justify-center lg:justify-start overflow-x-auto no-scrollbar max-w-max mx-auto lg:mx-0">
                                    {leadershipData.map((member, idx) => {
                                        const isActive = currentIndex === idx;
                                        return (
                                            <button
                                                key={member.id}
                                                onClick={() => setCurrentIndex(idx)}
                                                className="group relative focus:outline-none"
                                                aria-label={member.name}
                                                title={member.name}
                                            >
                                                {/* Active Ring Indicator */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="active-avatar-ring"
                                                        className="absolute inset-0 rounded-full border-[2.5px] border-blue-500"
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    />
                                                )}
                                                <div className={cn(
                                                    "w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden transition-all duration-300 border-[3px] border-transparent",
                                                    isActive ? "opacity-100 scale-[0.85]" : "opacity-50 hover:opacity-100 hover:scale-[0.9] grayscale-[50%] hover:grayscale-0"
                                                )}>
                                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                </div>
                                                
                                                {/* Tooltip on hover (desktop only) */}
                                                <div className="hidden lg:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-50 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl">
                                                    {member.name.split(" ")[0]} {member.name.split(" ")[1]}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>

                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};