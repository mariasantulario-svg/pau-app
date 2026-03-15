import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

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

export const SpotTheSpanglish = ({ onBack, exercises }: SpotTheSpanglishProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercises[0].timeSeconds);
  const [selected, setSelected] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const { addXP } = useGamification();

  const exercise = exercises[currentIndex];
  const segments = parseSegments(exercise.paragraph, exercise.errors);
  const errorBlocks = exercise.errors.map(e => e.block);

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

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setTimeLeft(exercises[next].timeSeconds);
      setSelected([]);
      setShowFeedback(false);
      setTimedOut(false);
    } else {
      onBack();
    }
  };

  const correct = selected.filter(s => errorBlocks.includes(s));
  const wrong = selected.filter(s => !errorBlocks.includes(s));
  const missed = errorBlocks.filter(b => !selected.includes(b));
  const timePct = (timeLeft / exercise.timeSeconds) * 100;

  // ── Block style during game ────────────────────────────────────────────────
  const getBlockGameStyle = (block: string) => {
    if (selected.includes(block)) {
      return 'bg-yellow-200 text-yellow-800 border-yellow-400 scale-105 ring-2 ring-yellow-300';
    }
    return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:border-blue-400 cursor-pointer';
  };

  // ── Block style after feedback ─────────────────────────────────────────────
  // Error found → red strikethrough (wrong word) + green correction inline
  // Error missed → orange pulsing
  // Wrong tap → red simple
  // Neutral distractor → gray
  const getBlockFeedbackStyle = (block: string, isError: boolean) => {
    if (isError && selected.includes(block)) return 'error-found'; // red strikethrough
    if (isError && !selected.includes(block)) return 'error-missed'; // orange
    if (!isError && selected.includes(block)) return 'wrong-tap';   // red
    return 'neutral';
  };

  const getErrorCorrection = (block: string) =>
    exercise.errors.find(e => e.block === block)?.correction ?? '';

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Spot the Spanglish</h2>
            <p className="text-sm text-gray-500">Ejercicio {currentIndex + 1} de {exercises.length}</p>
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
                <p className="text-orange-800 font-semibold text-sm">Encuentra los errores de Spanglish</p>
                <p className="text-orange-700 text-xs mt-1">
                  Pulsa los bloques subrayados que contengan errores.
                  <span className="font-bold"> Acierto: +3s · Fallo: −5s</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Paragraph */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6 text-gray-800 leading-loose text-base">
          {segments.map((seg, i) => {
            if (!seg.isClickable) return <span key={i}>{seg.text}</span>;

            if (!showFeedback) {
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBlockTap(seg.block!)}
                  className={`inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 font-medium transition-all text-base ${getBlockGameStyle(seg.block!)}`}
                >
                  {seg.text}
                </motion.button>
              );
            }

            // ── Feedback mode ────────────────────────────────────────────
            const style = getBlockFeedbackStyle(seg.block!, seg.isError);

            if (style === 'error-found') {
              // Red strikethrough + green correction inline
              return (
                <span key={i} className="inline-flex items-center gap-1 mx-0.5">
                  <span className="px-2 py-0.5 rounded-lg border-2 border-red-400 bg-red-50 text-red-700 font-medium line-through opacity-70">
                    {seg.text}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg border-2 border-green-400 bg-green-100 text-green-800 font-bold">
                    ✓ {getErrorCorrection(seg.block!)}
                  </span>
                </span>
              );
            }

            if (style === 'error-missed') {
              // Orange — missed error, show correction too
              return (
                <span key={i} className="inline-flex items-center gap-1 mx-0.5">
                  <span className="px-2 py-0.5 rounded-lg border-2 border-orange-400 bg-orange-50 text-orange-700 font-medium animate-pulse">
                    ⚠️ {seg.text}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg border-2 border-green-400 bg-green-100 text-green-800 font-bold">
                    ✓ {getErrorCorrection(seg.block!)}
                  </span>
                </span>
              );
            }

            if (style === 'wrong-tap') {
              // Red — tapped something that's not an error
              return (
                <span key={i} className="inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 border-red-300 bg-red-50 text-red-600 font-medium">
                  ✗ {seg.text}
                </span>
              );
            }

            // Neutral distractor
            return (
              <span key={i} className="inline-block mx-0.5 px-2 py-0.5 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-500 font-medium">
                {seg.text}
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
            🕵️ He terminado — ver resultados
          </motion.button>
        )}

        {/* Feedback panel */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {timedOut && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-center">
                  <p className="text-red-700 font-bold">⏰ ¡Tiempo agotado!</p>
                </div>
              )}

              {/* Score banner */}
              <div className={`p-4 rounded-xl text-center border-2 ${
                wrong.length === 0 && missed.length === 0 ? 'bg-green-50 border-green-400'
                : correct.length > 0 ? 'bg-blue-50 border-blue-400'
                : 'bg-orange-50 border-orange-400'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {wrong.length === 0 && missed.length === 0 ? '🏆 ¡Todos los errores encontrados!'
                   : correct.length > 0 ? '👍 Parcialmente correcto'
                   : '📚 Sigue practicando'}
                </div>
                <div className="flex justify-center gap-6 text-sm font-semibold mt-2">
                  <span className="text-green-600">✅ {correct.length} encontrados</span>
                  <span className="text-red-600">❌ {wrong.length} incorrectos</span>
                  <span className="text-orange-600">⚠️ {missed.length} perdidos</span>
                </div>
              </div>

              {/* Error explanations */}
              <div className="space-y-3">
                {exercise.errors.map((error) => {
                  const wasFound = selected.includes(error.block);
                  return (
                    <motion.div
                      key={error.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border-2 ${wasFound ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-300'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">{wasFound ? '✅' : '⚠️'}</span>
                        <div className="flex-1">
                          {/* Strikethrough wrong → green correct */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono text-sm line-through opacity-70">
                              {error.block}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono text-sm font-bold">
                              ✓ {error.correction}
                            </span>
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
                    <p className="text-red-700 text-sm font-semibold mb-2">❌ Pulsaste bloques que son inglés correcto:</p>
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
                <span className="text-purple-700 font-bold">Puntuación acumulada: {score} pts</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentIndex < exercises.length - 1 ? 'Siguiente Ejercicio →' : 'Finalizar Módulo'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
