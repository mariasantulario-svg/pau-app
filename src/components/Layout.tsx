import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { xp, level, streak, getProgressToNextLevel } = useGamification();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" fill="white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PAU Writing Master
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-2xl"
              >
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-600">{streak}</span>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-2xl"
              >
                <Trophy className="w-5 h-5 text-yellow-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Nivel {level}</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressToNextLevel()}%` }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    />
                  </div>
                </div>
              </motion.div>

              <div className="bg-blue-100 px-4 py-2 rounded-2xl">
                <span className="font-bold text-blue-600">{xp} XP</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
