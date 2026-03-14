import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

interface FlashSynonymsProps {
  onBack: () => void;
}

export const FlashSynonyms = ({ onBack }: FlashSynonymsProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const { addXP } = useGamification();

  const question = contentData.flashSynonyms[currentQuestion];

  useEffect(() => {
    if (!isGameActive || showFeedback || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShowFeedback(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, showFeedback, timeLeft]);

  const startGame = () => {
    setIsGameActive(true);
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(10);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleAnswer = (word: string) => {
    if (showFeedback) return;

    setSelectedAnswer(word);
    setShowFeedback(true);

    const isCorrect = question.options.find(o => o.word === word)?.isCorrect;
    if (isCorrect) {
      const timeBonus = timeLeft;
      setScore(prev => prev + 10 + timeBonus);
      addXP(10 + timeBonus);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < contentData.flashSynonyms.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsGameActive(false);
    }
  };

  const getButtonColor = (word: string) => {
    if (!showFeedback) return 'from-blue-400 to-purple-500';

    const option = question.options.find(o => o.word === word);
    if (option?.isCorrect) return 'from-green-400 to-green-600';
    if (word === selectedAnswer && !option?.isCorrect) return 'from-red-400 to-red-600';
    return 'from-gray-300 to-gray-400';
  };

  if (!isGameActive) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          {currentQuestion === 0 ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" fill="white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Flash-Synonyms</h2>
              <p className="text-gray-600 mb-8">
                Desafíos rápidos de 10 segundos. Elige la alternativa B2+/C1 más sofisticada para cada palabra básica.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg"
              >
                ¡Comenzar Desafío!
              </motion.button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">¡Desafío Completado!</h2>
              <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
                {score}
              </div>
              <p className="text-gray-600 mb-8">Puntos totales obtenidos</p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-bold"
                >
                  Jugar de Nuevo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-bold"
                >
                  Volver al Menú
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
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Pregunta {currentQuestion + 1} de {contentData.flashSynonyms.length}
            </span>
            <div className="bg-yellow-100 px-4 py-2 rounded-full">
              <span className="font-bold text-yellow-700">Puntos: {score}</span>
            </div>
          </div>

          <motion.div
            animate={{
              scale: timeLeft <= 3 ? [1, 1.1, 1] : 1,
            }}
            transition={{ repeat: timeLeft <= 3 ? Infinity : 0, duration: 0.5 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              timeLeft <= 3 ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <Clock className={`w-5 h-5 ${timeLeft <= 3 ? 'text-red-600' : 'text-blue-600'}`} />
            <span className={`font-bold text-xl ${timeLeft <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
              {timeLeft}s
            </span>
          </motion.div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 p-6 rounded-lg mb-8">
          <div className="mb-4">
            <span className="text-sm font-semibold text-orange-700 uppercase">Palabra Básica:</span>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{question.basicWord}</h3>
          </div>
          <p className="text-gray-700">
            <span className="font-semibold">Contexto:</span> {question.context.replace('____', '______')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option.word;
            const showIcon = showFeedback && (option.isCorrect || isSelected);

            return (
              <motion.button
                key={index}
                whileHover={!showFeedback ? { scale: 1.03 } : {}}
                whileTap={!showFeedback ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(option.word)}
                disabled={showFeedback}
                className={`relative p-6 rounded-2xl bg-gradient-to-r ${getButtonColor(option.word)} text-white font-bold text-lg shadow-lg disabled:cursor-not-allowed transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-xl mb-1">{option.word}</div>
                    <div className="text-xs opacity-80">Nivel {option.level}</div>
                  </div>
                  {showIcon && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {option.isCorrect ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <XCircle className="w-8 h-8" />
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-xl mb-4 ${
                question.options.find(o => o.word === selectedAnswer)?.isCorrect
                  ? 'bg-green-50 border-2 border-green-300'
                  : 'bg-red-50 border-2 border-red-300'
              }`}>
                <p className="text-gray-700 text-sm">{question.explanation}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextQuestion}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentQuestion < contentData.flashSynonyms.length - 1
                  ? 'Siguiente Pregunta'
                  : 'Ver Resultados'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
