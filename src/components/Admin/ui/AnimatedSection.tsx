import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function AnimatedSection({
  children,
  className,
  i = 0,
}: {
  children: ReactNode;
  className?: string;
  i?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={i}
      className={className}
    >
      {children}
    </motion.div>
  );
}
