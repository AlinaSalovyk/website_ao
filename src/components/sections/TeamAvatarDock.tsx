import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./TeamShowcase";
import type { Translations } from "@/i18n";

interface TeamAvatarDockProps {
  members: TeamMember[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  t: Translations;
  dockClassName?: string;
  layoutIdSuffix?: string;
}

export const TeamAvatarDock = ({
  members,
  currentIndex,
  setCurrentIndex,
  t,
  dockClassName,
  layoutIdSuffix = "",
}: TeamAvatarDockProps) => {
  return (
    <div className={cn("w-full relative z-20", dockClassName)}>
      <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-widest mb-3 md:mb-4 lg:hidden">
        {t.teamShowcase.selectToView}
      </p>
      <p className="hidden lg:block text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-widest mb-3 md:mb-4">
        {t.teamShowcase.entireTeam}
      </p>
      <div className="bg-white border border-gray-100 shadow-[0_8px_30px_var(--color-shadow-card-alt)] p-2 md:p-3 rounded-3xl md:rounded-full flex flex-wrap gap-2 md:gap-4 items-center justify-center lg:justify-start max-w-3xl mx-auto lg:mx-0">
        {members.map((member, idx) => {
          const isActive = currentIndex === idx;
          return (
            <button
              key={member.id}
              onClick={() => setCurrentIndex(idx)}
              className="group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-full"
              aria-label={member.name}
              title={member.name}
            >
              {/* Active Ring Indicator */}
              {isActive && (
                <motion.div
                  layoutId={`active-avatar-ring${layoutIdSuffix}`}
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
                  loading="lazy"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Tooltip on hover (desktop only) */}
              <div className="hidden lg:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-50 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl">
                {member.name.split(" ").slice(0, 2).join(" ")}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
