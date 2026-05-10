import { motion } from "framer-motion";

/**
 * @param {{ src: string, nameHint?: string }} props
 */
export function AnimalCard({ src, nameHint = "Động vật" }) {
  return (
    <motion.div
      key={src}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="overflow-hidden rounded-[2rem] bg-white/80 p-3 shadow-bub ring-2 ring-white/90 backdrop-blur-sm"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100">
        <img
          src={src}
          alt={nameHint}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
    </motion.div>
  );
}
