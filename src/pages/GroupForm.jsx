import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, UserPlus, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Field from '../components/ui/Field.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import { ConfirmDialog } from '../components/ui/Sheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { WEEKDAYS, todayISO } from '../utils/dates.js';
import { fullName, normalize } from '../utils/selectors.js';
import { isActive } from '../utils/school.js';
import { useGoBack } from '../utils/navigation.js';

const EMPTY = { name: '', kind: 'estable', schedule: [{ weekday: 5, time: '19:00', duration: 60 }], memberIds: [], notes: '', archived: false };
const NUEVO = { firstName: '', lastName: '', email: '', phone: '' };

/** Alta y edición de un grupo: nombre, tipo, horario, miembros (también «solo de grupo») y observaciones */
export default function GroupForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack('/alumnos?vista=grupos');
  const { state, actions } = useStore();
  const existing = (state.groups || []).find((g) => g.id === id);
  const [form, setForm] = useState(EMPTY);
  const [q, setQ] = useState('');
  const [nuevo, setNuevo] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (existing) setForm({ ...EMPTY, ...existing, schedule: existing.schedule || [] });
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (id && !existing) return <PageHeader back title="Grupo no encontrado" />;

  const setSlot = (i, k, v) => setForm((f) => ({ ...f, schedule: f.schedule.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
  const toggle = (sid) => setForm((f) => ({ ...f, memberIds: f.memberIds.includes(sid) ? f.memberIds.filter((x) => x !== sid) : [...f.memberIds, sid] }));
  const candidates = state.students
    .filter((s) => isActive(s) || form.memberIds.includes(s.id))
    .filter((s) => normalize(`${fullName(s)} ${s.instrument} ${s.level}`).includes(normalize(q)))
    .sort((a, b) => Number(form.memberIds.includes(b.id)) - Number(form.memberIds.includes(a.id)) || fullName(a).localeCompare(fullName(b), 'es'));

  const crearSoloGrupo = () => {
    if (!nuevo.firstName.trim() || !nuevo.lastName.trim()) return setError('Escribe el nombre y los apellidos de la persona');
    if (nuevo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo.email)) return setError('Email no válido');
    const st = actions.saveStudent({
      firstName: nuevo.firstName.trim(), lastName: nuevo.lastName.trim(), email: nuevo.email.trim(), phone: nuevo.phone.trim(),
      instrument: state.settings.subject, level: '', schedule: [], notes: '', groupOnly: true, since: todayISO(),
    });
    setForm((f) => ({ ...f, memberIds: [...f.memberIds, st.id] }));
    setNuevo(null);
    setError('');
    actions.notify(`${st.firstName} añadido como miembro solo de grupo`);
  };

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Ponle un nombre al grupo');
    const dup = (state.groups || []).find((g) => g.id !== existing?.id && normalize(g.name) === normalize(form.name.trim()));
    if (dup) return setError(`Ya hay un grupo llamado «${dup.name}»`);
    const saved = actions.saveGroup({
      ...form,
      name: form.name.trim(),
      schedule: form.schedule.map((s) => ({ weekday: Number(s.weekday), time: s.time, duration: Number(s.duration) })),
    });
    actions.notify(existing ? 'Grupo actualizado' : 'Grupo creado');
    navigate(`/grupos/${saved.id}`, { replace: true });
  };

  return (
    <>
      <PageHeader back title={existing ? 'Editar grupo' : 'Nuevo grupo'} subtitle={existing ? existing.name : 'Conjunto, dúo, trío o clase colectiva'} />
      <form onSubmit={save} className="grid gap-5 lg:grid-cols-2 lg:items-start" noValidate>
        <div className="space-y-5">
          <section className="card space-y-4 p-4">
            <Field label="Nombre del grupo *">
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej.: Ensemble de violonchelos" />
            </Field>
            <div>
              <span className="label">Tipo</span>
              <Segmented value={form.kind} onChange={(v) => setForm((f) => ({ ...f, kind: v }))} options={[{ value: 'estable', label: 'Estable' }, { value: 'ocasional', label: 'Ocasional (dúo, trío…)' }]} />
              <p className="mt-1 text-xs text-ink-300">{form.kind === 'estable' ? 'Con horario semanal: sus ensayos salen solos en la agenda.' : 'Sin horario fijo: sus ensayos se ponen con «Clase puntual». Archívalo cuando termine.'}</p>
            </div>
            <Field label="Observaciones">
              <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Objetivo, concierto, repertorio…" />
            </Field>
            {existing && (
              <label className="flex items-start gap-3 rounded-xl border border-ink-100 px-3 py-2.5">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-ink-800" checked={!!form.archived} onChange={(e) => setForm((f) => ({ ...f, archived: e.target.checked }))} />
                <span className="text-sm"><b className="text-ink-800">Archivado</b><span className="block text-xs text-ink-400">Ya no ensaya: sale de la agenda, pero conserva sus clases y la asistencia.</span></span>
              </label>
            )}
          </section>

          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl">Horario del grupo</h2>
                <p className="text-xs text-ink-400">{form.kind === 'ocasional' ? 'Opcional en un grupo ocasional' : 'Genera los ensayos en la agenda'}</p>
              </div>
              <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => setForm((f) => ({ ...f, schedule: [...f.schedule, { weekday: 1, time: '17:00', duration: 60 }] }))}>
                <Plus size={16} /> Añadir
              </button>
            </div>
            <div className="space-y-2">
              {form.schedule.map((s, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,5.5rem)_minmax(0,4.75rem)_auto] items-center gap-2">
                  <select className="input !py-2 !px-2 !text-sm" value={s.weekday} onChange={(e) => setSlot(i, 'weekday', Number(e.target.value))} aria-label="Día">
                    {WEEKDAYS.map((w, k) => <option key={w} value={k + 1}>{w}</option>)}
                  </select>
                  <input type="time" className="input !py-2 !px-2 !text-sm" value={s.time} onChange={(e) => setSlot(i, 'time', e.target.value)} aria-label="Hora" step="300" />
                  <select className="input !py-2 !px-2 !text-sm" value={s.duration} onChange={(e) => setSlot(i, 'duration', Number(e.target.value))} aria-label="Duración">
                    {[30, 45, 60, 75, 90, 105, 120, 150, 180].map((d) => <option key={d} value={d}>{d}′</option>)}
                  </select>
                  <button type="button" className="p-2 text-ink-300 hover:text-rose-600" onClick={() => setForm((f) => ({ ...f, schedule: f.schedule.filter((_, j) => j !== i) }))} aria-label="Quitar">
                    <X size={18} />
                  </button>
                </div>
              ))}
              {!form.schedule.length && <p className="text-sm text-ink-300">Sin horario fijo.</p>}
            </div>
          </section>
        </div>

        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl">Miembros · {form.memberIds.length}</h2>
              <p className="text-xs text-ink-400">Marca a los alumnos que están en el grupo</p>
            </div>
            <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => setNuevo(NUEVO)} data-ayuda="solo-grupo">
              <UserPlus size={16} /> Solo de grupo
            </button>
          </div>
          {nuevo && (
            <div className="mb-3 space-y-2 rounded-2xl bg-violet-50/60 p-3">
              <p className="text-xs text-violet-800">Persona que solo viene al grupo: no tiene clase individual ni calificaciones; se lleva su asistencia y recibe los correos del grupo.</p>
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Nombre" value={nuevo.firstName} onChange={(e) => setNuevo((n) => ({ ...n, firstName: e.target.value }))} />
                <input className="input" placeholder="Apellidos" value={nuevo.lastName} onChange={(e) => setNuevo((n) => ({ ...n, lastName: e.target.value }))} />
                <input className="input" type="email" placeholder="Email" value={nuevo.email} onChange={(e) => setNuevo((n) => ({ ...n, email: e.target.value }))} />
                <input className="input" type="tel" placeholder="Teléfono" value={nuevo.phone} onChange={(e) => setNuevo((n) => ({ ...n, phone: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary !py-1.5" onClick={() => { setNuevo(null); setError(''); }}>Cancelar</button>
                <button type="button" className="btn-primary !py-1.5" onClick={crearSoloGrupo}>Añadir al grupo</button>
              </div>
            </div>
          )}
          <SearchInput value={q} onChange={setQ} placeholder="Buscar alumno…" />
          <ul className="mt-2 max-h-[28rem] space-y-1.5 overflow-y-auto">
            {candidates.map((s) => (
              <li key={s.id}>
                <label className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2">
                  <input type="checkbox" className="h-4 w-4 accent-ink-800" checked={form.memberIds.includes(s.id)} onChange={() => toggle(s.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-800">{fullName(s)}</span>
                    <span className="text-xs text-ink-400">{s.groupOnly ? 'Solo de grupo' : [s.instrument !== state.settings.subject ? s.instrument : '', s.level].filter(Boolean).join(' · ')}</span>
                  </span>
                </label>
              </li>
            ))}
            {!candidates.length && <p className="py-4 text-center text-sm text-ink-300">No hay alumnos.</p>}
          </ul>
        </section>

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 lg:col-span-2">{error}</p>}
        <div className="flex gap-2 lg:col-span-2">
          {existing && <button type="button" className="btn-danger" onClick={() => setConfirm(true)}><Trash2 size={16} /> Eliminar</button>}
          <button type="button" className="btn-secondary ml-auto" onClick={goBack}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Eliminar grupo"
        message="El grupo desaparece de la agenda y de las listas. Las clases ya dadas se conservan en el historial de cada alumno. Si solo ha dejado de ensayar, mejor archívalo."
        onConfirm={() => { actions.deleteGroup(existing); actions.notify('Grupo eliminado'); navigate('/alumnos?vista=grupos', { replace: true }); }}
      />
    </>
  );
}
