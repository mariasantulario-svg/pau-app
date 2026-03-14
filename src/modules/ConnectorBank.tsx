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
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { addXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const availableWords = [...exercise.connectors.map(c => c.word), ...exercise.distractors]
    .sort(() => Math.random() - 0.5);

  // Tap a word from the bank → select it
  const handleWordTap = (word: string) => {
    if (showFeedback) return;
    setSelectedWord(prev => prev === word ? null : word);
  };

  // Tap a gap → place selected word, or clear if already filled
  const handleGapTap = (position: number) => {
    if (showFeedback) return;

    if (selectedWord) {
      // Place word in gap
      setFilledGaps(prev => ({ ...prev, [position]: selectedWord }));
      setSelectedWord(null);
    } else if (filledGaps[position]) {
      // Remove word from gap back to bank
      const newGaps = { ...filledGaps };
      delete newGaps[position];
      setFilledGaps(newGaps);
    }
  };

  // Tap a filled gap word → remove it
  const removeWord = (position: number) => {
    if (showFeedback) return;
    const newGaps = { ...filledGaps };
    delete newGaps[position];
    setFilledGaps(newGaps);
    setSelectedWord(null);
  };

  const checkAnswer = () => {
    const allCorrect = exercise.connectors.every(
      c => filledGaps[c.position] === c.word
    );
    if (allCorrect && !isChallengeCompleted(`connector-${exercise.id}`)) {
      addXP(35);
      markChallengeComplete(`connector-${exercise.id}`);
    }
    setShowFeedback(true);
  };

  const nextExercise = () => {
    if (currentExercise < contentData.connectorBank.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setFilledGaps({});
      setSelectedWord(null);
      setShowFeedback(false);
    } else {
      onBack();
    }
  };

  const usedWords = Object.values(filledGaps);
  const remainingWords = availableWords.filter(w => !usedWords.includes(w));

  const score = exercise.connectors.filter(c => filledGaps[c.position] === c.word).length;
  const total = exercise.connectors.length;

  const renderTextWithGaps = () => {
    const parts = exercise.text.split(/\{(\d+)\}/);

    return parts.map((part, index) => {
      if (index % 2 === 0) return <span key={index}>{part}</span>;

      const gapPosition = parseInt(part);
      const filledWord = filledGaps[gapPosition];
      const correctConnector = exercise.connectors.find(c => c.position === gapPosition);
      const isCorrect = showFeedback && filledWord === correctConnector?.word;
      const isIncorrect = showFeedback && filledWord && filledWord !== correctConnector?.word;
      const isTargeted = selectedWord && !filledWord;

      return (
        <span key={index} className="inline-block mx-1 my-1">
          {filledWord ? (
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={() => removeWord(gapPosition)}
              disabled={showFeedback}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
                showFeedback
                  ? isCorrect
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                  : 'bg-blue-200 text-blue-800 hover:bg-blue-300 active:scale-95'
              }`}
            >
              {filledWord}
              {!showFeedback && <span className="text-xs opacity-60">✕</span>}
              {showFeedback && isCorrect && <CheckCircle className="w-3 h-3" />}
              {showFeedback && isIncorrect && <XCircle className="w-3 h-3" />}
            </motion.button>
          ) : (
            <motion.button
              animate={isTargeted ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              onClick={() => handleGapTap(gapPosition)}
              className={`inline-block w-32 h-8 border-2 border-dashed rounded-lg transition-all ${
                isTargeted
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-200'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            />
          )}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Connector Bank</h2>
          <span className="text-sm text-gray-500">
            Ejercicio {currentExercise + 1} de {contentData.connectorBank.length}
          </span>
        </div>

        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-indigo-800 mb-1">{exercise.title}</h3>
          <p className="text-sm text-indigo-600">
            {selectedWord
              ? `"${selectedWord}" seleccionado — pulsa un hueco para colocarlo`
              : 'Pulsa una palabra del banco y luego pulsa el hueco donde quieres colocarla'}
          </p>
        </div>

        {/* Texto con huecos */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6 text-gray-800 leading-loose text-base">
          {renderTextWithGaps()}
        </div>

        {/* Banco de palabras */}
        {!showFeedback && (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Banco de palabras:</h3>
              <div className="flex flex-wrap gap-2">
                {remainingWords.map((word, index) => (
                  <motion.button
                    key={`${word}-${index}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleWordTap(word)}
                    className={`px-4 py-2 rounded-xl font-semibold shadow-md transition-all ${
                      selectedWord === word
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white ring-2 ring-orange-400 ring-offset-1 scale-105'
                        : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
                    }`}
                  >
                    {word}
                  </motion.button>
                ))}
              </div>
              {selectedWord && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedWord(null)}
                  className="mt-2 text-sm text-gray-500 underline"
                >
                  Cancelar selección
                </motion.button>
              )}
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

        {/* Feedback */}
        {showFeedback && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Score banner */}
              <div className={`p-4 rounded-xl text-center border-2 ${
                score === total ? 'bg-green-50 border-green-400'
                : score > 0    ? 'bg-blue-50 border-blue-400'
                               : 'bg-orange-50 border-orange-400'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {score === total ? '🏆 ¡Perfecto!' : score > 0 ? '👍 Casi' : '📚 Sigue practicando'}
                </div>
                <div className="text-lg font-semibold text-gray-700">{score} / {total} correctos</div>
              </div>

              {/* Feedback por conector */}
              <div className="grid gap-4">
                {exercise.connectors.map(connector => {
                  const userAnswer = filledGaps[connector.position];
                  const isCorrect = userAnswer === connector.word;

                  return (
                    <div key={connector.id} className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect
                          ? <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                          : <XCircle    className="w-6 h-6 text-red-600 flex-shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-bold text-gray-800">✅ {connector.word}</span>
                            {!isCorrect && userAnswer && (
                              <span className="text-sm text-red-600">(Tu respuesta: {userAnswer})</span>
                            )}
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-semibold text-blue-700 uppercase">{connector.type}</span>
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
                {currentExercise < contentData.connectorBank.length - 1 ? 'Siguiente Ejercicio →' : 'Finalizar Módulo'}
              </motion.button>

            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
