/**
 * @param {{ text: string, active?: boolean }} props
 */
export function TranscriptCard({ text, active }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm",
        active ? "ring-2 ring-sky-300" : "ring-1 ring-white/60",
      ].join(" ")}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bạn vừa nói</p>
      <p className="mt-1 min-h-[1.5rem] text-base font-semibold text-slate-900">
        {text ? `“${text}”` : "—"}
      </p>
    </div>
  );
}
