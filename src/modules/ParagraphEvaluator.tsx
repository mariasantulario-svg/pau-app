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
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft, CheckCircle, AlertCircle, Lightbulb,
  Star, Zap, TrendingUp, GripVertical,
} from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';

interface ParagraphEvaluatorProps {
  onBack: () => void;
}

interface StructuredFeedback {
  tier: 'TOP' | 'MID' | 'POOR';
  points: number;
  label: string;
  explanation: string;
  wowEffect: string[];
  highlights: string[];
  penalties: string[];
}

interface Paragraph {
  id: string;
  text: string;
  rank: number;
  feedback: StructuredFeedback;
}

// ── Sortable card ──────────────────────────────────────────────────────────
const SortableCard = ({
  paragraph,
  index,
  isActive,
}: {
  paragraph: Paragraph;
  index: number;
  isActive: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: paragraph.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isActive ? 0.35 : 1,
      }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 p-4 rounded-xl flex items-start gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {index + 1}
      </div>
      <p className="text-gray-700 text-sm flex-1 leading-relaxed">{paragraph.text}</p>
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-indigo-400 hover:text-indigo-600 p-1 touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </div>
    </div>
  );
};

// ── Ghost card shown while dragging ───────────────────────────────────────
const DragCard = ({ paragraph }: { paragraph: Paragraph }) => (
  <div className="bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-500 p-4 rounded-xl flex items-start gap-3 shadow-2xl rotate-1">
    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
      ✦
    </div>
    <p className="text-gray-700 text-sm flex-1 leading-relaxed">{paragraph.text}</p>
    <GripVertical className="w-5 h-5 text-indigo-500" />
  </div>
);

// ── Tier badge ─────────────────────────────────────────────────────────────
const TierBadge = ({ tier }: { tier: 'TOP' | 'MID' | 'POOR' }) => {
  const styles = {
    TOP:  { bg: 'bg-green-100 border-green-400',  text: 'text-green-800',  icon: '🏆' },
    MID:  { bg: 'bg-blue-100 border-blue-400',    text: 'text-blue-800',   icon: '✅' },
    POOR: { bg: 'bg-red-100 border-red-400',      text: 'text-red-800',    icon: '📚' },
  };
  const s = styles[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-bold ${s.bg} ${s.text}`}>
      {s.icon} {tier}
    </span>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
export const ParagraphEvaluator = ({ onBack }: ParagraphEvaluatorProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [items, setItems] = useState<Paragraph[]>(() =>
    [...(contentData.paragraphEvaluator[0].paragraphs as Paragraph[])].sort(() => Math.random() - 0.5)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const { addXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const currentEx = contentData.paragraphEvaluator[currentExercise];
  const isCompleted = isChallengeCompleted(`paragraph-${currentEx.id}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const oldIndex = prev.findIndex(p => p.id === active.id);
      const newIndex = prev.findIndex(p => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const checkAnswer = () => {
    let pts = 0;
    items.forEach((p, index) => { if (p.rank === index + 1) pts += 10; });
    setScore(pts);
    if (pts === 30 && !isCompleted) { addXP(30); markChallengeComplete(`paragraph-${currentEx.id}`); }
    else if (pts > 0 && !isCompleted) addXP(pts);
    setShowFeedback(true);
  };

  const nextExercise = () => {
    const next = currentExercise + 1;
    if (next < contentData.paragraphEvaluator.length) {
      setCurrentExercise(next);
      setItems([...(contentData.paragraphEvaluator[next].paragraphs as Paragraph[])].sort(() => Math.random() - 0.5));
      setShowFeedback(false);
      setScore(0);
      setActiveId(null);
    } else {
      onBack();
    }
  };

  const activeItem = items.find(p => p.id === activeId);
  const allCorrect = score === 30;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">The Paragraph Evaluador</h2>
          <span className="text-sm text-gray-500">
            Ejercicio {currentExercise + 1} de {contentData.paragraphEvaluator.length}
          </span>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <p className="text-gray-700 font-medium">{currentEx.prompt}</p>
        </div>

        {!showFeedback ? (
          <>
            <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Arrastra los párrafos para ordenarlos de{' '}
              <strong className="text-green-600 mx-1">mejor</strong> a{' '}
              <strong className="text-red-500 mx-1">peor</strong> según el criterio PAU
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 mb-6">
                  {items.map((paragraph, index) => (
                    <SortableCard
                      key={paragraph.id}
                      paragraph={paragraph}
                      index={index}
                      isActive={activeId === paragraph.id}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeItem ? <DragCard paragraph={activeItem} /> : null}
              </DragOverlay>
            </DndContext>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkAnswer}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg"
            >
              Confirmar Orden
            </motion.button>
          </>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">

              {/* Score banner */}
              <div className={`p-4 rounded-xl text-center ${
                allCorrect ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400'
                : score > 0  ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400'
                             : 'bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-400'
              }`}>
                <div className="text-3xl font-bold mb-1">
                  {allCorrect ? '🏆 ¡Perfecto!' : score > 0 ? '👍 ¡Casi!' : '📚 Sigue practicando'}
                </div>
                <div className="text-lg font-semibold text-gray-700">{score} / 30 puntos</div>
              </div>

              {/* Feedback por párrafo */}
              {[...(currentEx.paragraphs as Paragraph[])]
                .sort((a, b) => a.rank - b.rank)
                .map((paragraph, index) => {
                  const userRank = items.findIndex(p => p.id === paragraph.id) + 1;
                  const isCorrect = userRank === paragraph.rank;
                  const fb = paragraph.feedback as StructuredFeedback;

                  return (
                    <motion.div
                      key={paragraph.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
                    >
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <TierBadge tier={fb.tier} />
                        <span className="text-sm font-semibold text-gray-600">
                          {['🥇 Posición 1', '🥈 Posición 2', '🥉 Posición 3'][index]}
                        </span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-bold">
                            <CheckCircle className="w-4 h-4" /> Correcto +10 pts
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" /> Tu respuesta: posición {userRank}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-3 italic leading-relaxed">"{paragraph.text}"</p>

                      <div className="bg-white rounded-lg p-3 mb-2">
                        <p className="text-xs text-gray-600">{fb.explanation}</p>
                      </div>

                      {fb.wowEffect?.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs font-bold text-yellow-700">WOW EFFECT detectado:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {fb.wowEffect.map((w, i) => (
                              <span key={i} className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-mono">{w}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {fb.highlights?.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {fb.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-1">
                              <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-green-700">{h}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {fb.penalties?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-xs font-bold text-red-600">Penalizaciones PAU:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {fb.penalties.map((p, i) => (
                              <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">❌ {p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Estrategia PAU:</h4>
                    <p className="text-sm text-yellow-700">{currentEx.strategy}</p>
                  </div>
                </div>
              </div>

              {score > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                  className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3"
                >
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-700 font-bold">+{Math.floor(score / 10)} XP ganados</span>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
              >
                {currentExercise < contentData.paragraphEvaluator.length - 1
                  ? 'Siguiente Ejercicio →'
                  : 'Finalizar Módulo'}
              </motion.button>

            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
