import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export type ExaminerVariant = 'success' | 'error';

const DEFAULT_SUCCESS = '¡Excelente! Esto te daría el 10 en el Writing.';
const DEFAULT_ERROR = 'En la PAU este tipo de construcción se penaliza.';

interface ExaminerFeedbackProps {
  variant: ExaminerVariant;
  /** Custom message; if not set, uses default for success or error. */
  message?: string;
  /** Brief grammatical rule (for error variant). Shown below the main message. */
  grammaticalRule?: string;
  /** Optional compact layout. */
  compact?: boolean;
  className?: string;
}

export function ExaminerFeedback({
  variant,
  message,
  grammaticalRule,
  compact = false,
  className = '',
}: ExaminerFeedbackProps) {
  const isSuccess = variant === 'success';
  const displayMessage = message ?? (isSuccess ? DEFAULT_SUCCESS : DEFAULT_ERROR);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-xl border-2 p-4 ${
        isSuccess
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-amber-300 bg-amber-50'
      } ${className}`}
    >
      {/* Avatar: examinador serio */}
      <div
        className={`flex-shrink-0 rounded-full flex items-center justify-center ${
          isSuccess ? 'bg-emerald-200' : 'bg-amber-200'
        } ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}
        aria-hidden
      >
        <GraduationCap
          className={isSuccess ? 'text-emerald-700' : 'text-amber-800'}
          size={compact ? 20 : 24}
          strokeWidth={2.2}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold ${
            isSuccess ? 'text-emerald-800' : 'text-amber-900'
          } ${compact ? 'text-sm' : 'text-base'}`}
        >
          {displayMessage}
        </p>
        {!isSuccess && grammaticalRule && (
          <p className="mt-1.5 text-sm text-amber-800/90 leading-snug">
            {grammaticalRule}
          </p>
        )}
      </div>
    </motion.div>
  );
}
