import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BookOpen, CalendarRange, Clock, Music2, Trophy, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { StatusBadge } from '../components/ui/Badges.jsx';
import { useStore } from '../store/StoreContext.jsx';
import {
  ACTIVE_STATUSES, ATTENDANCE, ATTENDANCE_STYLE, REPERTOIRE_TYPES, RESULTS, RESULT_STYLE, STATUSES, STATUS_STYLE, attended, instrumentStyle, itemTitle,
} from '../utils/constants.js';
import { formatHours } from '../utils/dates.js';
import {
  byId, fullName, monthlyEvolution, studentAssignments, studentMonthlyResults, studentStats, teacherSessions, weeklyMinutes, weeklySlots,
} from '../utils/selectors.js';

const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 11, fill: '#6E7EA3' } };
const TOOLTIP = { contentStyle: { borderRadius: 12, border: '1px solid #E3E7F0', fontSize: 12, boxShadow: '0 8px 24px -8px rgba(20,26,44,.2)' } };

const METRICS = {
  clases: { label: 'Clases', unit: 'clases' },
  horas: { label: 'Horas', unit: 'h' },
  tareas: { label: 'Tareas hechas', unit: 'tareas' },
};

function ChartCard({ title, subtitle, children, action }) {
  return (
    <section className="card min-w-0 p-4 animate-fade-up">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Statistics() {
  const [params, setParams] = useSearchParams();
  const view = params.get('vista') || 'profesor';
  return (
    <>
      <PageHeader title="Estadísticas" />
      <Segmented
        value={view}
        onChange={(v) => setParams({ vista: v }, { replace: true })}
        options={[{ value: 'profesor', label: 'Profesor' }, { value: 'alumno', label: 'Por alumno' }]}
      />
      <div key={view} className="mt-4 animate-fade-up">{view === 'profesor' ? <TeacherStats /> : <StudentStats />}</div>
    </>
  );
}

function TeacherStats() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [metric, setMetric] = useState('clases');
  const [showTable, setShowTable] = useState(false);
  const items = byId(state.items);
  const evolution = monthlyEvolution(state, 6);

  const obras = state.assignments.filter((a) => items.get(a.itemId)?.type === 'obra');
  const inProcess = obras.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;

  const levelNames = [...new Set(state.students.map((s) => s.level))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  const byLevel = levelNames.map((l) => ({ name: l, alumnos: state.students.filter((s) => s.level === l).length }));
  const instrumentNames = [...new Set(state.students.map((s) => s.instrument))];
  const byInstrument = instrumentNames.length > 1
    ? instrumentNames.map((i) => ({ name: i, alumnos: state.students.filter((s) => s.instrument === i).length, fill: instrumentStyle(i).hex })).sort((a, b) => b.alumnos - a.alumnos)
    : null;
  const sessions = teacherSessions(state);
  const attendanceDist = ATTENDANCE.map((a) => ({ name: a, value: state.lessons.filter((l) => (l.attendance || 'Asistió') === a).length }));
  const attendanceTotal = attendanceDist.reduce((n, a) => n + a.value, 0) || 1;

  const statusData = STATUSES.map((s) => ({ name: s, value: obras.filter((a) => a.status === s).length, fill: STATUS_STYLE[s].hex }));

  const perStudent = useMemo(
    () =>
      state.students
        .map((s) => {
          const st = studentStats(state, s.id);
          return { id: s.id, name: `${s.firstName} ${s.lastName.split(' ')[0][0]}.`, progreso: st.progresoMedio, fill: '#4D5D84' };
        })
        .sort((a, b) => b.progreso - a.progreso),
    [state]
  );

  const resultDist = RESULTS.map((r) => ({ name: r, value: state.lessons.filter((l) => attended(l) && l.result === r).length }));
  const totalLessons = resultDist.reduce((n, r) => n + r.value, 0) || 1;
  const m = METRICS[metric];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Alumnos" value={state.students.length} tone="ink" />
        <StatCard icon={CalendarRange} label="Clases por semana" value={weeklySlots(state)} hint={`${formatHours(weeklyMinutes(state))} de docencia`} tone="brass" />
        <StatCard icon={Music2} label="Obras en proceso" value={inProcess} hint={`${obras.filter((a) => a.status === 'Terminada').length} terminadas`} tone="violet" />
        <StatCard icon={Clock} label="Clases impartidas" value={sessions.length} hint={formatHours(sessions.reduce((n, l) => n + Number(l.duration), 0))} tone="teal" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Evolución mensual"
        subtitle={`${m.label} en los últimos 6 meses`}
        action={<button onClick={() => setShowTable((v) => !v)} className="text-xs font-semibold text-brass-500">{showTable ? 'Gráfico' : 'Tabla'}</button>}
      >
        <Segmented value={metric} onChange={setMetric} options={Object.entries(METRICS).map(([value, x]) => ({ value, label: x.label }))} className="mb-3" />
        {showTable ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400"><th className="py-1.5 font-semibold">Mes</th><th className="text-right font-semibold">Clases</th><th className="text-right font-semibold">Horas</th><th className="text-right font-semibold">Tareas</th><th className="text-right font-semibold">Alumnos</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-50 tabular-nums">
              {evolution.map((r) => (
                <tr key={r.key}><td className="py-1.5">{r.mes}</td><td className="text-right">{r.clases}</td><td className="text-right">{r.horas}</td><td className="text-right">{r.tareas}</td><td className="text-right">{r.alumnos}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolution} margin={{ top: 16, right: 16, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="evo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4D5D84" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#4D5D84" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E3E7F0" />
                <XAxis dataKey="mes" {...AXIS} />
                <YAxis {...AXIS} allowDecimals={false} tick={{ fontSize: 11, fill: '#9DA9C4' }} />
                <Tooltip {...TOOLTIP} cursor={{ stroke: '#9DA9C4', strokeDasharray: '3 3' }} formatter={(v) => [`${v} ${m.unit}`, m.label]} />
                <Area type="monotone" dataKey={metric} stroke="#2D3853" strokeWidth={2} fill="url(#evo)" dot={{ r: 4, fill: '#2D3853', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={700}>
                  <LabelList dataKey={metric} position="top" offset={10} style={{ fontSize: 11, fill: '#3A4869', fontWeight: 600 }} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {evolution.some((r) => r.key.endsWith('-08') && r.clases === 0) && <p className="mt-2 text-xs text-ink-300">Agosto sin clases: periodo vacacional.</p>}
      </ChartCard>

      <ChartCard title="Alumnos por nivel" subtitle={state.settings.subject}>
        <div style={{ height: byLevel.length * 34 + 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byLevel} layout="vertical" margin={{ top: 0, right: 28, left: 12, bottom: 0 }} barCategoryGap={8}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="name" {...AXIS} width={118} tick={{ fontSize: 12, fill: '#3A4869' }} />
              <Tooltip {...TOOLTIP} cursor={{ fill: 'rgba(45,56,83,0.05)' }} formatter={(v) => [v, 'Alumnos']} />
              <Bar dataKey="alumnos" fill="#B07F30" radius={[0, 4, 4, 0]} maxBarSize={20} animationDuration={700}>
                <LabelList dataKey="alumnos" position="right" style={{ fontSize: 12, fill: '#2D3853', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {byInstrument && (
        <ChartCard title="Alumnos por especialidad">
          <div style={{ height: byInstrument.length * 34 + 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byInstrument} layout="vertical" margin={{ top: 0, right: 28, left: 12, bottom: 0 }} barCategoryGap={8}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" {...AXIS} width={96} tick={{ fontSize: 12, fill: '#3A4869' }} />
                <Tooltip {...TOOLTIP} cursor={{ fill: 'rgba(45,56,83,0.05)' }} formatter={(v) => [v, 'Alumnos']} />
                <Bar dataKey="alumnos" radius={[0, 4, 4, 0]} maxBarSize={20} animationDuration={700}>
                  {byInstrument.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  <LabelList dataKey="alumnos" position="right" style={{ fontSize: 12, fill: '#2D3853', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <ChartCard title="Asistencia" subtitle={`${state.lessons.length} registros de clase`}>
        <ul className="space-y-2">
          {attendanceDist.map((r) => (
            <li key={r.name} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-2 text-sm">
              <span className={`chip justify-center ${ATTENDANCE_STYLE[r.name].chip}`}>{r.name}</span>
              <div className="h-2 rounded-full bg-ink-100/70 overflow-hidden">
                <div className="h-2 rounded-full bg-ink-500 transition-[width] duration-700" style={{ width: `${(r.value / attendanceTotal) * 100}%` }} />
              </div>
              <span className="text-right tabular-nums text-ink-600">{Math.round((r.value / attendanceTotal) * 100)} %</span>
            </li>
          ))}
        </ul>
      </ChartCard>

      <ChartCard title="Estado de las obras" subtitle={`${obras.length} obras asignadas en total`}>
        <div className="flex h-4 overflow-hidden rounded-full gap-[2px]">
          {statusData.filter((d) => d.value).map((d) => (
            <div key={d.name} className={`${STATUS_STYLE[d.name].bar} transition-all duration-700 hover:opacity-80`} style={{ width: `${(d.value / (obras.length || 1)) * 100}%` }} title={`${d.name}: ${d.value}`} />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {statusData.map((d) => (
            <li key={d.name} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_STYLE[d.name].bar}`} />
              <span className="text-ink-600">{d.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-ink-800">{d.value}</span>
            </li>
          ))}
        </ul>
      </ChartCard>

      <ChartCard title="Progreso medio por alumno" subtitle="Media del repertorio activo · pulsa una barra para abrir la ficha">
        <div style={{ height: perStudent.length * 30 + 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perStudent} layout="vertical" margin={{ top: 0, right: 36, left: 12, bottom: 0 }} barCategoryGap={6}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" {...AXIS} width={84} tick={{ fontSize: 12, fill: '#3A4869' }} />
              <Tooltip {...TOOLTIP} cursor={{ fill: 'rgba(45,56,83,0.05)' }} formatter={(v) => [`${v}%`, 'Progreso medio']} />
              <Bar dataKey="progreso" radius={[0, 4, 4, 0]} maxBarSize={18} onClick={(d) => navigate(`/alumnos/${d.id}`)} className="cursor-pointer" animationDuration={700}>
                {perStudent.map((d) => <Cell key={d.id} fill={d.fill} />)}
                <LabelList dataKey="progreso" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: '#2D3853', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Valoración de las clases" subtitle={`${state.lessons.length} clases registradas`}>
        <ul className="space-y-2">
          {resultDist.map((r) => (
            <li key={r.name} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-sm">
              <span className={`chip justify-center ${RESULT_STYLE[r.name].chip}`}>{r.name}</span>
              <div className="h-2 rounded-full bg-ink-100/70 overflow-hidden">
                <div className="h-2 rounded-full bg-ink-500 transition-[width] duration-700" style={{ width: `${(r.value / totalLessons) * 100}%` }} />
              </div>
              <span className="text-right tabular-nums text-ink-600">{r.value}</span>
            </li>
          ))}
        </ul>
      </ChartCard>
      </div>
    </div>
  );
}

function StudentStats() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const studentId = params.get('alumno') || state.students[0]?.id;
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return <p className="text-ink-400">No hay alumnos.</p>;

  const stats = studentStats(state, student.id);
  const monthly = studentMonthlyResults(state, student.id);
  const assignments = studentAssignments(state, student.id);
  const hex = instrumentStyle(student.instrument).hex;

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {state.students.map((s) => (
          <button
            key={s.id}
            onClick={() => setParams({ vista: 'alumno', alumno: s.id }, { replace: true })}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${s.id === student.id ? 'bg-white shadow-card' : 'opacity-60 hover:opacity-100'}`}
          >
            <Avatar student={s} size="md" />
            <span className="text-[11px] font-semibold text-ink-700">{s.firstName}</span>
          </button>
        ))}
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="section-title">{fullName(student)}</h2>
        <span className="text-xs text-ink-400">{student.instrument} · {student.level}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Trophy} label="Obras terminadas" value={stats.obrasTerminadas} tone="emerald" />
        <StatCard icon={Music2} label="Obras activas" value={stats.obrasActivas} tone="violet" />
        <StatCard icon={BookOpen} label="Estudios activos" value={stats.estudiosActivos} tone="brass" />
        <StatCard icon={Clock} label="Horas estimadas" value={formatHours(stats.horasEstimadas)} hint={`${formatHours(stats.horasClase)} de clase`} tone="sky" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">

      <ChartCard title="Clases por mes" subtitle={`${stats.clases} clases · ${stats.asistencia ?? '—'} % de asistencia · valoración media ${stats.mediaResultado ? stats.mediaResultado.toFixed(1).replace('.', ',') : '—'} / 5`}>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 16, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E3E7F0" />
              <XAxis dataKey="mes" {...AXIS} />
              <YAxis {...AXIS} allowDecimals={false} tick={{ fontSize: 11, fill: '#9DA9C4' }} />
              <Tooltip {...TOOLTIP} cursor={{ fill: 'rgba(45,56,83,0.05)' }} formatter={(v, _n, p) => [`${v} clases${p.payload.media ? ` · media ${p.payload.media}/5` : ''}`, '']} separator="" />
              <Bar dataKey="clases" fill={hex} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={700}>
                <LabelList dataKey="clases" position="top" style={{ fontSize: 11, fill: '#2D3853', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Progreso por elemento" subtitle={`Progreso medio activo: ${stats.progresoMedio}%`}>
        <div className="space-y-4">
          {Object.entries(REPERTOIRE_TYPES).map(([type, t]) => {
            const list = assignments.filter((a) => a.item.type === type);
            if (!list.length) return null;
            return (
              <div key={type}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300">{t.label}</p>
                <ul className="space-y-2.5">
                  {list.map((a) => (
                    <li key={a.id}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-ink-700">{itemTitle(a.item)}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <ProgressBar value={a.progress} status={a.status} showLabel />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </ChartCard>

      <ChartCard title="Tareas para casa">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E3E7F0" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(stats.tareasCompletadas / Math.max(1, stats.tareasCompletadas + stats.tareasPendientes)) * 97.4} 97.4`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-xl">
              {Math.round((stats.tareasCompletadas / Math.max(1, stats.tareasCompletadas + stats.tareasPendientes)) * 100)}%
            </span>
          </div>
          <div className="text-sm text-ink-600">
            <p><b className="tabular-nums">{stats.tareasCompletadas}</b> completadas</p>
            <p><b className="tabular-nums">{stats.tareasPendientes}</b> pendientes</p>
          </div>
        </div>
      </ChartCard>
      </div>
    </div>
  );
}
