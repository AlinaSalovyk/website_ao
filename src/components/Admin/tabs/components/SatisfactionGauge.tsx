import { ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import type { FeedbackStat } from "../../api";
import { GlassCard } from "../../ui";

interface SatisfactionGaugeProps {
  fb: FeedbackStat | null;
}

export function SatisfactionGauge({ fb }: SatisfactionGaugeProps) {
  if (!fb || fb.total === 0) return null;

  return (
    <GlassCard title="Задоволеність" icon={ThumbsUp}>
      <div className="space-y-3">
        <div className="flex h-8 overflow-hidden rounded-xl text-xs font-medium">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fb.ratio * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex items-center justify-center bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold"
            style={{ minWidth: 40 }}
          >
            {(fb.ratio * 100).toFixed(0)}% 👍
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(1 - fb.ratio) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            className="flex items-center justify-center bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold"
            style={{ minWidth: 40 }}
          >
            {((1 - fb.ratio) * 100).toFixed(0)}% 👎
          </motion.div>
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Позитивних: {fb.positive}</span>
          <span>Негативних: {fb.negative}</span>
        </div>
      </div>
    </GlassCard>
  );
}
