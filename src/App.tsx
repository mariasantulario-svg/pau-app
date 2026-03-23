import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, Zap, BookOpen, Search, Gauge, Wand2, Layers } from 'lucide-react';
import { Layout } from './components/Layout';
import highlighterImg from './assets/highlighter.png';
import { ModuleCard } from './components/ModuleCard';
import { ConnectorBank } from './modules/ConnectorBank';
import { FlashSynonyms } from './modules/FlashSynonyms';
import { PAUSimulator } from './modules/PAUSimulator';
import { SpotTheSpanglish } from './modules/SpotTheSpanglish';
import { ConnectorSpeedMatch } from './modules/ConnectorSpeedMatch';
import { SentenceBuilder } from './modules/SentenceBuilder';
import contentData from './data/content.json';
import { useGamification } from './hooks/useGamification';

type Module = 'home' | 'connector' | 'flash' | 'simulator' | 'spanglish' | 'speedmatch' | 'builder';

const STICKY = {
  orange: { color: '#f4a35a', text: '#2a0a00' },
  yellow: { color: '#fde87c', text: '#2a1a00' },
  blue:   { color: '#93c5e8', text: '#0a1a2a' },
  green:  { color: '#86d9b0', text: '#0a2a1a' },
  pink:   { color: '#f4a8c4', text: '#2a0a1a' },
  lilac:  { color: '#c4b5f4', text: '#1a0a2a' },
  mint:   { color: '#a8e6cf', text: '#0a2018' },
  peach:  { color: '#ffb997', text: '#2a0a00' },
};

const shuffleArr = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function App() {
  const [activeModule, setActiveModule] = useState<Module>('home');
  const [spanglishRound] = useState(() => shuffleArr(contentData.spotTheSpanglish).slice(0, 10));
  const { completedChallenges } = useGamification();

  const getCompletedCount = (prefix: string) =>
    completedChallenges.filter(id => id.startsWith(prefix)).length;

  if (activeModule === 'connector')
    return <Layout><ConnectorBank onBack={() => setActiveModule('home')} /></Layout>;
  if (activeModule === 'flash')
    return <Layout><FlashSynonyms onBack={() => setActiveModule('home')} /></Layout>;
  if (activeModule === 'simulator')
    return <Layout><PAUSimulator onBack={() => setActiveModule('home')} /></Layout>;
  if (activeModule === 'spanglish')
    return (
      <Layout>
        <SpotTheSpanglish
          onBack={() => setActiveModule('home')}
          exercises={spanglishRound}
        />
      </Layout>
    );
  if (activeModule === 'speedmatch')
    return <Layout><ConnectorSpeedMatch onBack={() => setActiveModule('home')} /></Layout>;
  if (activeModule === 'builder')
    return <Layout><SentenceBuilder onBack={() => setActiveModule('home')} /></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Title — rotulador al lado del título (última versión) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900"
              style={{
                lineHeight: 1.1,
                borderBottom: '6px solid #f4a35a',
                paddingBottom: '4px'
              }}
            >
              PAU Writing Master
            </h1>
            <img
              src={highlighterImg}
              alt=""
              className="h-16 w-auto object-contain flex-shrink-0 md:h-20"
              style={{ maxHeight: '88px', marginLeft: '6px' }}
            />
          </div>

          <p
            className="mt-3 text-base text-gray-600 text-center max-w-xl"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Master PAU writing with visual, interactive practice that feels like working on a real exam paper.
          </p>
        </motion.div>

        {/* Module grid */}
        <div className="grid md:grid-cols-2 gap-7 mb-8">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ModuleCard
              title="Flash Synonyms"
              description="Choose accurate, rich synonyms in 10 seconds"
              icon={Zap}
              stickyColor={STICKY.green.color}
              textColor={STICKY.green.text}
              rotation={1.2}
              decoration="clip-left"
              onClick={() => setActiveModule('flash')}
              completed={getCompletedCount('flash')}
              total={47}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <ModuleCard
              title="Connector Bank"
              description="Practise PAU-style connectors in context"
              icon={LinkIcon}
              stickyColor={STICKY.yellow.color}
              textColor={STICKY.yellow.text}
              rotation={-0.8}
              decoration="washi"
              onClick={() => setActiveModule('connector')}
              completed={getCompletedCount('connector')}
              total={contentData.connectorBank.length}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ModuleCard
              title="Connector Speed Match"
              description="Choose the correct connector against the clock — each round is faster"
              icon={Gauge}
              stickyColor={STICKY.lilac.color}
              textColor={STICKY.lilac.text}
              rotation={0.8}
              decoration="washi"
              onClick={() => setActiveModule('speedmatch')}
              completed={getCompletedCount('speedmatch')}
              total={contentData.connectorSpeedMatch.length}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <ModuleCard
              title="Spot the Spanglish"
              description="Find hidden Spanglish errors before time runs out"
              icon={Search}
              stickyColor={STICKY.pink.color}
              textColor={STICKY.pink.text}
              rotation={-1.2}
              decoration="pin-red"
              onClick={() => setActiveModule('spanglish')}
              completed={getCompletedCount('spanglish')}
              total={contentData.spotTheSpanglish.length}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ModuleCard
              title="Sentence Builder"
              description="Rephrase sentences using passive voice, modals, inversions and more"
              icon={Wand2}
              stickyColor={STICKY.orange.color}
              textColor={STICKY.orange.text}
              rotation={-1.5}
              decoration="clip-left"
              onClick={() => setActiveModule('builder')}
              completed={getCompletedCount('builder')}
              total={contentData.sentenceBuilder.length}
            />
          </motion.div>

        </div>

        {/* PAU Simulator — full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ModuleCard
            title="PAU Exam Writing Simulator"
            description="Valencia Region: Official 2025-2026 Criteria"
            icon={BookOpen}
            stickyColor={STICKY.mint.color}
            textColor={STICKY.mint.text}
            rotation={0.3}
            decoration="clip-left"
            onClick={() => setActiveModule('simulator')}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10 text-sm text-gray-500"
        >
          Your progress is stored in this browser. Come back every day to keep your streak.
        </motion.p>

      </div>
    </Layout>
  );
}

export default App;
