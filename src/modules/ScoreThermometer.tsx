import type { FC } from 'react';
import { motion } from 'framer-motion';

export interface ScoreThermometerProps {
  /** Score between 0 and 10 */
  score: number;
  className?: string;
}

const clampScore = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(10, Math.max(0, value));
};

const getColorForScore = (score: number): string => {
  if (score >= 9) return 'from-yellow-300 via-amber-400 to-amber-500'; // gold
  if (score >= 7) return 'from-emerald-300 via-emerald-400 to-emerald-500'; // green
  if (score >= 5) return 'from-amber-300 via-amber-400 to-amber-500'; // amber
  return 'from-rose-400 via-red-500 to-red-600'; // red
};

export const ScoreThermometer: FC<ScoreThermometerProps> = ({ score, className }) => {
  const safeScore = clampScore(score);
  const fillPercent = (safeScore / 10) * 100;
  const gradient = getColorForScore(safeScore);

  return (
    <div className={['flex items-end gap-2', className ?? ''].filter(Boolean).join(' ')}>
      <div className="relative h-24 w-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${fillPercent}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${gradient}`}
        />
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-xs font-semibold text-slate-500">Score</span>
        <span className="text-sm font-bold tabular-nums text-slate-900">
          {safeScore.toFixed(1)} <span className="text-xs text-slate-500">/ 10</span>
        </span>
      </div>
    </div>
  );
};

export default ScoreThermometer;


