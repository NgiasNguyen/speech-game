import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import animals from "../../data/animals.js";
import {
  TEACHER_QUESTION,
  SPEECH_NOT_SUPPORTED,
  POSITIVE_RESPONSES,
  WRONG_REVEAL_PREFIX,
  TIMEOUT_REVEAL_PREFIX,
} from "../../constants/phrases.js";
import { shuffle } from "../../utils/array.js";
import { doesTranscriptMatchAnimal } from "../../utils/matchAnimal.js";
import { randomItem } from "../../utils/random.js";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition.js";
import { useSoundEffect } from "../../hooks/useSoundEffect.js";
import { useAudioSequence } from "../../hooks/useAudioSequence.js";
import { useTickSound } from "../../hooks/useTickSound.js";
import { TeacherAvatar } from "../teacher/TeacherAvatar.jsx";
import { TeacherBubble } from "../teacher/TeacherBubble.jsx";
import { AnimalCard } from "./AnimalCard.jsx";
import { MicButton } from "./MicButton.jsx";
import { QuizProgress } from "./QuizProgress.jsx";
import { TranscriptCard } from "./TranscriptCard.jsx";

export function GameApp() {
  const [started, setStarted] = useState(false);
  const [gameNonce, setGameNonce] = useState(0);
  const deck = useMemo(() => shuffle(animals), [gameNonce]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(/** @type {null | "correct" | "wrong" | "timeout"} */ (null));
  const [bubblePhrase, setBubblePhrase] = useState(TEACHER_QUESTION);
  const [timeLeft, setTimeLeft] = useState(10);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const revealTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const current = deck[roundIndex];
  const finished = roundIndex >= deck.length;

  const [history, setHistory] = useState(
    /** @type {Array<{ round: number, animalId: number, answer: string, outcome: "correct" | "wrong" | "timeout" }>} */ (
      []
    ),
  );

  const playCorrect = useSoundEffect("/sounds/correct.mp3");
  const { playSequence: playTtsSequence, stop: stopTts } = useAudioSequence();
  const { tick } = useTickSound();

  const handleFinalRef = useRef(/** @type {(said: string) => void} */ (() => {}));

  const playTts = useCallback(
    /**
     * @param {string[]} sources
     * @param {{ onDone?: () => void }} [options]
     */
    (sources, options) => {
      if (!sources?.length) return;
      playTtsSequence(sources, options);
    },
    [playTtsSequence],
  );

  const ttsWrongRevealCombinedSrc = useMemo(() => {
    if (!current?.id) return null;
    const id = String(current.id).padStart(2, "0");
    return `/sounds/tts/wrong_reveal_animal_${id}.mp3`;
  }, [current?.id]);

  const ttsTimeoutRevealCombinedSrc = useMemo(() => {
    if (!current?.id) return null;
    const id = String(current.id).padStart(2, "0");
    return `/sounds/tts/timeout_reveal_animal_${id}.mp3`;
  }, [current?.id]);

  const { supported, listening, interim, error, start, stop, resetText } = useSpeechRecognition({
    lang: "vi-VN",
    onFinal: (said) => handleFinalRef.current(String(said ?? "")),
  });

  const handleFinal = useCallback(
    (said) => {
      if (!started || finished || result === "correct") return;
      if (!current) return;
      stop();
      setCountdownRunning(false);

      const ok = doesTranscriptMatchAnimal(said, current);

      if (ok) {
        setResult("correct");
        const praise = randomItem(POSITIVE_RESPONSES) ?? "Đúng rồi!";
        setBubblePhrase(praise);
        setHistory((h) => [
          ...h,
          { round: roundIndex + 1, animalId: current.id, answer: current.answer, outcome: "correct" },
        ]);
        const praiseIndex = POSITIVE_RESPONSES.indexOf(praise);
        if (praiseIndex >= 0) {
          playTts([`/sounds/tts/positive_${praiseIndex}.mp3`], {
            onDone: () => {
              setRoundIndex((i) => i + 1);
              setResult(null);
              resetText();
            },
          });
        }
        playCorrect();
        setScore((s) => s + 1);
        return;
      }

      setResult("wrong");
      setBubblePhrase(`${WRONG_REVEAL_PREFIX} ${current.answer}.`);
      setHistory((h) => [
        ...h,
        { round: roundIndex + 1, animalId: current.id, answer: current.answer, outcome: "wrong" },
      ]);
      if (ttsWrongRevealCombinedSrc) {
        playTts([ttsWrongRevealCombinedSrc], {
          onDone: () => {
            setRoundIndex((i) => i + 1);
            setResult(null);
            resetText();
          },
        });
      }
    },
    [
      current,
      finished,
      playCorrect,
      playTts,
      result,
      resetText,
      roundIndex,
      started,
      stop,
      ttsTimeoutRevealCombinedSrc,
      ttsWrongRevealCombinedSrc,
    ],
  );

  useEffect(() => {
    handleFinalRef.current = handleFinal;
  }, [handleFinal]);

  const restartAll = useCallback(() => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    stopTts();
    stop();
    resetText();
    setStarted(false);
    setGameNonce((n) => n + 1);
    setRoundIndex(0);
    setScore(0);
    setResult(null);
    setTimeLeft(10);
    setCountdownRunning(false);
    setHistory([]);
  }, [resetText, stop, stopTts]);

  useEffect(() => {
    if (!started) return;
    if (finished) return;
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    stopTts();
    setCountdownRunning(false);
    setBubblePhrase(TEACHER_QUESTION);
    resetText();
    setResult(null);
    playTts(["/sounds/tts/teacher_question.mp3"], {
      onDone: () => {
        setTimeLeft(10);
        setCountdownRunning(true);
      },
    });
  }, [finished, gameNonce, playTts, resetText, roundIndex, started, stopTts]);

  // 5s countdown with ticking sound. When hits 0 -> auto wrong reveal.
  useEffect(() => {
    if (!started) return;
    if (finished) return;
    if (result !== null) return;
    if (!current) return;
    if (!countdownRunning) return;

    if (timeLeft <= 0) {
      setResult("timeout");
      setCountdownRunning(false);
      stop();
      setBubblePhrase(`${TIMEOUT_REVEAL_PREFIX} ${current.answer}.`);
      setHistory((h) => [
        ...h,
        { round: roundIndex + 1, animalId: current.id, answer: current.answer, outcome: "timeout" },
      ]);
      const srcs = ttsTimeoutRevealCombinedSrc ? [ttsTimeoutRevealCombinedSrc] : ["/sounds/tts/timeout_reveal_prefix.mp3"];
      playTts(srcs, {
        onDone: () => {
          setRoundIndex((i) => i + 1);
          setResult(null);
          resetText();
        },
      });
      return;
    }

    const id = setInterval(() => {
      tick();
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [
    current,
    countdownRunning,
    finished,
    playTts,
    result,
    resetText,
    roundIndex,
    started,
    stop,
    tick,
    timeLeft,
    ttsTimeoutRevealCombinedSrc,
    ttsWrongRevealCombinedSrc,
  ]);

  /** Đúng → happy · Sai → sad · chờ trả lời → idle */
  const teacherMood = useMemo(() => {
    if (result === "correct") return "happy";
    if (result === "wrong" || result === "timeout") return "sad";
    return "idle";
  }, [result]);

  const bubbleTone = result === "correct" ? "good" : result ? "retry" : "ask";

  const micDisabled =
    !started || !supported || finished || result !== null || !!error || !countdownRunning;

  const handleMicClick = () => {
    if (micDisabled) return;
    if (listening) stop();
    else start();
  };

  if (finished) {
    const wrongOnes = history.filter((x) => x.outcome !== "correct");
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-white/80 p-8 text-center shadow-bub ring-2 ring-white/90 backdrop-blur-sm"
        >
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700">Hoàn thành!</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Chúc mừng bạn 🎉</h1>
          <p className="mt-3 text-base font-semibold text-slate-700">
            Tổng điểm: <span className="text-sky-700">{score}</span> / <span>{deck.length}</span>
          </p>
          <div className="mt-5 rounded-3xl bg-white/70 p-4 text-left shadow-bub ring-2 ring-white/80">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">Report 10 câu</p>
            <ul className="mt-3 space-y-2">
              {history.map((x) => (
                <li key={`${x.round}-${x.animalId}`} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold text-slate-900">
                    Câu {x.round}: <span className="font-black text-sky-800">{x.answer}</span>
                  </span>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-extrabold",
                      x.outcome === "correct"
                        ? "bg-emerald-100 text-emerald-900"
                        : x.outcome === "timeout"
                          ? "bg-slate-200 text-slate-800"
                          : "bg-amber-100 text-amber-950",
                    ].join(" ")}
                  >
                    {x.outcome === "correct" ? "Đúng" : x.outcome === "timeout" ? "Hết giờ" : "Sai"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Chưa đúng: <span className="font-extrabold text-slate-900">{wrongOnes.length}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={restartAll}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-base font-extrabold text-white shadow-lg ring-2 ring-white/80"
          >
            Chơi lại
          </button>
        </motion.div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 sm:gap-6 sm:py-10">
        <header className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-sky-800/80">Speech game</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Đoán động vật cùng thầy 🌿</h1>
        </header>

        <div className="space-y-4">
          <TeacherBubble tone="ask">Bấm “Bắt đầu” để vào câu 1 nhé.</TeacherBubble>
          <TeacherAvatar mood="idle" />
        </div>

        <button
          type="button"
          onClick={() => setStarted(true)}
          className="w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-base font-extrabold text-white shadow-lg ring-2 ring-white/80"
        >
          Bắt đầu
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 sm:gap-6 sm:py-10">
      <header className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-sky-800/80">Speech game</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Đoán động vật cùng thầy 🌿</h1>
        {!supported ? (
          <p className="mx-auto mt-3 max-w-lg text-sm font-semibold text-amber-900">
            {SPEECH_NOT_SUPPORTED}
          </p>
        ) : null}
      </header>

      <QuizProgress currentIndex={roundIndex} total={deck.length} score={score} />

      <div className="grid gap-4 sm:grid-cols-[1.05fr_0.95fr] sm:items-start sm:gap-5">
        <div className="space-y-4">
          <TeacherBubble key={bubblePhrase} tone={bubbleTone}>
            {bubblePhrase}
          </TeacherBubble>
          <TeacherAvatar mood={teacherMood} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm font-extrabold text-slate-900 shadow-bub ring-2 ring-white/80 backdrop-blur-sm">
            {result !== null ? (
              <span className="text-slate-700">Đang phản hồi…</span>
            ) : countdownRunning ? (
              <>
                Còn lại: <span className="text-sky-700">{timeLeft}s</span>
              </>
            ) : (
              <span className="text-slate-700">Thầy đang hỏi…</span>
            )}
          </div>
          <AnimalCard src={current.image} nameHint="Hình động vật" />
          <MicButton listening={listening} disabled={micDisabled} onClick={handleMicClick} />
        </div>
      </div>

      <TranscriptCard text={interim} active={listening} />

      {error ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 ring-2 ring-amber-200">
          Lỗi mic: <span className="font-mono">{String(error)}</span>. Hãy thử Chrome, cấp quyền micro, hoặc bật local
          HTTPS.
        </p>
      ) : null}

      {/* Auto-advance is handled automatically; no next button */}
    </div>
  );
}
