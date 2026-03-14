import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, BookOpen, MapPin } from 'lucide-react';
import contentData from '../data/content.json';

interface PAUSimulatorProps {
  onBack: () => void;
}

export const PAUSimulator = ({ onBack }: PAUSimulatorProps) => {
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof contentData.pauRules.wordLimits>('valencia');
  const [wordCount, setWordCount] = useState(140);
  const [spellingErrors, setSpellingErrors] = useState(0);

  const wordLimit = contentData.pauRules.wordLimits[selectedRegion];
  const isWithinLimit = wordCount >= wordLimit.min && wordCount <= wordLimit.max;
  const wordPenalty = isWithinLimit ? 0 : 10;
  const totalPenalty = wordPenalty + (spellingErrors * 10);
  const finalScore = Math.max(0, 100 - totalPenalty);

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
        className="space-y-6"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            Simulador REGLA DEL 10%
          </h2>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
            <p className="text-orange-800 font-medium">{contentData.pauRules.penaltyRule}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                Comunidad Autónoma:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(contentData.pauRules.wordLimits).map((region) => (
                  <motion.button
                    key={region}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRegion(region as keyof typeof contentData.pauRules.wordLimits)}
                    className={`p-3 rounded-xl font-semibold capitalize transition-all ${
                      selectedRegion === region
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {region}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-semibold mb-2 block">
                Número de palabras: <span className="text-2xl font-bold text-blue-600">{wordCount}</span>
              </label>
              <div className="mb-2">
                <input
                  type="range"
                  min="100"
                  max="200"
                  value={wordCount}
                  onChange={(e) => setWordCount(parseInt(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${
                      isWithinLimit ? '#10b981' : '#ef4444'
                    } 0%, ${
                      isWithinLimit ? '#10b981' : '#ef4444'
                    } ${((wordCount - 100) / 100) * 100}%, #e5e7eb ${((wordCount - 100) / 100) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Mínimo: {wordLimit.min}</span>
                <span className={isWithinLimit ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {isWithinLimit ? '✓ Dentro del límite' : '✗ Fuera del límite'}
                </span>
                <span>Máximo: {wordLimit.max}</span>
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-semibold mb-2 block">
                Errores de ortografía/puntuación: <span className="text-2xl font-bold text-red-600">{spellingErrors}</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={spellingErrors}
                onChange={(e) => setSpellingErrors(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(spellingErrors / 10) * 100}%, #e5e7eb ${(spellingErrors / 10) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>0 errores</span>
                <span>10 errores</span>
              </div>
            </div>

            <motion.div
              key={finalScore}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`p-6 rounded-2xl text-center ${
                finalScore >= 70
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : finalScore >= 50
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-r from-red-400 to-pink-500'
              }`}
            >
              <div className="text-white">
                <div className="text-sm font-semibold mb-2">Puntuación Final Estimada</div>
                <div className="text-6xl font-bold mb-2">{finalScore}%</div>
                <div className="text-sm space-y-1">
                  {wordPenalty > 0 && <div>- {wordPenalty}% por límite de palabras</div>}
                  {spellingErrors > 0 && <div>- {spellingErrors * 10}% por {spellingErrors} error(es)</div>}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            Consejos Específicos PAU 2025-2026
          </h2>

          <div className="space-y-4">
            {contentData.pauRules.tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-lg"
              >
                <p className="text-gray-700">
                  <span className="font-semibold text-blue-700">
                    {tip.split(':')[0]}:
                  </span>
                  {tip.split(':').slice(1).join(':')}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
