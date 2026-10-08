import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BookOpen, CalendarClock, ClipboardPen, Clock, FolderOpen, Mail, Music2, Pencil, Phone, Plus,
  StickyNote, Trash2, Trophy, History, ListTodo,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/ui/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { InstrumentBadge } from '../components/ui/Badges.jsx';
import { ConfirmDialog } from '../components/ui/Sheet.jsx';
import AssignmentCard from '../components/repertoire/AssignmentCard.jsx';
import AssignmentSheet from '../components/repertoire/AssignmentSheet.jsx';
import AssignSheet from '../components/repertoire/AssignSheet.jsx';
import TaskItem from '../components/tasks/TaskItem.jsx';
import TaskFormSheet from '../components/tasks/TaskFormSheet.jsx';
import LessonCard from '../components/lessons/LessonCard.jsx';
import GradesCard from '../components/grades/GradesCard.jsx';
import MaterialList from '../components/materials/MaterialList.jsx';
import MaterialFormSheet from '../components/materials/MaterialFormSheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { REPERTOIRE_TYPES, STATUSES, STATUS_STYLE } from '../utils/constants.js';
import { WEEKDAYS, endTime, formatFull, formatHours, formatShort } from '../utils/dates.js';
import { byId, fullName, sortTasks, studentAssignments, studentMonthlyResults, studentStats } from '../utils/selectors.js';

const TABS = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'repertorio', label: 'Repertorio' },
  { value: 'tareas', label: 'Tareas' },
  { value: 'historial', label: 'Historial' },
  { value: 'material', label: 'Material' },
  { value: 'notas', label: 'Notas' },
];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'resumen';
  const { state, actions } = useStore();
  const student = state.students.find((s) => s.id === id);
  const [confirm, setConfirm] = useState(false);

  if (!student) {
    return (
      <>
        <PageHeader back title="Alumno" />
        <EmptyState title="Alumno no encontrado" action={<Link to="/alumnos" className="btn-primary">Volver a alumnos</Link>} />
      </>
    );
  }

  const stats = studentStats(state, student.id);
  const pendingCount = stats.tareasPendientes;

  return (
    <>
      <PageHeader
        back
        title={student.firstName}
        actions={
          <>
            <Link to={`/alumnos/${id}/editar`} className="btn-ghost !p-2" aria-label="Editar"><Pencil size={19} /></Link>
            <button onClick={() => setConfirm(true)} className="btn-ghost !p-2 hover:!text-rose-600" aria-label="Eliminar"><Trash2 size={19} /></button>
          </>
        }
      />

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <aside className="space-y-5 lg:sticky lg:top-24">
      {/* Cabecera */}
      <section className="card p-4 animate-fade-up">
        <div className="flex items-center gap-4">
          <Avatar student={student} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl leading-tight">{fullName(student)}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {student.instrument !== state.settings.subject && <InstrumentBadge instrument={student.instrument} />}
              <span className="chip bg-ink-50 text-ink-600">{student.level}</span>
              {student.group && <span className="chip bg-violet-50 text-violet-700">{student.group}</span>}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <a href={student.phone ? `tel:${student.phone.replace(/\s/g, '')}` : undefined} className={`btn-secondary !px-2 ${!student.phone ? 'pointer-events-none opacity-40' : ''}`}><Phone size={16} /> Llamar</a>
          <a href={student.email ? `mailto:${student.email}` : undefined} className={`btn-secondary !px-2 ${!student.email ? 'pointer-events-none opacity-40' : ''}`}><Mail size={16} /> Email</a>
          <Link to={`/clases/nueva?alumno=${student.id}`} className="btn-primary !px-2"><ClipboardPen size={16} /> Clase</Link>
        </div>
      </section>
      <div className="hidden space-y-5 lg:block">
        <GradesCard student={student} />
        <PersonalData student={student} />
      </div>
      </aside>

      <div className="min-w-0">
      <div className="sticky top-[4.6rem] z-20 -mx-4 mt-4 bg-paper/85 px-4 py-2 backdrop-blur-md md:top-[5.4rem] md:mx-0 md:px-0 lg:mt-0">
        <Segmented
          options={TABS.map((t) => (t.value === 'tareas' && pendingCount ? { ...t, count: pendingCount } : t))}
          value={tab}
          onChange={(v) => setParams({ tab: v }, { replace: true })}
        />
      </div>

      <div key={tab} className="mt-3 animate-fade-up">
        {tab === 'resumen' && <SummaryTab student={student} stats={stats} onTab={(v) => setParams({ tab: v }, { replace: true })} />}
        {tab === 'repertorio' && <RepertoireTab student={student} />}
        {tab === 'tareas' && <TasksTab student={student} />}
        {tab === 'historial' && <HistoryTab student={student} />}
        {tab === 'material' && <MaterialTab student={student} />}
        {tab === 'notas' && <NotesTab student={student} />}
      </div>
      </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Eliminar alumno"
        message={`Se eliminarán ${fullName(student)} y todo su historial, tareas, notas y asignaciones. Esta acción no se puede deshacer.`}
        onConfirm={() => {
          actions.deleteStudent(student.id);
          actions.notify('Alumno eliminado');
          navigate('/alumnos', { replace: true });
        }}
      />
    </>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-400">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}><Icon size={14} /></span>
        {label}
      </div>
      <p className="mt-2 font-display text-3xl leading-none tabular-nums text-ink-900">{value}</p>
    </div>
  );
}

function SummaryTab({ student, stats, onTab }) {
  const { state } = useStore();
  const [editing, setEditing] = useState(null);
  const items = byId(state.items);
  const assignments = studentAssignments(state, student.id, items);
  const active = assignments.filter((a) => a.status !== 'Pendiente' && a.status !== 'Terminada').sort((a, b) => b.progress - a.progress);
  const tasks = sortTasks(state.tasks.filter((t) => t.studentId === student.id && !t.done)).slice(0, 3);
  const monthly = studentMonthlyResults(state, student.id);
  const byStatus = STATUSES.map((s) => ({ s, n: assignments.filter((a) => a.status === s).length }));

  return (
    <div className="space-y-5">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-2.5">
        <MiniStat icon={Trophy} label="Obras terminadas" value={stats.obrasTerminadas} tone="bg-emerald-50 text-emerald-600" />
        <MiniStat icon={Music2} label="Obras activas" value={stats.obrasActivas} tone="bg-violet-50 text-violet-600" />
        <MiniStat icon={BookOpen} label="Estudios activos" value={stats.estudiosActivos} tone="bg-brass-50 text-brass-600" />
        <MiniStat icon={Clock} label="Horas estimadas" value={formatHours(stats.horasEstimadas).replace(' h', '')} tone="bg-sky-50 text-sky-600" />
      </div>
      <p className="-mt-3 text-xs text-ink-300">
        Horas estimadas = {formatHours(stats.horasClase)} de clase ({stats.clases} clases) + estudio en casa estimado (2 h por semana con clase).
      </p>

      {/* Distribución por estado */}
      {assignments.length > 0 && (
        <section className="card p-4">
          <h3 className="font-display text-xl">Progreso del repertorio</h3>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full gap-[2px]">
            {byStatus.filter((x) => x.n).map(({ s, n }) => (
              <div key={s} className={`${STATUS_STYLE[s].bar} transition-all duration-700`} style={{ width: `${(n / assignments.length) * 100}%` }} title={`${s}: ${n}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">
            {byStatus.map(({ s, n }) => (
              <span key={s} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${STATUS_STYLE[s].bar}`} />{s} <b className="tabular-nums">{n}</b></span>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {active.slice(0, 4).map((a) => <AssignmentCard key={a.id} assignment={a} onClick={() => setEditing(a)} />)}
          </div>
          {active.length > 4 && (
            <button onClick={() => onTab('repertorio')} className="mt-2 text-sm font-semibold text-brass-500">Ver todo el repertorio ({assignments.length})</button>
          )}
        </section>
      )}

      {/* Evolución */}
      <section className="card p-4">
        <h3 className="font-display text-xl">Evolución en clase</h3>
        <p className="text-xs text-ink-400">Valoración media mensual (1 = mejorable · 5 = excelente)</p>
        <div className="mt-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E3E7F0" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6E7EA3' }} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9DA9C4' }} />
              <Tooltip
                cursor={{ fill: 'rgba(45,56,83,0.05)' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #E3E7F0', fontSize: 12 }}
                formatter={(v, _n, p) => [v ? `${v} / 5 · ${p.payload.clases} clases` : 'Sin clases', 'Media']}
              />
              <Bar dataKey="media" fill="#4D5D84" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Próximas tareas */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="section-title">Próximas tareas</h3>
          <button onClick={() => onTab('tareas')} className="text-sm font-semibold text-brass-500">Todas</button>
        </div>
        <div className="space-y-2">
          {tasks.map((t) => <TaskItem key={t.id} task={t} item={items.get(t.itemId)} />)}
          {!tasks.length && <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-3 text-sm text-ink-300">Sin tareas pendientes</p>}
        </div>
      </section>

      <div className="space-y-5 lg:hidden">
        <GradesCard student={student} />
        <PersonalData student={student} />
      </div>

      <AssignmentSheet assignment={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function RepertoireTab({ student }) {
  const { state } = useStore();
  const [editing, setEditing] = useState(null);
  const [assignType, setAssignType] = useState(null);
  const assignments = studentAssignments(state, student.id);
  const order = { 'En estudio': 0, Iniciada: 1, Consolidada: 2, Pendiente: 3, Terminada: 4 };

  return (
    <div className="space-y-6">
      {Object.entries(REPERTOIRE_TYPES).map(([type, t]) => {
        const list = assignments.filter((a) => a.item.type === type).sort((a, b) => order[a.status] - order[b.status]);
        return (
          <section key={type}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="section-title">{type === 'tecnica' ? 'Ejercicios técnicos' : t.label}</h3>
              <button className="btn-secondary !px-3 !py-1.5" onClick={() => setAssignType(type)}><Plus size={15} /> Asignar</button>
            </div>
            <div className="space-y-2">
              {list.map((a, i) => <AssignmentCard key={a.id} assignment={a} onClick={() => setEditing(a)} delay={i * 30} />)}
              {!list.length && <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-3 text-sm text-ink-300">Nada asignado</p>}
            </div>
          </section>
        );
      })}
      <AssignmentSheet assignment={editing} onClose={() => setEditing(null)} />
      {assignType && <AssignSheet open student={student} initialType={assignType} onClose={() => setAssignType(null)} />}
    </div>
  );
}

function TasksTab({ student }) {
  const { state } = useStore();
  const [sheet, setSheet] = useState({ open: false, task: null });
  const items = byId(state.items);
  const tasks = sortTasks(state.tasks.filter((t) => t.studentId === student.id));
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  return (
    <div>
      <button className="btn-primary mb-3 w-full" onClick={() => setSheet({ open: true, task: null })}><Plus size={16} /> Nueva tarea</button>
      <div className="space-y-2">
        {pending.map((t, i) => <TaskItem key={t.id} task={t} item={items.get(t.itemId)} onEdit={(task) => setSheet({ open: true, task })} delay={i * 30} />)}
      </div>
      {!pending.length && <EmptyState icon={ListTodo} title="Sin tareas pendientes" text="Añade tareas para el estudio en casa." />}
      {done.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-ink-300">Completadas · {done.length}</h3>
          <div className="space-y-2">
            {done.map((t) => <TaskItem key={t.id} task={t} item={items.get(t.itemId)} onEdit={(task) => setSheet({ open: true, task })} />)}
          </div>
        </>
      )}
      <TaskFormSheet open={sheet.open} task={sheet.task} studentId={student.id} onClose={() => setSheet({ open: false, task: null })} />
    </div>
  );
}

function HistoryTab({ student }) {
  const { state } = useStore();
  const lessons = useMemo(
    () => state.lessons.filter((l) => l.studentId === student.id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    [state.lessons, student.id]
  );
  const [limit, setLimit] = useState(15);
  return (
    <div>
      <Link to={`/clases/nueva?alumno=${student.id}`} className="btn-primary mb-3 w-full"><ClipboardPen size={16} /> Registrar clase</Link>
      <div className="space-y-2">
        {lessons.slice(0, limit).map((l, i) => <LessonCard key={l.id} lesson={l} student={student} showStudent={false} delay={i * 25} />)}
      </div>
      {lessons.length > limit && (
        <button onClick={() => setLimit((n) => n + 15)} className="btn-secondary mt-3 w-full">Ver más ({lessons.length - limit})</button>
      )}
      {!lessons.length && <EmptyState icon={History} title="Sin clases registradas" />}
    </div>
  );
}

function MaterialTab({ student }) {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const itemIds = new Set(state.assignments.filter((a) => a.studentId === student.id).map((a) => a.itemId));
  const own = state.materials.filter((m) => m.studentId === student.id);
  const fromRepertoire = state.materials.filter((m) => m.studentId !== student.id && m.itemId && itemIds.has(m.itemId));
  return (
    <div className="space-y-5">
      <button className="btn-primary w-full" onClick={() => setOpen(true)}><Plus size={16} /> Añadir material</button>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-300">Del alumno · {own.length}</h3>
        {own.length ? <MaterialList materials={own} showOwner={false} /> : <p className="text-sm text-ink-300">Sin material propio.</p>}
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-300">De su repertorio · {fromRepertoire.length}</h3>
        {fromRepertoire.length ? <MaterialList materials={fromRepertoire} /> : <p className="text-sm text-ink-300">Las obras asignadas no tienen material adjunto.</p>}
      </section>
      {!own.length && !fromRepertoire.length && <EmptyState icon={FolderOpen} title="Sin material" text="Adjunta partituras PDF, vídeos, audios o enlaces." />}
      <MaterialFormSheet open={open} onClose={() => setOpen(false)} studentId={student.id} />
    </div>
  );
}

function NotesTab({ student }) {
  const { state, actions } = useStore();
  const [text, setText] = useState('');
  const notes = state.notes.filter((n) => n.studentId === student.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const add = () => {
    if (!text.trim()) return;
    actions.saveNote({ studentId: student.id, text: text.trim() });
    setText('');
    actions.notify('Nota guardada');
  };
  return (
    <div>
      <div className="card p-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[80px] !border-0 !ring-0 !px-1" placeholder="Escribe una nota sobre el alumno…" />
        <div className="flex justify-end"><button className="btn-primary !py-2" onClick={add} disabled={!text.trim()}>Guardar nota</button></div>
      </div>
      <ul className="mt-4 space-y-2">
        {notes.map((n, i) => (
          <li key={n.id} className="card relative p-4 pl-5 animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
            <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-brass-300" />
            <p className="text-sm text-ink-700 whitespace-pre-line">{n.text}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-300">
              <span>{formatShort(n.date)}</span>
              <button onClick={() => actions.deleteNote(n.id)} className="hover:text-rose-600" aria-label="Eliminar nota"><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
      {!notes.length && <EmptyState icon={StickyNote} title="Sin notas" />}
    </div>
  );
}

function PersonalData({ student }) {
  const { state } = useStore();
  const lastLesson = state.lessons.filter((l) => l.studentId === student.id).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const stats = studentStats(state, student.id);
  return (
      <section className="card divide-y divide-ink-50">
        <h3 className="px-4 pt-4 pb-2 font-display text-xl">Datos personales</h3>
        {[
          ['Nombre', student.firstName],
          ['Apellidos', student.lastName],
          ['Instrumento', student.instrument],
          ['Nivel', student.level],
          ['Teléfono', student.phone || '—'],
          ['Email', student.email || '—'],
          ['Alumno desde', student.since ? formatFull(student.since) : '—'],
          ['Asistencia', stats.asistencia === null ? '—' : `${stats.asistencia} % (${stats.faltas} ${stats.faltas === 1 ? 'falta' : 'faltas'})`],
          ['Última clase', lastLesson ? formatFull(lastLesson.date) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="text-ink-400">{k}</span>
            <span className="text-right font-medium text-ink-700 break-all">{v}</span>
          </div>
        ))}
        <div className="px-4 py-3">
          <p className="text-sm text-ink-400 mb-1.5 flex items-center gap-1.5"><CalendarClock size={14} /> Horario</p>
          <div className="flex flex-wrap gap-1.5">
            {(student.schedule || []).map((s, i) => (
              <span key={i} className="chip bg-ink-50 text-ink-700 !py-1">{WEEKDAYS[s.weekday - 1]} {s.time}–{endTime(s.time, s.duration)}</span>
            ))}
            {!student.schedule?.length && <span className="text-sm text-ink-300">Sin horario fijo</span>}
          </div>
        </div>
        {student.notes && (
          <div className="px-4 py-3">
            <p className="text-sm text-ink-400 mb-1">Observaciones</p>
            <p className="text-sm text-ink-700 whitespace-pre-line">{student.notes}</p>
          </div>
        )}
      </section>
  );
}
