import type { JSX } from "react";

interface InnovationsBadgeProps {
  className?: string;
}

/**
 * Брендовий бейдж-слоган ІТБ.
 * Використовується на всіх сторінках сайту під основним заголовком Hero-секції.
 */
export const InnovationsBadge = ({ className = "" }: InnovationsBadgeProps): JSX.Element => (
  <div className={`flex justify-center w-full ${className}`}>
    <div className="px-5 py-2 md:px-8 md:py-3 rounded-full border border-pure-white/10 bg-pure-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
      <span className="text-pure-white/80 text-xs md:text-base lg:text-lg font-medium tracking-[0.15em] uppercase">
        ІТБ — інновації твого життя
      </span>
    </div>
  </div>
);
