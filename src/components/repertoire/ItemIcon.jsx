import { BookOpen, Dumbbell, Music2, TrendingUp } from 'lucide-react';

const MAP = {
  obra: { icon: Music2, cls: 'bg-ink-800 text-brass-300' },
  estudio: { icon: BookOpen, cls: 'bg-brass-50 text-brass-600' },
  escala: { icon: TrendingUp, cls: 'bg-sky-50 text-sky-600' },
  tecnica: { icon: Dumbbell, cls: 'bg-violet-50 text-violet-600' },
};

export default function ItemIcon({ type, size = 'md' }) {
  const { icon: Icon, cls } = MAP[type] || MAP.obra;
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';
  return (
    <div className={`${box} ${cls} grid shrink-0 place-items-center`}>
      <Icon size={size === 'sm' ? 15 : 18} />
    </div>
  );
}
