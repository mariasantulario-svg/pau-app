import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, GripVertical, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

interface Block {
  id: string;
  type: string;
  text: string;
  correctOrder: number;
}

// ── Sortable item — NO type label shown during exercise ────────────────────
const SortableItem = ({ block, index, isActive }: { block: Block; index: number; isActive: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isActive ? 0.35 : 1 }}
      className="bg-white border-2 border-indigo-200 p-4 rounded-xl flex items-start gap-3 shadow-sm"
    >
      <div className="flex-shrink-0 w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
        {index + 1}
      </div>
      <p className="text-gray-700 text-sm flex-1 leading-relaxed">{block.text}</p>
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-indigo-300 hover:text-indigo-500 p-1 touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </div>
    </div>
  );
};

// ── Ghost card while dragging ──────────────────────────────────────────────
const DragCard = ({ block }: { block: Block }) => (
  <div className="bg-indigo-50 border-2 border-indigo-400 p-4 rounded-xl flex items-start gap-3 shadow-2xl rotate-1">
    <div className="flex-shrink-0 w-7 h-7 bg-indigo-400 text-white rounded-full flex items-center justify-center font-bold text-sm">✦</div>
    <p className="text-gray-700 text-sm flex-1 leading-relaxed">{block.text}</p>
    <GripVertical className="w-5 h-5 text-indigo-400" />
  </div>
);

// ── Feedback card — type label revealed here ───────────────────────────────
const getTypeStyle = (type: string) => {
  if (type.includes('Introduction')) return { bg: 'bg-blue-50 border-blue-300',   badge: 'bg-blue-100 text-blue-700' };
  if (type.includes('Body'))         return { bg: 'bg-purple-50 border-purple-300', badge: 'bg-purple-100 text-purple-700' };
  if (type.includes('Conclusion'))   return { bg: 'bg-green-50 border-green-300',  badge: 'bg-green-100 text-green-700' };
  return { bg: 'bg-gray-50 border-gray-300', badge: 'bg-gray-100 text-gray-700' };
};

// ── Main component ─────────────────────────────────────────────────────────
interface TextReconstructorProps {
  onBack: () => void;
}

export const TextReconstructor = ({ onBack }: TextReconstructorProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const exercise = contentData.textReconstructor[currentExercise];

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const [items, setItems] = useState<Block[]>(() => shuffle(exercise.blocks as Block[]));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { addXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const oldIndex = prev.findIndex(i => i.id === active.id);
      const newIndex = prev.findIndex(i => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
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
    const next = currentExercise + 1;
    if (next < contentData.textReconstructor.length) {
      setCurrentExercise(next);
      setItems(shuffle(contentData.textReconstructor[next].blocks as Block[]));
      setShowFeedback(false);
      setActiveId(null);
    } else {
      onBack();
    }
  };

  const resetExercise = () => {
    setItems(shuffle(exercise.blocks as Block[]));
    setShowFeedback(false);
    setActiveId(null);
  };

  const activeItem = items.find(i => i.id === activeId);
  const isAllCorrect = items.every((item, index) => item.correctOrder === index + 1);
  const correctCount = items.filter((item, index) => item.correctOrder === index + 1).length;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">The Text Reconstructor</h2>
          <span className="text-sm text-gray-500">
            Ejercicio {currentExercise + 1} de {contentData.textReconstructor.length}
          </span>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
          <p className="text-gray-700 font-medium">Tema: {exercise.topic}</p>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <GripVertical className="w-4 h-4" />
            Arrastra los bloques para construir un ensayo PAU bien estructurado
          </p>
        </div>

        {!showFeedback ? (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 mb-6">
                  {items.map((block, index) => (
                    <SortableItem
                      key={block.id}
                      block={block}
                      index={index}
                      isActive={activeId === block.id}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeItem ? <DragCard block={activeItem} /> : null}
              </DragOverlay>
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
                🔀 Reiniciar
              </motion.button>
            </div>
          </>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">

              {/* Score banner */}
              <div className={`p-4 rounded-xl text-center border-2 ${
                isAllCorrect ? 'bg-green-50 border-green-400'
                : correctCount > 0 ? 'bg-blue-50 border-blue-400'
                : 'bg-orange-50 border-orange-400'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {isAllCorrect ? '🏆 ¡Perfecto! Estructura correcta' : correctCount > 0 ? '👍 Casi — revisa el orden' : '📚 Revisa la estructura PAU'}
                </div>
                <div className="text-lg font-semibold text-gray-700">{correctCount} / {items.length} bloques en posición correcta</div>
              </div>

              {/* Bloques ordenados correctamente — ahora SÍ se muestran las etiquetas */}
              <div className="space-y-3">
                {[...(exercise.blocks as Block[])]
                  .sort((a, b) => a.correctOrder - b.correctOrder)
                  .map((block, index) => {
                    const userOrder = items.findIndex(i => i.id === block.id) + 1;
                    const isCorrect = userOrder === block.correctOrder;
                    const style = getTypeStyle(block.type);

                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`p-4 rounded-xl border-2 ${style.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {/* Type label — only revealed in feedback */}
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                                {block.type}
                              </span>
                              {isCorrect ? (
                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                  <CheckCircle className="w-3 h-3" /> Correcto
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600 text-xs">
                                  <XCircle className="w-3 h-3" /> Tu orden: posición {userOrder}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{block.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>

              {/* Tip pedagógico */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Estructura PAU:</h4>
                    <p className="text-sm text-yellow-700">
                      Todo writing PAU sigue: <strong>Introducción</strong> (gancho + tesis) → <strong>Desarrollo 1</strong> → <strong>Desarrollo 2</strong> → <strong>Conclusión</strong> (resumen + opinión si procede).
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentExercise < contentData.textReconstructor.length - 1 ? 'Siguiente Ejercicio →' : 'Finalizar Módulo'}
              </motion.button>

            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
