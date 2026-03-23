import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { getRoundItems, ROUND_SIZES } from '../utils/rounds';

interface SpanglishError {
  id: string;
  block: string;
  explanation: string;
  correction: string;
}

interface Exercise {
  id: number;
  paragraph: string;
  timeSeconds: number;
  errors: SpanglishError[];
}

interface SpotTheSpanglishProps {
  onBack: () => void;
  exercises: Exercise[];
}

const parseSegments = (paragraph: string, errors: SpanglishError[]) => {
  const errorBlocks = errors.map(e => e.block);
  const parts = paragraph.split(/\{([^}]+)\}/g);
  return parts.map((part, index) => ({
    text: part,
    isClickable: index % 2 === 1,
    isError: index % 2 === 1 && errorBlocks.includes(part),
    block: index % 2 === 1 ? part : null,
  }));
};

const ROUND_LEN = ROUND_SIZES.activities;

export const SpotTheSpanglish = ({ onBack, exercises }: SpotTheSpanglishProps) => {
  const [roundExercises, setRoundExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);
  const { addXP } = useGamification();

  const startRound = useCallback(() => {
    const exs = getRoundItems(exercises, ROUND_LEN);
    setRoundExercises(exs);
    setCurrentIndex(0);
    setRoundComplete(false);
    setTimeLeft(exs[0]?.timeSeconds ?? 60);
    setSelected([]);
    setShowFeedback(false);
    setTimedOut(false);
    setScore(0);
    setRevealed([]);
  }, [exercises]);

  const exercise = roundExercises[currentIndex];
  const errorBlocks = exercise?.errors?.map(e => e.block) ?? [];

  const finishRound = useCallback((timeout = false) => {
    setShowFeedback(true);
    setTimedOut(timeout);
    const correct = selected.filter(s => errorBlocks.includes(s)).length;
    const wrong = selected.filter(s => !errorBlocks.includes(s)).length;
    const missed = errorBlocks.filter(b => !selected.includes(b)).length;
    const pts = Math.max(0, correct * 25 - wrong * 10 - missed * 5);
    setScore(prev => prev + pts);
    addXP(Math.floor(pts / 5));
  }, [selected, errorBlocks, addXP]);

  useEffect(() => {
    if (showFeedback) return;
    if (timeLeft <= 0) { finishRound(true); return; }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, showFeedback, finishRound]);

  if (roundExercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Spot the Spanglish</h2>
          <p className="text-gray-600 mb-8">
            {ROUND_LEN} exercises per round. Find Spanglish errors before time runs out.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg">
            Start Round
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const segments = parseSegments(exercise!.paragraph, exercise!.errors);

  const handleBlockTap = (block: string) => {
    if (showFeedback) return;
    if (selected.includes(block)) {
      setSelected(prev => prev.filter(s => s !== block));
    } else {
      setSelected(prev => [...prev, block]);
      if (!errorBlocks.includes(block)) {
        setTimeLeft(prev => Math.max(0, prev - 5));
      } else {
        setTimeLeft(prev => Math.min(exercise.timeSeconds, prev + 3));
      }
    }
  };

  // Tap green correction button in feedback → reveal inline in paragraph
  const handleReveal = (block: string) => {
    if (!revealed.includes(block)) {
      setRevealed(prev => [...prev, block]);
    }
  };

  const nextExercise = () => {
    if (currentIndex < roundExercises.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setTimeLeft(roundExercises[next].timeSeconds);
      setSelected([]);
      setShowFeedback(false);
      setTimedOut(false);
      setRevealed([]);
    } else {
      setRoundComplete(true);
    }
  };

  const correct = selected.filter(s => errorBlocks.includes(s));
  const wrong = selected.filter(s => !errorBlocks.includes(s));
  const missed = errorBlocks.filter(b => !selected.includes(b));
  const timePct = exercise ? (timeLeft / exercise.timeSeconds) * 100 : 0;

  const getCorrection = (block: string) =>
    exercise?.errors.find(e => e.block === block)?.correction ?? '';

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
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-3 rounded-2xl font-bold">
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

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <span className="text-xs font-bold text-pink-600 bg-pink-50 border border-pink-200 px-3 py-1 rounded-full uppercase tracking-wide">
                Spot the Spanglish
              </span>
              <p className="text-sm text-gray-500">Exercise {currentIndex + 1} of {roundExercises.length}</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Spot the Spanglish</h2>
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
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            animate={{ width: `${timePct}%` }}
            className={`h-2 rounded-full transition-all duration-1000 ${
              timePct > 50 ? 'bg-blue-500' : timePct > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
        </div>

        {/* Instructions */}
        {!showFeedback && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-800 font-semibold text-sm">Find all the Spanglish errors</p>
                <p className="text-orange-700 text-xs mt-1">
                  Tap the blocks that contain errors.
                  <span className="font-bold"> Correct: +3s · Wrong: −5s</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Paragraph ────────────────────────────────────────────────────── */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6 text-gray-800 leading-loose text-base">
          {segments.map((seg, i) => {
            if (!seg.isClickable) return <span key={i}>{seg.text}</span>;

            const block = seg.block!;
            const isSelectedByUser = selected.includes(block);
            const isRevealedCorrection = revealed.includes(block);

            // ── During game ──────────────────────────────────────────────
            if (!showFeedback) {
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBlockTap(block)}
                  className={`inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 font-medium transition-all text-base ${
                    isSelectedByUser
                      ? 'bg-yellow-200 text-yellow-800 border-yellow-400 scale-105 ring-2 ring-yellow-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
                  }`}
                >
                  {seg.text}
                </motion.button>
              );
            }

            // ── After feedback ───────────────────────────────────────────
            // Error found by user
            if (seg.isError && isSelectedByUser) {
              if (isRevealedCorrection) {
                // User tapped correction button → show strikethrough + green correction
                return (
                  <span key={i} className="inline-flex items-center gap-1 mx-0.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg border-2 border-red-400 bg-red-50 text-red-700 font-medium line-through opacity-70">
                      {block}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2 py-0.5 rounded-lg border-2 border-green-500 bg-green-100 text-green-800 font-bold"
                    >
                      ✓ {getCorrection(block)}
                    </motion.span>
                  </span>
                );
              }
              // Not yet revealed — just red, waiting for user to tap correction
              return (
                <span key={i} className="inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 border-red-400 bg-red-50 text-red-700 font-medium">
                  {block}
                </span>
              );
            }

            // Error missed by user
            if (seg.isError && !isSelectedByUser) {
              if (isRevealedCorrection) {
                return (
                  <span key={i} className="inline-flex items-center gap-1 mx-0.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg border-2 border-orange-400 bg-orange-50 text-orange-700 font-medium line-through opacity-70">
                      {block}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2 py-0.5 rounded-lg border-2 border-green-500 bg-green-100 text-green-800 font-bold"
                    >
                      ✓ {getCorrection(block)}
                    </motion.span>
                  </span>
                );
              }
              return (
                <span key={i} className="inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 border-orange-400 bg-orange-50 text-orange-700 font-medium animate-pulse">
                  ⚠️ {block}
                </span>
              );
            }

            // Wrong tap (distractor selected)
            if (!seg.isError && isSelectedByUser) {
              return (
                <span key={i} className="inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 border-red-200 bg-red-50 text-red-400 font-medium">
                  ✗ {block}
                </span>
              );
            }

            // Neutral distractor not selected
            return (
              <span key={i} className="inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-500 font-medium">
                {block}
              </span>
            );
          })}
        </div>

        {/* Done button */}
        {!showFeedback && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => finishRound(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-lg mb-2"
          >
            🕵️ Done — show results
          </motion.button>
        )}

        {/* ── Feedback panel ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {timedOut && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-center">
                  <p className="text-red-700 font-bold">⏰ Time's up!</p>
                </div>
              )}

              {/* Score banner */}
              <div className={`p-4 rounded-xl text-center border-2 ${
                wrong.length === 0 && missed.length === 0 ? 'bg-green-50 border-green-400'
                : correct.length > 0 ? 'bg-blue-50 border-blue-400'
                : 'bg-orange-50 border-orange-400'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {wrong.length === 0 && missed.length === 0 ? '🏆 All errors found!'
                   : correct.length > 0 ? '👍 Partially correct'
                   : '📚 Keep practising'}
                </div>
                <div className="flex justify-center gap-6 text-sm font-semibold mt-2">
                  <span className="text-green-600">✅ {correct.length} found</span>
                  <span className="text-red-600">❌ {wrong.length} incorrect</span>
                  <span className="text-orange-600">⚠️ {missed.length} missed</span>
                </div>
              </div>

              {/* Hint */}
              <p className="text-center text-sm text-gray-500 italic">
                Tap the green button for each error to reveal the correction inside the paragraph.
              </p>

              {/* Error cards — green button triggers inline reveal */}
              <div className="space-y-3">
                {exercise.errors.map((error) => {
                  const wasFound = selected.includes(error.block);
                  const isRevealed = revealed.includes(error.block);

                  return (
                    <motion.div
                      key={error.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border-2 ${
                        wasFound ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">{wasFound ? '✅' : '⚠️'}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {/* Error in red */}
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono text-sm font-bold">
                              ✗ {error.block}
                            </span>
                            <span className="text-gray-400 text-sm">→</span>
                            {/* Green button — tap to reveal inline */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReveal(error.block)}
                              className={`px-3 py-0.5 rounded font-mono text-sm font-bold transition-all ${
                                isRevealed
                                  ? 'bg-green-200 text-green-800 cursor-default'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer ring-2 ring-green-300'
                              }`}
                            >
                              ✓ {error.correction}
                              {!isRevealed && <span className="ml-1 text-xs opacity-70">↑ tap</span>}
                            </motion.button>
                          </div>
                          <p className="text-sm text-gray-600">{error.explanation}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Wrong taps */}
                {wrong.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm font-semibold mb-2">❌ You tapped blocks of correct English:</p>
                    <div className="flex flex-wrap gap-2">
                      {wrong.map((w, i) => (
                        <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono text-sm">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* XP */}
              <div className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-purple-700 font-bold">Total score: {score} pts</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentIndex < exercises.length - 1 ? 'Next Exercise →' : 'Finish Module'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
