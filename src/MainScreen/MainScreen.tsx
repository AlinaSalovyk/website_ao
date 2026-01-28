import { AboutSection } from "./sections/AboutSection/AboutSection";
import { EducationalProgramsSection } from "./sections/EducationalProgramsSection/EducationalProgramsSection";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { InnovationStatsSection } from "./sections/InnovationStatsSection/InnovationStatsSection";
import { InstituteLeadershipSection } from "./sections/InstituteLeadershipSection.tsx/InstituteLeadershipSection";
import { LandingHeroSection } from "./sections/LandingHeroSection/LandingHeroSection";
import { NewsAndEventsSection } from "./sections/NewsAndEventsSection/NewsAndEventsSection";
import type { JSX } from "react";

import { useState } from "react";
import { Menu } from "../routes/Menu/Menu";

export const MainScreen = (): JSX.Element => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuClick = () => {
        setIsMenuOpen(true);
    };

    return (
        <div
            className="bg-black overflow-hidden w-full min-w-[1440px] flex justify-center"
            data-model-id="530:5377"
        >
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}
            <div className="flex w-full relative flex-col items-start">
                <img
                    className="absolute top-0 left-0 w-full h-[1689px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms]"
                    alt="Gradient"
                    src="https://c.animaapp.com/mkvpx7lhh8vezq/img/gradient.png"
                />

                <img
                    className="absolute top-0 left-0 w-full h-[820px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:200ms]"
                    alt="Gradient"
                    src="https://c.animaapp.com/mkvpx7lhh8vezq/img/gradient-1.png"
                />

                <img
                    className="absolute top-[-20px] left-1/2 -translate-x-1/4 w-[750px] h-[780px] object-contain pointer-events-none opacity-0 animate-fade-in [--animation-delay:400ms]"
                    alt="Element black chrome"
                    src="https://c.animaapp.com/mkvpx7lhh8vezq/img/3d-black-chrome-shape--17-.png"
                />

                <img
                    className="absolute top-0 left-0 w-full h-[1689px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:600ms]"
                    alt="Gradient"
                    src="https://c.animaapp.com/mkvpx7lhh8vezq/img/gradient-2.svg"
                />

                <header className="relative w-full flex justify-between items-center px-9 py-5 z-50 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
                    <button
                        onClick={handleMenuClick}
                        className="rounded-[20px] border border-white/80 bg-transparent text-white px-5 py-2 uppercase text-[11px] tracking-[0.15em] font-medium hover:bg-white/10 transition-colors"
                    >
                        МЕНЮ
                    </button>

                    {/* Logo */}
                    <img
                        src="/images/logo.png"
                        alt="ІТБ Logo"
                        className="h-10 w-auto object-contain"
                    />

                    <button className="rounded-[20px] border border-white/80 bg-transparent text-white px-5 py-2 uppercase text-[11px] tracking-[0.15em] font-medium hover:bg-white/10 transition-colors">
                        КОНТАКТИ
                    </button>
                </header>

                {/* Section 1: Landing Hero - Title only */}
                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                    <LandingHeroSection />
                </section>

                {/* Section 2: About - Tags + Description + Image */}
                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                    <AboutSection />
                </section>

                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                    <InnovationStatsSection />
                </section>

                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                    <HeroSection />
                </section>

                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                    <NewsAndEventsSection />
                </section>

                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
                    <EducationalProgramsSection />
                </section>

                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1000ms]">
                    <InstituteLeadershipSection />
                </section>
            </div>
        </div>
    );
};
