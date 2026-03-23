import { motion } from 'framer-motion';

export const PRECISION_DEFAULT_MAX = 10;

interface PrecisionMeterProps {
  /** Current precision (decreases on each error). */
  current: number;
  /** Maximum precision (e.g. 10). */
  max?: number;
  /** Accessible label. */
  label?: string;
  className?: string;
}

export function PrecisionMeter({
  current,
  max = PRECISION_DEFAULT_MAX,
  label = 'Precision',
  className = '',
}: PrecisionMeterProps) {
  const value = Math.max(0, Math.min(current, max));
  const pct = max > 0 ? (value / max) * 100 : 0;
  const isLow = pct <= 30;
  const isZero = value <= 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${
            isZero ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'
          }`}
        >
          {value} / {max}
        </span>
      </div>
      <div
        className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <motion.div
          className={`h-full rounded-full ${
            isZero ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'tween', duration: 0.3 }}
        />
      </div>
    </div>
  );
}
