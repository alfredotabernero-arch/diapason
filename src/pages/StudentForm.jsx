import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Field from '../components/ui/Field.jsx';
import { ConfirmDialog } from '../components/ui/Sheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { INSTRUMENTS, LEVELS, instrumentStyle, isInstrumentSubject } from '../utils/constants.js';
import { WEEKDAYS } from '../utils/dates.js';
import { fullName } from '../utils/selectors.js';
import { useGoBack } from '../utils/navigation.js';

const EMPTY = {
  firstName: '', lastName: '', instrument: '', level: 'Elemental 1º', group: '',
  phone: '', email: '', notes: '', schedule: [{ weekday: 1, time: '17:00', duration: 60 }],
};

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useStore();
  const existing = state.students.find((s) => s.id === id);
  const goBack = useGoBack('/alumnos');
  const subject = state.settings.subject;
  const instrumentSubject = isInstrumentSubject(subject);
  const [form, setForm] = useState({ ...EMPTY, instrument: instrumentSubject ? subject : 'Piano' });
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [warned, setWarned] = useState('');
  const groups = [...new Set(state.students.map((s) => s.group).filter(Boolean))].sort();
  const groupMate = form.group && state.students.find((s) => s.group === form.group && s.id !== existing?.id);

  useEffect(() => {
    if (existing) setForm({ ...EMPTY, ...existing, schedule: existing.schedule || [] });
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (id && !existing) {
    return <PageHeader back title="Alumno no encontrado" />;
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setSlot = (i, k, v) => setForm((f) => ({ ...f, schedule: f.schedule.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Obligatorio';
    if (!form.lastName.trim()) e.lastName = 'Obligatorio';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email no válido';
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) e.phone = 'Teléfono no válido';
    // Aviso de solapes con otros alumnos (no se avisa entre alumnos del mismo grupo)
    const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    let warning = '';
    for (const slot of form.schedule) {
      const s0 = toMin(slot.time);
      const s1 = s0 + Number(slot.duration);
      const clash = state.students.find((o) => o.id !== existing?.id && !(form.group && o.group === form.group)
        && (o.schedule || []).some((x) => Number(x.weekday) === Number(slot.weekday) && toMin(x.time) < s1 && toMin(x.time) + Number(x.duration) > s0));
      if (clash) {
        warning = `Se solapa con ${fullName(clash)} (${WEEKDAYS[slot.weekday - 1]} ${slot.time}). Pulsa «Guardar» otra vez para guardarlo igualmente.`;
        break;
      }
    }
    if (warning && warning !== warned) e.schedule = warning;
    setWarned(warning);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      group: form.group.trim(),
      instrument: instrumentSubject ? (form.instrument || subject) : form.instrument,
      schedule: form.schedule.map((s) => ({ weekday: Number(s.weekday), time: s.time, duration: Number(s.duration) })),
    };
    const saved = actions.saveStudent(data);
    actions.notify(existing ? 'Alumno actualizado' : 'Alumno creado');
    navigate(`/alumnos/${saved.id}`, { replace: true });
  };

  return (
    <>
      <PageHeader back title={existing ? 'Editar alumno' : 'Nuevo alumno'} subtitle={existing ? fullName(existing) : 'Alta de alumno'} />
      <form onSubmit={save} className="grid gap-5 lg:grid-cols-2 lg:items-start" noValidate>
        <section className="card space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre *" error={errors.firstName}>
              <input className="input" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
            </Field>
            <Field label="Apellidos *" error={errors.lastName}>
              <input className="input" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
            </Field>
          </div>
          {!instrumentSubject && (
            <div>
              <span className="label">Especialidad instrumental</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {INSTRUMENTS.slice(0, 12).map((i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setForm((f) => ({ ...f, instrument: i }))}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      form.instrument === i ? `${instrumentStyle(i).soft} border-transparent ring-2 ${instrumentStyle(i).ring}` : 'border-ink-100 bg-white text-ink-500'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${instrumentStyle(i).dot}`} /> {i}
                  </button>
                ))}
              </div>
              <select className="input mt-2 !py-2 text-sm" value={INSTRUMENTS.slice(0, 12).includes(form.instrument) ? '' : form.instrument} onChange={set('instrument')} aria-label="Otra especialidad">
                <option value="">Otra especialidad…</option>
                {INSTRUMENTS.slice(12).map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nivel">
              <select className="input" value={form.level} onChange={set('level')}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label={instrumentSubject ? 'Grupo (opcional)' : 'Grupo'} hint="Los alumnos del mismo grupo comparten clase">
              <input className="input" list="grupos" value={form.group} onChange={set('group')} placeholder="Ej.: 2.º Elemental · A" />
              <datalist id="grupos">{groups.map((g) => <option key={g} value={g} />)}</datalist>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Teléfono" error={errors.phone}>
              <input className="input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </Field>
          </div>
          <Field label="Observaciones">
            <textarea className="input min-h-[96px]" value={form.notes} onChange={set('notes')} placeholder="Objetivos, contacto familiar, aspectos a vigilar…" />
          </Field>
        </section>

        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">Horario semanal</h2>
              <p className="text-xs text-ink-400">Genera automáticamente las citas de la agenda</p>
            </div>
            <div className="flex gap-2">
              {groupMate && (
                <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => setForm((f) => ({ ...f, schedule: groupMate.schedule.map((x) => ({ ...x })) }))}>
                  Horario del grupo
                </button>
              )}
              <button
                type="button"
                className="btn-secondary !px-3 !py-2"
                onClick={() => setForm((f) => ({ ...f, schedule: [...f.schedule, { weekday: 1, time: '17:00', duration: 60 }] }))}
              >
                <Plus size={16} /> Añadir
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {form.schedule.map((s, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,5.5rem)_minmax(0,4.75rem)_auto] items-center gap-2 animate-fade-up">
                <select className="input !py-2 !px-2 !text-sm" value={s.weekday} onChange={(e) => setSlot(i, 'weekday', Number(e.target.value))} aria-label="Día">
                  {WEEKDAYS.map((w, k) => <option key={w} value={k + 1}>{w}</option>)}
                </select>
                <input type="time" className="input !py-2 !px-2 !text-sm" value={s.time} onChange={(e) => setSlot(i, 'time', e.target.value)} aria-label="Hora" step="300" />
                <select className="input !py-2 !px-2 !text-sm" value={s.duration} onChange={(e) => setSlot(i, 'duration', Number(e.target.value))} aria-label="Duración">
                  {[30, 45, 60, 75, 90, 120].map((d) => <option key={d} value={d}>{d}′</option>)}
                </select>
                <button type="button" className="p-2 text-ink-300 hover:text-rose-600" onClick={() => setForm((f) => ({ ...f, schedule: f.schedule.filter((_, j) => j !== i) }))} aria-label="Quitar">
                  <X size={18} />
                </button>
              </div>
            ))}
            {!form.schedule.length && <p className="text-sm text-ink-300">Sin clases fijas.</p>}
            {(errors.schedule || warned) && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{errors.schedule || warned.replace(' Pulsa «Guardar» otra vez para guardarlo igualmente.', '')}</p>}
          </div>
        </section>

        <div className="flex gap-2 lg:col-span-2">
          {existing && (
            <button type="button" className="btn-danger" onClick={() => setConfirm(true)}>
              <Trash2 size={16} /> Eliminar
            </button>
          )}
          <button type="button" className="btn-secondary ml-auto" onClick={() => goBack()}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Eliminar alumno"
        message={`Se eliminarán ${existing ? fullName(existing) : ''} y todo su historial, tareas, notas y asignaciones. Esta acción no se puede deshacer.`}
        onConfirm={() => {
          actions.deleteStudent(existing.id);
          actions.notify('Alumno eliminado');
          navigate('/alumnos', { replace: true });
        }}
      />
    </>
  );
}
