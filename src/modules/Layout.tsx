import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { xp, level, streak, getProgressToNextLevel } = useGamification();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8dcc8' }}>
      {/* Cork board header */}
      <header className="cork-header sticky top-0 z-50 shadow-lg" style={{ borderBottom: '4px solid #a07840' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">

            {/* Logo area — washi tape style */}
            <div className="flex items-center gap-3">
              {/* Decorative pin */}
              <div className="w-5 h-5 rounded-full shadow-md flex-shrink-0"
                style={{ background: 'radial-gradient(circle at 35% 35%, #ff6b6b, #cc2222)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }}
              />
              <div>
                <h1 className="font-handwritten text-2xl font-bold leading-tight"
                  style={{ color: '#2a1a00', textShadow: '1px 1px 0 rgba(255,255,255,0.3)' }}>
                  PAU Writing Master
                </h1>
                <p className="text-xs font-semibold" style={{ color: '#5a3a10', fontFamily: 'Nunito, sans-serif' }}>
                  Visual Strategist
                </p>
              </div>
            </div>

            {/* Stats — look like sticky labels */}
            <div className="flex items-center gap-3">

              {/* Streak */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: -1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-sm shadow-md"
                style={{ background: '#f4a35a', transform: 'rotate(1deg)' }}
              >
                <Flame className="w-4 h-4" style={{ color: '#7a2000' }} />
                <div className="text-center">
                  <div className="font-handwritten font-bold text-lg leading-none" style={{ color: '#2a0a00' }}>{streak}</div>
                  <div className="text-xs font-bold" style={{ color: '#7a2000', fontFamily: 'Nunito' }}>streak</div>
                </div>
              </motion.div>

              {/* Level + XP */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="px-3 py-2 rounded-sm shadow-md min-w-[90px]"
                style={{ background: '#fde87c', transform: 'rotate(-1deg)' }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3" style={{ color: '#7a5500' }} />
                  <span className="font-handwritten font-bold text-base" style={{ color: '#2a1a00' }}>Level {level}</span>
                </div>
                <div className="progress-tape">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressToNextLevel()}%` }}
                    className="progress-tape-fill"
                    style={{ background: '#c8940a' }}
                  />
                </div>
                <div className="font-bold text-xs mt-1 text-center" style={{ color: '#7a5500', fontFamily: 'Nunito' }}>{xp} XP</div>
              </motion.div>

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
