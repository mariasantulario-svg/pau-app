import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Star, Zap } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { getRoundItems, ROUND_SIZES } from '../utils/rounds';

interface Bubble {
  word: string;
  score: number;
  example?: string;
  wrongTopic?: string;
}

interface Exercise {
  id: number;
  prompt: string;
  timeSeconds: number;
  targetCount: number;
  bubbles: Bubble[];
}

interface BubbleBrainstormProps {
  onBack: () => void;
  exercises: Exercise[];
}

interface FloatingBubble extends Bubble {
  uid: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const BUBBLE_COLORS = [
  '#fde87c', '#f4a35a', '#93c5e8', '#86d9b0',
  '#f4a8c4', '#c4b5f4', '#a8e6cf', '#ffb997',
  '#fbbf88', '#b5d4f4', '#c0dd97', '#f09090',
];

const TOAST_MESSAGES_OK = [
  'Fits the topic, but there\'s a more precise option.',
  'Acceptable, but a PAU examiner expects richer vocabulary.',
  'Correct topic, but you should aim for a more specific term.',
  'OK choice, though a more academic word would score higher.',
];

const TOAST_MESSAGES_WRONG = [
  'That topic doesn\'t belong here!',
  'Wrong area — stay focused on the prompt.',
  'Off topic — try again.',
];

const CANVAS_H = 300;
const ROUND_LEN = ROUND_SIZES.activities;
const SLOT_COUNT = 6;
const TOP_SCORE = 17;
const PENALTY_PER_DISTRACTOR = 15;

type SlotFill = { type: 'TOP' | 'MID'; word: string } | null;

export const BubbleBrainstorm = ({ onBack, exercises }: BubbleBrainstormProps) => {
  const [roundExercises, setRoundExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [slots, setSlots] = useState<SlotFill[]>(() => Array(SLOT_COUNT).fill(null));
  const [distractorClicks, setDistractorClicks] = useState(0);
  const [slotShake, setSlotShake] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const [toast, setToast] = useState<{ word: string; message: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const bubblesRef = useRef<FloatingBubble[]>([]);
  const toastTimeoutRef = useRef<number | null>(null);
  const canvasW = useRef(680);
  const { addXP } = useGamification();

  const startRound = useCallback(() => {
    const exs = getRoundItems(exercises, ROUND_LEN);
    setRoundExercises(exs);
    setCurrentIndex(0);
    setRoundComplete(false);
    setTimeLeft(exs[0]?.timeSeconds ?? 60);
    setSlots(Array(SLOT_COUNT).fill(null));
    setDistractorClicks(0);
    setSlotShake(false);
    setShowFeedback(false);
  }, [exercises]);

  const exercise = roundExercises[currentIndex];

  // Init bubbles
  const initBubbles = useCallback(() => {
    if (!exercise?.bubbles?.length) return;
    const W = canvasW.current;
    const initial: FloatingBubble[] = shuffle(exercise.bubbles).map((b, i) => {
      const size = b.word.length > 16 ? 76 : b.word.length > 11 ? 64 : 54;
      return {
        ...b,
        uid: `b-${i}-${Math.random()}`,
        x: size + Math.random() * (W - size * 2),
        y: size + Math.random() * (CANVAS_H - size * 2),
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size,
        color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
      };
    });
    bubblesRef.current = initial;
    setBubbles(initial);
  }, [exercise?.bubbles]);

  useEffect(() => {
    if (containerRef.current) {
      canvasW.current = containerRef.current.offsetWidth || 680;
    }
    initBubbles();
    return () => cancelAnimationFrame(animRef.current);
  }, [currentIndex, initBubbles]);

  // Animation loop — separate from timer (dep on roundExercises.length so loop starts when entering game)
  useEffect(() => {
    if (showFeedback || !roundExercises.length) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    let running = true;

    const animate = () => {
      if (!running) return;
      const W = canvasW.current;
      if (!bubblesRef.current.length) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      bubblesRef.current = bubblesRef.current.map(b => {
        let { x, y, vx, vy, size } = b;
        x += vx;
        y += vy;
        const half = size / 2;
        if (x - half <= 0) { vx = Math.abs(vx); x = half; }
        if (x + half >= W) { vx = -Math.abs(vx); x = W - half; }
        if (y - half <= 0) { vy = Math.abs(vy); y = half; }
        if (y + half >= CANVAS_H) { vy = -Math.abs(vy); y = CANVAS_H - half; }
        return { ...b, x, y, vx, vy };
      });
      setBubbles([...bubblesRef.current]);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [showFeedback, currentIndex, roundExercises.length]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Timer — completely independent
  useEffect(() => {
    if (showFeedback) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowFeedback(true);
          cancelAnimationFrame(animRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showFeedback, currentIndex]);

  const handleDone = () => {
    cancelAnimationFrame(animRef.current);
    setShowFeedback(true);
  };

  const handleBubbleTap = (uid: string) => {
    if (showFeedback) return;
    const bubble = bubblesRef.current.find(b => b.uid === uid);
    if (!bubble) return;
    const isTOP = bubble.score >= TOP_SCORE;
    const isMID = bubble.score > 0 && bubble.score < TOP_SCORE;
    const isDistractor = bubble.score === 0;

    const showToast = (message: string, durationMs: number) => {
      if (toastTimeoutRef.current !== null) {
        clearTimeout(toastTimeoutRef.current);
      }
      setToast({ word: bubble.word, message });
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, durationMs);
    };

    if (isDistractor) {
      setDistractorClicks(c => c + 1);
      setSlotShake(true);
      setTimeout(() => setSlotShake(false), 500);
      const msg = TOAST_MESSAGES_WRONG[Math.floor(Math.random() * TOAST_MESSAGES_WRONG.length)];
      showToast(msg, 2200);
      return;
    }

    const idx = slots.findIndex(s => s?.word === bubble.word);
    if (idx >= 0) {
      setSlots(prev => prev.map((s, i) => (i === idx ? null : s)));
      return;
    }

    const firstEmpty = slots.findIndex(s => s === null);
    if (firstEmpty < 0) return;

    setSlots(prev => prev.map((s, i) => (i === firstEmpty ? { type: isTOP ? 'TOP' : 'MID', word: bubble.word } : s)));

    if (bubble.score === 8) {
      const msg = TOAST_MESSAGES_OK[Math.floor(Math.random() * TOAST_MESSAGES_OK.length)];
      showToast(msg, 2000);
    }
  };

  const nextExercise = () => {
    const next = currentIndex + 1;
    if (next < roundExercises.length) {
      setCurrentIndex(next);
      setTimeLeft(roundExercises[next].timeSeconds);
      setSlots(Array(SLOT_COUNT).fill(null));
      setDistractorClicks(0);
      setSlotShake(false);
      setShowFeedback(false);
    } else {
      setRoundComplete(true);
    }
  };

  if (roundExercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Bubble Brainstorm</h2>
          <p className="text-gray-600 mb-8">
            {ROUND_LEN} exercises per round. Select the best vocabulary for each topic.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg">
            Start Round
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Round Complete!</h2>
          <p className="text-gray-600 mb-8">You completed {roundExercises.length} exercises.</p>
          <div className="flex gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-3 rounded-2xl font-bold">
              Next Round
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-bold">
              Back to Menu
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!exercise) return null;

  const topCount = slots.filter(s => s?.type === 'TOP').length;
  const filledCount = slots.filter(s => s !== null).length;
  const rawScore = (topCount / SLOT_COUNT) * 100;
  const scorePercent = Math.max(0, Math.min(100, Math.round(rawScore - distractorClicks * PENALTY_PER_DISTRACTOR)));
  const totalSelections = filledCount + distractorClicks;
  const precisionPercent = totalSelections > 0 ? Math.round((topCount / totalSelections) * 100) : 0;

  const chosenGood = slots.filter((s): s is { type: 'TOP' | 'MID'; word: string } => s !== null).map(s => s.word);
  const missedGood = exercise.bubbles.filter(b => b.score > 0 && !slots.some(s => s?.word === b.word))
    .sort((a, b_) => (b_.score ?? 0) - (a.score ?? 0));

  const timePct = (timeLeft / exercise.timeSeconds) * 100;
  const selectedWords = new Set(slots.filter((s): s is { type: 'TOP' | 'MID'; word: string } => s !== null).map(s => s.word));

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full uppercase tracking-wide">
                Bubble Brainstorm
              </span>
              <p className="text-sm text-gray-500">Exercise {currentIndex + 1} of {roundExercises.length}</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Bubble Brainstorm</h2>
          </div>
          <motion.div
            animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: timeLeft <= 10 ? Infinity : 0, duration: 0.5 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              timeLeft <= 10 ? 'bg-red-100' : timeLeft <= 20 ? 'bg-yellow-100' : 'bg-blue-100'
            }`}
          >
            <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-600' : timeLeft <= 20 ? 'text-yellow-600' : 'text-blue-600'}`} />
            <span className={`font-bold text-xl ${timeLeft <= 10 ? 'text-red-600' : timeLeft <= 20 ? 'text-yellow-600' : 'text-blue-600'}`}>
              {timeLeft}s
            </span>
          </motion.div>
        </div>

        {/* Timer bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              timePct > 50 ? 'bg-blue-500' : timePct > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${timePct}%` }}
          />
        </div>

        {/* Prompt */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg mb-4">
          <p className="text-gray-800 font-semibold">{exercise.prompt}</p>
          {!showFeedback && (
            <p className="text-indigo-600 text-sm mt-1">
              Fill the 6 slots with the best words. Gold = TOP, blue = good. Avoid wrong-topic words (−15).
            </p>
          )}
        </div>

        {/* 6 slots */}
        {!showFeedback && (
          <motion.div
            animate={slotShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap gap-2 mb-4 justify-center"
          >
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`
                  w-14 h-14 rounded-xl border-2 flex items-center justify-center text-center text-xs font-bold
                  ${slot === null
                    ? 'border-gray-300 bg-gray-50 text-gray-400'
                    : slot.type === 'TOP'
                      ? 'border-amber-400 bg-amber-100 text-amber-800 shadow-md'
                      : 'border-blue-300 bg-blue-100 text-blue-800'
                  }
                `}
                title={slot ? slot.word : 'Empty slot'}
              >
                {slot ? (slot.word.length > 8 ? slot.word.slice(0, 7) + '…' : slot.word) : '—'}
              </div>
            ))}
          </motion.div>
        )}

        {/* Bubble canvas */}
        {!showFeedback && (
          <>
            <div
              ref={containerRef}
              className="relative rounded-xl overflow-hidden mb-4"
              style={{
                width: '100%',
                height: `${CANVAS_H}px`,
                background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 100%)',
              }}
            >
              {bubbles.map(bubble => {
                const isSelected = selectedWords.has(bubble.word);
                const scaleX = (containerRef.current?.offsetWidth ?? 680) / canvasW.current;
                return (
                  <motion.button
                    key={bubble.uid}
                    onClick={() => handleBubbleTap(bubble.uid)}
                    whileTap={{ scale: 0.88 }}
                    style={{
                      position: 'absolute',
                      left: (bubble.x - bubble.size / 2) * scaleX,
                      top: bubble.y - bubble.size / 2,
                      minWidth: bubble.size,
                      background: isSelected ? '#4f46e5' : bubble.color,
                      color: isSelected ? 'white' : '#1a1a2e',
                      border: isSelected ? '3px solid #312e81' : '2px solid rgba(0,0,0,0.1)',
                      borderRadius: '999px',
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      fontFamily: 'Nunito, sans-serif',
                      whiteSpace: 'nowrap',
                      boxShadow: isSelected
                        ? '0 4px 15px rgba(79,70,229,0.5)'
                        : '0 2px 8px rgba(0,0,0,0.12)',
                      cursor: 'pointer',
                      zIndex: isSelected ? 10 : 1,
                      userSelect: 'none',
                    }}
                  >
                    {isSelected && '✓ '}{bubble.word}
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast.word}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`relative mt-3 mx-auto max-w-xs text-center px-5 py-3 rounded-2xl shadow-md text-sm font-semibold
                    ${toast.message.includes('belong') || toast.message.includes('Off') || toast.message.includes('Wrong')
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                >
                  <span
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0
                      border-l-8 border-r-8 border-b-8
                      border-l-transparent border-r-transparent
                      ${toast.message.includes('belong') || toast.message.includes('Off') || toast.message.includes('Wrong')
                        ? 'border-b-red-200'
                        : 'border-b-amber-200'
                      }`}
                  />
                  {toast.message}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDone}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg"
            >
              Done — see results
            </motion.button>
          </>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Score + Precision */}
              <div className={`p-4 rounded-xl text-center border-2 ${
                scorePercent >= 80 ? 'bg-green-50 border-green-400'
                : scorePercent >= 50 ? 'bg-blue-50 border-blue-400'
                : 'bg-orange-50 border-orange-400'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {scorePercent >= 80 ? '🏆 Excellent vocabulary choices!'
                   : scorePercent >= 50 ? '👍 Good selection — room to improve'
                   : '📚 Keep practising topic vocabulary'}
                </div>
                <div className="text-4xl font-bold">{scorePercent}<span className="text-xl">/100</span></div>
                <div className="mt-2 text-lg font-semibold text-gray-700">
                  Precision: <span className="text-indigo-600">{precisionPercent}%</span>
                  <span className="text-sm font-normal text-gray-500 ml-1">(TOP words ÷ total selections)</span>
                </div>
                {distractorClicks > 0 && (
                  <p className="text-sm text-red-600 mt-1">Wrong-topic clicks: {distractorClicks} (−15 each)</p>
                )}
              </div>

              {/* Good choices (from slots) */}
              {chosenGood.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Your slot choices:
                  </p>
                  <div className="space-y-2">
                    {slots.filter((s): s is { type: 'TOP' | 'MID'; word: string } => s !== null)
                      .map((slot, i) => {
                        const bub = exercise.bubbles.find(b => b.word === slot.word);
                        return (
                          <div key={i} className={`px-3 py-2 rounded-xl text-sm border-2 ${
                            slot.type === 'TOP'
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-blue-50 border-blue-300 text-blue-800'
                          }`}>
                            <span className="font-bold">{slot.type === 'TOP' ? '⭐' : '🔵'} {slot.word}</span>
                            {bub?.example && <span className="ml-2 italic opacity-80">e.g. "{bub.example}"</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Wrong-topic reminder */}
              {distractorClicks > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl">
                  <p className="font-semibold text-red-700">❌ Wrong-topic clicks: {distractorClicks} (each −15 pts)</p>
                  <p className="text-sm text-red-600 mt-1">Avoid words that belong to another topic.</p>
                </div>
              )}

              {/* Missed good words */}
              {missedGood.length > 0 && (
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-xl">
                  <p className="font-semibold text-indigo-800 mb-2">💡 Useful words you didn't select:</p>
                  <div className="space-y-2">
                    {missedGood.slice(0, 6).map((b, i) => (
                      <div key={i} className="text-sm text-indigo-700">
                        <span className="font-bold">{b.score === 17 ? '⭐' : '🟡'} {b.word}</span>
                        {b.example && <span className="ml-2 italic opacity-80">e.g. "{b.example}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* XP */}
              <div className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-purple-700 font-bold">+{Math.max(1, Math.floor(scorePercent / 10))} XP</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentIndex < roundExercises.length - 1 ? 'Next Exercise →' : 'Finish'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
