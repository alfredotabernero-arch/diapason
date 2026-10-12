import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Field from '../components/ui/Field.jsx';
import { ConfirmDialog } from '../components/ui/Sheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { INSTRUMENTS, instrumentStyle, isInstrumentSubject } from '../utils/constants.js';
import { WEEKDAYS, todayISO } from '../utils/dates.js';
import { CYCLE_YEARS, levelsOf, schoolYear } from '../utils/school.js';
import { activeGroups, fullName } from '../utils/selectors.js';
import { useGoBack } from '../utils/navigation.js';

const EMPTY = {
  firstName: '', lastName: '', instrument: '', level: '', groupOnly: false,
  phone: '', email: '', notes: '', schedule: [{ weekday: 1, time: '17:00', duration: 60 }],
  since: '', leftAt: null, permanent: false, yearAdjust: 0,
};

export default function StudentForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const goSchedule = searchParams.get('seccion') === 'horario';
  const navigate = useNavigate();
  const { state, actions } = useStore();
  const existing = state.students.find((s) => s.id === id);
  const goBack = useGoBack('/alumnos');
  const subject = state.settings.subject;
  const instrumentSubject = isInstrumentSubject(subject);
  const levels = levelsOf(state.settings);
  const [form, setForm] = useState({ ...EMPTY, instrument: instrumentSubject ? subject : 'Piano', level: levels.includes('Elemental 1º') ? 'Elemental 1º' : levels[0], since: todayISO() });
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [warned, setWarned] = useState('');
  const groups = activeGroups(state).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const [groupIds, setGroupIds] = useState(() => (existing ? groups.filter((g) => g.memberIds.includes(existing.id)).map((g) => g.id) : searchParams.get('grupo') ? [searchParams.get('grupo')] : []));

  useEffect(() => {
    if (existing) setForm({ ...EMPTY, ...existing, schedule: existing.schedule || [] });
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // «Cambiar horario» desde la ficha: lleva directamente al horario semanal
  useEffect(() => {
    if (!goSchedule) return;
    const t = setTimeout(() => document.getElementById('horario')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    return () => clearTimeout(t);
  }, [goSchedule]);

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
    for (const slot of (form.groupOnly ? [] : form.schedule)) {
      const s0 = toMin(slot.time);
      const s1 = s0 + Number(slot.duration);
      const clash = state.students.find((o) => o.id !== existing?.id
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
      instrument: instrumentSubject ? (form.instrument || subject) : form.instrument,
      schedule: form.schedule.map((s) => ({ weekday: Number(s.weekday), time: s.time, duration: Number(s.duration) })),
      yearAdjust: Number(form.yearAdjust) || 0,
    };
    if (data.groupOnly) data.schedule = [];
    const saved = actions.saveStudent(data);
    actions.setStudentGroups(saved.id, groupIds);
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
                {(levels.includes(form.level) || !form.level ? levels : [form.level, ...levels]).map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <label className="flex items-start gap-3 self-end rounded-xl border border-ink-100 px-3 py-2.5" data-ayuda="solo-grupo">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-ink-800" checked={!!form.groupOnly} onChange={(e) => setForm((f) => ({ ...f, groupOnly: e.target.checked }))} />
              <span className="text-sm"><b className="text-ink-800">Solo de grupo</b><span className="block text-xs text-ink-400">Sin clase individual ni calificaciones</span></span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Teléfono" error={errors.phone}>
              <input className="input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </Field>
          </div>
          <div>
            <span className="label">Grupos</span>
            {groups.length ? (
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => {
                  const on = groupIds.includes(g.id);
                  return (
                    <button type="button" key={g.id} onClick={() => setGroupIds((x) => (on ? x.filter((y) => y !== g.id) : [...x, g.id]))}
                      className={`chip !py-1.5 !px-3 transition ${on ? 'bg-violet-600 text-white' : 'bg-white text-ink-500 border border-ink-100'}`}>
                      {g.name}
                    </button>
                  );
                })}
              </div>
            ) : <p className="text-xs text-ink-300">No hay grupos. Se crean en Alumnos › Grupos.</p>}
          </div>
          <Field label="Observaciones">
            <textarea className="input min-h-[96px]" value={form.notes} onChange={set('notes')} placeholder="Objetivos, contacto familiar, aspectos a vigilar…" />
          </Field>
        </section>


        {!form.groupOnly && <section id="horario" className={`card p-4 scroll-mt-24 ${goSchedule ? 'ring-2 ring-brass-300' : ''}`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl">Horario semanal</h2>
              <p className="text-xs text-ink-400">Genera automáticamente las citas de la agenda</p>
            </div>
            <div className="flex gap-2">
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
            <p className="text-xs text-ink-300">Solo la clase individual. Los ensayos de sus grupos van en el horario de cada grupo.</p>
          </div>
        </section>}

        <section className="card space-y-3 p-4">
          <div>
            <h2 className="font-display text-xl">En la escuela</h2>
            <p className="text-xs text-ink-400">El curso del alta es el 1.º año del ciclo de {CYCLE_YEARS}. Cada curso se suma uno solo.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha de alta">
              <input type="date" className="input !px-2" value={form.since || ''} onChange={(e) => e.target.value && setForm((f) => ({ ...f, since: e.target.value }))} />
            </Field>
            <Field label="Año en la escuela" hint={form.permanent ? 'Permanente: no cuenta años' : form.yearAdjust ? 'Corregido a mano' : 'Calculado desde el alta'}>
              <input
                type="number" min="1" max="20" className="input" disabled={form.permanent}
                value={form.permanent ? '' : schoolYear(form)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1) setForm((f) => ({ ...f, yearAdjust: v - schoolYear({ ...f, yearAdjust: 0 }) }));
                }}
              />
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-ink-100 px-3 py-2.5">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-ink-800" checked={!!form.permanent} onChange={(e) => setForm((f) => ({ ...f, permanent: e.target.checked }))} />
            <span className="text-sm"><b className="text-ink-800">Alumno permanente</b><span className="block text-xs text-ink-400">Sin límite de años (por ejemplo, por los privilegios de la escuela). No se le proponen la baja ni los años.</span></span>
          </label>
          <Field label="Fecha de baja" hint={form.leftAt ? 'Desde el día siguiente pasa a antiguo alumno: sale de la agenda, pero conserva todo su historial.' : 'Déjala vacía mientras siga en la escuela.'}>
            <div className="flex gap-2">
              <input type="date" className="input !px-2" value={form.leftAt || ''} onChange={(e) => setForm((f) => ({ ...f, leftAt: e.target.value || null }))} />
              {form.leftAt && <button type="button" className="btn-secondary !px-3" onClick={() => setForm((f) => ({ ...f, leftAt: null }))}>Quitar</button>}
            </div>
          </Field>
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
