import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, FolderInput, RotateCcw, Send, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Field from '../components/ui/Field.jsx';
import Sheet, { ConfirmDialog } from '../components/ui/Sheet.jsx';
import Logo from '../components/brand/Logo.jsx';
import { APP_CREDIT, APP_VERSION } from '../config.js';
import { useStore } from '../store/StoreContext.jsx';
import { DEMO_SUBJECTS, SUBJECT_GROUPS, isInstrumentSubject } from '../utils/constants.js';
import { DEFAULT_TERMS, courseLabel, courseOf, courseRanges } from '../utils/courses.js';
import { formatFull } from '../utils/dates.js';
import { canShareFiles, createBackup, downloadBlob, readBackup, restoreAttachments, shareBlob } from '../utils/backup.js';



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
  const { state, actions } = useStore();
  const location = useLocation();
  const [profile, setProfile] = useState({ teacherName: state.settings.teacherName, school: state.settings.school, subject: state.settings.subject });
  const [terms, setTerms] = useState(state.settings.terms || DEFAULT_TERMS);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null); // copia leída, a la espera de confirmar
  const [demoSubject, setDemoSubject] = useState(DEMO_SUBJECTS.includes(state.settings.subject) ? state.settings.subject : 'Violonchelo');
  const [confirmDemo, setConfirmDemo] = useState(false);
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

  const makeBackup = async (share = false) => {
    setBusy(share ? 'share' : 'zip');
    setError('');
    try {
      const { blob, name, missing } = await createBackup(actions.getState());
      if (share) {
        const ok = await shareBlob(blob, name).catch((e) => {
          if (e?.name === 'AbortError') return 'cancel';
          throw e;
        });
        if (ok === 'cancel') return;
        if (!ok) downloadBlob(blob, name);
      } else {
        await downloadBlob(blob, name);
      }
      actions.markBackup();
      actions.notify(missing ? `Copia creada (${missing} adjuntos no encontrados)` : 'Copia de seguridad creada');
    } catch (e) {
      if (/cancel/i.test(e?.message || '')) return; // menú Compartir cerrado sin elegir
      setError(`No se pudo crear la copia: ${e.message}`);
    } finally {
      setBusy('');
    }
  };

  const pickBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const read = await readBackup(file);
      if (!read.data || read.data.version !== 1 || !Array.isArray(read.data.students)) throw new Error('el archivo no es una copia de Diapasón');
      setPending({ ...read, fileName: file.name });
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
      actions.notify(`Copia restaurada${restored ? ` con ${restored} adjuntos` : ''}`);
      setPending(null);
    } catch (err) {
      setError(`No se pudo restaurar: ${err.message}`);
    } finally {
      setBusy('');
    }
  };

  const last = state.settings.lastBackup;

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
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={20} /></div>
              <div>
                <h2 className="font-display text-xl">Copia de seguridad</h2>
                <p className="text-sm text-ink-500">
                  {last ? `Última copia: ${formatFull(last.slice(0, 10))}.` : 'Todavía no has hecho ninguna copia.'} Los datos se guardan solo en este dispositivo.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button className="btn-primary" onClick={() => makeBackup(false)} disabled={!!busy}><Download size={16} /> {busy === 'zip' ? 'Creando…' : 'Crear copia .zip'}</button>
              {canShareFiles() && (
                <button className="btn-secondary" onClick={() => makeBackup(true)} disabled={!!busy}><Send size={16} /> {busy === 'share' ? 'Preparando…' : 'Enviar copia…'}</button>
              )}
              <button className="btn-secondary" onClick={() => fileRef.current.click()} disabled={!!busy}><FolderInput size={16} /> Restaurar una copia</button>
            </div>
            <input ref={fileRef} type="file" accept=".zip,application/zip,.json,application/json" className="hidden" onChange={pickBackup} />
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <details className="rounded-xl bg-ink-50/60 px-3 py-2 text-sm text-ink-600">
              <summary className="cursor-pointer font-semibold text-ink-700">Pasar los datos del PC al iPad o al móvil (y al revés)</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>En el dispositivo donde has trabajado, pulsa <b>Crear copia .zip</b>. En Android se abre el menú Compartir (Drive, correo, WhatsApp, Descargas…); en iPhone o iPad, <b>Enviar copia…</b> permite usar AirDrop, correo o Drive.</li>
                <li>Lleva el archivo <i>Diapason-copia-….zip</i> al otro dispositivo.</li>
                <li>Allí, abre Ajustes → <b>Restaurar una copia</b> y elige el archivo.</li>
              </ol>
              <p className="mt-2 text-xs text-ink-400">Restaurar sustituye los datos del dispositivo por los de la copia, incluidos los PDF, audios y vídeos adjuntos. Trabaja en un solo dispositivo cada vez y pasa la copia al cambiar.</p>
            </details>
            <p className="text-xs text-ink-300">
              {state.students.length} alumnos · {state.items.filter((i) => i.instrument === state.settings.subject).length} elementos de repertorio · {state.lessons.length} registros de clase · {state.grades.length} actas · {state.materials.length} materiales
            </p>
          </section>

          <section className="card space-y-3 p-4">
            <h2 className="font-display text-xl">Datos de ejemplo</h2>
            <p className="text-sm text-ink-500">Diez alumnos con horario, repertorio, tareas, historial de clases, asistencia y notas del curso pasado.</p>
            <div className="flex flex-wrap gap-2">
              <select id="demo-subject" className="input !w-auto" value={demoSubject} onChange={(e) => setDemoSubject(e.target.value)} aria-label="Asignatura de los datos de ejemplo">
                {DEMO_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button className="btn-danger" onClick={() => setConfirmDemo(true)}><RotateCcw size={16} /> Cargar datos de ejemplo</button>
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
        </div>
      </div>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Restaurar copia"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPending(null)}>Cancelar</button>
            <button className="btn bg-rose-600 text-white hover:bg-rose-700" onClick={restore} disabled={busy === 'restore'}>{busy === 'restore' ? 'Restaurando…' : 'Sustituir mis datos'}</button>
          </>
        }
      >
        {pending && (
          <div className="space-y-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-800 break-all">{pending.fileName}</p>
            <ul className="space-y-1">
              {pending.data.exportedAt && <li>Copia del {formatFull(pending.data.exportedAt.slice(0, 10))} a las {pending.data.exportedAt.slice(11, 16)} (UTC)</li>}
              <li>{pending.data.settings?.teacherName} · {pending.data.settings?.subject}</li>
              <li>{pending.data.students.length} alumnos · {(pending.data.lessons || []).length} registros de clase · {pending.attachments.length} adjuntos</li>
            </ul>
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">Los datos actuales de este dispositivo se sustituirán por los de la copia. Si quieres conservarlos, crea antes una copia.</p>
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
    </>
  );
}
