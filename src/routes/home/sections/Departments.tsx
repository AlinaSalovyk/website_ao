import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { DepartmentSelector } from "@/components/sections/DepartmentSelector";
import { DEPARTMENTS } from "@/routes/departments/departments-programs";

export const Departments = () => {
    return (
        <section className="w-full bg-layout-bg py-24 min-h-[800px] lg:min-h-[100vh] flex items-center relative overflow-hidden">
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
            <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 relative z-10">
                <ScrollReveal variant="fade-up" className="w-full">
                    <DepartmentSelector departments={DEPARTMENTS} />
                </ScrollReveal>
            </div>
        </section>
    );
};