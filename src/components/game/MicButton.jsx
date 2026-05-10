import { motion } from "framer-motion";

/**
 * @param {{ listening: boolean, disabled?: boolean, onClick: () => void }} props
 */
export function MicButton({ listening, disabled, onClick }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        animate={
          listening
            ? { scale: [1, 1.06, 1], boxShadow: "0 0 0 0 rgba(56, 189, 248, 0.0)" }
            : { scale: 1 }
        }
        transition={
          listening
            ? { repeat: Infinity, duration: 1.1, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        className={[
          "relative grid h-20 w-20 place-items-center rounded-full text-3xl shadow-bub ring-2",
          disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500 ring-slate-300"
            : listening
              ? "bg-sky-400 text-white ring-sky-200"
              : "bg-gradient-to-br from-sky-400 to-indigo-400 text-white ring-white/80",
        ].join(" ")}
        aria-pressed={listening}
        aria-label={listening ? "Đang nghe… nhấn lần nữa để dừng" : "Nhấn để nói đáp án"}
      >
        🎙️
        {listening ? (
          <span className="absolute inset-[-8px] rounded-full border-4 border-sky-300/70" />
        ) : null}
      </motion.button>
      <p className="text-center text-xs font-semibold text-slate-600 sm:text-sm">
        {disabled ? "Hãy bấm Câu tiếp để tiếp tục" : listening ? "Đang nghe…" : "Bấm mic và nói đáp án"}
      </p>
    </div>
  );
}
