import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { InstrumentBadge } from '../ui/Badges.jsx';
import { WEEKDAYS } from '../../utils/dates.js';
import { useStore } from '../../store/StoreContext.jsx';
import { fullName } from '../../utils/selectors.js';

export default function StudentCard({ student, progress, pending, delay = 0 }) {
  const { state } = useStore();
  const showInstrument = student.instrument !== state.settings.subject;
  const slots = (student.schedule || []).map((s) => `${WEEKDAYS[s.weekday - 1].slice(0, 3)} ${s.time}`).join(' · ');
  return (
    <Link to={`/alumnos/${student.id}`} className="card card-hover block p-3.5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3">
        <Avatar student={student} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-800">{fullName(student)}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {showInstrument && <InstrumentBadge instrument={student.instrument} />}
            <span className="text-xs text-ink-400">{student.level}</span>
            {student.group && <span className="chip bg-violet-50 text-violet-700">{student.group}</span>}
          </div>
        </div>
        <ChevronRight size={18} className="text-ink-200" />
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
        <span className="min-w-0 truncate">{slots || 'Sin horario'}</span>
        {pending > 0 && <span className="chip bg-brass-50 text-brass-600">{pending} tareas</span>}
        <div className="ml-auto w-28"><ProgressBar value={progress} size="sm" showLabel /></div>
      </div>
    </Link>
  );
}
