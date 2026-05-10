import { motion } from "framer-motion";

/**
 * @param {{ currentIndex: number, total: number, score: number }} props
 */
export function QuizProgress({ currentIndex, total, score }) {
  const pct = total > 0 ? Math.min(100, Math.round(((currentIndex + 1) / total) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        <span>
          Câu {Math.min(total, currentIndex + 1)} / {total}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs shadow-sm ring-1 ring-white/70 sm:text-sm">
          🌟 Điểm: <span className="text-sky-700">{score}</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/50 ring-1 ring-white/70">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        />
      </div>
    </div>
  );
}
