import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import Field from '../ui/Field.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { MATERIAL_KINDS, itemTitle } from '../../utils/constants.js';
import { formatBytes, saveFile } from '../../utils/files.js';
import { fullName } from '../../utils/selectors.js';

const MAX_BYTES = 80 * 1024 * 1024;

/** Adjuntar PDF, vídeo, audio o enlace a un alumno y/o a una obra */
export default function MaterialFormSheet({ open, onClose, studentId = '', itemId = '' }) {
  const { state, actions } = useStore();
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ kind: 'pdf', title: '', url: '', source: 'file', studentId, itemId });
      setFile(null);
      setError('');
    }
  }, [open, studentId, itemId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isLink = form.kind === 'link';
  const useFile = !isLink && form.source === 'file';

  const save = async () => {
    setError('');
    if (!form.studentId && !form.itemId) return setError('Asocia el material a un alumno o a una obra');
    if (useFile && !file) return setError('Selecciona un archivo');
    if (!useFile && !/^https?:\/\//i.test(form.url)) return setError('Introduce una URL que empiece por http:// o https://');
    if (file && file.size > MAX_BYTES) return setError(`El archivo supera ${formatBytes(MAX_BYTES)}`);
    setSaving(true);
    try {
      const base = {
        kind: form.kind,
        title: form.title.trim() || file?.name || form.url,
        studentId: form.studentId || null,
        itemId: form.itemId || null,
      };
      if (useFile) {
        const saved = actions.saveMaterial({ ...base, source: 'file', fileName: file.name, size: file.size, mime: file.type });
        await saveFile(saved.id, file);
      } else {
        actions.saveMaterial({ ...base, source: 'url', url: form.url.trim() });
      }
      actions.notify('Material añadido');
      onClose();
    } catch (e) {
      setError(`No se pudo guardar el archivo: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const items = state.items.filter((i) => i.instrument === state.settings.subject);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Añadir material"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </>
      }
    >
      {form.kind && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(MATERIAL_KINDS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm((f) => ({ ...f, kind: k, source: k === 'link' ? 'url' : f.source }))}
                className={`rounded-xl px-1 py-2.5 text-xs font-semibold transition ${form.kind === k ? 'bg-ink-800 text-white' : 'bg-ink-50 text-ink-500'}`}
              >
                {v.label.replace('Partitura ', '')}
              </button>
            ))}
          </div>

          {!isLink && (
            <div className="flex gap-4 text-sm">
              {[['file', 'Subir archivo'], ['url', 'Enlace (YouTube, Drive, IMSLP…)']].map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-ink-600">
                  <input type="radio" name="source" checked={form.source === v} onChange={() => setForm((f) => ({ ...f, source: v }))} className="accent-ink-800" />
                  {l}
                </label>
              ))}
            </div>
          )}

          {useFile ? (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 p-6 text-center hover:border-ink-400 transition">
              <Upload className="text-ink-300" />
              <span className="text-sm font-semibold text-ink-600">{file ? file.name : 'Elegir archivo'}</span>
              <span className="text-xs text-ink-300">{file ? formatBytes(file.size) : 'Se guarda en este navegador'}</span>
              <input type="file" accept={MATERIAL_KINDS[form.kind].accept} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          ) : (
            <Field label="URL">
              <input className="input" type="url" value={form.url} onChange={set('url')} placeholder="https://" />
            </Field>
          )}

          <Field label="Título">
            <input className="input" value={form.title} onChange={set('title')} placeholder="Ej.: Parte de violonchelo" />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Alumno">
              <select className="input" value={form.studentId || ''} onChange={set('studentId')}>
                <option value="">— Ninguno —</option>
                {state.students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
              </select>
            </Field>
            <Field label="Obra / estudio">
              <select className="input" value={form.itemId || ''} onChange={set('itemId')}>
                <option value="">— Ninguno —</option>
                {items.map((i) => <option key={i.id} value={i.id}>{itemTitle(i)}</option>)}
              </select>
            </Field>
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      )}
    </Sheet>
  );
}
