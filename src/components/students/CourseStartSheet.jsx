import { useEffect, useMemo, useState } from 'react';
import Sheet from '../ui/Sheet.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { courseLabel, courseOf } from '../../utils/courses.js';
import { formatFull } from '../../utils/dates.js';
import { fullName } from '../../utils/selectors.js';
import { CYCLE_YEARS, courseEndBefore, isActive, levelsOf, nextLevel, schoolYear } from '../../utils/school.js';

/**
 * Empezar el curso: avisa de los alumnos que han terminado su 6.º año (para darles de baja de una vez)
 * y propone subir de nivel a los demás. El año en la escuela se suma solo; los permanentes no cuentan años.
 */
export default function CourseStartSheet({ open, onClose }) {
  const { state, actions } = useStore();
  const course = courseOf();
  const leftAt = courseEndBefore(course);
  const students = useMemo(
    () => state.students.filter((s) => !s.groupOnly && isActive(s, leftAt))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'es')),
    [state.students, course, leftAt]
  );
  const terminan = students.filter((s) => !s.permanent && schoolYear(s, course) > CYCLE_YEARS && !s.leftAt);
  const siguen = students.filter((s) => !terminan.includes(s) && !s.leftAt);
  const [bajas, setBajas] = useState([]);
  const [niveles, setNiveles] = useState({});

  useEffect(() => {
    if (!open) return;
    setBajas(terminan.map((s) => s.id));
    setNiveles(Object.fromEntries(siguen.map((s) => [s.id, nextLevel(state.settings, s.level)])));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBaja = (id) => setBajas((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
  const levels = levelsOf(state.settings);

  const apply = () => {
    const cambios = Object.fromEntries(Object.entries(niveles).filter(([id, l]) => l !== state.students.find((s) => s.id === id)?.level));
    actions.startCourse({ course, bajas, niveles: cambios, leftAt });
    actions.notify(`${courseLabel(course)} preparado`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Empezar el ${courseLabel(course).toLowerCase()}`}
      footer={<><button className="btn-secondary" onClick={() => { actions.startCourse({ course, leftAt }); onClose(); }}>Ahora no</button><button className="btn-primary" onClick={apply}>Aplicar</button></>}
    >
      <div className="space-y-4 text-sm">
        <p className="text-ink-500">Cada alumno suma un año en la escuela automáticamente. Revisa quién termina y quién sube de nivel. Todo se puede cambiar después en la ficha de cada alumno.</p>

        <section>
          <h3 className="font-display text-lg">Han terminado su {CYCLE_YEARS}.º año</h3>
          {terminan.length ? (
            <>
              <p className="mb-2 text-xs text-ink-400">Marcados, pasan a antiguos alumnos con fecha de baja {formatFull(leftAt)}. Conservan todo su historial.</p>
              <ul className="space-y-1.5">
                {terminan.map((s) => (
                  <li key={s.id}>
                    <label className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2">
                      <input type="checkbox" className="h-4 w-4 accent-ink-800" checked={bajas.includes(s.id)} onChange={() => toggleBaja(s.id)} />
                      <span className="flex-1 font-semibold text-ink-800">{fullName(s)}</span>
                      <span className="text-xs text-ink-400">{s.level}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-ink-400">Nadie termina este curso.</p>}
        </section>

        <section>
          <h3 className="font-display text-lg">Subir de nivel</h3>
          <p className="mb-2 text-xs text-ink-400">Se propone el siguiente de tu lista de niveles. Cambia o deja igual el de quien lo necesite.</p>
          <ul className="space-y-1.5">
            {[...siguen, ...terminan.filter((s) => !bajas.includes(s.id))].map((s) => (
              <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-ink-100 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-800">{fullName(s)}</span>
                  <span className="text-xs text-ink-400">{s.level} · {s.permanent ? 'Permanente' : `${schoolYear(s, course)}.º año`}</span>
                </span>
                <select className="input !w-auto !py-1.5 !text-sm" value={niveles[s.id] || s.level} onChange={(e) => setNiveles((n) => ({ ...n, [s.id]: e.target.value }))}>
                  {(levels.includes(s.level) ? levels : [s.level, ...levels]).map((l) => <option key={l} value={l}>{l === s.level ? `${l} (igual)` : l}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Sheet>
  );
}
