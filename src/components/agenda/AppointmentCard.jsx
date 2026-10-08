import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardPen, Clock, UserX, Users } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Sheet from '../ui/Sheet.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { ATTENDANCE_STYLE, attended, instrumentStyle } from '../../utils/constants.js';
import { endTime, formatLong, nowMinutes, timeToMinutes, todayISO } from '../../utils/dates.js';
import { fullName } from '../../utils/selectors.js';

/**
 * Cita de la agenda. Individual: al pulsar abre la ficha del alumno.
 * De grupo: abre la lista del grupo, desde donde se va a cada ficha o se registra la clase.
 */
export default function AppointmentCard({ appt, compact = false, delay = 0 }) {
  const navigate = useNavigate();
  const { state } = useStore();
  const [groupOpen, setGroupOpen] = useState(false);
  const subject = state.settings.subject;
  const first = appt.student;
  const st = instrumentStyle(appt.isGroup ? subject : first.instrument);
  const isToday = appt.date === todayISO();
  const start = timeToMinutes(appt.time);
  const now = nowMinutes();
  const live = isToday && now >= start && now < start + appt.duration;
  const past = appt.date < todayISO() || (isToday && now >= start + appt.duration);
  const groupUrl = `/clases/nueva?grupo=${encodeURIComponent(appt.group)}&fecha=${appt.date}&hora=${appt.time}&duracion=${appt.duration}`;
  const singleUrl = `/clases/nueva?alumno=${first.id}&fecha=${appt.date}&hora=${appt.time}&duracion=${appt.duration}`;

  const register = (e) => {
    e.stopPropagation();
    if (appt.isGroup) navigate(groupUrl);
    else if (appt.lesson) navigate(`/clases/${appt.lesson.id}`);
    else navigate(singleUrl);
  };
  const open = () => (appt.isGroup ? setGroupOpen(true) : navigate(`/alumnos/${first.id}`));
  const absent = appt.lesson && !attended(appt.lesson);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => e.key === 'Enter' && open()}
        className={`card card-hover border-l-4 ${st.border} flex items-center gap-3 cursor-pointer animate-fade-up ${compact ? 'p-2.5' : 'p-3.5'} ${past && !live ? 'opacity-80' : ''}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className={`${compact ? 'w-12' : 'w-14'} shrink-0 text-center`}>
          <p className={`font-display ${compact ? 'text-lg' : 'text-xl'} leading-none text-ink-900 tabular-nums`}>{appt.time}</p>
          <p className="mt-1 text-[11px] text-ink-300 tabular-nums">{endTime(appt.time, appt.duration)}</p>
        </div>
        {!compact && (appt.isGroup ? (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600 ring-2 ring-white"><Users size={15} /></div>
        ) : <Avatar student={first} size="sm" />)}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-800">{appt.isGroup ? appt.group : fullName(first)}</p>
          <p className="flex items-center gap-1.5 text-xs text-ink-400 truncate">
            {appt.isGroup ? (
              <>{appt.students.length} alumnos</>
            ) : (
              <>
                {first.instrument !== subject && <><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{first.instrument}<span className="text-ink-200">·</span></>}
                {first.level}
              </>
            )}
            <span className="text-ink-200">·</span>
            <Clock size={12} className="shrink-0" /> {appt.duration} min
          </p>
        </div>
        {live && <span className="chip bg-rose-50 text-rose-600 animate-pulse">En curso</span>}
        {absent ? (
          <button onClick={register} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl" title={appt.lesson.attendance} aria-label={appt.lesson.attendance}>
            <UserX size={20} />
          </button>
        ) : appt.registered ? (
          <button onClick={register} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl" aria-label="Ver clase registrada" title="Clase registrada">
            <CheckCircle2 size={20} />
          </button>
        ) : (
          (past || live) && (
            <button onClick={register} className="p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded-xl" aria-label="Registrar clase" title="Registrar clase">
              <ClipboardPen size={20} />
            </button>
          )
        )}
      </div>

      {appt.isGroup && (
        <Sheet
          open={groupOpen}
          onClose={() => setGroupOpen(false)}
          title={appt.group}
          footer={<Link to={groupUrl} className="btn-primary w-full sm:w-auto"><ClipboardPen size={16} /> {appt.lessons.length ? 'Revisar la clase del grupo' : 'Registrar la clase del grupo'}</Link>}
        >
          <p className="mb-3 text-sm text-ink-400">{formatLong(appt.date)} · {appt.time}–{endTime(appt.time, appt.duration)}</p>
          <ul className="space-y-2">
            {appt.students.map((s) => {
              const lesson = appt.lessons.find((l) => l.studentId === s.id);
              return (
                <li key={s.id}>
                  <Link to={`/alumnos/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-ink-100 p-2.5 hover:bg-ink-50">
                    <Avatar student={s} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink-800">{fullName(s)}</span>
                      <span className="text-xs text-ink-400">{s.instrument}</span>
                    </span>
                    {lesson && <span className={`chip ${ATTENDANCE_STYLE[lesson.attendance || 'Asistió'].chip}`}>{lesson.attendance || 'Asistió'}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </>
  );
}
