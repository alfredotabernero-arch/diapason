import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Field from '../components/ui/Field.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { ConfirmDialog } from '../components/ui/Sheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { ACTIVE_STATUSES, ATTENDANCE, ATTENDANCE_STYLE, RESULTS, RESULT_STYLE, itemTitle } from '../utils/constants.js';
import { formatLong, todayISO } from '../utils/dates.js';
import { appointmentsForDate, byId, fullName, studentAssignments } from '../utils/selectors.js';
import { useGoBack } from '../utils/navigation.js';

function phraseFor(item) {
  if (item.type === 'escala') return `Escala de ${itemTitle(item)} a ${item.targetBpm} BPM`;
  if (item.type === 'estudio') return `Estudio ${itemTitle(item)}`;
  if (item.type === 'tecnica') return `${item.category}: ${item.title}`;
  return item.title;
}

const DURATIONS = [30, 45, 60, 75, 90, 120];

/** Registro de una clase. Con ?grupo=… registra la clase de todos los alumnos del grupo a la vez. */
export default function LessonForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state, actions } = useStore();
  const existing = state.lessons.find((l) => l.id === id);
  const goBack = useGoBack('/clases');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const groupName = !existing ? params.get('grupo') || '' : '';

  const [form, setForm] = useState(() => {
    if (existing) return { attendance: 'Asistió', ...existing, itemIds: existing.itemIds || [] };
    const studentId = params.get('alumno') || '';
    const date = params.get('fecha') || todayISO();
    const slot = studentId && appointmentsForDate(state, date).find((a) => a.student.id === studentId);
    return {
      studentId,
      date,
      time: params.get('hora') || slot?.time || '17:00',
      duration: Number(params.get('duracion') || slot?.duration || 60),
      attendance: 'Asistió',
      work: '',
      observations: '',
      incidents: '',
      result: 'Bien',
      itemIds: [],
    };
  });

  // Modo grupo: alumnos del grupo y su asistencia/valoración individual
  const groupStudents = useMemo(() => (groupName ? state.students.filter((s) => s.group === groupName) : []), [groupName, state.students]);
  const [roster, setRoster] = useState(() => {
    if (!groupName) return {};
    const out = {};
    for (const s of state.students.filter((x) => x.group === groupName)) {
      const prev = state.lessons.find((l) => l.studentId === s.id && l.date === (params.get('fecha') || todayISO()) && l.time === params.get('hora'));
      out[s.id] = { attendance: prev?.attendance || 'Asistió', result: prev?.result || 'Bien', lessonId: prev?.id || null };
    }
    return out;
  });
  useEffect(() => {
    if (!groupName) return;
    // Si la clase del grupo ya estaba registrada, se recuperan los textos
    const prev = state.lessons.find((l) => Object.values(roster).some((r) => r.lessonId === l.id));
    if (prev) setForm((f) => ({ ...f, work: prev.work, observations: prev.observations, incidents: prev.incidents, itemIds: prev.itemIds || [] }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && !existing) goBack();
  }, [id, existing]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = byId(state.items);
  const assignments = useMemo(() => {
    if (groupName) {
      // Repertorio común del grupo (sin repetir)
      const seen = new Map();
      for (const s of groupStudents) {
        for (const a of studentAssignments(state, s.id, items)) if (a.status !== 'Terminada' && !seen.has(a.itemId)) seen.set(a.itemId, a);
      }
      return [...seen.values()];
    }
    return form.studentId ? studentAssignments(state, form.studentId, items).filter((a) => ACTIVE_STATUSES.includes(a.status) || a.status === 'Pendiente') : [];
  }, [state, form.studentId, groupName, groupStudents, items]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const absent = !groupName && form.attendance !== 'Asistió';

  const toggleItem = (a) => {
    setForm((f) => {
      const has = f.itemIds.includes(a.itemId);
      const phrase = phraseFor(a.item);
      return {
        ...f,
        itemIds: has ? f.itemIds.filter((x) => x !== a.itemId) : [...f.itemIds, a.itemId],
        work: has ? f.work : f.work.trim() ? `${f.work.trim().replace(/\.$/, '')}. ${phrase}.` : `${phrase}.`,
      };
    });
  };

  const save = (e) => {
    e.preventDefault();
    if (groupName) {
      if (!form.work.trim()) return setError('Describe el trabajo realizado en clase');
      const list = groupStudents.map((s) => {
        const r = roster[s.id];
        const present = r.attendance === 'Asistió';
        return {
          ...(r.lessonId ? { id: r.lessonId } : {}),
          studentId: s.id, date: form.date, time: form.time, duration: Number(form.duration),
          attendance: r.attendance,
          work: present ? form.work.trim() : '',
          observations: present ? form.observations : '',
          incidents: present ? form.incidents : '',
          result: present ? r.result : '',
          itemIds: present ? form.itemIds : [],
        };
      });
      actions.saveLessons(list);
      actions.notify(`Clase registrada para ${list.length} alumnos`);
      return goBack();
    }
    if (!form.studentId) return setError('Elige un alumno');
    if (!absent && !form.work.trim()) return setError('Describe el trabajo realizado');
    actions.saveLesson({
      ...form,
      duration: Number(form.duration),
      work: absent ? '' : form.work.trim(),
      result: absent ? '' : form.result,
      itemIds: absent ? [] : form.itemIds,
    });
    actions.notify(existing ? 'Clase actualizada' : absent ? 'Falta registrada' : 'Clase registrada');
    goBack();
  };

  const student = state.students.find((s) => s.id === form.studentId);
  const resultPicker = (value, onPick, small = false) => (
    <div className="grid grid-cols-5 gap-1.5">
      {RESULTS.map((r) => (
        <button
          type="button"
          key={r}
          onClick={() => onPick(r)}
          className={`rounded-xl px-1 ${small ? 'py-1.5' : 'py-2.5'} text-[11px] font-semibold leading-tight transition-all ${
            value === r ? `${RESULT_STYLE[r].chip} ring-2 ring-current scale-[1.03]` : 'bg-ink-50 text-ink-400'
          }`}
          title={r}
        >
          <span className="block text-[10px] tracking-tighter">{'★'.repeat(RESULT_STYLE[r].score)}</span>
          {!small && r}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        back
        title={existing ? 'Clase' : groupName ? 'Clase del grupo' : 'Registrar clase'}
        subtitle={groupName ? `${groupName} · ${formatLong(form.date)}` : student ? fullName(student) : 'Historial de clases'}
      />
      <form onSubmit={save} className="grid gap-4 lg:grid-cols-2 lg:items-start" noValidate>
        <div className="space-y-4">
          <section className="card space-y-4 p-4">
            {!groupName && (
              <Field label="Alumno">
                <select className="input" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value, itemIds: [] }))}>
                  <option value="">Elige un alumno…</option>
                  {state.students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}{s.group ? ` · ${s.group}` : ''}</option>)}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,5.5rem)_minmax(0,4.5rem)] gap-2">
              <Field label="Fecha"><input type="date" className="input !px-2 !text-sm" value={form.date} onChange={set('date')} /></Field>
              <Field label="Hora"><input type="time" className="input !px-2 !text-sm" value={form.time} onChange={set('time')} /></Field>
              <Field label="Min">
                <select className="input !px-2" value={form.duration} onChange={set('duration')}>
                  {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            {!groupName && (
              <div>
                <span className="label">Asistencia</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {ATTENDANCE.map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setForm((f) => ({ ...f, attendance: a }))}
                      className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${form.attendance === a ? `${ATTENDANCE_STYLE[a].chip} ring-2 ring-current` : 'bg-ink-50 text-ink-400'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {groupName && (
            <section className="card p-4">
              <span className="label">Asistencia y valoración · {groupStudents.length} alumnos</span>
              <ul className="divide-y divide-ink-50">
                {groupStudents.map((s) => {
                  const r = roster[s.id];
                  const setR = (k, v) => setRoster((x) => ({ ...x, [s.id]: { ...x[s.id], [k]: v } }));
                  return (
                    <li key={s.id} className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar student={s} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-800">{fullName(s)}</span>
                        <select
                          value={r.attendance}
                          onChange={(e) => setR('attendance', e.target.value)}
                          className={`rounded-lg border-0 px-2 py-1.5 text-xs font-semibold ${ATTENDANCE_STYLE[r.attendance].chip}`}
                          aria-label={`Asistencia de ${fullName(s)}`}
                        >
                          {ATTENDANCE.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      {r.attendance === 'Asistió' && <div className="mt-2 pl-10">{resultPicker(r.result, (v) => setR('result', v), true)}</div>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-ink-300">★ = Mejorable · ★★★★★ = Excelente</p>
            </section>
          )}
        </div>

        <section className={`card space-y-4 p-4 ${absent ? 'opacity-60' : ''}`}>
          {absent && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Se registrará como {form.attendance.toLowerCase()}. Puedes anotar el motivo en observaciones.</p>}
          {!absent && assignments.length > 0 && (
            <div>
              <span className="label">Repertorio trabajado</span>
              <div className="flex flex-wrap gap-1.5">
                {assignments.map((a) => {
                  const on = form.itemIds.includes(a.itemId);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggleItem(a)}
                      className={`chip !py-1.5 !px-3 transition max-w-full ${on ? 'bg-ink-800 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'}`}
                    >
                      {!on && <Plus size={12} />} <span className="truncate">{itemTitle(a.item)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {!absent && (
            <Field label="Trabajo realizado *">
              <textarea className="input min-h-[110px]" value={form.work} onChange={set('work')} placeholder="Ej.: Escala de Sol Mayor a 90 BPM. Compases 1-24…" />
            </Field>
          )}
          <Field label={absent ? 'Observaciones / motivo' : 'Observaciones del profesor'}>
            <textarea className="input min-h-[80px]" value={form.observations} onChange={set('observations')} />
          </Field>
          {!absent && (
            <Field label="Incidencias">
              <input className="input" value={form.incidents} onChange={set('incidents')} placeholder="Retraso, falta de material, recuperación…" />
            </Field>
          )}
          {!absent && !groupName && (
            <div>
              <span className="label">Resultado general</span>
              {resultPicker(form.result, (r) => setForm((f) => ({ ...f, result: r })))}
            </div>
          )}
        </section>

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 lg:col-span-2">{error}</p>}
        <div className="flex gap-2 lg:col-span-2">
          {existing && <button type="button" className="btn-danger" onClick={() => setConfirm(true)}><Trash2 size={16} /> Eliminar</button>}
          <button type="button" className="btn-secondary ml-auto" onClick={goBack}>Cancelar</button>
          <button type="submit" className="btn-primary">{groupName ? 'Guardar la clase del grupo' : 'Guardar clase'}</button>
        </div>
      </form>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Eliminar clase"
        message="La clase se eliminará del historial."
        onConfirm={() => {
          actions.deleteLesson(existing.id);
          actions.notify('Clase eliminada');
          goBack();
        }}
      />
    </>
  );
}
