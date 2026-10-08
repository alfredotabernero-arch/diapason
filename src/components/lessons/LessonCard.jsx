import { Link } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import { ResultBadge } from '../ui/Badges.jsx';
import { ATTENDANCE_STYLE, attended, instrumentStyle } from '../../utils/constants.js';
import { formatShort, fromISO } from '../../utils/dates.js';
import { fullName } from '../../utils/selectors.js';

export default function LessonCard({ lesson, student, showStudent = true, delay = 0 }) {
  const st = instrumentStyle(student?.instrument);
  const d = fromISO(lesson.date);
  return (
    <Link
      to={`/clases/${lesson.id}`}
      className="card card-hover flex min-w-0 gap-3 p-3.5 animate-fade-up"
      style={{ animationDelay: `${Math.min(delay, 400)}ms` }}
    >
      <div className="w-12 shrink-0 rounded-xl bg-ink-50 py-1.5 text-center">
        <p className="text-[10px] font-semibold uppercase text-ink-400">{d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</p>
        <p className="font-display text-2xl leading-none text-ink-900">{d.getDate()}</p>
        <p className="text-[10px] text-ink-400">{formatShort(lesson.date).split(' ')[1]}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {showStudent && (
            <>
              <span className={`h-2 w-2 shrink-0 rounded-full ${st.dot}`} />
              <p className="min-w-0 truncate font-semibold text-ink-800">{fullName(student)}</p>
            </>
          )}
          <span className={`flex shrink-0 items-center gap-1 text-xs text-ink-400 ${showStudent ? '' : 'font-semibold'}`}>
            <Clock size={12} /> {lesson.time} · {lesson.duration} min
          </span>
          <span className="ml-auto shrink-0">
            {attended(lesson) ? <ResultBadge result={lesson.result} /> : <span className={`chip ${ATTENDANCE_STYLE[lesson.attendance].chip}`}>{lesson.attendance}</span>}
          </span>
        </div>
        {attended(lesson) && <p className="mt-1 text-sm text-ink-600 line-clamp-2">{lesson.work}</p>}
        {lesson.observations && <p className="mt-1 text-xs italic text-ink-400 line-clamp-1">“{lesson.observations}”</p>}
        {lesson.incidents && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
            <AlertTriangle size={12} /> {lesson.incidents}
          </p>
        )}
      </div>
    </Link>
  );
}
