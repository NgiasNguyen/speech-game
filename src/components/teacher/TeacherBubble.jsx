import { motion } from "framer-motion";

/**
 * @param {{ children: import("react").ReactNode, tone?: "ask" | "good" | "retry" }} props
 */
export function TeacherBubble({ children, tone = "ask" }) {
  const toneClass =
    tone === "good"
      ? "from-emerald-50 to-emerald-100 text-emerald-900 ring-emerald-200"
      : tone === "retry"
        ? "from-amber-50 to-amber-100 text-amber-950 ring-amber-200"
        : "from-white to-sky-50 text-slate-900 ring-sky-200";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="relative"
    >
      <div
        className={`rounded-3xl bg-gradient-to-br px-4 py-3 shadow-bub ring-2 ${toneClass} sm:px-5 sm:py-4`}
      >
        <p className="text-center text-base font-semibold leading-relaxed sm:text-lg">{children}</p>
      </div>
      <div
        className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm bg-white ring-2 ring-sky-200"
        aria-hidden
      />
    </motion.div>
  );
}
