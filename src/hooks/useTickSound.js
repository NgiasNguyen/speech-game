import { useCallback, useRef } from "react";

export function useTickSound({ volume = 0.15, frequency = 1200, durationMs = 35 } = {}) {
  const ctxRef = useRef(/** @type {AudioContext | null} */ (null));

  const tick = useCallback(() => {
    try {
      const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextImpl) return;

      if (!ctxRef.current) ctxRef.current = new AudioContextImpl();
      const ctx = ctxRef.current;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = frequency;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationMs / 1000 + 0.01);
    } catch {
      // ignore
    }
  }, [durationMs, frequency, volume]);

  return { tick };
}

