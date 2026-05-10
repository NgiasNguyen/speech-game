import { useCallback } from "react";

/**
 * Play short mp3 from /public.
 * @param {string} src e.g. "/sounds/correct.mp3"
 */
export function useSoundEffect(src) {
  return useCallback(() => {
    try {
      const audio = new Audio(src);
      audio.volume = 0.52;
      void audio.play();
    } catch {
      /* ignore autoplay / missing file */
    }
  }, [src]);
}
