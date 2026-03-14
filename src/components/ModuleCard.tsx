import { motion } from 'framer-motion';
import { Video as LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  completed?: number;
  total?: number;
}

export const ModuleCard = ({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  completed = 0,
  total = 0
}: ModuleCardProps) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-6 rounded-2xl shadow-lg ${color} text-left transition-shadow hover:shadow-xl`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl">
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/90 text-sm mb-3">{description}</p>

          {total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/80">
                <span>{completed} de {total} completados</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};
