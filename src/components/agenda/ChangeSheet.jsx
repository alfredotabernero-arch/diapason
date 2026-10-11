import { useEffect, useState } from 'react';
import { CalendarClock, CalendarX, Undo2 } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import Field from '../ui/Field.jsx';
import Segmented from '../ui/Segmented.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { endTime, formatLong } from '../../utils/dates.js';
import { fullName } from '../../utils/selectors.js';
import { activeStudents } from '../../utils/school.js';

const DURATIONS = [30, 45, 60, 75, 90, 120];
const quien = (appt) => (appt.isGroup || appt.group ? appt.group : fullName(appt.student || appt.students?.[0]));

/**
 * Cambiar una clase solo un día, sin tocar el horario semanal:
 * anularla o moverla a otro día y hora. Si la clase ya es un cambio (movida o suelta), se puede deshacer.
 */
export function ChangeSheet({ open, onClose, appt }) {
  const { actions } = useStore();
  const [mode, setMode] = useState('mover');
  const [toDate, setToDate] = useState('');
  const [toTime, setToTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || !appt) return;
    setMode('mover'); setToDate(appt.date); setToTime(appt.time); setNote('');
  }, [open, appt?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!appt) return null;
  const c = appt.change;
  const title = c ? (c.kind === 'extra' ? 'Clase puntual' : 'Clase movida') : 'Cambiar solo este día';

  const save = () => {
    const base = {
      studentIds: appt.students.map((s) => s.id), group: appt.isGroup ? appt.group : '',
      date: appt.date, time: appt.time, duration: appt.duration, note: note.trim(),
    };
    if (mode === 'anular') {
      actions.saveChange({ ...base, kind: 'anular' });
      actions.notify('Clase anulada ese día');
    } else {
      if (!toDate || !toTime) return;
      if (toDate === appt.date && toTime === appt.time) { onClose(); return; }
      actions.saveChange({ ...base, kind: 'mover', toDate, toTime });
      actions.notify(`Clase movida al ${formatLong(toDate).toLowerCase()} a las ${toTime}`);
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={c ? (
        <>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
          <button className="btn-primary" onClick={() => { actions.deleteChange(c.id); actions.notify(c.kind === 'extra' ? 'Clase puntual quitada' : 'La clase vuelve a su día y hora'); onClose(); }}>
            <Undo2 size={16} /> {c.kind === 'extra' ? 'Quitar la clase puntual' : 'Volver a su día y hora'}
          </button>
        </>
      ) : (
        <>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className={mode === 'anular' ? 'btn bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'} onClick={save}>
            {mode === 'anular' ? <><CalendarX size={16} /> Anular la clase</> : <><CalendarClock size={16} /> Mover la clase</>}
          </button>
        </>
      )}
    >
      <p className="mb-3 text-sm text-ink-500">
        <b className="text-ink-800">{quien(appt)}</b> · {formatLong(appt.date)} · {appt.time}–{endTime(appt.time, appt.duration)}
      </p>
      {c ? (
        <div className="space-y-2 text-sm text-ink-600">
          {c.kind === 'mover' && <p>Esta clase es la del <b>{formatLong(c.date).toLowerCase()}</b> a las <b>{c.time}</b>, movida a este día.</p>}
          {c.kind === 'extra' && <p>Es una clase suelta, solo este día: no forma parte del horario semanal.</p>}
          {c.note && <p className="rounded-xl bg-ink-50 px-3 py-2">«{c.note}»</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <Segmented value={mode} onChange={setMode} options={[{ value: 'mover', label: 'Moverla' }, { value: 'anular', label: 'Anularla' }]} />
          {mode === 'mover' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nuevo día"><input type="date" className="input" value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
              <Field label="Nueva hora"><input type="time" step="300" className="input" value={toTime} onChange={(e) => setToTime(e.target.value)} /></Field>
            </div>
          )}
          <Field label="Motivo (opcional)">
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'anular' ? 'Festivo, enfermedad, audición…' : 'Se recupera la clase del festivo…'} />
          </Field>
          <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">Solo cambia este día. El horario semanal del alumno sigue igual; para cambiarlo para siempre, usa «Cambiar horario» en su ficha.</p>
        </div>
      )}
    </Sheet>
  );
}

/** Clase suelta: un día concreto, para un alumno o un grupo, fuera del horario semanal */
export function ExtraSheet({ open, onClose, date }) {
  const { state, actions } = useStore();
  const students = activeStudents(state, date).sort((a, b) => fullName(a).localeCompare(fullName(b), 'es'));
  const groups = [...new Set(students.map((s) => s.group).filter(Boolean))].sort();
  const [who, setWho] = useState('');
  const [d, setD] = useState(date);
  const [time, setTime] = useState('17:00');
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState('');

  useEffect(() => { if (open) { setD(date); setWho(''); setNote(''); } }, [open, date]);

  const save = () => {
    if (!who || !d || !time) return;
    const isGroup = who.startsWith('g:');
    const ids = isGroup ? students.filter((s) => s.group === who.slice(2)).map((s) => s.id) : [who.slice(2)];
    actions.saveChange({ kind: 'extra', studentIds: ids, group: isGroup ? who.slice(2) : '', date: d, time, duration: Number(duration), note: note.trim() });
    actions.notify('Clase puntual añadida');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Clase puntual"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={save} disabled={!who}>Añadir</button></>}
    >
      <div className="space-y-3">
        <Field label="Para">
          <select className="input" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">Elige un alumno o un grupo…</option>
            {groups.length > 0 && <optgroup label="Grupos">{groups.map((g) => <option key={g} value={`g:${g}`}>{g}</option>)}</optgroup>}
            <optgroup label="Alumnos">{students.map((s) => <option key={s.id} value={`s:${s.id}`}>{fullName(s)}</option>)}</optgroup>
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Día"><input type="date" className="input !px-2" value={d} onChange={(e) => setD(e.target.value)} /></Field>
          <Field label="Hora"><input type="time" step="300" className="input !px-2" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          <Field label="Duración">
            <select className="input !px-2" value={duration} onChange={(e) => setDuration(e.target.value)}>{DURATIONS.map((x) => <option key={x} value={x}>{x}′</option>)}</select>
          </Field>
        </div>
        <Field label="Motivo (opcional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Clase de refuerzo, ensayo antes de la audición…" /></Field>
        <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">Solo ese día: no cambia el horario semanal.</p>
      </div>
    </Sheet>
  );
}
