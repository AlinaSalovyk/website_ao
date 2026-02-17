import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
// Sections will be imported here as they are created
import { Hero } from "@/routes/laboratory/sections/Hero";
import { AboutLaboratory } from "@/routes/laboratory/sections/AboutLaboratory";
import { Leadership } from "@/routes/laboratory/sections/Leadership";
import { Gallery } from "@/routes/laboratory/sections/Gallery";
import { Footer } from "@/components/layout/Footer";

export const LaboratoryPage = (): JSX.Element => {
    return (
        <MainLayout headerPosition="absolute">
            <Hero />
            <AboutLaboratory />
            <Leadership />
            <Gallery />
            <Footer />
        </MainLayout>
    );
};
