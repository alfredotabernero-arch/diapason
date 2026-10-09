import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeftRight, CheckCircle2, CircleDot, FolderInput, LogOut, RotateCcw, Send, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Field from '../components/ui/Field.jsx';
import Sheet, { ConfirmDialog } from '../components/ui/Sheet.jsx';
import Logo from '../components/brand/Logo.jsx';
import { APP_CREDIT, APP_VERSION } from '../config.js';
import { isNative } from '../utils/platform.js';
import { requestExit } from '../utils/backStack.js';
import { useStore } from '../store/StoreContext.jsx';
import { DEMO_SUBJECTS, SUBJECT_GROUPS, isInstrumentSubject } from '../utils/constants.js';
import { DEFAULT_TERMS, courseLabel, courseOf, courseRanges } from '../utils/courses.js';
import { readBackup, restoreAttachments } from '../utils/backup.js';
import { useEnviarDatos } from '../utils/useTransfer.js';
import { deviceLabel, deviceName, hasPending, otherKind, receiveWarnings, whenLabel } from '../utils/paso.js';



function SubjectSelect({ value, onChange, id }) {
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {SUBJECT_GROUPS.map((g) => (
        <optgroup key={g.family} label={g.label}>
          {g.subjects.map((s) => <option key={s}>{s}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export default function Settings() {
  const { state, actions, paso } = useStore();
  const location = useLocation();
  const [profile, setProfile] = useState({ teacherName: state.settings.teacherName, school: state.settings.school, subject: state.settings.subject });
  const [terms, setTerms] = useState(state.settings.terms || DEFAULT_TERMS);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null); // copia leída, a la espera de confirmar
  const [demoSubject, setDemoSubject] = useState(DEMO_SUBJECTS.includes(state.settings.subject) ? state.settings.subject : 'Violonchelo');
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef();
  const course = courseOf();
  const ranges = courseRanges(course, terms);
  const subjectChanged = profile.subject !== state.settings.subject;

  useEffect(() => {
    if (location.hash === '#copia') document.getElementById('copia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  const saveProfile = () => {
    actions.saveSettings(profile);
    actions.notify(subjectChanged ? `Asignatura cambiada a ${profile.subject}` : 'Perfil guardado');
  };

  const setTerm = (k, edge) => (e) => {
    const v = e.target.value; // AAAA-MM-DD
    if (v) setTerms((t) => ({ ...t, [k]: { ...t[k], [edge]: v.slice(5) } }));
  };

  const { send, busy: sending, error: sendError } = useEnviarDatos();

  const pickBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const read = await readBackup(file);
      if (!read.data || read.data.version !== 1 || !Array.isArray(read.data.students)) throw new Error('el archivo no es una copia de Diapasón');
      setPending({ ...read, fileName: file.name, warnings: receiveWarnings(paso, read.data.origen) });
    } catch (err) {
      setError(`No se pudo leer la copia: ${err.message}`);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      const restored = await restoreAttachments(pending.attachments, pending.data.materials || []);
      actions.replaceState(pending.data);
      setProfile({ teacherName: pending.data.settings?.teacherName || '', school: pending.data.settings?.school || '', subject: pending.data.settings?.subject || 'Violonchelo' });
      setTerms(pending.data.settings?.terms || DEFAULT_TERMS);
      actions.notify(`Datos recibidos ✓${restored ? ` (${restored} adjuntos)` : ''}`);
      setPending(null);
    } catch (err) {
      setError(`No se pudo restaurar: ${err.message}`);
    } finally {
      setBusy('');
    }
  };

  const pendingHere = hasPending(paso);
  const other = otherKind(paso);

  return (
    <>
      <PageHeader back title="Ajustes" />
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <section className="card space-y-4 p-4">
            <h2 className="font-display text-xl">Profesor y asignatura</h2>
            <Field label="Nombre del profesor">
              <input id="teacher-name" className="input" value={profile.teacherName} onChange={(e) => setProfile({ ...profile, teacherName: e.target.value })} />
            </Field>
            <Field label="Centro / escuela">
              <input id="school" className="input" value={profile.school} onChange={(e) => setProfile({ ...profile, school: e.target.value })} />
            </Field>
            <Field label="Asignatura que impartes" hint="Cada copia de Diapasón es de un profesor y una asignatura">
              <SubjectSelect id="subject" value={profile.subject} onChange={(subject) => setProfile({ ...profile, subject })} />
            </Field>
            {subjectChanged && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                La biblioteca mostrará el repertorio de {profile.subject}.
                {isInstrumentSubject(profile.subject)
                  ? ` Los alumnos de ${state.settings.subject} pasarán a ${profile.subject}.`
                  : ' Cada alumno conserva su especialidad instrumental, que podrás ver y filtrar.'}
              </p>
            )}
            <button className="btn-primary" onClick={saveProfile}>Guardar</button>
          </section>

          <section className="card space-y-3 p-4">
            <div>
              <h2 className="font-display text-xl">Curso y trimestres</h2>
              <p className="text-xs text-ink-400">{courseLabel(course)}. Las fechas se aplican cada curso (septiembre a junio) y sirven para las notas y los listados de asistencia.</p>
            </div>
            {['t1', 't2', 't3'].map((k, i) => (
              <div key={k} className="grid grid-cols-2 items-end gap-x-2 gap-y-1 sm:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)]">
                <span className="col-span-2 text-sm font-semibold text-ink-700 sm:col-span-1 sm:pb-3">{i + 1}.{i === 1 ? 'º' : 'er'} trim.</span>
                <Field label="Desde"><input id={`${k}-from`} type="date" className="input !px-2" value={ranges[k].from} onChange={setTerm(k, 'from')} /></Field>
                <Field label="Hasta"><input id={`${k}-to`} type="date" className="input !px-2" value={ranges[k].to} onChange={setTerm(k, 'to')} /></Field>
              </div>
            ))}
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => { actions.saveSettings({ terms }); actions.notify('Trimestres guardados'); }}>Guardar trimestres</button>
              <button className="btn-ghost" onClick={() => setTerms(DEFAULT_TERMS)}>Valores por defecto</button>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section id="copia" className="card space-y-3 p-4 scroll-mt-24">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brass-50 text-brass-600"><ArrowLeftRight size={20} /></div>
              <div>
                <h2 className="font-display text-xl">Pasar datos y copia de seguridad</h2>
                <p className="text-sm text-ink-500">Tus datos se guardan solo en este dispositivo. Para trabajar en otro (PC, Mac, iPad o móvil), <b>envía</b> los datos aquí y <b>recíbelos</b> allí.</p>
              </div>
            </div>
            <dl className="divide-y divide-ink-100 rounded-xl border border-ink-100 text-sm">
              {[
                ['Este dispositivo', deviceLabel(paso.device)],
                ['Último cambio aquí', whenLabel(paso.lastChange) || '—'],
                ['Último envío', whenLabel(paso.lastSent) || 'Nunca'],
                ['Última recepción', paso.lastReceived ? `${whenLabel(paso.lastReceived.at)}${paso.lastReceived.from ? ` (desde ${deviceName(paso.lastReceived.from)})` : ''}` : 'Nunca'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="text-right font-semibold text-ink-800">{v}</dd>
                </div>
              ))}
            </dl>
            {pendingHere ? (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <CircleDot size={16} className="mt-0.5 shrink-0" /> Hay cambios aquí que todavía no has enviado. Pulsa <b>Enviar datos</b> antes de cambiar de dispositivo.
              </p>
            ) : (
              <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> No hay cambios pendientes de enviar.
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button className="btn-primary" onClick={send} disabled={sending || !!busy}><Send size={16} /> {sending ? 'Preparando…' : 'Enviar datos'}</button>
              <button className="btn-secondary" onClick={() => fileRef.current.click()} disabled={sending || !!busy}><FolderInput size={16} /> Recibir datos</button>
            </div>
            <input ref={fileRef} type="file" accept=".zip,application/zip,.json,application/json" className="hidden" onChange={pickBackup} />
            {(error || sendError) && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error || sendError}</p>}
            <details className="rounded-xl bg-ink-50/60 px-3 py-2 text-sm text-ink-600">
              <summary className="cursor-pointer font-semibold text-ink-700">Cómo pasar los datos{other ? ` con ${deviceName(other)}` : ' a otro dispositivo'}</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Aquí: <b>Enviar datos</b>. Se crea un fichero <i>diapason-{paso.device === 'Android' ? 'movil' : paso.device.toLowerCase()}-fecha-hora.zip</i> con todo, adjuntos incluidos. {paso.device === 'PC' ? 'Guárdalo, por ejemplo, en el Escritorio.' : paso.device === 'Android' ? 'Se abre el menú Compartir: Drive, Gmail, WhatsApp, Quick Share…' : 'Se abre el menú Compartir: AirDrop, Guardar en Archivos, correo, Drive…'}</li>
                <li>Hazlo llegar al otro dispositivo: AirDrop (iPad ⇄ Mac), Drive o OneDrive, correo, WhatsApp o un pendrive.</li>
                <li>Allí: Ajustes › <b>Recibir datos</b>, elige el fichero y pulsa <b>Sustituir</b>.</li>
              </ol>
              <p className="mt-2 text-xs text-ink-400">La regla de oro: trabaja en un dispositivo cada vez. Al terminar en uno, envía; al empezar en el otro, recibe. Cada fichero enviado es también una copia de seguridad completa: guarda uno de vez en cuando en Drive o en el correo.</p>
            </details>
            <p className="text-xs text-ink-300">
              {state.students.length} alumnos · {state.items.filter((i) => i.instrument === state.settings.subject).length} elementos de repertorio · {state.lessons.length} registros de clase · {state.grades.length} actas · {state.materials.length} materiales
            </p>
          </section>

          <section className="card space-y-3 p-4">
            <h2 className="font-display text-xl">Datos de ejemplo y empezar de cero</h2>
            <p className="text-sm text-ink-500">Diez alumnos con horario, repertorio, tareas, historial de clases, asistencia y notas del curso pasado, para probar Diapasón.</p>
            <div className="flex flex-wrap gap-2">
              <select id="demo-subject" className="input !w-auto" value={demoSubject} onChange={(e) => setDemoSubject(e.target.value)} aria-label="Asignatura de los datos de ejemplo">
                {DEMO_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button className="btn-secondary" onClick={() => setConfirmDemo(true)}><RotateCcw size={16} /> Cargar datos de ejemplo</button>
            </div>
            <div className="border-t border-ink-100 pt-3">
              <p className="text-sm text-ink-500">Cuando quieras trabajar con tus alumnos, borra los datos de ejemplo. Se conservan tu nombre, el centro, la asignatura, los trimestres y la biblioteca de repertorio.</p>
              <button className="btn-danger mt-2" onClick={() => setConfirmClear(true)}><Trash2 size={16} /> Borrar todo y empezar</button>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="fork-vibrate-hover bg-paper px-6 pt-8 pb-5 text-center">
              <Logo variant="lockup" vibrate className="mx-auto block w-full max-w-[320px] h-auto" />
              <p className="mt-5 font-display text-lg italic text-ink-700">{APP_CREDIT}</p>
            </div>
            <div className="border-t border-ink-100 px-4 py-3 text-xs text-ink-400">
              <p>
                Versión {APP_VERSION}. La «i» del logotipo es un diapasón en La 440 Hz dibujado a escala real: mango 31 mm, púas 79 mm, 120 mm en total.
              </p>
            </div>
          </section>

          {isNative() && (
            <button className="btn-secondary w-full" onClick={requestExit}>
              <LogOut size={18} /> Salir de Diapasón
            </button>
          )}
        </div>
      </div>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Recibir datos"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPending(null)}>Cancelar</button>
            <button className={`btn text-white ${pending?.warnings?.length ? 'bg-rose-600 hover:bg-rose-700' : 'bg-ink-800 hover:bg-ink-700'}`} onClick={restore} disabled={busy === 'restore'}>{busy === 'restore' ? 'Recibiendo…' : 'Sustituir'}</button>
          </>
        }
      >
        {pending && (
          <div className="space-y-3 text-sm text-ink-600">
            <p className="font-display text-lg leading-snug text-ink-900">
              {pending.data.origen
                ? `Copia hecha en ${deviceName(pending.data.origen.device)} ${whenLabel(pending.data.origen.createdAt)}`
                : pending.data.exportedAt ? `Copia hecha ${whenLabel(pending.data.exportedAt)}` : 'Copia de Diapasón'}
            </p>
            <p className="break-all text-xs text-ink-400">{pending.fileName}</p>
            <ul className="space-y-1">
              <li>{pending.data.settings?.teacherName} · {pending.data.settings?.subject}</li>
              <li>{pending.data.students.length} alumnos · {(pending.data.lessons || []).length} registros de clase · {pending.attachments.length} adjuntos</li>
            </ul>
            {pending.warnings?.map((w) => (
              <div key={w.id} className="flex gap-2 rounded-xl bg-rose-50 px-3 py-2 text-rose-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p><b>{w.title}.</b> {w.text}</p>
              </div>
            ))}
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
              <b>Sustituir</b> deja este dispositivo exactamente igual que la copia: lo que hay ahora aquí se reemplaza. {pending.warnings?.length ? 'Ante la duda, Cancelar no cambia nada.' : ''}
            </p>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmDemo}
        onClose={() => setConfirmDemo(false)}
        title="Cargar datos de ejemplo"
        message={`Se sustituirán todos tus datos por los de ejemplo de ${demoSubject}. Crea antes una copia si quieres conservarlos.`}
        confirmLabel="Cargar"
        onConfirm={() => {
          actions.resetDemo(demoSubject);
          setProfile((p) => ({ ...p, subject: demoSubject }));
          actions.notify(`Datos de ejemplo de ${demoSubject} cargados`);
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Borrar todo y empezar"
        message="Se borrarán todos los alumnos con sus clases, tareas, notas, calificaciones y material. Se conservan tu nombre, el centro, la asignatura, los trimestres y la biblioteca de repertorio. Si quieres guardar lo que hay, crea antes una copia."
        confirmLabel="Borrar todo"
        onConfirm={() => {
          actions.clearAll();
          actions.notify('Listo: Diapasón está vacío para empezar');
        }}
      />
    </>
  );
}
