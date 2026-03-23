import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { ArrowLeft, GripVertical, CheckCircle, XCircle, Lightbulb, Zap } from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';
import { getRoundItems, shuffle, ROUND_SIZES } from '../utils/rounds';

// ── Gaps format (new) ──────────────────────────────────────────────────────
interface GapOption {
  id: string;
  text: string;
  correctGap: number; // 0, 1, 2 for gaps; -1 for distractor
}

interface ReconstructorExGaps {
  id: number;
  topic: string;
  parts: string[];
  options: GapOption[];
}

function isGapsExercise(ex: ReconstructorExGaps | unknown): ex is ReconstructorExGaps {
  return typeof ex === 'object' && ex !== null && 'parts' in ex && Array.isArray((ex as ReconstructorExGaps).parts) && 'options' in ex;
}

const TR_POOL = contentData.textReconstructor as ReconstructorExGaps[];
const TR_ROUND_LEN = ROUND_SIZES.exercises;

// ── Draggable option (pool) ─────────────────────────────────────────────────
const DraggableOption = ({
  option,
  isUsed,
  isActive,
}: {
  option: GapOption;
  isUsed: boolean;
  isActive: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: option.id,
    data: { option },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border-2 rounded-xl p-3 text-sm text-gray-700 cursor-grab active:cursor-grabbing
        ${isUsed ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-indigo-200 bg-white shadow-sm'}
        ${isDragging ? 'opacity-90 shadow-lg' : ''}
        ${isActive ? 'opacity-40' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
        <span className="leading-relaxed">{option.text}</span>
      </div>
    </div>
  );
};

// ── Drop zone (gap in text) ─────────────────────────────────────────────────
const GapDropZone = ({
  gapIndex,
  optionId,
  options,
}: {
  gapIndex: number;
  optionId: string | null;
  options: GapOption[];
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `gap-${gapIndex}` });
  const placed = optionId ? options.find(o => o.id === optionId) : null;

  return (
    <span ref={setNodeRef} className="inline-block align-top min-w-[180px]">
      <span
        className={`
          inline-block min-h-[2.5rem] px-3 py-2 rounded-lg border-2 border-dashed
          ${isOver ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-200 bg-indigo-50/50'}
          ${placed ? 'border-solid border-indigo-300 bg-white' : ''}
        `}
      >
        {placed ? (
          <span className="text-gray-700 text-sm leading-relaxed">{placed.text}</span>
        ) : (
          <span className="text-indigo-400 text-sm">Drop sentence here</span>
        )}
      </span>
    </span>
  );
};

// ── Drag overlay (ghost while dragging) ──────────────────────────────────────
const OptionOverlay = ({ option }: { option: GapOption }) => (
  <div className="border-2 border-indigo-400 bg-indigo-50 rounded-xl p-3 text-sm text-gray-700 shadow-2xl rotate-1">
    <div className="flex items-start gap-2">
      <GripVertical className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
      <span className="leading-relaxed">{option.text}</span>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
interface TextReconstructorProps {
  onBack: () => void;
}

export const TextReconstructor = ({ onBack }: TextReconstructorProps) => {
  const [roundExercises, setRoundExercises] = useState<ReconstructorExGaps[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [filledGaps, setFilledGaps] = useState<(string | null)[]>([null, null, null]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { addXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const startRound = useCallback(() => {
    const exs = getRoundItems(TR_POOL, TR_ROUND_LEN).filter(isGapsExercise);
    setRoundExercises(exs);
    setCurrentExercise(0);
    setRoundComplete(false);
    setFilledGaps([null, null, null]);
    setShowFeedback(false);
    setActiveId(null);
  }, []);

  const exercise = roundExercises[currentExercise];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith('gap-')) return;
    const gapIndex = parseInt(overId.replace('gap-', ''), 10);
    if (Number.isNaN(gapIndex) || gapIndex < 0 || gapIndex > 2) return;
    const optionId = active.id as string;
    setFilledGaps(prev => {
      const next = [...prev];
      // Remove this option from any other gap
      for (let i = 0; i < next.length; i++) {
        if (next[i] === optionId) next[i] = null;
      }
      next[gapIndex] = optionId;
      return next;
    });
  };

  const checkAnswer = () => {
    if (!exercise || !exercise.options) return;
    const correct = filledGaps.every((optionId, index) => {
      if (!optionId) return false;
      const opt = exercise.options.find(o => o.id === optionId);
      return opt && opt.correctGap === index;
    });
    if (correct && !isChallengeCompleted(`reconstructor-${exercise.id}`)) {
      addXP(40);
      markChallengeComplete(`reconstructor-${exercise.id}`);
    }
    setShowFeedback(true);
  };

  const nextExercise = () => {
    const next = currentExercise + 1;
    if (next < roundExercises.length) {
      setCurrentExercise(next);
      setFilledGaps([null, null, null]);
      setShowFeedback(false);
      setActiveId(null);
    } else {
      setRoundComplete(true);
    }
  };

  const resetExercise = () => {
    setFilledGaps([null, null, null]);
    setShowFeedback(false);
    setActiveId(null);
  };

  const correctCount = exercise
    ? filledGaps.filter((optionId, index) => {
        if (!optionId) return false;
        const opt = exercise.options.find(o => o.id === optionId);
        return opt && opt.correctGap === index;
      }).length
    : 0;
  const isAllCorrect = correctCount === 3;
  const activeOption = exercise && activeId ? exercise.options.find(o => o.id === activeId) : null;

  if (TR_POOL.length === 0 || TR_POOL.every(ex => !isGapsExercise(ex))) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-600">No gap-fill exercises available.</p>
        </motion.div>
      </div>
    );
  }

  if (roundExercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Text Reconstructor</h2>
          <p className="text-gray-600 mb-8">
            {TR_ROUND_LEN} exercises per round. Drag the missing sentences into the correct gaps.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg">
            Start Round
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Round Complete!</h2>
          <p className="text-gray-600 mb-8">You completed {roundExercises.length} exercises.</p>
          <div className="flex gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">
              Next Round
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

  if (!exercise || !isGapsExercise(exercise)) return null;

  const numGaps = 3;
  const parts = exercise.parts ?? [];
  const options = exercise.options ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Text Reconstructor</h2>
          <span className="text-sm text-gray-500">
            Exercise {currentExercise + 1} of {roundExercises.length}
          </span>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
          <p className="text-gray-700 font-medium">Topic: {exercise.topic}</p>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <GripVertical className="w-4 h-4" />
            Drag the missing sentences into the correct gaps. One option does not fit any gap (distractor).
          </p>
        </div>

        {!showFeedback ? (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="mb-6">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {parts[0]}
                  <GapDropZone
                    gapIndex={0}
                    optionId={filledGaps[0]}
                    options={options}
                  />
                  {parts[1]}
                  <GapDropZone
                    gapIndex={1}
                    optionId={filledGaps[1]}
                    options={options}
                  />
                  {parts[2]}
                  <GapDropZone
                    gapIndex={2}
                    optionId={filledGaps[2]}
                    options={options}
                  />
                  {parts[3]}
                </p>
              </div>

              <p className="text-sm font-medium text-gray-600 mb-2">Sentences to place (one per gap):</p>
              <div className="flex flex-wrap gap-3 mb-6">
                {options.map(opt => (
                  <DraggableOption
                    key={opt.id}
                    option={opt}
                    isUsed={filledGaps.includes(opt.id)}
                    isActive={activeId === opt.id}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeOption ? <OptionOverlay option={activeOption} /> : null}
              </DragOverlay>
            </DndContext>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkAnswer}
                disabled={filledGaps.some(g => g === null)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check answer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetExercise}
                className="px-6 bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold"
              >
                Clear gaps
              </motion.button>
            </div>
          </>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">

              <div className={`p-4 rounded-xl text-center border-2 ${
                isAllCorrect ? 'bg-green-50 border-green-400'
                : correctCount > 0 ? 'bg-blue-50 border-blue-400'
                : 'bg-orange-50 border-orange-400'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {isAllCorrect ? '🏆 Perfect! All three sentences in the right place' : correctCount > 0 ? '👍 Some correct — check which gap fits which sentence' : '📚 Review cohesion: topic sentence, connector, conclusion'}
                </div>
                <div className="text-lg font-semibold text-gray-700">{correctCount} / 3 gaps correct</div>
              </div>

              <div className="space-y-3">
                {[0, 1, 2].map(gapIndex => {
                  const optionId = filledGaps[gapIndex];
                  const opt = optionId ? options.find(o => o.id === optionId) : null;
                  const correctOpt = options.find(o => o.correctGap === gapIndex);
                  const isCorrect = opt && opt.correctGap === gapIndex;

                  return (
                    <motion.div
                      key={gapIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gapIndex * 0.08 }}
                      className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                          Gap {gapIndex + 1}
                        </span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                            <CheckCircle className="w-3 h-3" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <XCircle className="w-3 h-3" />
                            {correctOpt ? `Correct sentence: "${correctOpt.text.slice(0, 50)}…"` : 'Wrong gap'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{opt ? opt.text : '—'}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Cohesion tip</h4>
                    <p className="text-sm text-yellow-700">
                      The first gap usually needs a <strong>topic sentence</strong> or general claim. The middle gap often needs a <strong>connector or transition</strong> (e.g. Furthermore, However). The last gap typically needs a <strong>closing</strong> (e.g. In conclusion, On balance). Avoid placing “Firstly” or “Secondly” without context.
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
                {currentExercise < roundExercises.length - 1 ? 'Next Exercise →' : 'Finish Round'}
              </motion.button>

            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
