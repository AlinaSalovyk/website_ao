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
            className="bg-[#0f1215] overflow-hidden w-full min-w-[1440px] flex justify-center"
            data-model-id="530:5377"
        >
            {isMenuOpen && <Menu onClose={() => setIsMenuOpen(false)} />}
            <div className="flex w-full relative flex-col items-start min-h-screen">
                <div
                    className="absolute top-0 left-0 w-full h-[1800px] pointer-events-none opacity-0 animate-fade-in [--animation-delay:0ms]"
                    style={{
                        background: 'linear-gradient(180deg, #01133C00 0%, #011C58 50%, #0332A2 100%)'
                    }}
                />

                <img
                    className="absolute top left-1/2 -translate-x-1/4 w-[1250px] h-[780px] object-contain pointer-events-none opacity-0 animate-fade-in [--animation-delay:400ms]"
                    alt="Element black chrome"
                    src="/images/3d-black-chrome-shape.png"
                />

                <header className="relative w-full flex justify-between items-center px-9 py-5 z-50 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
                    <button
                        onClick={handleMenuClick}
                        className="rounded-[20px] border border-white/80 bg-transparent text-white px-5 py-2 uppercase text-[11px] tracking-[0.15em] font-medium hover:bg-white/10 transition-colors"
                    >
                        МЕНЮ
                    </button>

                    {/* Logo */}
                    <svg width="83" height="32" viewBox="0 0 83 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
                        <path d="M45.6854 0.0372467H13.75V8.37522H45.6854V0.0372467Z" fill="white" />
                        <path d="M25.452 13.0111H13.6533V21.3491H25.452V31.9728H33.79V21.3491H45.5887V13.0111H33.79H25.452Z" fill="white" />
                        <path d="M81.4999 8.37522V0.0372467H49.5645V31.9727H81.4999V13.011H57.9185V8.37522H81.4999ZM73.1619 21.349V23.6186H57.9185V21.349H73.1619Z" fill="white" />
                        <path d="M9.83797 0.0372467H1.5V31.9727H9.83797V0.0372467Z" fill="white" />
                    </svg>

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

                <section className="relative w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1000ms] flex-1 flex flex-col">
                    <InstituteLeadershipSection />
                </section>
            </div>
        </div>
    );
};
