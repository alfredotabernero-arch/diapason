import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileSpreadsheet, MessageSquareText, Printer } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { PriorityBadge, StatusBadge } from '../components/ui/Badges.jsx';
import GradeSelect from '../components/grades/GradeSelect.jsx';
import GradeSheet from '../components/grades/GradeSheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { GRADE_ABBR, REPERTOIRE_TYPES, TERMS, attended, gradeLabel, gradeStyle, isInstrumentSubject, itemTitle } from '../utils/constants.js';
import { courseLabel, courseOf, courseRanges, finalGrade, proposedFinal, shiftCourse } from '../utils/courses.js';
import { WEEKDAYS, addDays, endTime, formatFull, formatShort, formatHours, isoWeekday, monthLabel, startOfMonth, addMonths, todayISO } from '../utils/dates.js';
import { downloadCSV } from '../utils/csv.js';
import { byId, fullName, sortTasks, studentAssignments } from '../utils/selectors.js';

const LISTS = [
  { value: 'notas', label: 'Calificaciones' },
  { value: 'alumnos', label: 'Alumnos y horario' },
  { value: 'asistencia', label: 'Clases y asistencia' },
  { value: 'tareas', label: 'Tareas y repertorio' },
];

const bySurname = (a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'es');

export default function Listados() {
  const [params, setParams] = useSearchParams();
  const list = params.get('lista') || 'notas';
  const { state } = useStore();
  const groups = [...new Set(state.students.map((s) => s.group).filter(Boolean))].sort();
  const [group, setGroup] = useState('');
  const students = state.students.filter((s) => !group || s.group === group).sort(bySurname);

  return (
    <>
      <PageHeader title="Listados" subtitle={`${state.settings.subject} · ${state.settings.school}`} />
      <div className="no-print">
        <Segmented value={list} onChange={(v) => setParams({ lista: v }, { replace: true })} options={LISTS} />
        {groups.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['', ...groups].map((g) => (
              <button key={g || 'all'} onClick={() => setGroup(g)} className={`chip !py-1.5 !px-3 transition ${group === g ? 'bg-ink-800 text-white' : 'bg-white text-ink-500 border border-ink-100'}`}>
                {g || 'Todos los grupos'}
              </button>
            ))}
          </div>
        )}
      </div>
      <div key={list} className="mt-4 animate-fade-up">
        {list === 'notas' && <GradesList students={students} group={group} />}
        {list === 'alumnos' && <StudentsList students={students} group={group} />}
        {list === 'asistencia' && <AttendanceList students={students} group={group} />}
        {list === 'tareas' && <TasksList students={students} group={group} />}
      </div>
    </>
  );
}

/* ---------- piezas comunes ---------- */

function Toolbar({ children, onCSV }) {
  return (
    <div className="no-print mb-3 flex flex-wrap items-center gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <button className="btn-secondary !py-2" onClick={() => window.print()} title="Imprimir o guardar como PDF"><Printer size={16} /> Imprimir / PDF</button>
      <button className="btn-secondary !py-2" onClick={onCSV} title="Descargar para Excel"><FileSpreadsheet size={16} /> Excel</button>
    </div>
  );
}

function PrintHeader({ title, detail }) {
  const { state } = useStore();
  const { teacherName, school, subject } = state.settings;
  return (
    <div className="print-only mb-4 border-b border-ink-200 pb-3">
      <p className="text-xs uppercase tracking-widest text-ink-500">{school}</p>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="text-sm text-ink-600">{subject} · {teacherName}{detail ? ` · ${detail}` : ''}</p>
      <p className="text-xs text-ink-400">Emitido el {formatFull(todayISO())} con Diapasón</p>
    </div>
  );
}

function Table({ children }) {
  return (
    <div className="card print-table-wrap overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}
const Th = ({ children, className = '' }) => <th className={`border-b border-ink-100 bg-ink-50/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 ${className}`}>{children}</th>;
const Td = ({ children, className = '' }) => <td className={`border-b border-ink-50 px-3 py-2 align-middle ${className}`}>{children}</td>;
const fileTag = (group) => (group ? `-${group.replace(/[^\p{L}\p{N}]+/gu, '-')}` : '');

/* ---------- 1. Calificaciones (acta) ---------- */

function GradesList({ students, group }) {
  const { state, actions } = useStore();
  const current = courseOf();
  const [course, setCourse] = useState(current);
  const [commenting, setCommenting] = useState(null);
  const gradeOf = (id) => state.grades.find((g) => g.studentId === id && g.course === course);
  const showInstrument = !isInstrumentSubject(state.settings.subject);

  const rows = students.map((s) => {
    const g = gradeOf(s.id);
    return { s, g, fin: finalGrade(g), auto: !g || g.final === null || g.final === undefined };
  });
  const finals = rows.map((r) => r.fin).filter((v) => v !== null);
  const dist = ['Insuficiente', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente'].map((l) => ({ l, n: finals.filter((v) => gradeLabel(v) === l).length }));
  const mean = (key) => {
    const v = rows.map((r) => (key === 'final' ? r.fin : r.g?.[key])).filter((x) => x !== null && x !== undefined);
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1).replace('.', ',') : '—';
  };

  const csv = () => downloadCSV(`Acta-${state.settings.subject}-${course}${fileTag(group)}`,
    ['Apellidos', 'Nombre', ...(showInstrument ? ['Especialidad'] : []), 'Nivel', 'Grupo', '1T', '2T', '3T', 'Final', 'Calificación', 'Observaciones'],
    rows.map(({ s, g, fin }) => [s.lastName, s.firstName, ...(showInstrument ? [s.instrument] : []), s.level, s.group || '', g?.t1 ?? '', g?.t2 ?? '', g?.t3 ?? '', fin ?? '', gradeLabel(fin),
      Object.values(g?.comments || {}).filter(Boolean).join(' | ')]));

  return (
    <>
      <Toolbar onCSV={csv}>
        <select className="input !w-auto !py-2 text-sm" value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Curso">
          {[shiftCourse(current, -1), current, shiftCourse(current, 1)].map((c) => <option key={c} value={c}>{courseLabel(c)}</option>)}
        </select>
        <span className="text-xs text-ink-400">Notas de 1 a 10 · * final propuesta (media)</span>
      </Toolbar>
      {!rows.some((r) => r.g) && state.grades.some((g) => g.course === shiftCourse(course, -1)) && (
        <p className="no-print mb-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Aún no hay notas en el {courseLabel(course).toLowerCase()}.{' '}
          <button className="font-semibold underline" onClick={() => setCourse(shiftCourse(course, -1))}>Ver el {courseLabel(shiftCourse(course, -1)).toLowerCase()}</button>
        </p>
      )}
      <PrintHeader title="Acta de calificaciones" detail={`${courseLabel(course)}${group ? ` · ${group}` : ''}`} />
      {students.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Alumno</Th>
              <Th>{showInstrument ? 'Especialidad · nivel' : 'Nivel'}</Th>
              {TERMS.map((t) => <Th key={t.key} className="text-center">{t.short}</Th>)}
              <Th className="text-center">Final</Th>
              <Th>Calificación</Th>
              <Th className="no-print text-center">Obs.</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, g, fin, auto }) => (
              <tr key={s.id} className="hover:bg-ink-50/40">
                <Td className="whitespace-nowrap"><Link to={`/alumnos/${s.id}`} className="font-semibold text-ink-800 hover:underline">{s.lastName}, {s.firstName}</Link></Td>
                <Td className="whitespace-nowrap text-ink-500">{showInstrument ? `${s.instrument} · ` : ''}{s.level}</Td>
                {TERMS.map((t) => (
                  <Td key={t.key} className="text-center">
                    <span className="no-print"><GradeSelect label={`${t.label} de ${fullName(s)}`} value={g?.[t.key] ?? null} onChange={(v) => actions.saveGrade(s.id, course, { [t.key]: v })} /></span>
                    <span className="print-only font-semibold tabular-nums">{g?.[t.key] ?? '—'}</span>
                  </Td>
                ))}
                <Td className="text-center">
                  <span className="no-print"><GradeSelect label={`Nota final de ${fullName(s)}`} value={g?.final ?? null} placeholder={proposedFinal(g)} onChange={(v) => actions.saveGrade(s.id, course, { final: v })} /></span>
                  <span className="print-only font-semibold tabular-nums">{fin ?? '—'}{fin !== null && auto ? '*' : ''}</span>
                </Td>
                <Td>{fin !== null ? <span className={`chip ${gradeStyle(fin)}`}>{gradeLabel(fin)}</span> : <span className="text-ink-300">—</span>}</Td>
                <Td className="no-print text-center">
                  <button onClick={() => setCommenting(s)} className={`rounded-lg p-1.5 hover:bg-ink-50 ${Object.values(g?.comments || {}).some(Boolean) ? 'text-brass-500' : 'text-ink-300'}`} aria-label="Observaciones">
                    <MessageSquareText size={17} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-ink-600">
              <Td>Media</Td><Td />
              {TERMS.map((t) => <Td key={t.key} className="text-center tabular-nums">{mean(t.key)}</Td>)}
              <Td className="text-center tabular-nums">{mean('final')}</Td>
              <Td className="text-xs font-normal">{dist.map((d) => `${GRADE_ABBR[d.l]} ${d.n}`).join(' · ')}</Td>
              <Td className="no-print" />
            </tr>
          </tfoot>
        </Table>
      ) : <EmptyState title="No hay alumnos" />}
      <p className="mt-3 text-xs text-ink-400">
        Las notas se guardan al momento. La final propuesta es la media de los tres trimestres redondeada; elige una nota para fijarla a mano.
      </p>
      {commenting && <GradeSheet student={commenting} course={course} onClose={() => setCommenting(null)} />}
    </>
  );
}

/* ---------- 2. Alumnos y horario ---------- */

function StudentsList({ students, group }) {
  const { state } = useStore();
  const showInstrument = !isInstrumentSubject(state.settings.subject);
  const schedule = (s) => (s.schedule || []).map((x) => `${WEEKDAYS[x.weekday - 1].slice(0, 3)} ${x.time}–${endTime(x.time, x.duration)}`).join(', ');

  // Rejilla semanal: filas = franjas horarias, columnas = días con clase
  const grid = useMemo(() => {
    const cells = new Map();
    const times = new Set();
    const days = new Set();
    for (const s of students) {
      for (const x of s.schedule || []) {
        const key = `${x.weekday}|${x.time}`;
        times.add(x.time);
        days.add(x.weekday);
        if (!cells.has(key)) cells.set(key, { duration: x.duration, names: new Set() });
        cells.get(key).names.add(s.group || `${s.firstName} ${s.lastName.split(' ')[0]}`);
      }
    }
    return { cells, times: [...times].sort(), days: [...days].sort() };
  }, [students]);

  const csv = () => downloadCSV(`Alumnos-${state.settings.subject}${fileTag(group)}`,
    ['Apellidos', 'Nombre', ...(showInstrument ? ['Especialidad'] : []), 'Nivel', 'Grupo', 'Teléfono', 'Email', 'Horario', 'Alumno desde'],
    students.map((s) => [s.lastName, s.firstName, ...(showInstrument ? [s.instrument] : []), s.level, s.group || '', s.phone, s.email, schedule(s), s.since ? formatShort(s.since) : '']));

  return (
    <>
      <Toolbar onCSV={csv}><span className="text-sm text-ink-500">{students.length} alumnos</span></Toolbar>
      <PrintHeader title="Alumnos y horario" detail={group} />
      <Table>
        <thead>
          <tr>
            <Th>Alumno</Th>{showInstrument && <Th>Especialidad</Th>}<Th>Nivel</Th><Th>Grupo</Th><Th>Teléfono</Th><Th>Email</Th><Th>Horario</Th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <Td className="whitespace-nowrap"><Link to={`/alumnos/${s.id}`} className="font-semibold text-ink-800 hover:underline">{s.lastName}, {s.firstName}</Link></Td>
              {showInstrument && <Td>{s.instrument}</Td>}
              <Td className="whitespace-nowrap">{s.level}</Td>
              <Td className="whitespace-nowrap">{s.group || '—'}</Td>
              <Td className="whitespace-nowrap tabular-nums">{s.phone || '—'}</Td>
              <Td className="break-all">{s.email || '—'}</Td>
              <Td className="text-ink-500">{schedule(s) || '—'}</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h3 className="section-title mt-6 mb-2">Horario semanal</h3>
      {grid.times.length ? (
        <Table>
          <thead>
            <tr><Th>Hora</Th>{grid.days.map((d) => <Th key={d}>{WEEKDAYS[d - 1]}</Th>)}</tr>
          </thead>
          <tbody>
            {grid.times.map((t) => (
              <tr key={t}>
                <Td className="font-semibold tabular-nums text-ink-600">{t}</Td>
                {grid.days.map((d) => {
                  const c = grid.cells.get(`${d}|${t}`);
                  return (
                    <Td key={d} className={c ? 'bg-brass-50/50' : ''}>
                      {c && (
                        <>
                          <p className="font-semibold text-ink-800">{[...c.names].join(', ')}</p>
                          <p className="text-xs text-ink-400">{t}–{endTime(t, c.duration)}</p>
                        </>
                      )}
                    </Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <p className="text-sm text-ink-300">Sin horario.</p>}
    </>
  );
}

/* ---------- 3. Clases y asistencia ---------- */

function periodOptions(terms) {
  const today = todayISO();
  const course = courseOf(today);
  const r = courseRanges(course, terms);
  const prev = courseRanges(shiftCourse(course, -1), terms);
  const m0 = startOfMonth(today);
  const m1 = addMonths(m0, -1);
  return [
    ...TERMS.map((t) => ({ value: `${course}:${t.key}`, label: `${t.label} ${course.replace('-', '/')}`, ...r[t.key] })),
    { value: `${course}:curso`, label: courseLabel(course), ...r.course },
    { value: 'mes', label: `${monthLabel(m0)}`, from: m0, to: addDays(addMonths(m0, 1), -1) },
    { value: 'mes-1', label: `${monthLabel(m1)}`, from: m1, to: addDays(m0, -1) },
    { value: `${shiftCourse(course, -1)}:curso`, label: courseLabel(shiftCourse(course, -1)), ...prev.course },
  ];
}

function AttendanceList({ students, group }) {
  const { state } = useStore();
  const options = periodOptions(state.settings.terms);
  const today = todayISO();
  const initial = options.find((o) => today >= o.from && today <= o.to) || options[3];
  const [period, setPeriod] = useState(initial.value);
  const p = options.find((o) => o.value === period) || initial;
  const yesterday = addDays(today, -1);

  const rows = students.map((s) => {
    const ls = state.lessons.filter((l) => l.studentId === s.id && l.date >= p.from && l.date <= p.to);
    const att = ls.filter(attended);
    const fj = ls.filter((l) => l.attendance === 'Falta justificada').length;
    const fi = ls.filter((l) => l.attendance === 'Falta injustificada').length;
    // Clases del horario ya pasadas sin registrar (dentro del periodo)
    let unregistered = 0;
    const from = s.since && s.since > p.from ? s.since : p.from;
    const to = p.to < yesterday ? p.to : yesterday;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const wd = isoWeekday(d);
      for (const x of s.schedule || []) if (Number(x.weekday) === wd && !ls.some((l) => l.date === d)) unregistered++;
    }
    return {
      s, total: ls.length, att: att.length, fj, fi,
      pct: ls.length ? Math.round((att.length / ls.length) * 100) : null,
      minutes: att.reduce((n, l) => n + Number(l.duration || 0), 0),
      incidents: ls.filter((l) => l.incidents).length,
      unregistered,
    };
  });
  const sum = (k) => rows.reduce((n, r) => n + r[k], 0);
  const totalPct = sum('total') ? Math.round((sum('att') / sum('total')) * 100) : null;

  const csv = () => downloadCSV(`Asistencia-${state.settings.subject}-${p.label}${fileTag(group)}`,
    ['Apellidos', 'Nombre', 'Nivel', 'Grupo', 'Clases registradas', 'Asistidas', 'Faltas justificadas', 'Faltas injustificadas', '% asistencia', 'Horas de clase', 'Incidencias', 'Sin registrar'],
    rows.map((r) => [r.s.lastName, r.s.firstName, r.s.level, r.s.group || '', r.total, r.att, r.fj, r.fi, r.pct ?? '', (r.minutes / 60).toFixed(1).replace('.', ','), r.incidents, r.unregistered]));

  return (
    <>
      <Toolbar onCSV={csv}>
        <select className="input !w-auto !py-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Periodo">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="text-xs text-ink-400">{formatShort(p.from)} – {formatShort(p.to)}</span>
      </Toolbar>
      <PrintHeader title="Clases y asistencia" detail={`${p.label} (${formatShort(p.from)} – ${formatShort(p.to)})${group ? ` · ${group}` : ''}`} />
      <Table>
        <thead>
          <tr>
            <Th>Alumno</Th><Th className="text-center">Registradas</Th><Th className="text-center">Asistidas</Th><Th className="text-center">F. just.</Th>
            <Th className="text-center">F. injust.</Th><Th className="w-40">Asistencia</Th><Th className="text-right">Horas</Th><Th className="text-center">Incid.</Th><Th className="text-center">Sin registrar</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.s.id}>
              <Td className="whitespace-nowrap"><Link to={`/alumnos/${r.s.id}?tab=historial`} className="font-semibold text-ink-800 hover:underline">{r.s.lastName}, {r.s.firstName}</Link></Td>
              <Td className="text-center tabular-nums">{r.total}</Td>
              <Td className="text-center tabular-nums">{r.att}</Td>
              <Td className="text-center tabular-nums">{r.fj || '—'}</Td>
              <Td className={`text-center tabular-nums ${r.fi ? 'font-semibold text-rose-600' : ''}`}>{r.fi || '—'}</Td>
              <Td>{r.pct !== null ? <ProgressBar value={r.pct} size="sm" showLabel /> : <span className="text-ink-300">—</span>}</Td>
              <Td className="text-right tabular-nums">{formatHours(r.minutes)}</Td>
              <Td className="text-center tabular-nums">{r.incidents || '—'}</Td>
              <Td className={`text-center tabular-nums ${r.unregistered ? 'text-amber-700 font-semibold' : 'text-ink-300'}`}>{r.unregistered || '—'}</Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold text-ink-600">
            <Td>Total</Td><Td className="text-center">{sum('total')}</Td><Td className="text-center">{sum('att')}</Td><Td className="text-center">{sum('fj')}</Td>
            <Td className="text-center">{sum('fi')}</Td><Td>{totalPct !== null ? `${totalPct} %` : '—'}</Td><Td className="text-right">{formatHours(sum('minutes'))}</Td>
            <Td className="text-center">{sum('incidents')}</Td><Td className="text-center">{sum('unregistered')}</Td>
          </tr>
        </tfoot>
      </Table>
      <p className="mt-3 text-xs text-ink-400">«Sin registrar» cuenta las clases del horario de ese periodo que no tienen registro (incluye festivos: revísalas en la agenda).</p>
    </>
  );
}

/* ---------- 4. Tareas y repertorio ---------- */

function TasksList({ students, group }) {
  const { state } = useStore();
  const [onlyActive, setOnlyActive] = useState(true);
  const items = byId(state.items);
  const data = students.map((s) => ({
    s,
    tasks: sortTasks(state.tasks.filter((t) => t.studentId === s.id && !t.done)),
    reps: studentAssignments(state, s.id, items).filter((a) => !onlyActive || (a.status !== 'Terminada')),
  }));

  const csv = () => downloadCSV(`Tareas-y-repertorio-${state.settings.subject}${fileTag(group)}`,
    ['Apellidos', 'Nombre', 'Registro', 'Tipo / prioridad', 'Elemento / tarea', 'Estado / fecha límite', '% progreso'],
    data.flatMap(({ s, tasks, reps }) => [
      ...reps.map((a) => [s.lastName, s.firstName, 'Repertorio', REPERTOIRE_TYPES[a.item.type].singular, itemTitle(a.item), a.status, a.progress]),
      ...tasks.map((t) => [s.lastName, s.firstName, 'Tarea', t.priority, t.title, t.dueDate ? formatShort(t.dueDate) : '', '']),
    ]));

  return (
    <>
      <Toolbar onCSV={csv}>
        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="accent-ink-800" /> Ocultar repertorio terminado
        </label>
      </Toolbar>
      <PrintHeader title="Tareas y repertorio" detail={group} />
      <div className="grid gap-3 xl:grid-cols-2">
        {data.map(({ s, tasks, reps }) => (
          <section key={s.id} className="card p-4 break-inside-avoid">
            <div className="flex items-baseline justify-between gap-2">
              <Link to={`/alumnos/${s.id}`} className="font-display text-xl hover:underline">{s.lastName}, {s.firstName}</Link>
              <span className="text-xs text-ink-400">{s.level}{s.group ? ` · ${s.group}` : ''}</span>
            </div>
            <p className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Repertorio</p>
            <ul className="divide-y divide-ink-50">
              {reps.map((a) => (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto_6rem] items-center gap-2 py-1.5 text-sm">
                  <span className="truncate"><span className="text-ink-400">{REPERTOIRE_TYPES[a.item.type].singular.split(' ')[0]} · </span>{itemTitle(a.item)}</span>
                  <StatusBadge status={a.status} />
                  <ProgressBar value={a.progress} status={a.status} size="sm" showLabel />
                </li>
              ))}
              {!reps.length && <li className="py-1.5 text-sm text-ink-300">Sin repertorio</li>}
            </ul>
            <p className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Tareas pendientes</p>
            <ul className="divide-y divide-ink-50">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="min-w-0 flex-1">{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                  <span className={`w-14 text-right text-xs tabular-nums ${t.dueDate && t.dueDate < todayISO() ? 'font-semibold text-rose-600' : 'text-ink-400'}`}>{t.dueDate ? formatShort(t.dueDate) : '—'}</span>
                </li>
              ))}
              {!tasks.length && <li className="py-1.5 text-sm text-ink-300">Sin tareas pendientes</li>}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
