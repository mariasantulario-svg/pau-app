import type { FC, ReactNode } from 'react';
import { Tag, Star, Sparkles, Target, Pen } from 'lucide-react';

type BadgeType =
  | 'rephrasing'
  | 'focus'
  | 'style'
  | 'strategy'
  | 'default';

export interface BadgePillProps {
  type?: BadgeType;
  label: string;
  className?: string;
  iconRight?: ReactNode;
}

const typeStyles: Record<BadgeType, { bg: string; text: string; ring: string }> = {
  rephrasing: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    ring: 'ring-purple-200',
  },
  focus: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    ring: 'ring-blue-200',
  },
  style: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    ring: 'ring-pink-200',
  },
  strategy: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
  },
  default: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    ring: 'ring-slate-200',
  },
};

const typeIcon: Record<BadgeType, typeof Tag> = {
  rephrasing: Pen,
  focus: Target,
  style: Sparkles,
  strategy: Star,
  default: Tag,
};

export const BadgePill: FC<BadgePillProps> = ({
  type = 'default',
  label,
  className,
  iconRight,
}) => {
  const Icon = typeIcon[type];
  const styles = typeStyles[type];

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        'shadow-sm backdrop-blur-sm ring-1',
        styles.bg,
        styles.text,
        styles.ring,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
      <span className="truncate">{label}</span>
      {iconRight}
    </span>
  );
};

export default BadgePill;


