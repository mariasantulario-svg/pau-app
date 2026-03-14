import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

interface ParagraphEvaluatorProps {
  onBack: () => void;
}

export const ParagraphEvaluator = ({ onBack }: ParagraphEvaluatorProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [ranking, setRanking] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const { addXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const exercise = contentData.paragraphEvaluator[currentExercise];
  const isCompleted = isChallengeCompleted(`paragraph-${exercise.id}`);

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newRanking = [...ranking];
    const draggedIndex = newRanking.indexOf(draggedItem);
    const targetIndex = newRanking.indexOf(targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newRanking.splice(draggedIndex, 1);
      newRanking.splice(targetIndex, 0, draggedItem);
      setRanking(newRanking);
    }
  };

  const handleDrop = () => {
    setDraggedItem(null);
  };

  const addToRanking = (id: string) => {
    if (!ranking.includes(id)) {
      setRanking([...ranking, id]);
    }
  };

  const removeFromRanking = (id: string) => {
    setRanking(ranking.filter(r => r !== id));
  };

  const checkAnswer = () => {
    const correct = ranking.every((id, index) => {
      const paragraph = exercise.paragraphs.find(p => p.id === id);
      return paragraph && paragraph.rank === index + 1;
    });

    if (correct && !isCompleted) {
      addXP(30);
      markChallengeComplete(`paragraph-${exercise.id}`);
    }

    setShowFeedback(true);
  };

  const nextExercise = () => {
    if (currentExercise < contentData.paragraphEvaluator.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setRanking([]);
      setShowFeedback(false);
    } else {
      onBack();
    }
  };

  const getRankLabel = (index: number) => {
    const labels = ['🥇 Mejor (B2/C1)', '🥈 Intermedio (B1/B2)', '🥉 Básico (A2/B1)'];
    return labels[index];
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
          <h2 className="text-2xl font-bold text-gray-800">The Paragraph Evaluador</h2>
          <span className="text-sm text-gray-500">
            Ejercicio {currentExercise + 1} de {contentData.paragraphEvaluator.length}
          </span>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <p className="text-gray-700 font-medium">{exercise.prompt}</p>
        </div>

        {!showFeedback ? (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                Arrastra los párrafos para ordenarlos de mejor a peor calidad:
              </h3>
              <div className="space-y-3">
                {ranking.map((id, index) => {
                  const paragraph = exercise.paragraphs.find(p => p.id === id);
                  if (!paragraph) return null;

                  return (
                    <motion.div
                      key={id}
                      layout
                      draggable
                      onDragStart={() => handleDragStart(id)}
                      onDragOver={(e) => handleDragOver(e, id)}
                      onDragEnd={handleDrop}
                      className="bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300 p-4 rounded-xl cursor-move"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-green-700 mb-1 block">
                            {getRankLabel(index)}
                          </span>
                          <p className="text-gray-700 text-sm">{paragraph.text}</p>
                        </div>
                        <button
                          onClick={() => removeFromRanking(id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Opciones disponibles:</h3>
              <div className="space-y-3">
                {exercise.paragraphs
                  .filter(p => !ranking.includes(p.id))
                  .map(paragraph => (
                    <motion.div
                      key={paragraph.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => addToRanking(paragraph.id)}
                      className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      <p className="text-gray-700 text-sm">{paragraph.text}</p>
                    </motion.div>
                  ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkAnswer}
              disabled={ranking.length !== 3}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Orden
            </motion.button>
          </>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {exercise.paragraphs
                .sort((a, b) => a.rank - b.rank)
                .map((paragraph, index) => {
                  const userRank = ranking.indexOf(paragraph.id) + 1;
                  const isCorrect = userRank === paragraph.rank;

                  return (
                    <div
                      key={paragraph.id}
                      className={`p-4 rounded-xl border-2 ${
                        isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              Posición correcta: {getRankLabel(index)}
                            </span>
                            {!isCorrect && (
                              <span className="text-sm text-red-600">
                                (Tu respuesta: posición {userRank})
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{paragraph.text}</p>
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600">{paragraph.feedback}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Estrategia PAU:</h4>
                    <p className="text-sm text-yellow-700">{exercise.strategy}</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentExercise < contentData.paragraphEvaluator.length - 1
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
