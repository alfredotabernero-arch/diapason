import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardPen, History } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LessonCard from '../components/lessons/LessonCard.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { RESULTS } from '../utils/constants.js';
import { formatHours, monthLabel } from '../utils/dates.js';
import { byId, fullName, groupBy, normalize, teacherSessions } from '../utils/selectors.js';

export default function LessonHistory() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState('');
  const [onlyIncidents, setOnlyIncidents] = useState(false);
  const [limit, setLimit] = useState(40);
  const students = byId(state.students);

  const filtered = useMemo(
    () =>
      state.lessons
        .filter((l) => !studentId || l.studentId === studentId)
        .filter((l) => !result || l.result === result)
        .filter((l) => !onlyIncidents || l.incidents || (l.attendance && l.attendance !== 'Asistió'))
        .filter((l) => !q || normalize(`${l.work} ${l.observations} ${l.incidents} ${fullName(students.get(l.studentId))}`).includes(normalize(q)))
        .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    [state.lessons, studentId, result, onlyIncidents, q, students]
  );
  const shown = filtered.slice(0, limit);
  const groups = groupBy(shown, (l) => l.date.slice(0, 7));
  const minutes = teacherSessions(state, filtered).reduce((n, l) => n + Number(l.duration || 0), 0);

  return (
    <>
      <PageHeader
        back
        title="Historial de clases"
        subtitle={`${filtered.length} registros · ${formatHours(minutes)}`}
        actions={<Link to="/clases/nueva" className="btn-primary !px-3"><ClipboardPen size={17} /> Nueva</Link>}
      />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar en trabajo, observaciones…" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select className="input !py-2 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)} aria-label="Alumno">
          <option value="">Todos los alumnos</option>
          {state.students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
        </select>
        <select className="input !py-2 text-sm" value={result} onChange={(e) => setResult(e.target.value)} aria-label="Resultado">
          <option value="">Cualquier resultado</option>
          {RESULTS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm text-ink-500">
        <input type="checkbox" checked={onlyIncidents} onChange={(e) => setOnlyIncidents(e.target.checked)} className="accent-ink-800" />
        Solo clases con incidencias o faltas
      </label>

      <div className="mt-4 space-y-6">
        {[...groups.entries()].map(([month, list]) => (
          <section key={month}>
            <h2 className="mb-2 flex items-baseline justify-between">
              <span className="section-title">{monthLabel(`${month}-01`)}</span>
              <span className="text-xs text-ink-300">{list.length} clases</span>
            </h2>
            <div className="grid gap-2 xl:grid-cols-2">
              {list.map((l, i) => <LessonCard key={l.id} lesson={l} student={students.get(l.studentId)} delay={i * 20} />)}
            </div>
          </section>
        ))}
      </div>
      {filtered.length > limit && <button className="btn-secondary mt-4 w-full" onClick={() => setLimit((n) => n + 40)}>Cargar más</button>}
      {!filtered.length && <EmptyState icon={History} title="No hay clases" text="Ajusta los filtros o registra una clase nueva." />}
    </>
  );
}
