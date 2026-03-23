import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import highlighterImg from '../assets/highlighter.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { xp, level, streak, getProgressToNextLevel } = useGamification();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-semibold tracking-wide text-gray-900">
                PAU Writing Master
              </h1>
              <span className="text-xs text-gray-500">Visual strategist</span>
            </div>
            <img
              src={highlighterImg}
              alt=""
              className="h-10 w-auto object-contain flex-shrink-0"
              style={{ maxHeight: '44px', marginLeft: '4px' }}
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>{streak} day streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>Level {level}</span>
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressToNextLevel()}%` }}
                  className="h-full bg-yellow-500"
                />
              </div>
              <span>{xp} XP</span>
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
