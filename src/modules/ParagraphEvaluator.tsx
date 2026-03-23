import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Lightbulb,
  Star, Zap,
} from 'lucide-react';
import contentData from '../data/content.json';
import { useGamification } from '../hooks/useGamification';
import { getRoundItems, shuffle, ROUND_SIZES } from '../utils/rounds';
import { ExaminerFeedback } from '../components/ExaminerFeedback';
import { PrecisionMeter, PRECISION_DEFAULT_MAX } from '../components/PrecisionMeter';

interface ParagraphEvaluatorProps {
  onBack: () => void;
}

interface StructuredFeedback {
  tier: 'TOP' | 'MID' | 'POOR';
  points?: number;
  label?: string;
  explanation?: string;
  wowEffect?: string[];
  highlights?: string[];
  penalties?: string[];
}

interface Paragraph {
  id: string;
  text: string;
  rank: number;
  feedback: string | StructuredFeedback;
  wowEffect?: string[];
}

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

type ParagraphEx = { id: number; prompt: string; paragraphs: Paragraph[]; strategy?: string };
const PE_POOL = contentData.paragraphEvaluator as ParagraphEx[];
const PE_ROUND_LEN = ROUND_SIZES.exercises;

const PARAGRAPH_CARD_MIN_H = 120;
const LINE_CLAMP = 5;
const PRECISION_PENALTY_XP = 5;

// Normalise word for matching (lowercase, strip trailing punctuation)
const norm = (w: string) => w.toLowerCase().replace(/[.,;:!?)]+$/, '').trim();

export const ParagraphEvaluator = ({ onBack }: ParagraphEvaluatorProps) => {
  const [roundExercises, setRoundExercises] = useState<ParagraphEx[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [items, setItems] = useState<Paragraph[]>([]);
  const [phase, setPhase] = useState<'select' | 'highlight' | 'result'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  const [highlightPhaseDone, setHighlightPhaseDone] = useState(false);
  const [precision, setPrecision] = useState(PRECISION_DEFAULT_MAX);
  const [justRestarted, setJustRestarted] = useState(false);
  const { addXP, subtractXP, markChallengeComplete, isChallengeCompleted } = useGamification();

  const restartCurrentExercise = useCallback(() => {
    if (!currentEx) return;
    subtractXP(PRECISION_PENALTY_XP);
    setItems(shuffle([...(currentEx.paragraphs as Paragraph[])]));
    setPhase('select');
    setSelectedId(null);
    setPrecision(PRECISION_DEFAULT_MAX);
    setHighlightedWords(new Set());
    setHighlightPhaseDone(false);
    setJustRestarted(true);
    setTimeout(() => setJustRestarted(false), 3000);
  }, [currentEx, subtractXP]);

  const startRound = useCallback(() => {
    const exs = getRoundItems(PE_POOL, PE_ROUND_LEN);
    setRoundExercises(exs);
    setCurrentExercise(0);
    setRoundComplete(false);
    setItems(exs.length ? shuffle([...(exs[0].paragraphs as Paragraph[])]) : []);
    setPhase('select');
    setSelectedId(null);
    setHighlightedWords(new Set());
    setHighlightPhaseDone(false);
    setPrecision(PRECISION_DEFAULT_MAX);
    setJustRestarted(false);
  }, []);

  const currentEx = roundExercises[currentExercise];
  const isCompleted = currentEx ? isChallengeCompleted(`paragraph-${currentEx.id}`) : false;
  const selectedParagraph = items.find(p => p.id === selectedId);
  const topParagraph = currentEx?.paragraphs?.find((p: Paragraph) => p.rank === 1) as Paragraph | undefined;
  const selectedRank = selectedParagraph?.rank ?? 0;

  // WowEffect: from paragraph.wowEffect or from (feedback as StructuredFeedback).wowEffect
  const wowEffectList = useMemo(() => {
    if (!topParagraph) return [];
    const list = topParagraph.wowEffect ?? [];
    if (list.length) return list;
    const fb = topParagraph.feedback;
    if (typeof fb === 'object' && fb !== null && 'wowEffect' in fb && Array.isArray((fb as StructuredFeedback).wowEffect))
      return (fb as StructuredFeedback).wowEffect!;
    return [];
  }, [topParagraph]);

  const wowEffectNormalized = useMemo(() => new Set(wowEffectList.map(w => norm(w))), [wowEffectList]);

  const confirmSelection = () => {
    if (!selectedId) return;
    if (selectedRank === 1) {
      setPhase('highlight');
      setHighlightedWords(new Set());
      setHighlightPhaseDone(false);
    } else {
      const newPrecision = Math.max(0, precision - 1);
      setPrecision(newPrecision);
      if (newPrecision <= 0) {
        restartCurrentExercise();
        return;
      }
      setPhase('result');
      if (selectedRank === 2 && !isCompleted) {
        addXP(10);
        markChallengeComplete(`paragraph-${currentEx.id}`);
      }
    }
  };

  const finishHighlightAndGoToResult = () => {
    setHighlightPhaseDone(true);
    setPhase('result');
    if (!isCompleted) {
      addXP(20);
      markChallengeComplete(`paragraph-${currentEx.id}`);
    }
  };

  const toggleWordHighlight = (word: string) => {
    const n = norm(word);
    setHighlightedWords(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else if (next.size < 2) next.add(n);
      return next;
    });
  };

  const correctHighlights = useMemo(() => {
    return [...highlightedWords].filter(w => wowEffectNormalized.has(w)).length;
  }, [highlightedWords, wowEffectNormalized]);
  const canFinishHighlight = wowEffectList.length === 0 ? highlightedWords.size >= 2 : correctHighlights >= 2;

  const nextExercise = () => {
    const next = currentExercise + 1;
    if (next < roundExercises.length) {
      setCurrentExercise(next);
      setItems(shuffle([...(roundExercises[next].paragraphs as Paragraph[])]));
      setPhase('select');
      setSelectedId(null);
      setPrecision(PRECISION_DEFAULT_MAX);
      setHighlightedWords(new Set());
      setHighlightPhaseDone(false);
    } else {
      setRoundComplete(true);
    }
  };

  if (roundExercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Paragraph Evaluator</h2>
          <p className="text-gray-600 mb-8">
            {PE_ROUND_LEN} exercises per round. Choose the paragraph with the best PAU register.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRound}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg">
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
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">
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

  if (!currentEx) return null;

  const promptLabel = (currentEx.prompt || '').replace(/^Write a paragraph about\s+/i, '').replace(/^Topic:\s*/i, '').trim();

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Paragraph Evaluator</h2>
          <span className="text-sm text-gray-500">
            Exercise {currentExercise + 1} of {roundExercises.length}
          </span>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Topic</p>
          <p className="text-gray-700 font-medium">{promptLabel}</p>
        </div>

        {(phase === 'select' || phase === 'highlight') && (
          <div className="mb-4">
            <PrecisionMeter current={precision} max={PRECISION_DEFAULT_MAX} label="Precisión" />
          </div>
        )}

        {justRestarted && (
          <div className="mb-4 p-3 rounded-xl bg-amber-100 border border-amber-400 text-amber-800 text-sm font-medium">
            Ejercicio reiniciado. −{PRECISION_PENALTY_XP} XP por precisión en cero.
          </div>
        )}

        {/* ── Phase: SELECT ───────────────────────────────────────────────── */}
        {phase === 'select' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              The three paragraphs below have the <strong>same visual length</strong>. Choose the one with the <strong>best PAU register</strong> (formal connectors, vocabulary, grammar).
            </p>
            <p className="text-lg font-semibold text-indigo-700 mb-4">Elige el párrafo con mejor registro PAU.</p>

            <div className="space-y-3 mb-6">
              {items.map((paragraph) => {
                const isSelected = selectedId === paragraph.id;
                return (
                  <motion.button
                    key={paragraph.id}
                    type="button"
                    onClick={() => setSelectedId(paragraph.id)}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                        : 'border-gray-200 bg-gray-50/80 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                    style={{ minHeight: PARAGRAPH_CARD_MIN_H }}
                  >
                    <p
                      className="text-gray-700 text-sm leading-relaxed"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: LINE_CLAMP,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: PARAGRAPH_CARD_MIN_H - 32,
                      }}
                    >
                      {paragraph.text}
                    </p>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 mt-2 text-indigo-600 text-sm font-bold">
                        <CheckCircle className="w-4 h-4" /> Selected
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={confirmSelection}
              disabled={!selectedId}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm selection
            </motion.button>
          </>
        )}

        {/* ── Phase: HIGHLIGHT (only if they chose TOP) ─────────────────────── */}
        {phase === 'highlight' && topParagraph && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mb-4">
                <p className="text-lg font-bold text-green-800">Correct. This paragraph has the best PAU register.</p>
                <p className="text-sm text-green-700 mt-1">Now click <strong>2 connectors or key words</strong> that justify its high score.</p>
              </div>

              <div className="bg-white border-2 border-indigo-200 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">Click two words or phrases:</p>
                <div className="flex flex-wrap gap-1.5 leading-relaxed">
                  {topParagraph.text.split(/(\s+)/).map((part, i) => {
                    const isWord = /^\S+$/.test(part) && part.length > 0;
                    const wordNorm = isWord ? norm(part) : '';
                    const isInWow = isWord && wowEffectNormalized.has(wordNorm);
                    const isHighlighted = isWord && highlightedWords.has(wordNorm);
                    if (!isWord) return <span key={i}>{part}</span>;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleWordHighlight(part)}
                        className={`px-1 rounded ${isHighlighted ? 'bg-amber-300 font-bold' : isInWow ? 'hover:bg-amber-100' : 'hover:bg-gray-100'}`}
                      >
                        {part}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Highlighted: {highlightedWords.size} / 2
                {wowEffectList.length > 0 && ` (${correctHighlights} from the WOW list)`}
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={finishHighlightAndGoToResult}
                disabled={!canFinishHighlight}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canFinishHighlight ? 'Continue →' : 'Select 2 words to continue'}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Phase: RESULT ─────────────────────────────────────────────────── */}
        {phase === 'result' && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">

              {selectedRank === 3 && (
                <ExaminerFeedback
                  variant="error"
                  message="Este párrafo es demasiado informal para la PAU."
                  grammaticalRule="En el Writing de la PAU se exige registro formal: evita estructuras coloquiales, 'I think', y vocabulario vago ('good', 'nice', 'things'). Usa conectores avanzados (Furthermore, Notwithstanding) y voz pasiva."
                />
              )}

              {selectedRank === 2 && (
                <ExaminerFeedback
                  variant="error"
                  message="Este párrafo es aceptable pero no el de mejor registro."
                  grammaticalRule="El mejor párrafo usa conectores más avanzados y vocabulario más preciso. Evita repetir 'Also' y 'But'; usa Furthermore, However, Consequently y estructuras formales."
                />
              )}

              {selectedRank === 1 && !highlightPhaseDone && (
                <ExaminerFeedback variant="success" message="Correcto. Este es el párrafo con mejor registro PAU." />
              )}

              {selectedRank === 1 && highlightPhaseDone && (
                <ExaminerFeedback
                  variant="success"
                  message="¡Excelente! Esto te daría el 10 en el Writing."
                  grammaticalRule={undefined}
                />
              )}

              {/* Show TOP paragraph and feedback */}
              {topParagraph && (
                <div className="p-4 rounded-xl border-2 bg-green-50 border-green-300">
                  <div className="flex items-center gap-2 mb-3">
                    <TierBadge tier="TOP" />
                    <span className="text-sm font-semibold text-gray-600">Best register (PAU)</span>
                  </div>
                  <p className="text-gray-700 text-sm italic leading-relaxed mb-3">"{topParagraph.text}"</p>
                  {(() => {
                    const rawFb = topParagraph.feedback;
                    const explanationText = typeof rawFb === 'string' ? rawFb : (rawFb as StructuredFeedback).explanation ?? '';
                    const fb = typeof rawFb === 'object' && rawFb !== null && 'tier' in rawFb ? (rawFb as StructuredFeedback) : null;
                    return (
                      <>
                        <div className="bg-white rounded-lg p-3 mb-2">
                          <p className="text-xs text-gray-600">{explanationText}</p>
                        </div>
                        {(fb?.wowEffect?.length ?? wowEffectList.length) > 0 && (
                          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="w-3 h-3 text-yellow-600" />
                              <span className="text-xs font-bold text-yellow-700">WOW EFFECT:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {(fb?.wowEffect ?? wowEffectList).map((w: string, i: number) => (
                                <span key={i} className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-mono">{w}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {currentEx.strategy && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">PAU strategy</h4>
                      <p className="text-sm text-yellow-700">{currentEx.strategy}</p>
                    </div>
                  </div>
                </div>
              )}

              {(selectedRank === 1 || selectedRank === 2) && (
                <div className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-700 font-bold">
                    +{selectedRank === 1 ? 20 : 10} XP
                  </span>
                </div>
              )}

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
