import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Thin wrapper around Web Speech API (speech-to-text).
 * @param {{ lang?: string, onFinal?: (text: string) => void }} options
 */
export function useSpeechRecognition({ lang = "vi-VN", onFinal } = {}) {
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const supported = useMemo(() => !!getRecognitionCtor(), []);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const recRef = useRef(null);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop?.();
    } catch {
      /* ignore */
    }
  }, []);

  const resetText = useCallback(() => {
    setInterim("");
    setError("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Không tìm thấy SpeechRecognition.");
      return;
    }

    stop();
    resetText();

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (event) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        const transcript = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += transcript;
        else interimText += transcript;
      }

      const trimmedFinal = finalText.trim();
      const trimmedInterim = interimText.trim();

      if (trimmedFinal) {
        setInterim(trimmedFinal);
        onFinalRef.current?.(trimmedFinal);
      } else {
        setInterim(trimmedInterim);
      }
    };

    rec.onerror = (evt) => {
      setError(evt.error || "speech_error");
    };

    rec.onend = () => setListening(false);

    recRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      setListening(false);
      setError("start_failed");
      console.error(e);
    }
  }, [lang, resetText, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    supported,
    listening,
    interim,
    error,
    start,
    stop,
    resetText,
  };
}
