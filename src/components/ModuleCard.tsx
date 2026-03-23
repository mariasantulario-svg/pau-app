import { motion } from 'framer-motion';
import { Video as LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stickyColor?: string;
  textColor?: string;
  rotation?: number;
  decoration?: 'none';
  onClick: () => void;
  completed?: number;
  total?: number;
}

export const ModuleCard = ({
  title,
  description,
  icon: Icon,
  stickyColor = '#fde87c',
  textColor = '#2a1a00',
  rotation = 0,
  decoration = 'none',
  onClick,
  completed = 0,
  total = 0,
}: ModuleCardProps) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const mutedText = '#4b5563';

  return (
    <motion.button
      whileHover={{
        y: -4,
        scale: 1.01,
        transition: { duration: 0.15 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left relative rounded-xl shadow-sm bg-white border border-gray-100"
      style={{
        backgroundColor: stickyColor,
        padding: '20px 22px 18px'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6" style={{ color: textColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold leading-tight mb-1 text-gray-900"
            style={{ fontSize: '1rem', letterSpacing: '0.01em' }}
          >
            {title}
          </h3>
          <p
            className="text-sm leading-snug mb-3"
            style={{ color: mutedText, fontWeight: 400 }}
          >
            {description}
          </p>

          {total > 0 && (
            <div>
              <div
                className="flex justify-between text-xs font-medium mb-1"
                style={{ color: mutedText }}
              >
                <span>{completed} / {total} completed</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-tape">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="progress-tape-fill"
                  style={{ background: 'rgba(0,0,0,0.25)' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};
