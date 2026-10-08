import { Link } from 'react-router-dom';

const TONES = {
  ink: 'bg-ink-50 text-ink-600',
  brass: 'bg-brass-50 text-brass-600',
  rose: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'ink', to, delay = 0 }) {
  const body = (
    <div className="card card-hover p-4 h-full animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${TONES[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="font-display text-[2rem] leading-none text-ink-900 tabular-nums">{value}</p>
      <p className="mt-1.5 text-sm font-medium text-ink-600">{label}</p>
      {hint && <p className="text-xs text-ink-300 mt-0.5">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}
