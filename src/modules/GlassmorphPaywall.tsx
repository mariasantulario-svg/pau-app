import type { FC, ReactNode, MouseEventHandler } from 'react';
import { Lock } from 'lucide-react';

export interface GlassmorphPaywallProps {
  children: ReactNode;
  onUnlock?: MouseEventHandler<HTMLButtonElement>;
  ctaLabel?: string;
  className?: string;
  title?: string;
}

export const GlassmorphPaywall: FC<GlassmorphPaywallProps> = ({
  children,
  onUnlock,
  ctaLabel = 'Unlock Pro',
  className,
  title,
}) => {
  return (
    <div className={['relative group', className ?? ''].filter(Boolean).join(' ')}>
      <div className="pointer-events-none select-none blur-sm brightness-90">
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 shadow-lg px-6 py-4 max-w-xs text-center">
          <div className="flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-slate-50 mr-2" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wide text-slate-100 uppercase">
              {title ?? 'Pro feature'}
            </span>
          </div>
          <p className="text-sm text-slate-100/90 mb-3">
            This simulator mode is part of the Pro toolkit.
          </p>
          <button
            type="button"
            onClick={onUnlock}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-semibold text-slate-900 bg-slate-50 hover:bg-white shadow-sm transition-colors"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphPaywall;


