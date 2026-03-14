import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Zap, CheckCircle, XCircle, Star } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

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

const getScoreLabel = (score: number) => {
  if (score === 0)   return { label: '❌ Incorrecto',  bg: 'from-red-400 to-red-600',     icon: 'wrong' };
  if (score === 40)  return { label: '🟡 Aceptable',   bg: 'from-yellow-400 to-yellow-500', icon: 'acceptable' };
  if (score === 70)  return { label: '✅ Buena',        bg: 'from-blue-400 to-blue-600',    icon: 'good' };
  if (score === 100) return { label: '⭐ Óptima',       bg: 'from-green-400 to-green-600',  icon: 'wow' };
  return { label: '', bg: 'from-gray-300 to-gray-400', icon: '' };
};

const getButtonColor = (option: Option, selectedWord: string | null, showFeedback: boolean) => {
  if (!showFeedback) return 'from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600';
  if (option.word === selectedWord) return getScoreLabel(option.score).bg;
  if (option.score === 100 && showFeedback) return 'from-green-300 to-green-400 opacity-80';
  return 'from-gray-200 to-gray-300';
};

const getFeedbackText = (option: Option | undefined) => {
  if (!option) return '';
  if (option.score === 0) return option.wrongReason ?? '';
  return option.feedback ?? '';
};

const getFeedbackStyle = (score: number) => {
  if (score === 0)   return 'bg-red-50 border-2 border-red-300 text-red-800';
  if (score === 40)  return 'bg-yellow-50 border-2 border-yellow-300 text-yellow-800';
  if (score === 70)  return 'bg-blue-50 border-2 border-blue-300 text-blue-800';
  if (score === 100) return 'bg-green-50 border-2 border-green-300 text-green-800';
  return 'bg-gray-50 border-2 border-gray-300';
};

export const FlashSynonyms = ({ onBack }: FlashSynonymsProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [questionScores, setQuestionScores] = useState<number[]>([]);
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
    setLastPoints(null);
    setQuestionScores([]);
  };

  const handleAnswer = (word: string) => {
    if (showFeedback) return;

    setSelectedAnswer(word);
    setShowFeedback(true);

    const option = question.options.find((o: Option) => o.word === word);
    const points = option?.score ?? 0;
    setLastPoints(points);
    setScore(prev => prev + points);
    setQuestionScores(prev => [...prev, points]);
    addXP(Math.floor(points / 10));
  };

  const nextQuestion = () => {
    if (currentQuestion < contentData.flashSynonyms.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setLastPoints(null);
    } else {
      setIsGameActive(false);
    }
  };

  const selectedOption = question?.options.find((o: Option) => o.word === selectedAnswer);
  const totalPossible = contentData.flashSynonyms.length * 100;
  const percentage = Math.round((score / totalPossible) * 100);

  // ── PANTALLA INICIO / RESULTADOS ──────────────────────────────────────────
  if (!isGameActive) {
    const isResults = questionScores.length > 0;

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
          {!isResults ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" fill="white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Flash Synonyms</h2>
              <p className="text-gray-600 mb-3">
                10 segundos por pregunta. Elige la alternativa más sofisticada para cada palabra básica.
              </p>
              <div className="flex justify-center gap-6 mb-8 text-sm">
                <span className="flex items-center gap-1 text-red-500">❌ Incorrecto — 0 pts</span>
                <span className="flex items-center gap-1 text-yellow-600">🟡 Aceptable — 40 pts</span>
                <span className="flex items-center gap-1 text-blue-600">✅ Buena — 70 pts</span>
                <span className="flex items-center gap-1 text-green-600">⭐ Óptima — 100 pts</span>
              </div>
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
                <Star className="w-10 h-10 text-white" fill="white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Desafío Completado!</h2>

              {/* Score grande */}
              <div className="text-7xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-1">
                {score}
              </div>
              <p className="text-gray-500 mb-2">de {totalPossible} puntos posibles</p>

              {/* Barra de porcentaje */}
              <div className="w-full bg-gray-100 rounded-full h-4 mb-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-4 rounded-full ${
                    percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    percentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                />
              </div>

              {/* Desglose por pregunta */}
              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {questionScores.map((pts, i) => (
                  <span
                    key={i}
                    className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center text-white ${
                      pts === 100 ? 'bg-green-500' :
                      pts === 70  ? 'bg-blue-500' :
                      pts === 40  ? 'bg-yellow-500' :
                      'bg-red-400'
                    }`}
                  >
                    {pts === 100 ? '⭐' : pts === 70 ? '✅' : pts === 40 ? '🟡' : '❌'}
                  </span>
                ))}
              </div>

              {/* Mensaje según resultado */}
              <p className="text-gray-600 mb-8 text-lg">
                {percentage === 100 ? '🏆 ¡Perfecto! Dominas el vocabulario C1.' :
                 percentage >= 80  ? '🌟 ¡Excelente nivel! Casi todo óptimo.' :
                 percentage >= 60  ? '👍 Buen trabajo. Sigue practicando el C1.' :
                 percentage >= 40  ? '📚 Nivel aceptable. Aprende los vocabularios óptimos.' :
                 '💪 Necesitas practicar más. ¡Inténtalo de nuevo!'}
              </p>

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

  // ── PANTALLA DE JUEGO ─────────────────────────────────────────────────────
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {currentQuestion + 1} / {contentData.flashSynonyms.length}
            </span>
            <div className="bg-yellow-100 px-4 py-2 rounded-full flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="font-bold text-yellow-700">{score} pts</span>
              <AnimatePresence>
                {lastPoints !== null && lastPoints > 0 && (
                  <motion.span
                    key={currentQuestion}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-green-600 font-bold text-sm"
                  >
                    +{lastPoints}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Temporizador */}
          <motion.div
            animate={{ scale: timeLeft <= 3 ? [1, 1.1, 1] : 1 }}
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

        {/* Barra de progreso temporal */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            animate={{ width: `${(timeLeft / 10) * 100}%` }}
            className={`h-2 rounded-full transition-all ${
              timeLeft <= 3 ? 'bg-red-500' : 'bg-blue-500'
            }`}
          />
        </div>

        {/* Contexto */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 p-6 rounded-lg mb-8">
          <div className="mb-3">
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Mejora esta palabra:
            </span>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">"{question.basicWord}"</h3>
          </div>
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">Contexto:</span>{' '}
            {question.context.replace('___', '______')}
          </p>
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {question.options.map((option: Option, index: number) => {
            const isSelected = selectedAnswer === option.word;
            const isOptimal = option.score === 100;

            return (
              <motion.button
                key={index}
                whileHover={!showFeedback ? { scale: 1.03 } : {}}
                whileTap={!showFeedback ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(option.word)}
                disabled={showFeedback}
                className={`relative p-6 rounded-2xl bg-gradient-to-r ${getButtonColor(option, selectedAnswer, showFeedback)} text-white font-bold text-lg shadow-lg disabled:cursor-not-allowed transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{option.word}</span>

                  {/* Icono post-selección */}
                  {showFeedback && isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {option.score === 100 ? (
                        <Star className="w-7 h-7" fill="white" />
                      ) : option.score > 0 ? (
                        <CheckCircle className="w-7 h-7" />
                      ) : (
                        <XCircle className="w-7 h-7" />
                      )}
                    </motion.div>
                  )}

                  {/* Muestra la óptima si el alumno no la eligió */}
                  {showFeedback && !isSelected && isOptimal && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="opacity-70"
                    >
                      <Star className="w-6 h-6" />
                    </motion.div>
                  )}
                </div>

                {/* Badge de puntos al seleccionar */}
                {showFeedback && isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm font-semibold opacity-90"
                  >
                    {getScoreLabel(option.score).label}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback pedagógico */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {/* Feedback de la opción elegida */}
              {selectedOption && (
                <div className={`p-4 rounded-xl mb-3 ${getFeedbackStyle(selectedOption.score)}`}>
                  <p className="text-sm font-medium">
                    {getFeedbackText(selectedOption)}
                  </p>
                </div>
              )}

              {/* Si no eligió la óptima, muestra cuál era */}
              {selectedOption && selectedOption.score < 100 && (
                <div className="bg-green-50 border-2 border-green-200 p-3 rounded-xl mb-4">
                  <p className="text-green-700 text-sm">
                    <span className="font-bold">⭐ Opción óptima: </span>
                    <span className="font-bold">
                      {question.options.find((o: Option) => o.score === 100)?.word}
                    </span>
                    {' — '}
                    {question.options.find((o: Option) => o.score === 100)?.feedback}
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextQuestion}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentQuestion < contentData.flashSynonyms.length - 1
                  ? 'Siguiente Pregunta →'
                  : 'Ver Resultados'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
