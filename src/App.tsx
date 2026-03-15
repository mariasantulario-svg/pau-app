import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Puzzle, Link as LinkIcon, Zap, BookOpen, Search, Gauge } from 'lucide-react';
import { Layout } from './components/Layout';
import { ModuleCard } from './components/ModuleCard';
import { ParagraphEvaluator } from './modules/ParagraphEvaluator';
import { TextReconstructor } from './modules/TextReconstructor';
import { ConnectorBank } from './modules/ConnectorBank';
import { FlashSynonyms } from './modules/FlashSynonyms';
import { PAUSimulator } from './modules/PAUSimulator';
import { SpotTheSpanglish } from './modules/SpotTheSpanglish';
import { ConnectorSpeedMatch } from './modules/ConnectorSpeedMatch';
import contentData from './data/content.json';
import { useGamification } from './hooks/useGamification';

type Module = 'home' | 'evaluator' | 'reconstructor' | 'connector' | 'flash' | 'simulator' | 'spanglish' | 'speedmatch';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('home');
  const { completedChallenges } = useGamification();

  const getCompletedCount = (prefix: string) =>
    completedChallenges.filter(id => id.startsWith(prefix)).length;

  if (activeModule === 'evaluator')
    return <Layout><ParagraphEvaluator onBack={() => setActiveModule('home')} /></Layout>;
  if (activeModule === 'reconstructor')
    return <Layout><TextReconstructor onBack={() => setActiveModule('home')} /></Layout>;
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
          exercises={contentData.spotTheSpanglish}
        />
      </Layout>
    );
  if (activeModule === 'speedmatch')
    return <Layout><ConnectorSpeedMatch onBack={() => setActiveModule('home')} /></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            PAU Writing Master: Visual Strategist
          </h1>
          <p className="text-xl text-gray-600">
            Domina la escritura de la PAU con estrategias visuales e interactivas
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ModuleCard
            title="The Paragraph Evaluador"
            description="Ordena párrafos de mejor a peor y aprende qué hace un texto B2/C1"
            icon={Target}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            onClick={() => setActiveModule('evaluator')}
            completed={getCompletedCount('paragraph')}
            total={contentData.paragraphEvaluator.length}
          />
          <ModuleCard
            title="The Text Reconstructor"
            description="Reconstruye ensayos arrastrando bloques a su orden lógico"
            icon={Puzzle}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => setActiveModule('reconstructor')}
            completed={getCompletedCount('reconstructor')}
            total={contentData.textReconstructor.length}
          />
          <ModuleCard
            title="Connector Bank"
            description="Practica conectores colocándolos en los espacios correctos"
            icon={LinkIcon}
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            onClick={() => setActiveModule('connector')}
            completed={getCompletedCount('connector')}
            total={contentData.connectorBank.length}
          />
          <ModuleCard
            title="Flash Synonyms"
            description="Desafíos de 10 segundos: elige sinónimos B2+/C1 sofisticados"
            icon={Zap}
            color="bg-gradient-to-br from-yellow-500 to-orange-500"
            onClick={() => setActiveModule('flash')}
          />
          <ModuleCard
            title="Spot the Spanglish"
            description="Encuentra los errores de Spanglish escondidos antes de que se acabe el tiempo"
            icon={Search}
            color="bg-gradient-to-br from-red-500 to-pink-600"
            onClick={() => setActiveModule('spanglish')}
            completed={getCompletedCount('spanglish')}
            total={contentData.spotTheSpanglish.length}
          />
          <ModuleCard
            title="Connector Speed Match"
            description="Elige el conector correcto contra el reloj — cada ronda es más rápida"
            icon={Gauge}
            color="bg-gradient-to-br from-teal-500 to-cyan-600"
            onClick={() => setActiveModule('speedmatch')}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ModuleCard
            title="Simulador PAU & Consejos Regionales"
            description="Simula la Regla del 10% y accede a consejos de Valencia, Murcia y Andalucía"
            icon={BookOpen}
            color="bg-gradient-to-br from-green-500 to-emerald-600"
            onClick={() => setActiveModule('simulator')}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-gray-500 text-sm"
        >
          <p>Datos guardados en tu navegador. ¡Vuelve cada día para mantener tu racha!</p>
        </motion.div>
      </div>
    </Layout>
  );
}

export default App;
