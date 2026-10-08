import { useEffect, useState } from 'react';
import Sheet from '../ui/Sheet.jsx';
import Field from '../ui/Field.jsx';
import Segmented from '../ui/Segmented.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { ARTICULATIONS, REPERTOIRE_LEVELS, REPERTOIRE_TYPES, techniqueCategories } from '../../utils/constants.js';

const DEFAULTS = {
  obra: { title: '', composer: '', level: 'Elemental' },
  estudio: { method: '', number: 1, author: '', level: 'Elemental', focus: '' },
  escala: { tonality: '', articulation: 'Legato', targetBpm: 80, octaves: 2, level: 'Elemental' },
  tecnica: { category: 'Arco', title: '', description: '', level: 'Elemental' },
};

/** Alta y edición de elementos de la biblioteca */
export default function ItemFormSheet({ open, onClose, item, defaultType = 'obra', onSaved }) {
  const { state, actions } = useStore();
  const subject = state.settings.subject;
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(item ? { ...item } : { type: defaultType, instrument: subject, ...DEFAULTS[defaultType], ...(defaultType === 'tecnica' ? { category: techniqueCategories(subject)[0] } : {}) });
      setError('');
    }
  }, [open, item, defaultType, subject]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const changeType = (type) => setForm((f) => ({ type, instrument: f.instrument, ...DEFAULTS[type], ...(type === 'tecnica' ? { category: techniqueCategories(subject)[0] } : {}) }));

  const save = () => {
    const required = { obra: 'title', estudio: 'method', escala: 'tonality', tecnica: 'title' }[form.type];
    if (!String(form[required] || '').trim()) return setError('Completa los campos obligatorios');
    const data = { ...form };
    if (data.type === 'estudio') data.number = Number(data.number) || 1;
    if (data.type === 'escala') {
      data.targetBpm = Number(data.targetBpm) || 60;
      data.octaves = Number(data.octaves) || 1;
    }
    const saved = actions.saveItem(data);
    actions.notify(item ? 'Cambios guardados' : 'Añadido a la biblioteca');
    onSaved?.(saved);
    onClose();
  };

  const t = form.type;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={item ? 'Editar' : 'Nuevo en la biblioteca'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save}>Guardar</button>
        </>
      }
    >
      {t && (
        <div className="space-y-4">
          {!item && (
            <Segmented
              value={t}
              onChange={changeType}
              options={Object.entries(REPERTOIRE_TYPES).map(([value, x]) => ({ value, label: x.singular.split(' ')[0] }))}
            />
          )}
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <Field label="Nivel">
            <select className="input" value={form.level} onChange={set('level')}>
              {REPERTOIRE_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>

          {t === 'obra' && (
            <>
              <Field label="Título *"><input className="input" value={form.title} onChange={set('title')} placeholder="Ej.: Élégie, Op. 24" /></Field>
              <Field label="Compositor"><input className="input" value={form.composer} onChange={set('composer')} placeholder="Ej.: Gabriel Fauré" /></Field>
            </>
          )}

          {t === 'estudio' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Método *" className="col-span-2"><input className="input" value={form.method} onChange={set('method')} placeholder="Ej.: Dotzauer · 113 Estudios" /></Field>
                <Field label="Número"><input type="number" min="1" className="input" value={form.number} onChange={set('number')} /></Field>
              </div>
              <Field label="Autor"><input className="input" value={form.author} onChange={set('author')} /></Field>
              <Field label="Objetivo técnico"><input className="input" value={form.focus} onChange={set('focus')} placeholder="Ej.: Cruce de cuerdas" /></Field>
            </>
          )}

          {t === 'escala' && (
            <>
              <Field label="Tonalidad *"><input className="input" value={form.tonality} onChange={set('tonality')} placeholder="Ej.: Sol Mayor" /></Field>
              <Field label="Articulación">
                <select className="input" value={form.articulation} onChange={set('articulation')}>
                  {ARTICULATIONS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Velocidad objetivo (BPM)"><input type="number" min="30" max="240" className="input" value={form.targetBpm} onChange={set('targetBpm')} /></Field>
                <Field label="Octavas"><input type="number" min="1" max="4" className="input" value={form.octaves} onChange={set('octaves')} /></Field>
              </div>
            </>
          )}

          {t === 'tecnica' && (
            <>
              <Field label="Categoría">
                <div className="flex flex-wrap gap-1.5">
                  {techniqueCategories(subject).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: c }))}
                      className={`chip !py-1.5 !px-3 transition ${form.category === c ? 'bg-ink-800 text-white' : 'bg-ink-50 text-ink-500'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Ejercicio *"><input className="input" value={form.title} onChange={set('title')} placeholder="Ej.: Cambios de arco en el talón" /></Field>
              <Field label="Descripción"><textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} /></Field>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
