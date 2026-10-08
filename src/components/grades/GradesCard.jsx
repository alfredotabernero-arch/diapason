import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import GradeSheet from './GradeSheet.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { TERMS, gradeLabel, gradeStyle } from '../../utils/constants.js';
import { courseLabel, courseOf, finalGrade, shiftCourse } from '../../utils/courses.js';

function Cell({ label, value, auto }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-semibold text-ink-400">{label}</span>
      <span className={`grid h-10 w-full place-items-center rounded-xl text-lg font-display tabular-nums ${value !== null && value !== undefined ? gradeStyle(value) : 'bg-ink-50 text-ink-200'}`} title={gradeLabel(value)}>
        {value ?? '—'}{auto && value !== null ? <sup className="text-[10px]">*</sup> : null}
      </span>
    </div>
  );
}

/** Notas del curso actual y del anterior en la ficha del alumno */
export default function GradesCard({ student }) {
  const { state } = useStore();
  const current = courseOf();
  // Si aún no hay notas del curso actual, se muestra el anterior
  const hasCurrent = state.grades.some((x) => x.studentId === student.id && x.course === current && (x.t1 ?? x.t2 ?? x.t3) !== null);
  const [course, setCourse] = useState(hasCurrent ? current : shiftCourse(current, -1));
  const [editing, setEditing] = useState(false);
  const g = state.grades.find((x) => x.studentId === student.id && x.course === course);
  const fin = finalGrade(g);
  const options = [shiftCourse(current, -1), current];

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-xl">Calificaciones</h3>
        <button className="btn-ghost !p-2" onClick={() => setEditing(true)} aria-label="Editar calificaciones"><Pencil size={16} /></button>
      </div>
      <div className="mb-3 flex gap-1 rounded-xl bg-ink-100/60 p-1">
        {options.map((c) => (
          <button key={c} onClick={() => setCourse(c)} className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${course === c ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'}`}>
            {c.replace('-', '/')}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TERMS.map((t) => <Cell key={t.key} label={t.short} value={g?.[t.key] ?? null} />)}
        <Cell label="Final" value={fin} auto={g && (g.final === null || g.final === undefined)} />
      </div>
      {fin !== null && <p className="mt-2 text-center text-sm font-semibold text-ink-600">{gradeLabel(fin)}</p>}
      <p className="mt-2 text-xs text-ink-300">
        {courseLabel(course)} · <Link to="/listados?lista=notas" className="font-semibold text-brass-500">Ver el acta del grupo</Link>
      </p>
      {editing && <GradeSheet student={student} course={course} onClose={() => setEditing(false)} />}
    </section>
  );
}
