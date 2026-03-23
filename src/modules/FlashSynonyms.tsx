import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Zap, CheckCircle, XCircle, Star } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';
import { getRoundItems, ROUND_SIZES } from '../utils/rounds';

interface FlashSynonymsProps {
  onBack: () => void;
}

interface Option {
  word: string;
  score: number;
  level: string;
  wrongReason?: string;
  feedback?: string;
}

type FlashSynonymItem = { id: number; basicWord: string; context: string; options: Option[] };

const getButtonColor = (option: Option, selectedWord: string | null, showFeedback: boolean) => {
  if (!showFeedback) return 'from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600';
  if (option.word === selectedWord) {
    return option.score === 100 ? 'from-green-400 to-green-600' : 'from-red-400 to-red-600';
  }
  if (option.score === 100 && showFeedback) return 'from-green-300 to-green-400';
  return 'from-gray-200 to-gray-300';
};

const POOL = (contentData.flashSynonyms as FlashSynonymItem[]);
const ROUND_LEN = ROUND_SIZES.questions;

export const FlashSynonyms = ({ onBack }: FlashSynonymsProps) => {
  const [roundQuestions, setRoundQuestions] = useState<FlashSynonymItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [questionScores, setQuestionScores] = useState<boolean[]>([]);
  const { addXP } = useGamification();

  const question = roundQuestions[currentQuestion];

  useEffect(() => {
    if (!isGameActive || showFeedback || timeLeft === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setShowFeedback(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameActive, showFeedback, timeLeft]);

  const startGame = () => {
    setRoundQuestions(getRoundItems(POOL, ROUND_LEN));
    setIsGameActive(true);
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(10);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuestionScores([]);
  };

  const handleAnswer = (word: string) => {
    if (showFeedback) return;
    setSelectedAnswer(word);
    setShowFeedback(true);
    const option = question.options.find((o: Option) => o.word === word);
    const isCorrect = (option?.score ?? 0) === 100;
    if (isCorrect) { setScore(prev => prev + 1); addXP(10); }
    setQuestionScores(prev => [...prev, isCorrect]);
  };

  const nextQuestion = () => {
    if (roundQuestions.length && currentQuestion < roundQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsGameActive(false);
    }
  };

  const selectedOption = question?.options.find((o: Option) => o.word === selectedAnswer);
  const correctOption = question?.options.find((o: Option) => o.score === 100);
  const total = roundQuestions.length;

  if (!isGameActive || !question) {
    const isResults = questionScores.length > 0 && roundQuestions.length > 0;
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          {!isResults ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" fill="white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Flash Synonyms</h2>
              <p className="text-gray-600 mb-8">
                {ROUND_LEN} questions per round, 10 seconds each.
              </p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg">
                Start Challenge!
              </motion.button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-white" fill="white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Round Complete!</h2>
              <div className="text-7xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-1">
                {score}<span className="text-3xl">/{total}</span>
              </div>
              <p className="text-gray-500 mb-6">correct answers</p>
              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {questionScores.map((correct, i) => (
                  <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${correct ? 'bg-green-500' : 'bg-red-400'}`}>
                    {correct ? '✓' : '✗'}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 mb-8">
                {score === total ? '🏆 Perfect score! Excellent vocabulary range.' :
                 score >= total * 0.7 ? '🌟 Great work! Keep building your lexical range.' :
                 '📚 Keep practising — rich, accurate vocabulary makes a real difference in PAU.'}
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold">
                  Next Round
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-bold">
                  Back to Menu
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" /><span>Back</span>
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full uppercase tracking-wide">
              Flash Synonyms
            </span>
            <span className="text-sm text-gray-400">{currentQuestion + 1} / {total}</span>
            <div className="bg-yellow-100 px-4 py-2 rounded-full flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-700">{score} correct</span>
            </div>
          </div>
          <motion.div
            animate={{ scale: timeLeft <= 3 ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: timeLeft <= 3 ? Infinity : 0, duration: 0.5 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft <= 3 ? 'bg-red-100' : 'bg-blue-100'}`}
          >
            <Clock className={`w-5 h-5 ${timeLeft <= 3 ? 'text-red-600' : 'text-blue-600'}`} />
            <span className={`font-bold text-xl ${timeLeft <= 3 ? 'text-red-600' : 'text-blue-600'}`}>{timeLeft}s</span>
          </motion.div>
        </div>

        {/* Timer bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div animate={{ width: `${(timeLeft / 10) * 100}%` }}
            className={`h-2 rounded-full transition-all ${timeLeft <= 3 ? 'bg-red-500' : 'bg-blue-500'}`} />
        </div>

        {/* Context — basicWord shown inside the gap */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 p-6 rounded-lg mb-8">
          <p className="text-gray-800 text-lg leading-relaxed">
            {question.context.split('___').map((part: string, i: number, arr: string[]) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-block mx-1 text-2xl font-black text-orange-600 border-b-2 border-orange-400">
                    {question.basicWord}
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {question.options.map((option: Option, index: number) => {
            const isSelected = selectedAnswer === option.word;
            const isCorrect = option.score === 100;
            return (
              <motion.button
                key={index}
                whileHover={!showFeedback ? { scale: 1.03 } : {}}
                whileTap={!showFeedback ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(option.word)}
                disabled={showFeedback}
                className={`relative p-6 rounded-2xl bg-gradient-to-r ${getButtonColor(option, selectedAnswer, showFeedback)} ${
                  showFeedback && !isSelected && !isCorrect ? 'text-gray-500' : 'text-white'
                } font-bold text-lg shadow-lg disabled:cursor-not-allowed transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{option.word}</span>
                  {showFeedback && isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                      {isCorrect ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                    </motion.div>
                  )}
                  {showFeedback && !isSelected && isCorrect && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="opacity-80">
                      <Star className="w-6 h-6" fill="white" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">

              {/* What the user chose */}
              {selectedOption && selectedOption.score === 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-3">
                  <p className="text-sm font-semibold text-red-700 mb-1">❌ Why "{selectedOption.word}" doesn't work here:</p>
                  <p className="text-sm text-red-800">{selectedOption.wrongReason}</p>
                </div>
              )}

              {/* Correct answer explanation — always shown */}
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-700 mb-1">
                  {selectedOption?.score === 100 ? '✅ Correct!' : `⭐ Best answer: ${correctOption?.word}`}
                </p>
                <p className="text-sm text-green-800">{correctOption?.feedback}</p>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextQuestion}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg">
                {currentQuestion < total - 1 ? 'Next Question →' : 'View Results'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
