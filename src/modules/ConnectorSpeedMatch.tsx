import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Zap, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';
import { getRoundItems, shuffle, ROUND_SIZES } from '../utils/rounds';

interface ConnectorSpeedMatchProps {
  onBack: () => void;
}

interface Question {
  id: number;
  sentence: string;
  correct: string;
  options: string[];
  explanation: string;
  wrongReasons: Record<string, string>;
}

const INITIAL_TIME = 25;
const TIME_DECREASE = 1; // each question in the round gets 1s less
const MIN_TIME = 15;

const POOL = (contentData.connectorSpeedMatch as Question[]);
const ROUND_LEN = ROUND_SIZES.questions;

export const ConnectorSpeedMatch = ({ onBack }: ConnectorSpeedMatchProps) => {
  const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const { addXP } = useGamification();

  const startRound = useCallback(() => {
    const qs = getRoundItems(POOL, ROUND_LEN);
    setRoundQuestions(qs);
    setCurrentIndex(0);
    setTimeLeft(INITIAL_TIME);
    setSelected(null);
    setShowFeedback(false);
    setScore(0);
    setStreak(0);
    setResults([]);
    setGameOver(false);
    setShuffledOptions(qs.length ? shuffle(qs[0].options) : []);
  }, []);

  const question = roundQuestions[currentIndex];
  const timeForRound = Math.max(MIN_TIME, INITIAL_TIME - currentIndex * TIME_DECREASE);

  const handleAnswer = useCallback((word: string) => {
    if (showFeedback || selected) return;
    setSelected(word);
    setShowFeedback(true);

    const isCorrect = word === question.correct;
    const timeBonus = Math.floor(timeLeft / 2);
    const streakBonus = streak >= 3 ? 5 : 0;
    const pts = isCorrect ? 10 + timeBonus + streakBonus : 0;

    setScore(prev => prev + pts);
    setStreak(prev => isCorrect ? prev + 1 : 0);
    setResults(prev => [...prev, isCorrect]);
    if (pts > 0) addXP(Math.floor(pts / 5));
  }, [showFeedback, selected, question, timeLeft, streak, addXP]);

  // Timer
  useEffect(() => {
    if (showFeedback || gameOver) return;
    if (timeLeft <= 0) {
      handleAnswer('__timeout__');
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, showFeedback, gameOver, handleAnswer]);

  const next = () => {
    if (currentIndex >= roundQuestions.length - 1) {
      setGameOver(true);
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setTimeLeft(Math.max(MIN_TIME, INITIAL_TIME - nextIndex * TIME_DECREASE));
    setSelected(null);
    setShowFeedback(false);
    setShuffledOptions(shuffle(roundQuestions[nextIndex].options));
  };

  const isCorrect = selected === question?.correct;
  const timePct = question ? (timeLeft / timeForRound) * 100 : 0;
  const totalCorrect = results.filter(Boolean).length;

  // ── START SCREEN ───────────────────────────────────────────────────────────
  if (roundQuestions.length === 0 && !gameOver) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Connector Speed Match</h2>
          <p className="text-gray-600 mb-8">
            {ROUND_LEN} questions per round. Choose the best connector before time runs out.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg">
            Start Challenge!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── ROUND COMPLETE (GAME OVER) ──────────────────────────────────────────────
  if (gameOver && roundQuestions.length > 0) {
    const pct = Math.round((totalCorrect / roundQuestions.length) * 100);
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">
            {pct === 100 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '👍' : '📚'}
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {pct === 100 ? 'Perfect!' : pct >= 70 ? 'Excellent!' : pct >= 50 ? 'Good job!' : 'Keep practising'}
          </h2>
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            {score}
          </div>
          <p className="text-gray-500 mb-2">total points</p>
          <p className="text-gray-600 mb-6 font-semibold">{totalCorrect} / {roundQuestions.length} correct</p>

          {/* Result dots */}
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            {results.map((r, i) => (
              <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${r ? 'bg-green-500' : 'bg-red-400'}`}>
                {r ? '✓' : '✗'}
              </span>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold">
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

  // ── GAME (need question) ───────────────────────────────────────────────────
  if (!question) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wide">
              Connector Speed Match
            </span>
            <span className="text-sm text-gray-500">{currentIndex + 1} / {roundQuestions.length}</span>
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-700 text-sm">{score} pts</span>
            </div>
            {streak >= 3 && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full"
              >
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-orange-700 text-sm">🔥 {streak} streak</span>
              </motion.div>
            )}
          </div>

          {/* Timer */}
          <motion.div
            animate={{ scale: timeLeft <= 3 ? [1, 1.15, 1] : 1 }}
            transition={{ repeat: timeLeft <= 3 ? Infinity : 0, duration: 0.4 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              timeLeft <= 3 ? 'bg-red-100' : timeLeft <= 6 ? 'bg-yellow-100' : 'bg-blue-100'
            }`}
          >
            <Clock className={`w-5 h-5 ${timeLeft <= 3 ? 'text-red-600' : timeLeft <= 6 ? 'text-yellow-600' : 'text-blue-600'}`} />
            <span className={`font-bold text-xl ${timeLeft <= 3 ? 'text-red-600' : timeLeft <= 6 ? 'text-yellow-600' : 'text-blue-600'}`}>
              {timeLeft}s
            </span>
          </motion.div>
        </div>

        {/* Timer bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            animate={{ width: `${timePct}%` }}
            className={`h-2 rounded-full transition-all duration-1000 ${
              timePct > 60 ? 'bg-blue-500' : timePct > 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
        </div>

        {/* Difficulty indicator */}
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
          <span>Speed:</span>
          {Array.from({ length: roundQuestions.length }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= currentIndex ? 'bg-indigo-500' : 'bg-gray-200'}`} />
          ))}
          <span className="ml-1">({timeForRound}s per round)</span>
        </div>

        {/* Sentence with gap */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-xl mb-8"
          >
            <p className="text-gray-800 text-lg leading-relaxed font-medium">
              {question.sentence.split('___').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className={`inline-block mx-1 px-4 py-1 rounded-lg border-2 border-dashed font-bold min-w-[120px] text-center ${
                      showFeedback
                        ? isCorrect
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : 'bg-red-100 border-red-400 text-red-800'
                        : 'bg-white border-indigo-300 text-indigo-400'
                    }`}>
                      {showFeedback ? question.correct : '?'}
                    </span>
                  )}
                </span>
              ))}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {shuffledOptions.map((option) => {
            const isSelected = selected === option;
            const isRight = option === question.correct;

            let btnStyle = 'from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600';
            if (showFeedback) {
              if (isRight) btnStyle = 'from-green-400 to-green-600';
              else if (isSelected && !isRight) btnStyle = 'from-red-400 to-red-600';
              else btnStyle = 'from-gray-200 to-gray-300';
            }

            return (
              <motion.button
                key={option}
                whileHover={!showFeedback ? { scale: 1.03 } : {}}
                whileTap={!showFeedback ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(option)}
                disabled={showFeedback}
                className={`p-4 rounded-2xl bg-gradient-to-r ${btnStyle} ${
                  showFeedback && !isRight && !isSelected ? 'text-gray-500' : 'text-white'
                } font-bold text-base shadow-lg disabled:cursor-not-allowed transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showFeedback && isRight && <CheckCircle className="w-5 h-5" />}
                  {showFeedback && isSelected && !isRight && <XCircle className="w-5 h-5" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              {/* Timeout message */}
              {selected === '__timeout__' && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 mb-3 text-center">
                  <p className="text-red-700 font-bold">⏰ Time's up! The correct connector was: <span className="font-mono">{question.correct}</span></p>
                </div>
              )}

              {/* Score gained */}
              {isCorrect && selected !== '__timeout__' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-green-50 border-2 border-green-300 rounded-xl p-3 mb-3 text-center"
                >
                  <p className="text-green-700 font-bold">
                    ✅ +{10 + Math.floor(timeLeft / 2) + (streak >= 3 ? 5 : 0)} pts
                    {streak >= 3 && <span className="ml-2 text-orange-600">🔥 +5 bonus streak</span>}
                  </p>
                </motion.div>
              )}

              {/* Explanation — specific to what the user chose (only when wrong) */}
              {!isCorrect && selected && selected !== '__timeout__' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl mb-3">
                  <p className="text-xs font-bold text-red-600 uppercase mb-1">
                    Why "{selected}" is not the best option:
                  </p>
                  <p className="text-sm text-red-800">
                    {question.wrongReasons?.[selected]
                      ?? 'This connector does not fit the logical relationship in the sentence (contrast, cause, result, etc.).'}
                  </p>
                </div>
              )}

              {/* Positive explanation when the student chose correctly */}
              {isCorrect && selected !== '__timeout__' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-xl mb-4">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">
                    Why "{question.correct}" works here:
                  </p>
                  <p className="text-sm text-green-800">
                    {question.explanation
                      || 'This connector matches the logical relationship between the two clauses and sounds natural in PAU-style writing.'}
                  </p>
                </div>
              )}

              {/* Neutral explanation when time is up or the answer was wrong */}
              {(!isCorrect || selected === '__timeout__') && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl mb-4">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">
                    Why "{question.correct}" is the correct answer:
                  </p>
                  <p className="text-sm text-blue-800">
                    {question.explanation
                      || 'This connector expresses the intended relationship in the sentence (contrast, cause–effect, addition, etc.), so it is the most accurate option.'}
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={next}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentIndex < roundQuestions.length - 1 ? 'Next →' : 'View Results'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
