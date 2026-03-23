import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, ChevronUp, CheckCircle,
  AlertTriangle, XCircle, PenLine, BookOpen, Lightbulb
} from 'lucide-react';

interface PAUSimulatorProps {
  onBack: () => void;
}

interface Prompt {
  year: string;
  session: 'Ordinaria' | 'Extraordinaria';
  referenceText: string;
  text: string;
  topic: string;
}

interface TextType {
  id: string;
  label: string;
  pct: string;
  description: string;
  structureHint: string;
  prompts: Prompt[];
}

interface TopicVocab {
  words: { word: string; meaning: string }[];
  connectors: { connector: string; use: string }[];
}

interface CriterionResult {
  band: 'Excellent' | 'Acceptable' | 'Needs work';
  feedback: string;
}

interface EvaluationResult {
  strategic: CriterionResult;
  grammar: CriterionResult;
  coherence: CriterionResult;
  lexis: CriterionResult;
  generalFeedback: string;
  wordPenalty: boolean;
  spellingPenalty: boolean;
}

// ── Real PAU Valencia prompts 2015–2024 (source: Comisión Gestora CV) ────────

const TEXT_TYPES: TextType[] = [
  {
    id: 'opinion',
    label: 'Opinion Essay',
    pct: '~65% of students choose this type',
    description: 'Give and defend your personal view. Structure: intro (state your opinion) → arguments → conclusion.',
    structureHint: 'Intro (state opinion) → Argument 1 → Argument 2 → Counterargument + rebuttal → Conclusion. Never start with "I".',
    prompts: [
      { year: '2024', session: 'Ordinaria', referenceText: 'The Rise of AI in Art', text: 'Is an AI-generated image really a piece of art? Give reasons for your answer.', topic: 'technology' },
      { year: '2023', session: 'Ordinaria', referenceText: 'Hanging out with friends', text: 'Is digital technology making us more lonely even when we are "connected"?', topic: 'technology' },
      { year: '2023', session: 'Extraordinaria', referenceText: 'Young people prescribed surfing', text: 'Should doctors prescribe physical activities instead of medication for mental health issues?', topic: 'health' },
      { year: '2022', session: 'Ordinaria', referenceText: '"Alexa, take me to the moon"', text: 'Is space exploration a priority given the current problems on our planet?', topic: 'space' },
      { year: '2022', session: 'Extraordinaria', referenceText: 'Is that really me? Beauty filters', text: "Do you think social media beauty filters can be dangerous for teenagers' self-esteem?", topic: 'social-media' },
      { year: '2021', session: 'Extraordinaria', referenceText: 'The digital divide in education', text: 'Should the government provide free internet for all students to ensure equality?', topic: 'education' },
      { year: '2020', session: 'Ordinaria', referenceText: 'How to make the world happier', text: "What factors, in your opinion, contribute most to a person's happiness?", topic: 'wellbeing' },
      { year: '2020', session: 'Extraordinaria', referenceText: 'Greta Thunberg: A global mission', text: 'Can teenagers really change the world through activism? Give examples.', topic: 'social-issues' },
      { year: '2015', session: 'Extraordinaria', referenceText: 'Bilingual brains', text: 'Do you think learning a second language gives you a cognitive advantage? Give reasons for your answer.', topic: 'education' },
    ],
  },
  {
    id: 'for-against',
    label: 'For and Against Essay',
    pct: '~25% of students choose this type',
    description: 'Present arguments on both sides without giving your opinion until the conclusion.',
    structureHint: 'Intro (neutral, no opinion) → Arguments for → Arguments against → Conclusion (balanced + brief personal view)',
    prompts: [
      { year: '2024', session: 'Ordinaria', referenceText: 'Fathers, talk to your daughters about money', text: 'Should financial education be a mandatory subject in the school curriculum? Discuss.', topic: 'education' },
      { year: '2021', session: 'Ordinaria', referenceText: 'The true cost of fast fashion', text: 'Is it possible to be fashionable without harming the environment? Discuss.', topic: 'environment' },
      { year: '2018', session: 'Extraordinaria', referenceText: 'Major brands of bottled water contain plastic', text: 'Discuss whether single-use plastics should be banned in favour of public health and the environment.', topic: 'environment' },
      { year: '2016', session: 'Ordinaria', referenceText: 'Why are British kids so unhappy?', text: 'Discuss the advantages and disadvantages of increased screen time for children and teenagers.', topic: 'health' },
    ],
  },
  {
    id: 'discursive',
    label: 'Discursive Essay',
    pct: 'Often combined with opinion in option B',
    description: 'Explore a topic from multiple angles. Discuss causes, effects or perspectives and reach a reasoned conclusion.',
    structureHint: 'Intro (context + question) → Perspective 1 → Perspective 2 → Your balanced view → Conclusion',
    prompts: [
      { year: '2019', session: 'Ordinaria', referenceText: 'Garbage collection in space', text: 'Discuss the environmental and ethical responsibilities involved in managing space debris.', topic: 'space' },
      { year: '2017', session: 'Ordinaria', referenceText: "WhatsApp's blue double tick", text: 'Discuss how instant messaging technology affects personal relationships and privacy.', topic: 'technology' },
    ],
  },
  {
    id: 'narrative',
    label: 'Narrative Essay',
    pct: 'Less than 10% — use with caution',
    description: 'Tell a story, real or imagined. Requires strong command of past tenses (Past Perfect, Past Continuous).',
    structureHint: 'Set the scene → Build up → Climax / turning point → Resolution. Use vivid past tenses throughout.',
    prompts: [
      { year: '2026', session: 'Ordinaria', referenceText: 'New competencial model (CRUE 2025-26)', text: 'You are the editor of a school magazine. Write an article about the benefits of volunteering in your local community. (New competencial format — situational task)', topic: 'social-issues' },
    ],
  },
];

// ── Topic vocabulary (from official B2 wordlists and PAU reports) ────────────

const TOPIC_VOCAB: Record<string, TopicVocab> = {
  technology: {
    words: [
      { word: 'breakthrough', meaning: 'avance tecnológico' },
      { word: 'privacy breach', meaning: 'brecha de privacidad' },
      { word: 'cutting-edge', meaning: 'vanguardista' },
      { word: 'obsolete', meaning: 'obsoleto' },
      { word: 'widespread', meaning: 'generalizado' },
      { word: 'to enhance', meaning: 'mejorar, potenciar' },
      { word: 'to jeopardise', meaning: 'poner en peligro' },
      { word: 'user-friendly', meaning: 'fácil de usar' },
      { word: 'digital literacy', meaning: 'competencia digital' },
      { word: 'screen addiction', meaning: 'adicción a las pantallas' },
    ],
    connectors: [
      { connector: 'It is widely maintained that', use: 'Introduce a widely-held view' },
      { connector: 'Furthermore', use: 'Add a supporting point' },
      { connector: 'However', use: 'Introduce a counterargument' },
      { connector: 'As a result', use: 'Show a direct consequence' },
      { connector: 'Despite the fact that', use: 'Formal concession' },
    ],
  },
  'social-media': {
    words: [
      { word: 'cyberbullying', meaning: 'ciberacoso' },
      { word: 'virtual validation', meaning: 'validación virtual (likes)' },
      { word: 'unrealistic standards', meaning: 'estándares irreales' },
      { word: 'influencer culture', meaning: 'cultura influencer' },
      { word: 'online harassment', meaning: 'acoso en línea' },
      { word: 'social comparison', meaning: 'comparación social' },
      { word: 'media literacy', meaning: 'alfabetización mediática' },
      { word: 'digital anxiety', meaning: 'ansiedad digital' },
    ],
    connectors: [
      { connector: 'On the one hand', use: 'Introduce the first side' },
      { connector: 'On the other hand', use: 'Introduce the opposing view' },
      { connector: 'It cannot be denied that', use: 'Acknowledge a strong argument' },
      { connector: 'Nevertheless', use: 'Concede and then contrast' },
      { connector: 'What is more', use: 'Add an even stronger point' },
    ],
  },
  health: {
    words: [
      { word: 'sedentary lifestyle', meaning: 'estilo de vida sedentario' },
      { word: 'mental wellbeing', meaning: 'bienestar mental' },
      { word: 'obesity epidemic', meaning: 'epidemia de obesidad' },
      { word: 'coping strategies', meaning: 'estrategias de afrontamiento' },
      { word: 'preventive medicine', meaning: 'medicina preventiva' },
      { word: 'sleep deprivation', meaning: 'privación de sueño' },
      { word: 'psychological well-being', meaning: 'bienestar psicológico' },
      { word: 'to jeopardise health', meaning: 'poner en peligro la salud' },
    ],
    connectors: [
      { connector: 'It has been demonstrated that', use: 'Cite evidence formally' },
      { connector: 'Moreover', use: 'Add a stronger point' },
      { connector: 'Although', use: 'Introduce a concession' },
      { connector: 'Consequently', use: 'State a result' },
      { connector: 'Unless', use: 'Negative condition' },
    ],
  },
  environment: {
    words: [
      { word: 'carbon footprint', meaning: 'huella de carbono' },
      { word: 'ecological degradation', meaning: 'degradación ecológica' },
      { word: 'renewable sources', meaning: 'fuentes renovables' },
      { word: 'greenhouse effect', meaning: 'efecto invernadero' },
      { word: 'eco-friendly', meaning: 'ecológico, sostenible' },
      { word: 'to phase out', meaning: 'eliminar gradualmente' },
      { word: 'to mitigate', meaning: 'mitigar' },
      { word: 'to tackle a problem', meaning: 'abordar un problema' },
      { word: 'awareness', meaning: 'concienciación' },
      { word: 'consumption patterns', meaning: 'patrones de consumo' },
    ],
    connectors: [
      { connector: 'It is paramount that', use: 'Urgent obligation' },
      { connector: 'Consequently', use: 'Direct cause-effect' },
      { connector: 'Notwithstanding', use: 'Formal "despite"' },
      { connector: 'Unless', use: 'Negative condition' },
      { connector: 'In the long run', use: 'Long-term consequences' },
    ],
  },
  education: {
    words: [
      { word: 'pedagogical frameworks', meaning: 'marcos pedagógicos' },
      { word: 'achievement gap', meaning: 'brecha de rendimiento' },
      { word: 'lifelong learning', meaning: 'aprendizaje permanente' },
      { word: 'critical thinking', meaning: 'pensamiento crítico' },
      { word: 'vocational training', meaning: 'formación profesional' },
      { word: 'customised curricula', meaning: 'currículos personalizados' },
      { word: 'equal access', meaning: 'acceso igualitario' },
      { word: 'digital divide', meaning: 'brecha digital' },
    ],
    connectors: [
      { connector: 'It is argued that', use: 'Present a view neutrally' },
      { connector: 'In addition', use: 'Add a parallel point' },
      { connector: 'On the other hand', use: 'Opposing view' },
      { connector: 'As a consequence', use: 'State a result' },
      { connector: 'Provided that', use: 'Positive condition' },
    ],
  },
  space: {
    words: [
      { word: 'space debris', meaning: 'basura espacial' },
      { word: 'astronomical research', meaning: 'investigación astronómica' },
      { word: 'space race', meaning: 'carrera espacial' },
      { word: 'finite resources', meaning: 'recursos finitos' },
      { word: 'ethical responsibility', meaning: 'responsabilidad ética' },
      { word: 'groundbreaking discovery', meaning: 'descubrimiento revolucionario' },
      { word: 'to allocate funds', meaning: 'asignar fondos' },
      { word: 'pressing issues', meaning: 'problemas urgentes' },
    ],
    connectors: [
      { connector: 'It is undeniable that', use: 'Acknowledge a strong point' },
      { connector: 'Nevertheless', use: 'Concede and contrast' },
      { connector: 'In contrast', use: 'Sharply contrast two ideas' },
      { connector: 'Given that', use: 'Introduce a premise' },
      { connector: 'Taking everything into account', use: 'Balanced conclusion' },
    ],
  },
  wellbeing: {
    words: [
      { word: 'emotional resilience', meaning: 'resiliencia emocional' },
      { word: 'sense of purpose', meaning: 'sentido de propósito' },
      { word: 'social cohesion', meaning: 'cohesión social' },
      { word: 'meaningful relationships', meaning: 'relaciones significativas' },
      { word: 'work-life balance', meaning: 'equilibrio vida-trabajo' },
      { word: 'self-fulfilment', meaning: 'autorrealización' },
      { word: 'mindfulness', meaning: 'atención plena' },
      { word: 'to foster', meaning: 'fomentar, promover' },
    ],
    connectors: [
      { connector: 'First and foremost', use: 'Introduce the main argument' },
      { connector: 'Furthermore', use: 'Add a supporting point' },
      { connector: 'In my view', use: 'Give your opinion formally' },
      { connector: 'To illustrate this point', use: 'Introduce an example' },
      { connector: 'Taking everything into account', use: 'Balanced conclusion' },
    ],
  },
  'social-issues': {
    words: [
      { word: 'social cohesion', meaning: 'cohesión social' },
      { word: 'cultural diversity', meaning: 'diversidad cultural' },
      { word: 'inequality', meaning: 'desigualdad' },
      { word: 'marginalised communities', meaning: 'comunidades marginadas' },
      { word: 'demographic shift', meaning: 'cambio demográfico' },
      { word: 'social mobility', meaning: 'movilidad social' },
      { word: 'civic engagement', meaning: 'compromiso cívico' },
      { word: 'grass-roots activism', meaning: 'activismo de base' },
    ],
    connectors: [
      { connector: 'It is undeniable that', use: 'Acknowledge a strong point' },
      { connector: 'Nonetheless', use: 'Formal "nevertheless"' },
      { connector: 'What is more', use: 'Add a stronger point' },
      { connector: 'In contrast', use: 'Sharp contrast' },
      { connector: 'Given that', use: 'Introduce a reason' },
    ],
  },
};

const getFallback = (): TopicVocab => ({
  words: [
    { word: 'paramount', meaning: 'de suma importancia' },
    { word: 'detrimental', meaning: 'perjudicial' },
    { word: 'substantial', meaning: 'considerable, importante' },
    { word: 'inevitable', meaning: 'inevitable' },
    { word: 'to address', meaning: 'abordar (un problema)' },
    { word: 'to implement', meaning: 'implementar, poner en práctica' },
  ],
  connectors: [
    { connector: 'Furthermore', use: 'Add a supporting point' },
    { connector: 'Nevertheless', use: 'Concede and contrast' },
    { connector: 'Consequently', use: 'Show a direct result' },
    { connector: 'It is widely maintained that', use: 'Introduce a formal view' },
    { connector: 'In spite of', use: 'Concede before contrasting' },
  ],
});

// ── Rubric — official CV criteria (Comisión Gestora 2025-26) ─────────────────
// Total: 4 pts within writing section → contributes to 3 pts of overall exam

const RUBRIC = [
  {
    id: 'strategic',
    label: 'Aspectos estratégicos',
    maxPts: '0.5 pts',
    levels: [
      { value: 2, band: 'Excellent', color: 'emerald', desc: 'Clear presentation, correct margins and indentation. No spelling errors. Punctuation accurate throughout.' },
      { value: 1, band: 'Acceptable', color: 'yellow', desc: 'Presentation adequate but some spelling or punctuation errors. Layout mostly correct.' },
      { value: 0, band: 'Needs work', color: 'red', desc: 'Poor presentation, frequent spelling/punctuation errors. Text difficult to follow visually.' },
    ],
  },
  {
    id: 'grammar',
    label: 'Corrección gramatical',
    maxPts: '1.5 pts',
    levels: [
      { value: 2, band: 'Excellent', color: 'emerald', desc: 'SVO order correct. Subject-verb agreement accurate. Varied tenses (Perfect, Continuous), modals, passive voice and prepositions used correctly.' },
      { value: 1, band: 'Acceptable', color: 'yellow', desc: 'Generally correct grammar. Some errors in complex structures (tenses, modals) that do not impede understanding.' },
      { value: 0, band: 'Needs work', color: 'red', desc: 'Frequent grammatical errors. Spanglish structures (is important, are agree, discuss about). Basic errors in SVO or agreement.' },
    ],
  },
  {
    id: 'coherence',
    label: 'Claridad y organización',
    maxPts: '1.0 pts',
    levels: [
      { value: 2, band: 'Excellent', color: 'emerald', desc: 'Coherent paragraphs (intro, body, conclusion). Varied, accurate connectors. No repetition of ideas. Originality present.' },
      { value: 1, band: 'Acceptable', color: 'yellow', desc: 'Basic structure present. Limited connector range or some repetition. Ideas are logical but predictable.' },
      { value: 0, band: 'Needs work', color: 'red', desc: 'No clear paragraph structure. Missing connectors or ideas jump without logic. Ideas repeated to reach word count.' },
    ],
  },
  {
    id: 'lexis',
    label: 'Variedad y precisión léxica',
    maxPts: '1.0 pts',
    levels: [
      { value: 2, band: 'Excellent', color: 'emerald', desc: 'Rich, precise B2 vocabulary. No "palabras baúl" (good, bad, thing). Topic-specific terms used accurately. No repetition.' },
      { value: 1, band: 'Acceptable', color: 'yellow', desc: 'Adequate vocabulary. Some attempts at B2 range. Some repetition or reliance on basic words.' },
      { value: 0, band: 'Needs work', color: 'red', desc: 'Very basic vocabulary. Repeated use of "good/bad/important/thing". No topic-specific terms.' },
    ],
  },
];

type BandColor = 'emerald' | 'yellow' | 'red';

const BAND: Record<BandColor, { bg: string; border: string; text: string; icon: JSX.Element }> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-800', icon: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /> },
  yellow:  { bg: 'bg-yellow-50',  border: 'border-yellow-400',  text: 'text-yellow-800',  icon: <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" /> },
  red:     { bg: 'bg-red-50',     border: 'border-red-400',     text: 'text-red-800',     icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> },
};

const countWords = (t: string) => (!t.trim() ? 0 : t.trim().split(/\s+/).filter(Boolean).length);

// ── Component ────────────────────────────────────────────────────────────────

export function PAUSimulator({ onBack }: PAUSimulatorProps) {
  const [openType, setOpenType] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<{ typeId: string; prompt: Prompt } | null>(null);
  const [essayText, setEssayText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  const wordCount = countWords(essayText);
  const wordStatus = !essayText.trim() ? 'empty'
    : wordCount < 120 ? 'critical-under'
    : wordCount < 130 ? 'under'
    : wordCount > 165 ? 'critical-over'
    : wordCount > 150 ? 'over'
    : 'ok';
  const wordPenalty = (wordStatus === 'critical-under' || wordStatus === 'critical-over') ? 10 : 0;

  const canSubmit = essayText.trim().length > 50 && !submitted;

  const vocab = selectedPrompt
    ? (TOPIC_VOCAB[selectedPrompt.prompt.topic] ?? getFallback())
    : getFallback();

  const selectedType = TEXT_TYPES.find(t => t.id === selectedPrompt?.typeId);

  const handleSelectPrompt = (typeId: string, prompt: Prompt) => {
    setSelectedPrompt({ typeId, prompt });
    setEssayText('');
    setEvaluation(null);
    setSubmitted(false);
    setVocabOpen(false);
    setTipOpen(false);
    setTimeout(() => {
      document.getElementById('pau-simulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsEvaluating(true);
    setSubmitted(true);

    const prompt = `You are an expert PAU (Spanish university entrance exam) English examiner for the Comunitat Valenciana.
Evaluate the following student essay strictly according to the official 4-criterion rubric.

ESSAY PROMPT: "${selectedPrompt?.prompt.text}"

STUDENT ESSAY:
${essayText}

WORD COUNT: ${wordCount} words (target: 130-150)

RUBRIC:
1. Aspectos estratégicos (0.5 pts): presentation, spelling, punctuation, legibility
2. Corrección gramatical (1.5 pts): SVO order, subject-verb agreement, tenses, modals, passive voice, prepositions
3. Claridad y organización (1.0 pts): paragraph structure, connectors, coherence, no repetition
4. Variedad y precisión léxica (1.0 pts): B2 vocabulary, no palabras baúl (good/bad/important/thing), topic-specific terms

For each criterion assign: "Excellent", "Acceptable", or "Needs work".
Give 1-2 specific sentences of feedback per criterion referencing the actual essay text.
Also give a short general feedback sentence (1 sentence max).
Set wordPenalty to true if word count is below 120 or above 165.
Set spellingPenalty to true if spelling errors declared is above 2.

Respond ONLY with a JSON object, no markdown, no explanation outside the JSON:
{
  "strategic": { "band": "Excellent|Acceptable|Needs work", "feedback": "..." },
  "grammar": { "band": "Excellent|Acceptable|Needs work", "feedback": "..." },
  "coherence": { "band": "Excellent|Acceptable|Needs work", "feedback": "..." },
  "lexis": { "band": "Excellent|Acceptable|Needs work", "feedback": "..." },
  "generalFeedback": "...",
  "wordPenalty": true|false,
  "spellingPenalty": true|false
}`;

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const result: EvaluationResult = JSON.parse(clean);
      setEvaluation(result);
    } catch (err) {
      console.error('Evaluation error:', err);
      setEvaluation(null);
    } finally {
      setIsEvaluating(false);
      setTimeout(() => {
        document.getElementById('pau-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const wordCountColor = wordStatus === 'ok' ? 'text-emerald-600'
    : wordStatus === 'empty' ? 'text-gray-400'
    : wordStatus === 'critical-under' || wordStatus === 'critical-over' ? 'text-red-600 font-extrabold'
    : 'text-orange-500';

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" /><span>Back</span>
      </button>

      {/* Header */}
      <div className="bg-emerald-600 rounded-2xl p-6 text-white mb-4" style={{ backgroundColor: '#059669' }}>
        <p className="text-white/90 text-xs font-bold uppercase tracking-widest mb-1">PAU Writing Simulator</p>
        <h2 className="text-2xl font-bold">Comunitat Valenciana</h2>
        <p className="text-white/90 text-sm mt-1">
          Real exam prompts 2015-2024 · 130-150 words · 3 pts · EBAU Comunitat Valenciana
        </p>
      </div>

      {/* 10-30-5 tip */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden mb-6">
        <button
          onClick={() => setTipOpen(!tipOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-800">Exam strategy: the 10-30-5 method</span>
          </div>
          {tipOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
        </button>
        <AnimatePresence>
          {tipOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-5 pb-4 border-t border-amber-100 grid grid-cols-3 gap-4 pt-4">
                {[
                  { mins: '10 min', label: 'Brainstorm', desc: 'Write 3-4 B2 keywords and decide which connectors you will use before you write a single sentence.' },
                  { mins: '30 min', label: 'Write', desc: 'Use clear handwriting, respect margins. Short correct sentences beat long error-ridden ones.' },
                  { mins: '5 min', label: 'Review', desc: 'Check 3rd-person -s, spelling of key words, and count: 130-150 words is the target range.' },
                ].map(s => (
                  <div key={s.mins} className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-amber-600">{s.mins}</p>
                    <p className="font-bold text-amber-800 text-sm mb-1">{s.label}</p>
                    <p className="text-xs text-gray-600">{s.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 1 — Prompt selector */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Step 1 — Choose a text type and past exam prompt</h3>
          <p className="text-sm text-gray-500 mt-0.5">Real prompts from the Comunitat Valenciana PAU 2015-2024.</p>
        </div>

        <div className="divide-y divide-gray-100">
          {TEXT_TYPES.map((type) => (
            <div key={type.id}>
              <button
                onClick={() => setOpenType(openType === type.id ? null : type.id)}
                className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                  openType === type.id ? 'bg-emerald-50' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className={`font-bold ${openType === type.id ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {type.label}
                    </p>
                    <span className="text-xs text-gray-400 font-medium">{type.pct}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
                </div>
                <span className="ml-4 flex-shrink-0 text-gray-400">
                  {openType === type.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </span>
              </button>

              <AnimatePresence>
                {openType === type.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide pt-3 mb-3">
                        Past exam prompts — tap to practise
                      </p>
                      {type.prompts.map((p, i) => {
                        const isSelected =
                          selectedPrompt?.typeId === type.id && selectedPrompt?.prompt.text === p.text;
                        return (
                          <button
                            key={i}
                            onClick={() => handleSelectPrompt(type.id, p)}
                            className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-50'
                                : 'border-gray-200 hover:border-emerald-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                  isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {p.year}
                                </span>
                                <span className={`text-xs font-medium ${
                                  p.session === 'Ordinaria' ? 'text-blue-400' : 'text-purple-400'
                                }`}>
                                  {p.session === 'Ordinaria' ? 'Ord.' : 'Extr.'}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 italic mb-0.5">
                                  Text: "{p.referenceText}"
                                </p>
                                <p className={`text-sm leading-relaxed ${
                                  isSelected ? 'text-emerald-800 font-semibold' : 'text-gray-700'
                                }`}>
                                  {p.text}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Steps 2-4: Simulator */}
      <AnimatePresence>
        {selectedPrompt && (
          <motion.div
            id="pau-simulator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Prompt reminder */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex items-start gap-3">
                <PenLine className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-0.5">
                    {selectedType?.label} · PAU Valencia {selectedPrompt.prompt.year} ({selectedPrompt.prompt.session})
                  </p>
                  <p className="text-xs text-gray-400 italic mb-1.5">
                    Reference text: "{selectedPrompt.prompt.referenceText}"
                  </p>
                  <p className="text-gray-800 font-semibold leading-relaxed">{selectedPrompt.prompt.text}</p>
                  {selectedType && (
                    <p className="text-xs text-gray-400 mt-2 italic border-t border-gray-100 pt-2">
                      Structure: {selectedType.structureHint}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Writing + vocabulary */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-5 space-y-4">
                <h3 className="font-bold text-gray-800">Step 2 — Write your essay</h3>
                <textarea
                  value={essayText}
                  onChange={(e) => { setEssayText(e.target.value); setSubmitted(false); }}
                  placeholder="Start writing here. Remember: 130-150 words, clear paragraphs, no Spanglish."
                  disabled={submitted}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-emerald-400 outline-none text-gray-800 text-base leading-relaxed font-sans disabled:bg-gray-50"
                  style={{ minHeight: '420px', height: '420px', resize: 'vertical' }}
                  spellCheck={false}
                />
                <p className="text-xs text-gray-400 mt-1">Press Enter twice to start a new paragraph.</p>

                {/* Word count with zones */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">
                      Zones: &lt;120 ❌ · 120-129 ⚠️ · <span className="text-emerald-600 font-bold">130-150 ✓</span> · 151-165 ⚠️ · &gt;165 ❌
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${wordCountColor}`}>
                      {(wordStatus === 'ok') && <CheckCircle className="w-4 h-4" />}
                      {(wordStatus === 'under' || wordStatus === 'over') && <AlertTriangle className="w-4 h-4" />}
                      {(wordStatus === 'critical-under' || wordStatus === 'critical-over') && <XCircle className="w-4 h-4" />}
                      {wordCount} words
                      {wordStatus === 'critical-under' && ` (${120 - wordCount} below minimum, -10% penalty)`}
                      {wordStatus === 'under' && ` (${130 - wordCount} more to reach target)`}
                      {wordStatus === 'over' && ` (+${wordCount - 150} above target)`}
                      {wordStatus === 'critical-over' && ` (${wordCount - 165} above limit, -10% penalty)`}
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div className="w-[15%] bg-red-300 rounded-l-full" title="<120" />
                    <div className="w-[8%] bg-yellow-300" title="120-129" />
                    <div className="w-[16%] bg-emerald-400" title="130-150 — target" />
                    <div className="w-[12%] bg-yellow-300" title="151-165" />
                    <div className="flex-1 bg-red-300 rounded-r-full" title=">165" />
                  </div>
                </div>
              </div>

              {/* Vocabulary panel */}
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden self-start">
                <button
                  onClick={() => setVocabOpen(!vocabOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-gray-800 text-sm">Vocabulary for this topic</span>
                  </div>
                  {vocabOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                <AnimatePresence>
                  {vocabOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-3 mb-2">B2 Key words</p>
                          <div className="space-y-1.5">
                            {vocab.words.map((w, i) => (
                              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between items-start gap-2">
                                <p className="text-sm font-bold text-emerald-700">{w.word}</p>
                                <p className="text-xs text-gray-400 text-right italic">{w.meaning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Connectors</p>
                          <div className="space-y-1.5">
                            {vocab.connectors.map((c, i) => (
                              <div key={i} className="bg-indigo-50 rounded-lg px-3 py-2">
                                <p className="text-sm font-bold text-indigo-700">{c.connector}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{c.use}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Step 3 — Submit for AI feedback */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h3 className="font-bold text-gray-800 mb-4">Step 3 — Get AI feedback</h3>
              <p className="text-xs text-gray-400 mb-4">
                Claude will evaluate your essay using the official PAU Valencia rubric (Comisión Gestora CV).
              </p>

              {!submitted && (
                <>
                  {essayText.trim().length <= 50 && (
                    <p className="text-sm text-gray-400 mb-3 text-center">Write your essay above before submitting.</p>
                  )}
                  <motion.button
                    whileHover={canSubmit ? { scale: 1.02 } : {}}
                    whileTap={canSubmit ? { scale: 0.98 } : {}}
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                      canSubmit
                        ? 'bg-emerald-600 text-white shadow-lg cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Submit for AI feedback
                  </motion.button>
                </>
              )}
            </div>

            {/* Result */}
            <AnimatePresence>
              {submitted && (
                <motion.div
                  id="pau-result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-5 space-y-4"
                >
                  {isEvaluating ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">The examiner is reading your essay...</p>
                    </div>
                  ) : evaluation ? (
                    <>
                      <h3 className="font-bold text-gray-800 text-lg">AI Examiner Feedback</h3>

                      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 italic border border-gray-200">
                        {evaluation.generalFeedback}
                      </div>

                      {(evaluation.spellingPenalty || evaluation.wordPenalty) ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 space-y-1">
                          {evaluation.wordPenalty && (
                            <p className="font-semibold">Word count: {wordCount} words (target 130-150). A -10% penalty applies.</p>
                          )}
                          {evaluation.spellingPenalty && (
                            <p className="font-semibold">Spelling/punctuation errors detected. Free allowance: 2 errors. Each additional error costs -10%.</p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 font-semibold">
                          No penalties. Word count and spelling within the allowed range.
                        </div>
                      )}

                      <div className="space-y-3">
                        {([
                          { key: 'strategic' as const, label: 'Aspectos estratégicos', maxPts: '0.5 pts' },
                          { key: 'grammar'   as const, label: 'Corrección gramatical', maxPts: '1.5 pts' },
                          { key: 'coherence' as const, label: 'Claridad y organización', maxPts: '1.0 pts' },
                          { key: 'lexis'     as const, label: 'Variedad y precisión léxica', maxPts: '1.0 pts' },
                        ]).map(({ key, label, maxPts }) => {
                          const result = evaluation[key];
                          const color: BandColor = result.band === 'Excellent' ? 'emerald' : result.band === 'Acceptable' ? 'yellow' : 'red';
                          const s = BAND[color];
                          return (
                            <div key={key} className={`rounded-xl border-2 p-4 ${s.bg} ${s.border}`}>
                              <div className="flex items-center gap-2 mb-2">
                                {s.icon}
                                <span className={`font-bold text-sm ${s.text}`}>{label}</span>
                                <span className="text-xs text-gray-400 ml-1">{maxPts}</span>
                                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                                  {result.band}
                                </span>
                              </div>
                              <p className={`text-sm ${s.text}`}>{result.feedback}</p>
                            </div>
                          );
                        })}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setEssayText('');
                          setEvaluation(null);
                          setSubmitted(false);
                          setSelectedPrompt(null);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Practise another prompt
                      </motion.button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-red-600 font-semibold">Something went wrong. Please try again.</p>
                      <button
                        onClick={() => { setSubmitted(false); setEvaluation(null); }}
                        className="mt-3 text-sm underline text-gray-500"
                      >
                        Go back
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PAUSimulator;
