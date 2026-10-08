import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Library, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { StatusBadge } from '../components/ui/Badges.jsx';
import ItemIcon from '../components/repertoire/ItemIcon.jsx';
import ItemFormSheet from '../components/repertoire/ItemFormSheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { REPERTOIRE_TYPES, STATUSES, itemSubtitle, itemTitle, techniqueCategories } from '../utils/constants.js';
import { groupBy, normalize } from '../utils/selectors.js';

/** Estado global de una obra en la biblioteca = estado más avanzado entre los alumnos */
function aggregate(assignments) {
  if (!assignments?.length) return { status: null, progress: 0, students: 0 };
  const best = [...assignments].sort((a, b) => STATUSES.indexOf(b.status) - STATUSES.indexOf(a.status))[0];
  return {
    status: best.status,
    progress: Math.round(assignments.reduce((n, a) => n + a.progress, 0) / assignments.length),
    students: assignments.length,
  };
}

export default function Repertoire() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const type = params.get('tipo') || 'obra';
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);

  const assignmentsByItem = useMemo(() => groupBy(state.assignments, (a) => a.itemId), [state.assignments]);

  const subject = state.settings.subject;
  const mine = state.items.filter((i) => i.instrument === subject);
  const levels = [...new Set(mine.map((i) => i.level))];
  const list = mine
    .filter((i) => i.type === type)
    .filter((i) => !level || i.level === level)
    .filter((i) => type !== 'tecnica' || !category || i.category === category)
    .filter((i) => !q || normalize(`${itemTitle(i)} ${itemSubtitle(i)} ${i.composer || ''} ${i.author || ''} ${i.level}`).includes(normalize(q)))
    .map((i) => ({ i, agg: aggregate(assignmentsByItem.get(i.id)) }))
    .filter(({ agg }) => !status || (status === 'Sin asignar' ? !agg.status : agg.status === status))
    .sort((a, b) => itemTitle(a.i).localeCompare(itemTitle(b.i), 'es', { numeric: true }));

  const counts = Object.fromEntries(Object.keys(REPERTOIRE_TYPES).map((t) => [t, mine.filter((i) => i.type === t).length]));

  return (
    <>
      <PageHeader
        title="Repertorio"
        subtitle={`Biblioteca de ${subject}`}
        actions={<button className="btn-primary !px-3" onClick={() => setCreating(true)}><Plus size={18} /> Añadir</button>}
      />
      <Segmented
        value={type}
        onChange={(v) => { setParams({ tipo: v }, { replace: true }); setStatus(''); setCategory(''); }}
        options={Object.entries(REPERTOIRE_TYPES).map(([value, t]) => ({ value, label: t.label, count: counts[value] }))}
      />
      <div className="mt-3"><SearchInput value={q} onChange={setQ} placeholder={`Buscar ${REPERTOIRE_TYPES[type].label.toLowerCase()}…`} /></div>

      <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
        {['', ...levels].map((l) => (
          <button
            key={l || 'all'}
            onClick={() => setLevel(l)}
            className={`chip !py-1.5 !px-3 whitespace-nowrap transition ${level === l ? 'bg-ink-800 text-white' : 'bg-white text-ink-500 border border-ink-100'}`}
          >
            {l || 'Todos los niveles'}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {type === 'tecnica' && (
          <select className="input !py-1.5 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {techniqueCategories(subject).map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <select className="input !py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Estado">
          <option value="">Cualquier estado</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
          <option>Sin asignar</option>
        </select>
      </div>

      <p className="mt-3 text-xs text-ink-400">{list.length} elementos</p>
      <ul className="mt-2 grid gap-2 md:grid-cols-2">
        {list.map(({ i, agg }, idx) => (
          <li key={i.id}>
            <Link to={`/repertorio/${i.id}`} className="card card-hover flex items-center gap-3 p-3.5 animate-fade-up" style={{ animationDelay: `${Math.min(idx * 25, 300)}ms` }}>
              <ItemIcon type={i.type} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-ink-800 line-clamp-2">{itemTitle(i)}</p>
                <p className="flex items-center gap-1.5 text-xs text-ink-400">
                  <span className="truncate">{itemSubtitle(i)} · {i.level}</span>
                </p>
                {agg.status && (
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={agg.status} />
                    <div className="flex-1"><ProgressBar value={agg.progress} status={agg.status} size="sm" /></div>
                    <span className="text-[11px] text-ink-400 whitespace-nowrap">{agg.students} {agg.students === 1 ? 'alumno' : 'alumnos'}</span>
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="shrink-0 text-ink-200" />
            </Link>
          </li>
        ))}
      </ul>
      {!list.length && <EmptyState icon={Library} title="No hay elementos" text="Cambia los filtros o añade nuevo repertorio." />}
      <ItemFormSheet open={creating} onClose={() => setCreating(false)} defaultType={type} />
    </>
  );
}
