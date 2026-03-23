import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, Zap } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

interface Exercise {
  id: number;
  category: string;
  original: string;
  keyWord: string;
  correct: string[];           // primary (most formal) answer — used for display
  acceptedAnswers: string[][]; // all valid answers including correct
  options: string[];
  explanation: string;
  wrongFeedback: Record<string, string>;
}

interface SentenceBuilderProps {
  onBack: () => void;
}

const ROUND_SIZE = 10;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const CATEGORY_COLORS: Record<string, string> = {
  'Passive Voice':     'bg-blue-100 text-blue-800',
  'Phrasal Verbs':     'bg-purple-100 text-purple-800',
  'Connectors':        'bg-yellow-100 text-yellow-800',
  'Formal Register':   'bg-rose-100 text-rose-800',
  'Modal Perfects':    'bg-indigo-100 text-indigo-800',
  'Vocabulary Upgrade':'bg-green-100 text-green-800',
  'Conditionals':      'bg-orange-100 text-orange-800',
};

export const SentenceBuilder = ({ onBack }: SentenceBuilderProps) => {
  const [round] = useState<Exercise[]>(() =>
    shuffle(contentData.sentenceBuilder as Exercise[]).slice(0, ROUND_SIZE)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const { addXP } = useGamification();

  const exercise = round[currentIndex];

  useEffect(() => {
    setAvailable(shuffle(exercise.options));
    setPlaced([]);
    setShowFeedback(false);
    setWrongWords([]);
  }, [currentIndex, exercise.options]);

  const tapFromBank = (word: string, idx: number) => {
    if (showFeedback) return;
    const newAvailable = [...available];
    newAvailable.splice(idx, 1);
    setAvailable(newAvailable);
    setPlaced([...placed, word]);
  };

  const tapFromPlaced = (word: string, idx: number) => {
    if (showFeedback) return;
    const newPlaced = [...placed];
    newPlaced.splice(idx, 1);
    setPlaced(newPlaced);
    setAvailable([...available, word]);
  };

  const checkAnswer = () => {
    const accepted = exercise.acceptedAnswers ?? [exercise.correct];

    // Strip commas for comparison
    const placedFiltered = placed.filter(w => w !== ',');

    const matchedAnswer = accepted.find(ans => {
      const ansFiltered = ans.filter(w => w !== ',');
      return placedFiltered.join(' ') === ansFiltered.join(' ');
    });

    const ok = !!matchedAnswer;

    // A word is "wrong" only if it does not appear in ANY accepted answer
    const allAcceptedWords = new Set(accepted.flat());
    const wrong = ok ? [] : placed.filter(w => w !== ',' && !allAcceptedWords.has(w));

    setIsCorrect(ok);
    setWrongWords(wrong);
    setShowFeedback(true);

    if (ok) {
      setScore(s => s + 1);
      addXP(15);
    }
    setResults(r => [...r, ok]);
  };

  const next = () => {
    if (currentIndex < round.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setGameOver(true);
    }
  };

  if (gameOver) {
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="text-6xl mb-4">{score >= 8 ? '🏆' : score >= 5 ? '✅' : '📚'}</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Round Complete!</h2>
          <div className="text-6xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-1">
            {score}<span className="text-2xl">/{round.length}</span>
          </div>
          <p className="text-gray-500 mb-6">
            {score >= 8 ? 'Excellent command of grammar structures!' : score >= 5 ? 'Good work, keep practising the trickier structures.' : 'Review the feedback and try again.'}
          </p>
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {results.map((r, i) => (
              <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${r ? 'bg-green-500' : 'bg-red-400'}`}>
                {r ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrentIndex(0); setScore(0); setResults([]); setGameOver(false); }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold">
              New Round
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

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" /><span>Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full uppercase tracking-wide">
                Sentence Builder
              </span>
              <p className="text-sm text-gray-500">Exercise {currentIndex + 1} of {round.length}</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Sentence Builder</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[exercise.category] || 'bg-gray-100 text-gray-700'}`}>
              {exercise.category}
            </span>
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-700">{score}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
          <div className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex) / round.length) * 100}%` }} />
        </div>

        {/* Original sentence */}
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Original sentence:</p>
          <p className="text-gray-800 font-medium">{exercise.original}</p>
        </div>

        {/* Key word */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-sm text-gray-600 font-semibold">Use the word:</span>
          <span className="bg-indigo-600 text-white px-4 py-1 rounded-full font-black text-sm tracking-wide">
            {exercise.keyWord}
          </span>
        </div>

        {/* Drop zone — placed words */}
        <div className="min-h-[60px] bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center">
          {placed.length === 0 && (
            <span className="text-indigo-300 text-sm italic">Tap words below to build the sentence...</span>
          )}
          <AnimatePresence>
            {placed.map((word, idx) => (
              <motion.button
                key={`${word}-${idx}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => tapFromPlaced(word, idx)}
                disabled={showFeedback}
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm shadow-sm transition-all ${
                  showFeedback
                    ? wrongWords.includes(word)
                      ? 'bg-red-200 text-red-800 border-2 border-red-400'
                      : 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Word bank */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Word bank: tap to add</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {available.map((word, idx) => (
                <motion.button
                  key={`${word}-${idx}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => tapFromBank(word, idx)}
                  disabled={showFeedback}
                  className="px-3 py-1.5 bg-white border-2 border-gray-300 rounded-lg font-semibold text-sm text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all disabled:opacity-50"
                >
                  {word}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Check button */}
        {!showFeedback && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkAnswer}
            disabled={placed.length === 0}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-40"
          >
            Check Answer
          </motion.button>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

              {/* Result */}
              <div className={`p-4 rounded-xl border-2 text-center ${isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                  <span className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Correct! +15 XP' : 'Not quite. See the correct answer below.'}
                  </span>
                </div>
              </div>

              {isCorrect && placed.filter(w => w !== ',').join(' ') !==
                exercise.correct.filter(w => w !== ',').join(' ') && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                  <span className="font-bold">Good answer.</span> The most formal PAU option would be:{' '}
                  <span className="font-semibold">{exercise.correct.join(' ')}</span>
                </div>
              )}

              {/* Correct answer if wrong */}
              {!isCorrect && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Correct answer:</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.correct.map((word, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Wrong word feedback */}
              {!isCorrect && wrongWords.length > 0 && wrongWords.map(word => (
                exercise.wrongFeedback[word] && (
                  <div key={word} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-xl">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Why "{word}" doesn't work:</p>
                    <p className="text-sm text-red-800">{exercise.wrongFeedback[word]}</p>
                  </div>
                )
              ))}

              {/* Explanation — always shown */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-bold text-blue-600 uppercase">Grammar note:</p>
                </div>
                <p className="text-sm text-blue-800">{exercise.explanation}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={next}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentIndex < round.length - 1 ? 'Next →' : 'See Results'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
