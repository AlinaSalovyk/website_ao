import type { JSX } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Hero } from "@/routes/laboratory-vr/sections/Hero";
import { AboutLaboratory } from "@/routes/laboratory-vr/sections/AboutLaboratory";
import { Leadership } from "@/routes/laboratory-vr/sections/Leadership";
import { Gallery } from "@/routes/laboratory-vr/sections/Gallery";
import { Footer } from "@/components/layout/Footer";

export const LaboratoryVRPage = (): JSX.Element => {
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
