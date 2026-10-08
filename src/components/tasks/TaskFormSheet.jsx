import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import Field from '../ui/Field.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { PRIORITIES, PRIORITY_STYLE, itemTitle } from '../../utils/constants.js';
import { addDays, todayISO } from '../../utils/dates.js';
import { byId, fullName } from '../../utils/selectors.js';

const EMPTY = { title: '', description: '', priority: 'Media', dueDate: '', studentId: '', itemId: '' };

export default function TaskFormSheet({ open, onClose, task, studentId }) {
  const { state, actions } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(task ? { ...EMPTY, ...task, itemId: task.itemId || '' } : { ...EMPTY, studentId: studentId || '', dueDate: addDays(todayISO(), 7) });
      setError('');
    }
  }, [open, task, studentId]);

  const items = byId(state.items);
  const studentItems = useMemo(
    () => state.assignments.filter((a) => a.studentId === form.studentId).map((a) => items.get(a.itemId)).filter(Boolean),
    [state.assignments, form.studentId, items]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const save = () => {
    if (!form.title.trim()) return setError('Escribe la tarea');
    if (!form.studentId) return setError('Elige un alumno');
    actions.saveTask({ ...form, title: form.title.trim(), itemId: form.itemId || null });
    actions.notify(task ? 'Tarea actualizada' : 'Tarea creada');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={task ? 'Editar tarea' : 'Nueva tarea'}
      footer={
        <>
          {task && (
            <button
              className="btn-danger mr-auto"
              onClick={() => {
                actions.deleteTask(task.id);
                actions.notify('Tarea eliminada');
                onClose();
              }}
            >
              <Trash2 size={16} /> Eliminar
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save}>Guardar</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Tarea" error={error}>
          <input className="input" value={form.title} onChange={set('title')} placeholder="Ej.: Compases 25-40 a 60 BPM" autoFocus />
        </Field>
        <Field label="Detalles (opcional)">
          <textarea className="input min-h-[72px]" value={form.description} onChange={set('description')} placeholder="Indicaciones, número de repeticiones, vídeo de referencia…" />
        </Field>
        {!studentId && (
          <Field label="Alumno">
            <select className="input" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value, itemId: '' }))}>
              <option value="">Elige un alumno…</option>
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>{fullName(s)} · {s.instrument}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Asociada a (opcional)">
          <select className="input" value={form.itemId} onChange={set('itemId')} disabled={!form.studentId}>
            <option value="">Sin asociar</option>
            {studentItems.map((i) => (
              <option key={i.id} value={i.id}>{itemTitle(i)}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha límite">
            <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
          <div>
            <span className="label">Prioridad</span>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p }))}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                    form.priority === p ? `${PRIORITY_STYLE[p].chip} ring-2 ring-current` : 'bg-ink-50 text-ink-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
