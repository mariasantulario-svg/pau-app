import type { FC } from 'react';
import { CheckCircle2, AlertTriangle, ThumbsUp, Skull } from 'lucide-react';
import { motion } from 'framer-motion';

export interface StickerFeedbackProps {
  /** Number of spelling/grammar errors */
  errors: number;
  className?: string;
}

interface StickerConfig {
  label: string;
  tone: 'perfect' | 'good' | 'warning' | 'danger';
}

const getSticker = (errors: number): StickerConfig => {
  if (errors <= 0) return { label: 'Perfect score', tone: 'perfect' };
  if (errors <= 2) return { label: 'Still safe', tone: 'good' };
  if (errors <= 4) return { label: 'Watch out', tone: 'warning' };
  return { label: 'Careful!', tone: 'danger' };
};

const toneStyles: Record<StickerConfig['tone'], { bg: string; text: string; border: string }> = {
  perfect: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-400',
  },
  good: {
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    border: 'border-sky-400',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-400',
  },
  danger: {
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-400',
  },
};

const toneIcon: Record<StickerConfig['tone'], typeof CheckCircle2> = {
  perfect: CheckCircle2,
  good: ThumbsUp,
  warning: AlertTriangle,
  danger: Skull,
};

export const StickerFeedback: FC<StickerFeedbackProps> = ({ errors, className }) => {
  const sticker = getSticker(errors);
  const styles = toneStyles[sticker.tone];
  const Icon = toneIcon[sticker.tone];

  return (
    <motion.div
      initial={{ scale: 0.9, rotate: -2, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={[
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm',
        'bg-white/60 backdrop-blur-sm',
        styles.bg,
        styles.text,
        styles.border,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span>{sticker.label}</span>
    </motion.div>
  );
};

export default StickerFeedback;


