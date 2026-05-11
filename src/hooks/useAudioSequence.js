import { useCallback, useRef } from "react";

/**
 * Play multiple audio clips sequentially.
 * Avoids overlapping by stopping any previous sequence.
 */
export function useAudioSequence({ volume = 0.62 } = {}) {
  const audiosRef = useRef(/** @type {HTMLAudioElement[]} */ ([]));
  const onDoneRef = useRef(/** @type {null | (() => void)} */ (null));

  const stop = useCallback(() => {
    for (const a of audiosRef.current) {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {
        // ignore
      }
    }
    audiosRef.current = [];
    onDoneRef.current = null;
  }, []);

  const playSequence = useCallback(
    /**
     * @param {string[]} sources
     * @param {{ onDone?: () => void }} [options]
     */
    (sources, options = {}) => {
      try {
        stop();
        if (!sources?.length) return;
        onDoneRef.current = options.onDone ?? null;

        const audios = sources.map((src) => {
          const a = new Audio(src);
          a.volume = volume;
          return a;
        });
        audiosRef.current = audios;

        const playAt = (idx) => {
          const a = audios[idx];
          if (!a) {
            const cb = onDoneRef.current;
            onDoneRef.current = null;
            cb?.();
            return;
          }
          a.onended = () => playAt(idx + 1);
          void a.play();
        };

        playAt(0);
      } catch {
        /* ignore autoplay / missing file */
      }
    },
    [stop, volume],
  );

  return { playSequence, stop };
}

