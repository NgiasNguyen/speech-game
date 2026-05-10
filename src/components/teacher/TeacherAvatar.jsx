import { motion } from "framer-motion";

const MOOD_SRC = {
  idle: "/teacher/idle.png",
  happy: "/teacher/happy.png",
  sad: "/teacher/sad.png",
  talking: "/teacher/talking.png",
};

/**
 * @param {{ mood: keyof typeof MOOD_SRC, alt?: string, className?: string }} props
 */
export function TeacherAvatar({ mood, alt = "Thầy giáo", className = "" }) {
  const src = MOOD_SRC[mood] || MOOD_SRC.idle;

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="rounded-[2rem] bg-white/70 p-3 shadow-bub ring-2 ring-white/80 backdrop-blur-sm">
        <img
          src={src}
          alt={alt}
          className="mx-auto h-40 w-auto max-w-[12rem] select-none object-contain sm:h-48"
          draggable={false}
        />
      </div>
    </motion.div>
  );
}
