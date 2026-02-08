"use client";
import type { JSX } from "react";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ScrollableCardStack constants
const SCROLL_TIMEOUT_OFFSET = 100;
const MIN_SCROLL_INTERVAL = 300;
const SCROLL_THRESHOLD = 20;
const TOUCH_SCROLL_THRESHOLD = 100;
const SCALE_FACTOR = 0.08;
const MIN_SCALE = 0.08;
const MAX_SCALE = 2;
const HOVER_SCALE_MULTIPLIER = 1.02;
const CARD_PADDING = 100;

export interface DepartmentItem {
    id: string;
    title: string;
    categories: string[];
    backgroundImage: string;
}

interface ScrollableCardStackProps {
    items: DepartmentItem[];
    cardHeight?: number;
    perspective?: number;
    transitionDuration?: number;
    className?: string;
}

export const ScrollableCardStack: React.FC<ScrollableCardStackProps> = ({
    items,
    cardHeight = 900,
    perspective = 1000,
    transitionDuration = 180,
    className,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollY = useMotionValue(0);
    const lastScrollTime = useRef(0);
    const shouldReduceMotion = useReducedMotion();

    const totalItems = items.length;
    const maxIndex = totalItems - 1;

    const FRAME_OFFSET = -30;
    const FRAMES_VISIBLE_LENGTH = 3;
    const SNAP_DISTANCE = 50;

    const clamp = useCallback(
        (val: number, [min, max]: [number, number]): number =>
            Math.min(Math.max(val, min), max),
        []
    );

    const scrollToCard = useCallback(
        (direction: 1 | -1) => {
            if (isScrolling) {
                return;
            }
            const now = Date.now();
            const timeSinceLastScroll = now - lastScrollTime.current;
            if (timeSinceLastScroll < MIN_SCROLL_INTERVAL) {
                return;
            }
            const newIndex = clamp(currentIndex + direction, [0, maxIndex]);
            if (newIndex !== currentIndex) {
                lastScrollTime.current = now;
                setIsScrolling(true);
                setCurrentIndex(newIndex);
                scrollY.set(newIndex * SNAP_DISTANCE);
                setTimeout(() => {
                    setIsScrolling(false);
                }, transitionDuration + SCROLL_TIMEOUT_OFFSET);
            }
        },
        [currentIndex, maxIndex, scrollY, isScrolling, transitionDuration, clamp]
    );

    const handleScroll = useCallback(
        (deltaY: number) => {
            if (isDragging || isScrolling) {
                return;
            }
            if (Math.abs(deltaY) < SCROLL_THRESHOLD) {
                return;
            }
            const scrollDirection = deltaY > 0 ? 1 : -1;
            scrollToCard(scrollDirection);
        },
        [isDragging, isScrolling, scrollToCard]
    );

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            // Allow scrolling past component when at boundaries
            const scrollingDown = e.deltaY > 0;
            const scrollingUp = e.deltaY < 0;
            const atLastCard = currentIndex === maxIndex;
            const atFirstCard = currentIndex === 0;

            // If at last card and scrolling down, or at first card and scrolling up, allow default scroll
            if ((atLastCard && scrollingDown) || (atFirstCard && scrollingUp)) {
                return; // Don't prevent default, allow page scroll
            }

            e.preventDefault();
            handleScroll(e.deltaY);
        },
        [handleScroll]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (isScrolling) {
                return;
            }
            switch (e.key) {
                case "ArrowUp":
                case "ArrowLeft": {
                    e.preventDefault();
                    scrollToCard(-1);
                    break;
                }
                case "ArrowDown":
                case "ArrowRight": {
                    e.preventDefault();
                    scrollToCard(1);
                    break;
                }
                case "Home": {
                    e.preventDefault();
                    if (currentIndex !== 0) {
                        setIsScrolling(true);
                        setCurrentIndex(0);
                        scrollY.set(0);
                        setTimeout(() => {
                            setIsScrolling(false);
                        }, transitionDuration + SCROLL_TIMEOUT_OFFSET);
                    }
                    break;
                }
                case "End": {
                    e.preventDefault();
                    if (currentIndex !== maxIndex) {
                        setIsScrolling(true);
                        setCurrentIndex(maxIndex);
                        scrollY.set(maxIndex * SNAP_DISTANCE);
                        setTimeout(() => {
                            setIsScrolling(false);
                        }, transitionDuration + SCROLL_TIMEOUT_OFFSET);
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        },
        [
            currentIndex,
            maxIndex,
            scrollY,
            isScrolling,
            scrollToCard,
            transitionDuration,
        ]
    );

    const touchStartY = useRef(0);
    const touchStartIndex = useRef(0);
    const touchStartTime = useRef(0);
    const touchMoved = useRef(false);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            touchStartY.current = e.touches[0].clientY;
            touchStartIndex.current = currentIndex;
            touchStartTime.current = Date.now();
            touchMoved.current = false;
            setIsDragging(true);
        },
        [currentIndex]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isDragging || isScrolling) {
                return;
            }
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY.current - touchY;
            if (Math.abs(deltaY) > TOUCH_SCROLL_THRESHOLD && !touchMoved.current) {
                const scrollDirection = deltaY > 0 ? 1 : -1;
                scrollToCard(scrollDirection);
                touchMoved.current = true;
            }
        },
        [isDragging, isScrolling, scrollToCard]
    );

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        touchMoved.current = false;
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            container.removeEventListener("wheel", handleWheel);
        };
    }, [handleWheel]);

    useEffect(() => {
        if (!isDragging) {
            scrollY.set(currentIndex * SNAP_DISTANCE);
        }
    }, [currentIndex, isDragging, scrollY]);

    const getCardTransform = useCallback(
        (index: number) => {
            const offsetIndex = index - currentIndex;
            const isActive = index === currentIndex;
            // Only active card is fully visible, others completely hidden
            const opacity = isActive ? 1 : 0;
            const scale = shouldReduceMotion
                ? 1
                : clamp(1 - offsetIndex * SCALE_FACTOR, [MIN_SCALE, MAX_SCALE]);
            const y = shouldReduceMotion
                ? 0
                : clamp(offsetIndex * FRAME_OFFSET, [
                    FRAME_OFFSET * FRAMES_VISIBLE_LENGTH,
                    Number.POSITIVE_INFINITY,
                ]);
            const zIndex = items.length - index;
            return {
                y,
                scale,
                opacity,
                zIndex,
            };
        },
        [currentIndex, items.length, clamp, shouldReduceMotion]
    );

    return (
        <section
            aria-atomic="true"
            aria-label="Scrollable card stack"
            aria-live="polite"
            className={cn("relative mx-auto w-full", className)}
        >
            <div
                aria-label="Scrollable card container"
                className="h-full w-full"
                onKeyDown={handleKeyDown}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onTouchStart={handleTouchStart}
                ref={containerRef}
                role="application"
                style={{
                    minHeight: `calc(var(--card-height, ${cardHeight}px) + ${CARD_PADDING}px)`,
                    perspective: `${perspective}px`,
                    perspectiveOrigin: "center 60%",
                    touchAction: "none",
                }}
                tabIndex={0}
            >
                {items.map((item, i) => {
                    const transform = getCardTransform(i);
                    const isActive = i === currentIndex;
                    const isHovered = hoveredIndex === i;

                    return (
                        <motion.article
                            animate={
                                shouldReduceMotion
                                    ? { x: "-50%" }
                                    : {
                                        y: `calc(-50% + ${transform.y}px)`,
                                        scale: transform.scale,
                                        x: "-50%",
                                    }
                            }
                            aria-hidden={!isActive}
                            className="absolute top-1/2 left-1/2 overflow-hidden rounded-2xl w-full max-w-6xl 2xl:max-w-7xl"
                            data-active={isActive}
                            initial={false}
                            key={`scrollable-card-${item.id}`}
                            onBlur={() => setHoveredIndex(null)}
                            onFocus={() => isActive && setHoveredIndex(i)}
                            onMouseEnter={() => isActive && setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                height: `var(--card-height, ${cardHeight}px)`,
                                zIndex: transform.zIndex,
                                pointerEvents: isActive ? "auto" : "none",
                                transformOrigin: "center center",
                                willChange: shouldReduceMotion
                                    ? undefined
                                    : "opacity, transform",
                                opacity: transform.opacity,
                                transitionProperty: shouldReduceMotion
                                    ? "none"
                                    : "opacity",
                                transitionDuration: shouldReduceMotion ? "0ms" : "200ms",
                                transitionTimingFunction:
                                    "cubic-bezier(0.645, 0.045, 0.355, 1)",
                                backgroundImage: `url(${item.backgroundImage})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                            tabIndex={isActive ? 0 : -1}
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0 }
                                    : {
                                        type: "spring",
                                        stiffness: 250,
                                        damping: 20,
                                        mass: 0.5,
                                        duration: 0.25,
                                    }
                            }
                            whileHover={
                                shouldReduceMotion || !isActive
                                    ? {}
                                    : {
                                        scale: transform.scale * HOVER_SCALE_MULTIPLIER,
                                        transition: {
                                            type: "spring",
                                            stiffness: 250,
                                            damping: 20,
                                            mass: 0.5,
                                            duration: 0.25,
                                        },
                                    }
                            }
                        >
                            {/* Department Card Content */}
                            <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between px-4 md:px-0 py-3 relative top-6 xl:top-8 2xl:top-[35px] bg-layout-bg border-t border-departments-border gap-4 md:gap-0">
                                <div className="flex flex-col items-start w-full md:w-auto">
                                    <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-pure-white text-lg md:text-xl xl:text-2xl leading-snug xl:leading-[30px] max-w-full md:max-w-xs xl:max-w-sm 2xl:max-w-[450px]">
                                        {item.title}
                                    </h2>
                                </div>

                                <nav className="flex items-center justify-start md:justify-center w-full md:w-auto overflow-x-auto md:overflow-visible">
                                    <ul className="flex items-center gap-2 md:gap-6 flex-wrap md:flex-nowrap">
                                        {item.categories.map((category, catIndex) => (
                                            <li key={catIndex}>
                                                <Badge
                                                    variant="outline"
                                                    className="h-auto bg-transparent hover:bg-transparent border-none px-0 py-0 cursor-pointer transition-colors hover:text-white"
                                                >
                                                    <span className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-departments-badge text-[9px] xl:text-[10px] 2xl:text-[11.2px] tracking-wide xl:tracking-[0.36px] leading-tight xl:leading-[14.4px] whitespace-nowrap">
                                                        {category}
                                                    </span>
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                <Button
                                    variant="outline"
                                    className="hidden md:inline-flex h-auto rounded-full border-pure-white bg-transparent hover:bg-pure-white/10 pt-1.5 pb-1 px-2 xl:px-3 2xl:px-[11px] transition-colors"
                                >
                                    <span className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-pure-white text-xs leading-[14px] whitespace-nowrap">
                                        ПЕРЕГЛЯНУТИ ІНФОРМАЦІЮ
                                    </span>
                                </Button>
                            </div>
                        </motion.article>
                    );
                })}

                {/* Navigation indicators */}
                <div
                    aria-label="Card navigation"
                    className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform space-x-2"
                    role="tablist"
                >
                    {Array.from({ length: items.length }, (_, i) => (
                        <motion.button
                            aria-label={`Go to card ${i + 1} of ${items.length}`}
                            aria-selected={i === currentIndex}
                            className={cn(
                                "h-2 w-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-brand focus:ring-offset-1",
                                i === currentIndex
                                    ? "scale-125 bg-pure-white"
                                    : "bg-gray-500 hover:bg-gray-400"
                            )}
                            key={`scrollable-indicator-${items[i]?.id || i}`}
                            onClick={() => {
                                if (i !== currentIndex && !isScrolling) {
                                    setIsScrolling(true);
                                    setCurrentIndex(i);
                                    scrollY.set(i * SNAP_DISTANCE);
                                    setTimeout(() => {
                                        setIsScrolling(false);
                                    }, transitionDuration + SCROLL_TIMEOUT_OFFSET);
                                }
                            }}
                            role="tab"
                            transition={{
                                type: "spring",
                                stiffness: 250,
                                damping: 20,
                                mass: 0.5,
                            }}
                            type="button"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                        />
                    ))}
                </div>

                {/* Screen reader instructions */}
                <div aria-live="polite" className="sr-only">
                    {`Card ${currentIndex + 1} of ${items.length} selected. Use arrow keys to navigate one card at a time, or click the dots below.`}
                </div>
            </div>
        </section>
    );
};
