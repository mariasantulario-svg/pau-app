import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, GripVertical, CheckCircle } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

interface SortableItemProps {
  id: string;
  text: string;
  type: string;
}

const SortableItem = ({ id, text, type }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getColorByType = (type: string) => {
    if (type.includes('Introduction')) return 'from-blue-100 to-blue-50 border-blue-300';
    if (type.includes('Body')) return 'from-purple-100 to-purple-50 border-purple-300';
    if (type.includes('Conclusion')) return 'from-green-100 to-green-50 border-green-300';
    return 'from-gray-100 to-gray-50 border-gray-300';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`bg-gradient-to-r ${getColorByType(type)} border-2 p-4 rounded-xl mb-3 cursor-move`}
      >
        <div className="flex items-start gap-3">
          <div {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-semibold text-gray-600 mb-1 block">{type}</span>
            <p className="text-gray-700 text-sm">{text}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface TextReconstructorProps {
  onBack: () => void;
}

export const TextReconstructor = ({ onBack }: TextReconstructorProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const exercise = contentData.textReconstructor[currentExercise];

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const [items, setItems] = useState(() => shuffleArray(exercise.blocks));
  const [showFeedback, setShowFeedback] = useState(false);
  const { addXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const checkAnswer = () => {
    const correct = items.every((item, index) => item.correctOrder === index + 1);

    if (correct && !isChallengeCompleted(`reconstructor-${exercise.id}`)) {
      addXP(40);
      markChallengeComplete(`reconstructor-${exercise.id}`);
    }

    setShowFeedback(true);
  };

  const nextExercise = () => {
    if (currentExercise < contentData.textReconstructor.length - 1) {
      const nextEx = contentData.textReconstructor[currentExercise + 1];
      setCurrentExercise(currentExercise + 1);
      setItems(shuffleArray(nextEx.blocks));
      setShowFeedback(false);
    } else {
      onBack();
    }
  };

  const resetExercise = () => {
    setItems(shuffleArray(exercise.blocks));
    setShowFeedback(false);
  };

  const isCorrect = items.every((item, index) => item.correctOrder === index + 1);

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
          <h2 className="text-2xl font-bold text-gray-800">The Text Reconstructor</h2>
          <span className="text-sm text-gray-500">
            Ejercicio {currentExercise + 1} de {contentData.textReconstructor.length}
          </span>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
          <p className="text-gray-700 font-medium">Tema: {exercise.topic}</p>
          <p className="text-sm text-gray-600 mt-1">
            Arrastra los bloques para ordenar el ensayo en la estructura correcta: Intro → Body 1 → Body 2 → Conclusion
          </p>
        </div>

        {!showFeedback ? (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="mb-6">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      text={item.text}
                      type={item.type}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkAnswer}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                Verificar Orden
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetExercise}
                className="px-6 bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold"
              >
                Reiniciar
              </motion.button>
            </div>
          </>
        ) : (
          <div>
            {isCorrect ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h3 className="text-xl font-bold text-green-800">¡Perfecto!</h3>
                </div>
                <p className="text-green-700">
                  Has ordenado correctamente la estructura del ensayo. Sigue esta estructura en tus writings de la PAU.
                </p>
              </motion.div>
            ) : (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-red-800 mb-3">Orden incorrecto</h3>
                <p className="text-red-700 mb-4">Revisa el orden correcto a continuación:</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {exercise.blocks.sort((a, b) => a.correctOrder - b.correctOrder).map((block, index) => {
                const userOrder = items.findIndex(item => item.id === block.id) + 1;
                const correct = userOrder === block.correctOrder;

                return (
                  <div
                    key={block.id}
                    className={`p-4 rounded-xl border-2 ${
                      correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        correct ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-600">{block.type}</span>
                          {!correct && (
                            <span className="text-xs text-red-600">(Tu orden: posición {userOrder})</span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm">{block.text}</p>
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
              {currentExercise < contentData.textReconstructor.length - 1
                ? 'Siguiente Ejercicio'
                : 'Finalizar Módulo'}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
