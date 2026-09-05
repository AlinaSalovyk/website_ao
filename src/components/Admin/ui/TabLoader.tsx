import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export function TabLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <RefreshCw size={24} />
      </motion.div>
      <p className="text-sm font-medium">Завантаження...</p>
    </div>
  );
}
