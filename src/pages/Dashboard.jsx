import { useEffect, useMemo, useState } from 'react';
import { isNative } from '../utils/platform.js';
import { requestExit } from '../utils/backStack.js';
import { deviceName, toDevice, hasPending, otherKind } from '../utils/paso.js';
import { useEnviarDatos } from '../utils/useTransfer.js';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight, ClipboardPen, Clock, History, ListTodo, LogOut, Music2, Send, Settings, ShieldAlert, Users } from 'lucide-react';
import Logo from '../components/brand/Logo.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import AppointmentCard from '../components/agenda/AppointmentCard.jsx';
import TaskItem from '../components/tasks/TaskItem.jsx';
import TaskFormSheet from '../components/tasks/TaskFormSheet.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { StatusBadge } from '../components/ui/Badges.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { ACTIVE_STATUSES, instrumentStyle, itemTitle } from '../utils/constants.js';
import { daysBetween, endTime, formatLong, nowMinutes, relativeDay, timeToMinutes, todayISO } from '../utils/dates.js';
import { agendaForDate, byId, fullName, nextAppointment, sortTasks } from '../utils/selectors.js';

function greeting() {
  const h = new Date().getHours();
  return h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

function useMinuteTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

export default function Dashboard() {
  useMinuteTick();
  const { state, paso } = useStore();
  const { send, busy: sending } = useEnviarDatos();
  const navigate = useNavigate();
  const [editingTask, setEditingTask] = useState(null);
  const today = todayISO();
  const students = byId(state.students);
  const items = byId(state.items);
  const { subject } = state.settings;
  const lastCopy = [paso.lastSent, paso.lastReceived?.at].filter(Boolean).sort().pop();
  const unsent = !!paso.lastReceived && hasPending(paso); // trabaja con dos dispositivos y hay algo sin pasar

  const todayAppts = agendaForDate(state, today);
  const next = nextAppointment(state, today, nowMinutes());
  const activeObras = state.assignments.filter((a) => ACTIVE_STATUSES.includes(a.status) && items.get(a.itemId)?.type === 'obra');
  const pendingTasks = sortTasks(state.tasks.filter((t) => !t.done));
  const overdue = pendingTasks.filter((t) => t.dueDate && t.dueDate < today).length;
  const firstName = state.settings.teacherName.replace(/^Prof\.?\s*/i, '').split(' ')[0];
  const backupDays = lastCopy ? daysBetween(lastCopy.slice(0, 10), today) : null;

  const showcase = useMemo(
    () => [...activeObras].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 8),
    [activeObras]
  );

  let nextLabel = '';
  if (next) {
    const diff = next.date === today ? timeToMinutes(next.time) - nowMinutes() : null;
    nextLabel = diff === null ? relativeDay(next.date) : diff <= 0 ? 'Ahora' : diff < 60 ? `En ${diff} min` : `Hoy · en ${Math.floor(diff / 60)} h ${diff % 60} min`;
  }
  const nextUrl = next && (next.isGroup
    ? `/clases/nueva?grupo=${encodeURIComponent(next.group)}&fecha=${next.date}&hora=${next.time}&duracion=${next.duration}`
    : `/clases/nueva?alumno=${next.student.id}&fecha=${next.date}&hora=${next.time}&duracion=${next.duration}`);

  return (
    <>
      <header className="pt-[max(env(safe-area-inset-top),1rem)] pb-4 md:pt-8">
        <div className="flex items-end justify-between md:hidden">
          <Link to="/ajustes" className="fork-vibrate-hover block" aria-label="Diapasón · Acerca de">
            <Logo vibrate className="h-[84px] w-auto" />
          </Link>
          <div className="mb-1 flex items-center gap-1">
            <Link to="/ajustes" className="btn-ghost !p-2" aria-label="Ajustes">
              <Settings size={21} />
            </Link>
            {isNative() && (
              <button onClick={requestExit} className="btn-ghost !p-2" aria-label="Salir de Diapasón" title="Salir">
                <LogOut size={21} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 md:mt-0 text-xs font-semibold uppercase tracking-[0.14em] text-brass-500">{formatLong(today)} · {subject}</p>
        <h1 className="font-display text-[1.9rem] md:text-[2.4rem] leading-tight">{greeting()}, {firstName}</h1>
      </header>

      {unsent && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-100/70 px-4 py-2.5 text-sm text-amber-900">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
          <span className="flex-1 font-semibold">Cambios sin enviar {toDevice(otherKind(paso))}</span>
          <button className="btn !py-1.5 !px-3 bg-amber-600 text-white hover:bg-amber-700" onClick={send} disabled={sending}>
            <Send size={15} /> {sending ? 'Preparando…' : 'Enviar'}
          </button>
        </div>
      )}

      {!unsent && (backupDays === null || backupDays > 14) && (
        <Link to="/ajustes#copia" className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 transition">
          <ShieldAlert size={18} className="shrink-0" />
          <span className="flex-1">
            {backupDays === null ? 'Aún no has hecho ninguna copia de seguridad.' : `Tu última copia es de hace ${backupDays} días.`} Pulsa Enviar datos para tener una copia y no perder nada.
          </span>
          <ChevronRight size={16} />
        </Link>
      )}

      <div className="grid gap-x-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {/* Próxima clase */}
          {next ? (
            <section
              className="relative overflow-hidden rounded-3xl bg-ink-800 p-5 text-white shadow-lift cursor-pointer animate-fade-up"
              onClick={() => (next.isGroup ? navigate('/agenda') : navigate(`/alumnos/${next.student.id}`))}
            >
              <Logo variant="mark" tone="mono" className="pointer-events-none absolute -right-2 -top-10 h-64 w-auto text-white/[0.07]" title="" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-300">Próxima clase · {nextLabel}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[2.6rem] leading-none tabular-nums">{next.time}</p>
                  <p className="mt-2 truncate text-lg font-semibold">{next.isGroup ? next.group : fullName(next.student)}</p>
                  <p className="flex items-center gap-1.5 text-sm text-ink-200">
                    {next.isGroup ? (
                      <><Users size={14} /> {next.students.length} alumnos</>
                    ) : (
                      <>
                        <span className={`h-2 w-2 rounded-full ${instrumentStyle(next.student.instrument).dot}`} />
                        {next.student.instrument !== subject ? `${next.student.instrument} · ` : ''}{next.student.level}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right text-sm text-ink-200 shrink-0">
                  <p className="flex items-center justify-end gap-1"><Clock size={14} /> {next.duration} min</p>
                  <p>hasta las {endTime(next.time, next.duration)}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="btn bg-white/10 text-white hover:bg-white/20 !py-2">{next.isGroup ? 'Ver agenda' : 'Ver ficha'} <ChevronRight size={16} /></span>
                <Link onClick={(e) => e.stopPropagation()} to={nextUrl} className="btn bg-brass-300 text-ink-900 hover:bg-brass-200 !py-2">
                  <ClipboardPen size={16} /> Registrar
                </Link>
              </div>
            </section>
          ) : (
            <div className="card p-5"><EmptyState icon={CalendarCheck} title="Sin clases próximas" text="Añade un horario semanal en la ficha de tus alumnos." /></div>
          )}

          {/* Tarjetas resumen */}
          <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard icon={CalendarCheck} label="Clases hoy" value={todayAppts.length} hint={todayAppts.length ? `${todayAppts.reduce((n, a) => n + a.duration, 0)} min de clase` : 'Día libre'} tone="brass" to="/agenda" delay={40} />
            <StatCard icon={Users} label="Alumnos" value={state.students.length} hint={subject} tone="ink" to="/alumnos" delay={80} />
            <StatCard icon={Music2} label="Obras activas" value={activeObras.length} hint="iniciadas, en estudio o consolidadas" tone="violet" to="/repertorio" delay={120} />
            <StatCard icon={ListTodo} label="Tareas pendientes" value={pendingTasks.length} hint={overdue ? `${overdue} vencidas` : 'Al día'} tone={overdue ? 'rose' : 'emerald'} to="/tareas" delay={160} />
          </section>

          {/* Repertorio en marcha */}
          {showcase.length > 0 && (
            <section className="mt-7">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="section-title">Obras en marcha</h2>
                <Link to="/repertorio" className="text-sm font-semibold text-brass-500">Biblioteca</Link>
              </div>
              <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:px-0">
                {showcase.map((a, i) => {
                  const item = items.get(a.itemId);
                  const st = students.get(a.studentId);
                  return (
                    <Link key={a.id} to={`/alumnos/${a.studentId}`} className="card card-hover w-56 shrink-0 snap-start p-4 animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <StatusBadge status={a.status} />
                      <p className="mt-2 font-semibold leading-snug text-ink-800 line-clamp-2 min-h-[2.6rem]">{itemTitle(item)}</p>
                      <p className="text-xs text-ink-400 truncate">{item.composer}</p>
                      <p className="mt-2 truncate text-xs text-ink-500">{fullName(st)}</p>
                      <div className="mt-2"><ProgressBar value={a.progress} status={a.status} showLabel /></div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="min-w-0">
          {/* Clases de hoy */}
          <section className="mt-7 lg:mt-0">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="section-title">Clases de hoy</h2>
              <Link to="/agenda" className="text-sm font-semibold text-brass-500">Agenda</Link>
            </div>
            {todayAppts.length ? (
              <div className="space-y-2">
                {todayAppts.map((a, i) => <AppointmentCard key={a.key} appt={a} delay={i * 40} />)}
              </div>
            ) : (
              <div className="card"><EmptyState icon={CalendarCheck} title="Hoy no tienes clases" text="Aprovecha para preparar material o revisar el repertorio." /></div>
            )}
          </section>

          {/* Tareas */}
          <section className="mt-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="section-title">Tareas para casa</h2>
              <Link to="/tareas" className="text-sm font-semibold text-brass-500">Ver todas</Link>
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map((t, i) => (
                <TaskItem key={t.id} task={t} student={students.get(t.studentId)} item={items.get(t.itemId)} onEdit={setEditingTask} showStudent delay={i * 40} />
              ))}
              {!pendingTasks.length && <div className="card"><EmptyState icon={ListTodo} title="Todo al día" text="No hay tareas pendientes." /></div>}
            </div>
          </section>

          <Link to="/clases" className="card card-hover mt-6 flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brass-50 text-brass-600"><History size={18} /></div>
            <div className="flex-1">
              <p className="font-semibold text-ink-800">Historial de clases</p>
              <p className="text-xs text-ink-400">{state.lessons.length} registros</p>
            </div>
            <ChevronRight size={18} className="text-ink-200" />
          </Link>
        </div>
      </div>

      <TaskFormSheet open={!!editingTask} task={editingTask} onClose={() => setEditingTask(null)} />
    </>
  );
}
