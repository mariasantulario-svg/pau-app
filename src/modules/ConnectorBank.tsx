import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Info } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

interface ConnectorBankProps {
  onBack: () => void;
}

export const ConnectorBank = ({ onBack }: ConnectorBankProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const exercise = contentData.connectorBank[currentExercise];

  const [filledGaps, setFilledGaps] = useState<{ [key: number]: string }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const { addXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const availableWords = [...exercise.connectors.map(c => c.word), ...exercise.distractors];

  const handleDragStart = (word: string) => {
    setDraggedWord(word);
  };

  const handleDrop = (position: number) => {
    if (draggedWord) {
      setFilledGaps({ ...filledGaps, [position]: draggedWord });
      setDraggedWord(null);
    }
  };

  const removeWord = (position: number) => {
    const newGaps = { ...filledGaps };
    delete newGaps[position];
    setFilledGaps(newGaps);
  };

  const checkAnswer = () => {
    const correct = exercise.connectors.every(
      connector => filledGaps[connector.position] === connector.word
    );

    if (correct && !isChallengeCompleted(`connector-${exercise.id}`)) {
      addXP(35);
      markChallengeComplete(`connector-${exercise.id}`);
    }

    setShowFeedback(true);
  };

  const nextExercise = () => {
    if (currentExercise < contentData.connectorBank.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setFilledGaps({});
      setShowFeedback(false);
    } else {
      onBack();
    }
  };

  const usedWords = Object.values(filledGaps);
  const remainingWords = availableWords.filter(word => !usedWords.includes(word));

  const renderTextWithGaps = () => {
    const parts = exercise.text.split(/\{(\d+)\}/);

    return parts.map((part, index) => {
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      }

      const gapPosition = parseInt(part);
      const filledWord = filledGaps[gapPosition];
      const correctConnector = exercise.connectors.find(c => c.position === gapPosition);
      const isCorrect = showFeedback && filledWord === correctConnector?.word;
      const isIncorrect = showFeedback && filledWord && filledWord !== correctConnector?.word;

      return (
        <span
          key={index}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(gapPosition)}
          className="inline-block mx-1"
        >
          {filledWord ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold ${
                showFeedback
                  ? isCorrect
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                  : 'bg-blue-200 text-blue-800 cursor-pointer hover:bg-blue-300'
              }`}
              onClick={() => !showFeedback && removeWord(gapPosition)}
            >
              {filledWord}
              {!showFeedback && <span className="text-xs">✕</span>}
            </motion.span>
          ) : (
            <span className="inline-block w-32 h-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"></span>
          )}
        </span>
      );
    });
  };

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
          <h2 className="text-2xl font-bold text-gray-800">Connector Bank</h2>
          <span className="text-sm text-gray-500">
            Ejercicio {currentExercise + 1} de {contentData.connectorBank.length}
          </span>
        </div>

        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-indigo-800 mb-1">{exercise.title}</h3>
          <p className="text-sm text-indigo-600">
            Arrastra los conectores correctos a los espacios en blanco
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl mb-6 text-gray-800 leading-relaxed">
          {renderTextWithGaps()}
        </div>

        {!showFeedback && (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Banco de palabras:</h3>
              <div className="flex flex-wrap gap-2">
                {remainingWords.map((word, index) => (
                  <motion.div
                    key={`${word}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(word)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-xl font-semibold cursor-move shadow-md"
                  >
                    {word}
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkAnswer}
              disabled={Object.keys(filledGaps).length !== exercise.connectors.length}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verificar Respuestas
            </motion.button>
          </>
        )}

        {showFeedback && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="grid gap-4">
                {exercise.connectors.map(connector => {
                  const userAnswer = filledGaps[connector.position];
                  const isCorrect = userAnswer === connector.word;

                  return (
                    <div
                      key={connector.id}
                      className={`p-4 rounded-xl border-2 ${
                        isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-800">
                              Respuesta correcta: {connector.word}
                            </span>
                            {!isCorrect && userAnswer && (
                              <span className="text-sm text-red-600">
                                (Tu respuesta: {userAnswer})
                              </span>
                            )}
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-semibold text-blue-700 uppercase">
                                  {connector.type}
                                </span>
                                <p className="text-sm text-gray-600 mt-1">{connector.explanation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentExercise < contentData.connectorBank.length - 1
                  ? 'Siguiente Ejercicio'
                  : 'Finalizar Módulo'}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
