import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { DEFAULT_LEVELS, levelsOf } from '../../utils/school.js';

/**
 * Ajustes › Niveles: la lista la decide cada profesor (las escuelas de música no tienen niveles rígidos).
 * Renombrar un nivel lo cambia en todos los alumnos que lo tengan; quitar uno en uso pide a qué nivel pasarlos.
 * El orden sirve para «subir de nivel» al empezar el curso y para ordenar listados y estadísticas.
 */
export default function LevelsCard() {
  const { state, actions } = useStore();
  const initial = () => levelsOf(state.settings).map((l) => ({ orig: l, name: l }));
  const [rows, setRows] = useState(initial);
  const [nuevo, setNuevo] = useState('');
  const [quitar, setQuitar] = useState(null); // { i, orig, en: n }
  const [destino, setDestino] = useState('');
  const [removed, setRemoved] = useState({}); // orig → nivel al que pasan sus alumnos

  useEffect(() => { setRows(initial()); setRemoved({}); }, [state.settings.levels]); // eslint-disable-line react-hooks/exhaustive-deps

  const usage = (l) => state.students.filter((s) => s.level === l).length;
  const names = rows.map((r) => r.name.trim());
  const dupe = names.some((n, i) => !n || names.indexOf(n) !== i);
  const changed = JSON.stringify(names) !== JSON.stringify(levelsOf(state.settings)) || Object.keys(removed).length > 0;

  const move = (i, d) => setRows((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const add = () => { const v = nuevo.trim(); if (!v || names.includes(v)) return; setRows((r) => [...r, { orig: null, name: v }]); setNuevo(''); };
  const askRemove = (i) => {
    const r = rows[i];
    const n = r.orig ? usage(r.orig) : 0;
    if (!n) { setRows((x) => x.filter((_, k) => k !== i)); return; }
    setQuitar({ i, orig: r.orig, en: n });
    setDestino(rows.find((_, k) => k !== i)?.name || '');
  };
  const save = () => {
    if (dupe) return;
    const renames = { ...removed };
    for (const r of rows) if (r.orig && r.orig !== r.name.trim()) renames[r.orig] = r.name.trim();
    // si el destino de un nivel quitado se renombró, se sigue el nombre nuevo
    for (const k of Object.keys(removed)) { const t = rows.find((r) => r.orig === removed[k]); if (t) renames[k] = t.name.trim(); }
    actions.saveLevels(names, renames);
    actions.notify('Niveles guardados');
  };

  return (
    <section className="card space-y-3 p-4">
      <div>
        <h2 className="font-display text-xl">Niveles</h2>
        <p className="text-xs text-ink-400">Los niveles de tu escuela, en orden. Al renombrar uno, cambia en todos sus alumnos. El orden se usa para subir de nivel al empezar el curso.</p>
      </div>
      <ul className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <li key={`${r.orig || 'n'}-${i}`} className="flex items-center gap-1.5">
            <input className="input !py-1.5 !text-sm" value={r.name} onChange={(e) => setRows((x) => x.map((y, k) => (k === i ? { ...y, name: e.target.value } : y)))} aria-label={`Nivel ${i + 1}`} />
            <span className="w-8 shrink-0 text-center text-xs text-ink-300" title="Alumnos con este nivel">{r.orig ? usage(r.orig) || '' : ''}</span>
            <button className="btn-ghost !p-1.5" onClick={() => move(i, -1)} disabled={!i} aria-label="Subir"><ArrowUp size={15} /></button>
            <button className="btn-ghost !p-1.5" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Bajar"><ArrowDown size={15} /></button>
            <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => askRemove(i)} aria-label="Quitar"><X size={15} /></button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className="input !py-2 !text-sm" value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Nuevo nivel: Iniciación A, Banda, Adultos martes…" />
        <button className="btn-secondary !px-3" onClick={add} disabled={!nuevo.trim()}><Plus size={16} /> Añadir</button>
      </div>
      {dupe && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Hay niveles vacíos o repetidos.</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={save} disabled={!changed || dupe}>Guardar niveles</button>
        <button className="btn-ghost" onClick={() => { setRows(DEFAULT_LEVELS.map((l) => ({ orig: levelsOf(state.settings).includes(l) ? l : null, name: l }))); }}>Valores por defecto</button>
      </div>

      <Sheet
        open={!!quitar}
        onClose={() => setQuitar(null)}
        title="Quitar nivel"
        footer={<>
          <button className="btn-secondary" onClick={() => setQuitar(null)}>Cancelar</button>
          <button className="btn-primary" disabled={!destino} onClick={() => {
            const target = rows.find((r) => r.name === destino);
            setRemoved((m) => ({ ...m, [quitar.orig]: target?.orig || destino }));
            setRows((x) => x.filter((_, k) => k !== quitar.i));
            setQuitar(null);
          }}>Quitar y pasarlos</button>
        </>}
      >
        {quitar && (
          <div className="space-y-3 text-sm text-ink-600">
            <p><b>{quitar.en} {quitar.en === 1 ? 'alumno tiene' : 'alumnos tienen'}</b> el nivel «{quitar.orig}». ¿A qué nivel pasan?</p>
            <select className="input" value={destino} onChange={(e) => setDestino(e.target.value)}>
              {rows.filter((_, k) => k !== quitar.i).map((r) => <option key={r.name}>{r.name}</option>)}
            </select>
            <p className="text-xs text-ink-400">El cambio se guarda al pulsar «Guardar niveles».</p>
          </div>
        )}
      </Sheet>
    </section>
  );
}
