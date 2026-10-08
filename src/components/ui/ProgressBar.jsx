import { STATUS_STYLE } from '../../utils/constants.js';

/** Barra de progreso con color por estado (o por porcentaje si no se indica estado) */
export default function ProgressBar({ value = 0, status, size = 'md', showLabel = false }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color =
    STATUS_STYLE[status]?.bar ||
    (v >= 100 ? 'bg-emerald-500' : v >= 75 ? 'bg-violet-400' : v >= 35 ? 'bg-amber-400' : v > 0 ? 'bg-sky-400' : 'bg-slate-300');
  const h = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex-1 ${h} rounded-full bg-ink-100/70 overflow-hidden`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={`${h} ${color} rounded-full transition-[width] duration-700 ease-out`} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-9 text-right text-xs font-semibold tabular-nums text-ink-500">{v}%</span>}
    </div>
  );
}
