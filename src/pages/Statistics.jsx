import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
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
import { courseLabel, courseOf, finalGrade, shiftCourse } from '../utils/courses.js';
import { GRADE_ABBR, TERMS, gradeLabel } from '../utils/constants.js';
import {
  byId, fullName, monthlyEvolution, studentAssignments, studentMonthlyResults, studentStats, teacherSessions, weeklyMinutes, weeklySlots,
} from '../utils/selectors.js';
import { activeStudents, altaOf, isActive, levelIn, levelIndex } from '../utils/school.js';

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
        options={[{ value: 'profesor', label: 'Profesor' }, { value: 'cursos', label: 'Por cursos' }, { value: 'alumno', label: 'Por alumno' }]}
      />
      <div key={view} className="mt-4 animate-fade-up">{view === 'profesor' ? <TeacherStats /> : view === 'cursos' ? <CourseStats /> : <StudentStats />}</div>
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

  const act = activeStudents(state);
  const levelNames = [...new Set(act.map((s) => s.level))].sort((a, b) => levelIndex(state.settings, a) - levelIndex(state.settings, b) || a.localeCompare(b, 'es', { numeric: true }));
  const byLevel = levelNames.map((l) => ({ name: l, alumnos: act.filter((s) => s.level === l).length }));
  const instrumentNames = [...new Set(act.map((s) => s.instrument))];
  const byInstrument = instrumentNames.length > 1
    ? instrumentNames.map((i) => ({ name: i, alumnos: act.filter((s) => s.instrument === i).length, fill: instrumentStyle(i).hex })).sort((a, b) => b.alumnos - a.alumnos)
    : null;
  const sessions = teacherSessions(state);
  const attendanceDist = ATTENDANCE.map((a) => ({ name: a, value: state.lessons.filter((l) => (l.attendance || 'Asistió') === a).length }));
  const attendanceTotal = attendanceDist.reduce((n, a) => n + a.value, 0) || 1;

  const statusData = STATUSES.map((s) => ({ name: s, value: obras.filter((a) => a.status === s).length, fill: STATUS_STYLE[s].hex }));

  const perStudent = useMemo(
    () =>
      act
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
        <StatCard icon={Users} label="Alumnos" value={act.length} tone="ink" />
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
  const ordered = [...state.students].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));
  const studentId = params.get('alumno') || ordered[0]?.id;
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return <p className="text-ink-400">No hay alumnos.</p>;

  const stats = studentStats(state, student.id);
  const monthly = studentMonthlyResults(state, student.id);
  const assignments = studentAssignments(state, student.id);
  const hex = instrumentStyle(student.instrument).hex;

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {ordered.map((s) => (
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
      <Trayectoria student={student} />
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

/* ======================= Por cursos ======================= */

const CMP = { este: '#2D3853', antes: '#C9B48A' };
const fmt1 = (v) => (v === null || v === undefined ? '—' : v.toFixed(1).replace('.', ','));
const mean = (l) => { const v = l.filter((x) => x !== null && x !== undefined && x !== ''); return v.length ? v.reduce((a, b) => a + Number(b), 0) / v.length : null; };
const ESCALA = ['Insuficiente', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente'];

/** Cursos con algún dato (notas, clases o altas), del más reciente al más antiguo */
function coursesWithData(state) {
  const set = new Set([courseOf()]);
  state.grades.forEach((g) => set.add(g.course));
  state.lessons.forEach((l) => set.add(courseOf(l.date)));
  return [...set].sort().reverse();
}

/** Resumen de un curso: alumnos, clases, asistencia, notas medias, reparto de calificaciones y niveles */
function courseSummary(state, course) {
  const y = Number(course.slice(0, 4));
  const from = `${y}-09-01`, to = `${y + 1}-08-31`;
  const grades = state.grades.filter((g) => g.course === course);
  const lessons = state.lessons.filter((l) => l.date >= from && l.date <= to);
  const ids = new Set([...grades.map((g) => g.studentId), ...lessons.map((l) => l.studentId)]);
  const students = state.students.filter((s) => ids.has(s.id) || (altaOf(s) <= to && isActive(s, from) && course <= courseOf()));
  const sessions = teacherSessions(state, lessons);
  const att = lessons.length ? Math.round((lessons.filter(attended).length / lessons.length) * 100) : null;
  const medias = Object.fromEntries([...TERMS.map((t) => [t.key, mean(grades.map((g) => g[t.key]))]), ['final', mean(grades.map(finalGrade))]]);
  // nota de referencia de cada alumno: la final o, si aún no hay, la del último trimestre con nota
  const ref = (g) => finalGrade(g) ?? g?.t3 ?? g?.t2 ?? g?.t1 ?? null;
  const refs = grades.map(ref).filter((v) => v !== null);
  const reparto = Object.fromEntries(ESCALA.map((l) => [l, refs.filter((v) => gradeLabel(v) === l).length]));
  const niveles = {};
  for (const s of students) {
    const l = levelIn(s, course) || '—';
    (niveles[l] = niveles[l] || { n: 0, notas: [] }).n += 1;
    const g = grades.find((x) => x.studentId === s.id);
    if (ref(g) !== null) niveles[l].notas.push(ref(g));
  }
  return { course, students: students.length, sesiones: sessions.length, horas: sessions.reduce((n, l) => n + Number(l.duration || 0), 0), asistencia: att, medias, reparto, niveles, conNotas: refs.length };
}

function Comparado({ label, este, antes, unidad = '' }) {
  const d = este !== null && antes !== null && antes !== undefined ? este - antes : null;
  return (
    <div className="card p-3">
      <p className="text-xs font-semibold text-ink-400">{label}</p>
      <p className="font-display text-2xl leading-tight tabular-nums">{este ?? '—'}{este !== null && unidad}</p>
      <p className="text-xs text-ink-400">
        {antes === null || antes === undefined ? 'Sin datos del curso anterior' : <>Curso anterior: {antes}{unidad}{d ? <b className={d > 0 ? 'ml-1 text-emerald-600' : 'ml-1 text-rose-600'}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}{unidad}</b> : null}</>}
      </p>
    </div>
  );
}

function CourseStats() {
  const { state } = useStore();
  const cursos = coursesWithData(state);
  const [course, setCourse] = useState(cursos[0]);
  const prev = shiftCourse(course, -1);
  const A = courseSummary(state, course);
  const hayAntes = cursos.includes(prev);
  const B = hayAntes ? courseSummary(state, prev) : null;
  const corto = (c) => c.slice(2, 4) + '/' + c.slice(7, 9);
  const notas = [...TERMS.map((t) => ({ k: t.short, key: t.key })), { k: 'Final', key: 'final' }].map(({ k, key }) => ({
    k, este: A.medias[key] !== null ? Math.round(A.medias[key] * 10) / 10 : null, antes: B && B.medias[key] !== null ? Math.round(B.medias[key] * 10) / 10 : null,
  }));
  const reparto = ESCALA.map((l) => ({ k: GRADE_ABBR[l], nombre: l, este: A.reparto[l], antes: B ? B.reparto[l] : null }));
  const niveles = [...new Set([...Object.keys(A.niveles), ...Object.keys(B?.niveles || {})])].sort((a, b) => levelIndex(state.settings, a) - levelIndex(state.settings, b));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="input !w-auto" value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Curso">
          {cursos.map((c) => <option key={c} value={c}>{courseLabel(c)}</option>)}
        </select>
        <span className="text-sm text-ink-400">{hayAntes ? `comparado con el ${courseLabel(prev).toLowerCase()}` : 'Las comparaciones aparecen a partir del segundo curso con datos.'}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Comparado label="Alumnos" este={A.students} antes={B?.students} />
        <Comparado label="Clases impartidas" este={A.sesiones} antes={B?.sesiones} />
        <Comparado label="Horas de clase" este={Math.round(A.horas / 60)} antes={B ? Math.round(B.horas / 60) : null} unidad=" h" />
        <Comparado label="Asistencia" este={A.asistencia} antes={B?.asistencia} unidad=" %" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Nota media por trimestre" subtitle={`${A.conNotas} alumnos con notas · de 1 a 10`}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={notas} margin={{ top: 18, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E3E7F0" />
                <XAxis dataKey="k" {...AXIS} />
                <YAxis {...AXIS} domain={[0, 10]} ticks={[0, 5, 10]} />
                <Tooltip {...TOOLTIP} formatter={(v, n) => [fmt1(v), n === 'este' ? courseLabel(course) : courseLabel(prev)]} />
                {hayAntes && <Bar dataKey="antes" fill={CMP.antes} radius={[4, 4, 0, 0]} maxBarSize={26} />}
                <Bar dataKey="este" fill={CMP.este} radius={[4, 4, 0, 0]} maxBarSize={26}>
                  <LabelList dataKey="este" position="top" formatter={fmt1} style={{ fontSize: 11, fill: '#2D3853', fontWeight: 600 }} />
                </Bar>
                {hayAntes && <Legend formatter={(v) => (v === 'este' ? corto(course) : corto(prev))} wrapperStyle={{ fontSize: 12 }} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Calificaciones" subtitle="Nota final, o la del último trimestre si aún no hay final">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reparto} margin={{ top: 18, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E3E7F0" />
                <XAxis dataKey="k" {...AXIS} />
                <YAxis {...AXIS} allowDecimals={false} />
                <Tooltip {...TOOLTIP} labelFormatter={(k) => ESCALA.find((l) => GRADE_ABBR[l] === k)} formatter={(v, n) => [`${v} alumnos`, n === 'este' ? courseLabel(course) : courseLabel(prev)]} />
                {hayAntes && <Bar dataKey="antes" fill={CMP.antes} radius={[4, 4, 0, 0]} maxBarSize={26} />}
                <Bar dataKey="este" fill={CMP.este} radius={[4, 4, 0, 0]} maxBarSize={26}>
                  <LabelList dataKey="este" position="top" style={{ fontSize: 11, fill: '#2D3853', fontWeight: 600 }} />
                </Bar>
                {hayAntes && <Legend formatter={(v) => (v === 'este' ? corto(course) : corto(prev))} wrapperStyle={{ fontSize: 12 }} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <ChartCard title="Por nivel" subtitle="Alumnos y nota media de cada nivel (el que tenían en ese curso)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-1.5">Nivel</th>
                <th className="text-center">Alumnos</th>{hayAntes && <th className="text-center text-ink-300">antes</th>}
                <th className="text-center">Media</th>{hayAntes && <th className="text-center text-ink-300">antes</th>}
              </tr>
            </thead>
            <tbody>
              {niveles.map((l) => {
                const a = A.niveles[l], b = B?.niveles[l];
                return (
                  <tr key={l} className="border-t border-ink-50">
                    <td className="py-1.5 font-semibold text-ink-700">{l}</td>
                    <td className="text-center tabular-nums">{a?.n || '—'}</td>{hayAntes && <td className="text-center tabular-nums text-ink-400">{b?.n || '—'}</td>}
                    <td className="text-center tabular-nums">{fmt1(a ? mean(a.notas) : null)}</td>{hayAntes && <td className="text-center tabular-nums text-ink-400">{fmt1(b ? mean(b.notas) : null)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ======================= Trayectoria de un alumno ======================= */

function Trayectoria({ student }) {
  const { state } = useStore();
  const grades = state.grades.filter((g) => g.studentId === student.id).sort((a, b) => (a.course < b.course ? -1 : 1));
  if (!grades.length) return null;
  const corto = (c) => c.slice(2, 4) + '/' + c.slice(7, 9);
  const puntos = grades.flatMap((g) => TERMS.map((t) => ({ k: `${corto(g.course)} ${t.short}`, nota: g[t.key] ?? null }))).filter((p, i, arr) => p.nota !== null || arr.slice(i).some((x) => x.nota !== null));
  const filas = grades.map((g) => {
    const y = Number(g.course.slice(0, 4));
    const from = `${y}-09-01`, to = `${y + 1}-08-31`;
    const ls = state.lessons.filter((l) => l.studentId === student.id && l.date >= from && l.date <= to);
    const term = state.assignments.filter((a) => a.studentId === student.id && a.status === 'Terminada' && a.updatedAt >= from && a.updatedAt <= to).length;
    return { g, nivel: levelIn(student, g.course), clases: ls.filter(attended).length, asis: ls.length ? Math.round((ls.filter(attended).length / ls.length) * 100) : null, term };
  });
  return (
    <ChartCard title="Trayectoria" subtitle={`Notas de ${grades.length === 1 ? 'su curso' : `sus ${grades.length} cursos`} en la escuela`}>
      {puntos.length > 1 && (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={puntos} margin={{ top: 14, right: 10, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E3E7F0" />
              <XAxis dataKey="k" {...AXIS} interval={0} tick={{ fontSize: 10, fill: '#6E7EA3' }} />
              <YAxis {...AXIS} domain={[0, 10]} ticks={[0, 5, 10]} />
              <Tooltip {...TOOLTIP} formatter={(v) => [`${v} · ${gradeLabel(v)}`, 'Nota']} />
              <Line type="monotone" dataKey="nota" stroke="#2D3853" strokeWidth={2.5} dot={{ r: 4, fill: '#B07F30', stroke: '#fff', strokeWidth: 2 }} connectNulls>
                <LabelList dataKey="nota" position="top" style={{ fontSize: 11, fill: '#2D3853', fontWeight: 600 }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="py-1.5">Curso</th><th>Nivel</th>{TERMS.map((t) => <th key={t.key} className="text-center">{t.short}</th>)}<th className="text-center">Final</th><th className="text-center">Clases</th><th className="text-center">Asist.</th><th className="text-center">Obras</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ g, nivel, clases, asis, term }) => (
              <tr key={g.course} className="border-t border-ink-50">
                <td className="py-1.5 font-semibold text-ink-700 whitespace-nowrap">{corto(g.course)}</td>
                <td className="whitespace-nowrap text-ink-500">{nivel}</td>
                {TERMS.map((t) => <td key={t.key} className="text-center tabular-nums">{g[t.key] ?? '—'}</td>)}
                <td className="text-center font-semibold tabular-nums">{finalGrade(g) ?? '—'}</td>
                <td className="text-center tabular-nums">{clases}</td>
                <td className="text-center tabular-nums">{asis === null ? '—' : `${asis} %`}</td>
                <td className="text-center tabular-nums">{term}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
