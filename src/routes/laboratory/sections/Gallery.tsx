import type { JSX } from "react";
import { useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const galleryImages = [
    {
        src: "/images/Gallery/roboto.png",
        alt: "Laboratory Equipment 1",
    },
    {
        src: "/images/Gallery/roboto1.png",
        alt: "Laboratory Equipment 2",
    },
    {
        src: "/images/Gallery/roboto2.png",
        alt: "Laboratory Equipment 3",
    },
    {
        src: "/images/Gallery/roboto3.png",
        alt: "Laboratory Workspace",
    },
    {
        src: "/images/Gallery/roboto.png",
        alt: "Laboratory Equipment 1 Copy",
    },
    {
        src: "/images/Gallery/roboto1.png",
        alt: "Laboratory Equipment 2 Copy",
    },
];

export const Gallery = (): JSX.Element => {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollTo = (direction: 'left' | 'right') => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const itemWidth = 327;
        const gap = window.innerWidth >= 768 ? 24 : 16;
        const scrollAmount = itemWidth + gap;

        if (direction === 'left') {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="w-full bg-pure-white text-pure-black py-20">
            <div className="container mx-auto px-4 md:px-9 flex flex-col">
                <header className="flex flex-col w-full mb-2 mx-auto">
                    <div className="flex justify-center w-full mb-10 border-b border-pure-black pb-4">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-['Roboto',sans-serif] text-center">
                            Галерея
                        </h2>
                    </div>

                    <div className="flex justify-end w-full px-10 md:px-4">
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => scrollTo('left')}
                                className="group h-12 w-12 hover:bg-transparent p-0 flex items-center justify-center shrink-0 cursor-pointer focus:outline-none"
                            >
                                <div className="transition-transform duration-300 group-hover:-translate-x-1">
                                    <svg width="42" height="14" viewBox="0 0 42 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[20px] xl:w-[38px] 2xl:w-[36px] h-auto text-black opacity-90">
                                        <path d="M42 7H2M2 7L8 1M2 7L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollTo('right')}
                                className="group h-12 w-12 hover:bg-transparent p-0 flex items-center justify-center shrink-0 cursor-pointer focus:outline-none"
                            >
                                <div className="transition-transform duration-300 group-hover:translate-x-1">
                                    <svg width="42" height="14" viewBox="0 0 42 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[40px] xl:w-[48px] 2xl:w-[36px] h-auto text-black opacity-90">
                                        <path d="M0 7H40M40 7L34 1M40 7L34 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </header>

                <div
                    ref={containerRef}
                    className="flex overflow-x-auto gap-4 md:gap-6 snap-x snap-mandatory scrollbar-hide pb-4 mx-auto"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {galleryImages.map((image, index) => (
                        <div
                            key={index}
                            className="snap-start flex-shrink-0"
                        >
                            <div className="w-[327px] h-[199px] overflow-hidden rounded-[8px] bg-gray-100">
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
