import { useEffect, useState } from 'react';
import Sheet from '../ui/Sheet.jsx';
import GradeSelect from './GradeSelect.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { TERMS, gradeLabel } from '../../utils/constants.js';
import { courseLabel, proposedFinal } from '../../utils/courses.js';
import { fullName } from '../../utils/selectors.js';

const EMPTY = { t1: null, t2: null, t3: null, final: null, comments: {} };

/** Calificaciones de un alumno en un curso: tres trimestres + final (propuesta = media) */
export default function GradeSheet({ student, course, onClose }) {
  const { state, actions } = useStore();
  const [g, setG] = useState(EMPTY);

  useEffect(() => {
    if (!student) return;
    const current = state.grades.find((x) => x.studentId === student.id && x.course === course);
    setG(current ? { ...EMPTY, ...current, comments: { ...(current.comments || {}) } } : EMPTY);
  }, [student, course]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!student) return null;
  const proposal = proposedFinal(g);
  const setComment = (k) => (e) => setG((x) => ({ ...x, comments: { ...x.comments, [k]: e.target.value } }));

  return (
    <Sheet
      open={!!student}
      onClose={onClose}
      title="Calificaciones"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={() => {
              actions.saveGrade(student.id, course, { t1: g.t1, t2: g.t2, t3: g.t3, final: g.final, comments: g.comments });
              actions.notify('Calificaciones guardadas');
              onClose();
            }}
          >
            Guardar
          </button>
        </>
      }
    >
      <p className="-mt-1 mb-4 text-sm text-ink-400">{fullName(student)} · {courseLabel(course)}</p>
      <div className="space-y-3">
        {[...TERMS, { key: 'final', label: 'Calificación final', short: 'Final' }].map((t) => (
          <div key={t.key} className={`rounded-2xl border p-3 ${t.key === 'final' ? 'border-brass-200 bg-brass-50/50' : 'border-ink-100'}`}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-800">{t.label}</p>
                <p className="text-xs text-ink-400">
                  {t.key === 'final'
                    ? g.final !== null ? `${gradeLabel(g.final)} · puesta a mano` : proposal !== null ? `Propuesta: ${proposal} (${gradeLabel(proposal)}), media de los tres trimestres` : 'Se propondrá la media cuando estén los tres trimestres'
                    : g[t.key] !== null ? gradeLabel(g[t.key]) : 'Sin nota'}
                </p>
              </div>
              <GradeSelect
                label={t.label}
                value={g[t.key]}
                placeholder={t.key === 'final' ? proposal : null}
                onChange={(v) => setG((x) => ({ ...x, [t.key]: v }))}
              />
            </div>
            <textarea
              className="input mt-2 min-h-[44px] !py-2 text-sm"
              placeholder="Observaciones (opcional)"
              value={g.comments?.[t.key] || ''}
              onChange={setComment(t.key)}
            />
          </div>
        ))}
        <p className="text-xs text-ink-300">Escala de 1 a 10: Insuficiente (1–4), Suficiente (5), Bien (6), Notable (7–8), Sobresaliente (9–10). Si dejas la final en «—», cuenta la media propuesta (*).</p>
      </div>
    </Sheet>
  );
}
