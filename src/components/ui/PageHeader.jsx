import { ArrowLeft } from 'lucide-react';
import { useGoBack } from '../../utils/navigation.js';

export default function PageHeader({ title, subtitle, back = false, actions, eyebrow }) {
  const goBack = useGoBack('/');
  return (
    <header className="no-print sticky top-0 z-30 -mx-4 px-4 md:-mx-8 md:px-8 pt-[max(env(safe-area-inset-top),0.75rem)] md:pt-6 pb-3 bg-paper/85 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {back && (
          <button
            onClick={goBack}
            className="btn-ghost !p-2 -ml-2"
            aria-label="Volver"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-500">{eyebrow}</p>}
          <h1 className="font-display text-[2rem] leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-ink-400 truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
