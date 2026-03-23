/**
 * TeamShowcase — Reusable leadership / team showcase component.
 *
 * Features:
 * - Interactive avatar dock with animated selection ring
 * - 3D mouse-tilt parallax photo card
 * - Animated photo transitions (blur + scale)
 * - Contact panel with email + social links
 * - Mobile: avatars on top; Desktop: avatars on bottom
 *
 * Usage:
 *   import { TeamShowcase, type TeamMember } from "@/components/sections/TeamShowcase";
 *
 *   const members: TeamMember[] = [
 *     { id: 1, name: "Іванко Петренко Олегович", role: "Директор", email: "ivan@oa.edu.ua", image: "/images/ivan.webp" },
 *   ];
 *
 *   <TeamShowcase members={members} />
 *   <TeamShowcase members={members} heading="Наша команда" badge="Команда" />
 */
import { Mail } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState, type JSX, type MouseEvent } from "react";

import type { Locale } from "@/i18n";
import { getTranslations } from "@/i18n";
import { cn } from "@/lib/utils";

/* ── Types ── */

export interface TeamMemberSocial {
  /** The JSX icon element */
  icon: JSX.Element;
  /** URL to link to */
  href: string;
  /** Accessible label */
  label: string;
}

export interface TeamMember {
  id: number;
  /** Full name, e.g. "Прізвище Ім'я По-батькові" */
  name: string;
  /** Role / title description */
  role: string;
  /** Email address */
  email: string;
  /** Path to the photo */
  image: string;
  /** Optional office hours text */
  officeHours?: string;
  /** Optional social links for this person */
  socials?: TeamMemberSocial[];
}

export interface TeamShowcaseProps {
  /** Array of team members to display */
  members: TeamMember[];
  /** Badge text above the heading */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section HTML id for anchor links */
  sectionId?: string;
  /** Extra class names for the root wrapper */
  className?: string;
  /** Default social links to show for every member (used if member.socials is undefined) */
  defaultSocials?: TeamMemberSocial[];
  /** Locale for translations */
  locale?: Locale;
}

/* ── Main component ── */
export const TeamShowcase = ({
  members,
  badge,
  heading,
  sectionId = "leadership",
  className,
  defaultSocials,
  locale,
}: TeamShowcaseProps) => {
  const t = getTranslations(locale);
  const displayBadge = badge ?? t.teamShowcase.badge;
  const displayHeading = heading ?? t.teamShowcase.heading;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMember = members[currentIndex];

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
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const memberSocials = currentMember.socials ?? defaultSocials ?? [];

  /* ── Avatar Dock (rendered in two places: mobile top, desktop bottom) ── */
  const renderAvatarDock = (dockClassName?: string) => (
    <div className={cn("w-full relative z-20", dockClassName)}>
      <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-widest mb-3 md:mb-4 lg:hidden">
        {t.teamShowcase.selectToView}
      </p>
      <p className="hidden lg:block text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-widest mb-3 md:mb-4">
        {t.teamShowcase.entireTeam}
      </p>
      <div className="bg-white border border-gray-100 shadow-[0_8px_30px_var(--color-shadow-card-alt)] p-2 md:p-3 rounded-3xl md:rounded-full flex flex-wrap gap-2 md:gap-4 items-center justify-center lg:justify-start max-w-3xl mx-auto lg:mx-0">
        {members.map((member, idx) => {
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
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <div
                className={cn(
                  "w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden transition-all duration-300 border-[3px] border-transparent",
                  isActive
                    ? "opacity-100 scale-[0.85]"
                    : "opacity-50 hover:opacity-100 hover:scale-[0.9] grayscale-[50%] hover:grayscale-0",
                )}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
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
  );

  return (
    <section
      id={sectionId}
      className={cn(
        "w-full bg-pure-white py-12 md:py-24 min-h-[700px] lg:min-h-[900px] flex items-center relative overflow-hidden",
        className,
      )}
    >
      {/* Soft creative background flare */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="flex flex-col max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 md:px-9 relative z-10">
        {/* Header */}
        <header className="flex flex-col items-center mb-6 lg:mb-16 w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-3 lg:mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            {displayBadge}
          </div>
          <h2 className="font-semibold text-pure-black text-3xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
            {displayHeading}
          </h2>
        </header>

        {/* Mobile Only: Avatar Dock (Top) */}
        {renderAvatarDock(
          "mb-2 md:mb-3 w-full flex flex-col items-center lg:hidden",
        )}

        <div className="flex flex-col lg:flex-row gap-0 md:gap-4 lg:gap-24 items-center lg:items-stretch justify-center w-full max-w-5xl mx-auto">
          {/* Interactive 3D Image Card */}
          <div
            className="w-full max-w-[12.5rem] sm:max-w-[16.25rem] md:max-w-[22.5rem] lg:max-w-[26.25rem] xl:max-w-[28.125rem] shrink-0 flex justify-center"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-full rounded-[2rem] shadow-2xl bg-white border border-gray-100 cursor-crosshair group p-2.5 md:p-3.5 lg:p-4"
            >
              <div
                className="relative w-full h-full rounded-[1.25rem] md:rounded-[1.5rem] overflow-hidden bg-gray-50"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "translateZ(20px)",
                }}
              >
                <AnimatePresence initial={false}>
                  <motion.img
                    key={currentMember.id}
                    src={currentMember.image}
                    alt={currentMember.name}
                    initial={{
                      opacity: 0,
                      filter: "blur(8px)",
                    }}
                    animate={{
                      opacity: 1,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      filter: "blur(8px)",
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transformOrigin: "center center" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/400x500?text=No+Image";
                    }}
                  />
                </AnimatePresence>
              </div>

              {/* 3D Glow overlay on hover */}
              <div
                className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ transform: "translateZ(50px)" }}
              />
            </motion.div>
          </div>

          {/* Member Details & Contact Panel */}
          <div className="w-full flex-1 flex flex-col items-center lg:items-start text-center lg:text-left mt-3 lg:mt-0 min-w-0">
            <div className="relative w-full flex flex-col items-center lg:items-start min-w-0">
              <div className="w-full flex flex-col items-center lg:items-start min-w-0">
                <h3 className="font-bold text-[clamp(1.25rem,4vw,1.75rem)] lg:text-[clamp(1.5rem,2.5vw,2.25rem)] text-pure-black mb-1 md:mb-2 tracking-tight leading-tight px-2 md:px-0 w-full max-w-full min-h-0 lg:min-h-[80px] block">
                  <span className="inline-block whitespace-nowrap">
                    {currentMember.name.split(" ").slice(0, 2).join(" ")}
                  </span>
                  {currentMember.name.split(" ").length > 2 && (
                    <span className="block text-[clamp(1.125rem,3vw,1.25rem)] lg:text-[clamp(1.25rem,2vw,1.75rem)] text-pure-black/90 mt-1 md:mt-2">
                      {currentMember.name.split(" ").slice(2).join(" ")}
                    </span>
                  )}
                </h3>

                <p className="text-base md:text-xl text-gray-500 font-light mb-3 md:mb-5 max-w-lg leading-relaxed px-4 md:px-0 min-h-0 lg:min-h-[100px] block">
                  {currentMember.role}
                </p>

                {/* Premium Floating Contact Panel */}
                <div className="flex flex-col gap-3 md:gap-5 bg-white border border-gray-100 shadow-[0_8px_30px_var(--color-shadow-card)] p-4 md:p-6 rounded-2xl md:rounded-[1.5rem] w-full max-w-[360px] md:max-w-md mx-auto lg:mx-0">
                  <div className="flex flex-row items-center md:items-start justify-start gap-3 md:gap-4 text-left">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] md:text-xs text-blue-600 font-semibold uppercase tracking-wider mb-0.5 md:mb-1">
                        {t.teamShowcase.emailLabel}
                      </span>
                      <a
                        href={`mailto:${currentMember.email}`}
                        className="text-sm md:text-base text-gray-900 font-medium hover:text-blue-600 transition-colors break-words overflow-hidden"
                      >
                        {currentMember.email}
                      </a>
                    </div>
                  </div>

                  {memberSocials.length > 0 && (
                    <>
                      <div className="h-px w-full bg-gray-100" />
                      <div className="flex flex-col gap-2 text-left w-full mt-2">
                        <span className="text-[10px] md:text-xs text-blue-600 font-semibold uppercase tracking-wider">
                          {t.teamShowcase.socialNetworks}
                        </span>
                        <div className="flex gap-4 items-center mt-1">
                          {memberSocials.map((social, idx) => (
                            <a
                              key={idx}
                              href={social.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={social.label}
                              className="group/social transition-transform duration-300 hover:scale-110 focus:outline-none"
                            >
                              {social.icon}
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Desktop Only: Avatar Dock (Bottom) */}
                {renderAvatarDock(
                  "mt-6 md:mt-8 w-full max-w-md mx-0 relative z-20 hidden lg:flex flex-col items-start",
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
