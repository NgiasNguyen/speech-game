import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import animals from "../../data/animals.js";
import {
  TEACHER_QUESTION,
  SPEECH_NOT_SUPPORTED,
  POSITIVE_RESPONSES,
  RETRY_RESPONSES,
} from "../../constants/phrases.js";
import { shuffle } from "../../utils/array.js";
import { doesTranscriptMatchAnimal } from "../../utils/matchAnimal.js";
import { randomItem } from "../../utils/random.js";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition.js";
import { useSoundEffect } from "../../hooks/useSoundEffect.js";
import { TeacherAvatar } from "../teacher/TeacherAvatar.jsx";
import { TeacherBubble } from "../teacher/TeacherBubble.jsx";
import { AnimalCard } from "./AnimalCard.jsx";
import { MicButton } from "./MicButton.jsx";
import { QuizProgress } from "./QuizProgress.jsx";
import { TranscriptCard } from "./TranscriptCard.jsx";

export function GameApp() {
  const [gameNonce, setGameNonce] = useState(0);
  const deck = useMemo(() => shuffle(animals), [gameNonce]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(/** @type {null | "correct" | "wrong"} */ (null));
  const [bubblePhrase, setBubblePhrase] = useState(TEACHER_QUESTION);

  const current = deck[roundIndex];
  const finished = roundIndex >= deck.length;

  const playCorrect = useSoundEffect("/sounds/correct.mp3");
  const playWrong = useSoundEffect("/sounds/wrong.mp3");

  const handleFinal = useCallback(
    (said) => {
      if (finished || result === "correct") return;
      if (!current) return;

      const ok = doesTranscriptMatchAnimal(said, current);

      if (ok) {
        setResult("correct");
        const praise = randomItem(POSITIVE_RESPONSES) ?? "Đúng rồi!";
        setBubblePhrase(praise);
        playCorrect();
        setScore((s) => s + 1);
        return;
      }

      setResult("wrong");
      const line = randomItem(RETRY_RESPONSES) ?? "Thử lại nhé!";
      setBubblePhrase(line);
      playWrong();
    },
    [current, finished, playCorrect, playWrong, result],
  );

  const { supported, listening, interim, error, start, stop, resetText } = useSpeechRecognition({
    lang: "vi-VN",
    onFinal: handleFinal,
  });

  const goNextRound = useCallback(() => {
    if (result === null) return;
    setRoundIndex((i) => i + 1);
    setResult(null);
    setBubblePhrase(TEACHER_QUESTION);
    resetText();
  }, [resetText, result]);

  const restartAll = useCallback(() => {
    stop();
    resetText();
    setGameNonce((n) => n + 1);
    setRoundIndex(0);
    setScore(0);
    setResult(null);
    setBubblePhrase(TEACHER_QUESTION);
  }, [resetText, stop]);

  useEffect(() => {
    setBubblePhrase(TEACHER_QUESTION);
    resetText();
    setResult(null);
  }, [gameNonce, resetText, roundIndex]);

  /** Đúng → happy · Sai → sad · chờ trả lời → idle */
  const teacherMood = useMemo(() => {
    if (result === "correct") return "happy";
    if (result === "wrong") return "sad";
    return "idle";
  }, [result]);

  const bubbleTone = result === "correct" ? "good" : result === "wrong" ? "retry" : "ask";

  const micDisabled = !supported || finished || result === "correct" || !!error;

  const handleMicClick = () => {
    if (micDisabled) return;
    if (listening) stop();
    else start();
  };

  if (finished) {
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

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={goNextRound}
          disabled={result === null}
          className={[
            "w-full rounded-full px-5 py-3 text-center text-sm font-extrabold shadow-lg ring-2 sm:w-auto",
            result === null
              ? "cursor-not-allowed bg-slate-200 text-slate-500 ring-slate-300"
              : "bg-white text-slate-900 ring-white/80 hover:bg-slate-50",
          ].join(" ")}
        >
          Câu tiếp theo
        </button>
      </div>
    </div>
  );
}
