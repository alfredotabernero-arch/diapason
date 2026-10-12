import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StudentCard from '../components/students/StudentCard.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { ACTIVE_STATUSES, instrumentStyle } from '../utils/constants.js';
import { fullName, groupsOf, normalize } from '../utils/selectors.js';
import GroupList from '../components/groups/GroupList.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { isActive, levelIndex } from '../utils/school.js';

const SORTS = { nombre: 'Nombre', nivel: 'Nivel', progreso: 'Progreso' };

export default function Students() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('nombre');
  const [params, setParams] = useSearchParams();
  const tab = params.get('vista') || 'activos';
  const setTab = (v) => setParams(v === 'activos' ? {} : { vista: v }, { replace: true });
  const nGrupos = (state.groups || []).filter((g) => !g.archived).length;
  const nActivos = state.students.filter((s) => isActive(s)).length;
  const nAntiguos = state.students.length - nActivos;
  const pool = state.students.filter((s) => (tab === 'activos' ? isActive(s) : !isActive(s)));

  const enriched = useMemo(
    () =>
      pool.map((s) => {
        const active = state.assignments.filter((a) => a.studentId === s.id && ACTIVE_STATUSES.includes(a.status));
        return {
          s,
          progress: active.length ? Math.round(active.reduce((n, a) => n + a.progress, 0) / active.length) : 0,
          pending: state.tasks.filter((t) => t.studentId === s.id && !t.done).length,
        };
      }),
    [pool, state.assignments, state.tasks]
  );

  // Filtros rápidos: grupos, especialidades (si hay varias) y niveles
  const count = (fn) => pool.filter(fn).length;
  const gOf = (s) => groupsOf(state, s.id).map((g) => g.name);
  const groups = [...new Set(pool.flatMap(gOf))].sort();
  const instruments = [...new Set(pool.map((s) => s.instrument))].sort();
  const levels = [...new Set(pool.map((s) => s.level))].sort((a, b) => levelIndex(state.settings, a) - levelIndex(state.settings, b));
  const chips = [
    ...groups.map((g) => ({ value: g, kind: 'group', count: count((s) => gOf(s).includes(g)) })),
    ...(instruments.length > 1 ? instruments.map((i) => ({ value: i, kind: 'instrument', count: count((s) => s.instrument === i) })) : []),
    ...(pool.some((s) => s.groupOnly) ? [{ value: 'Solo de grupo', kind: 'solo', count: count((s) => s.groupOnly) }] : []),
    ...(groups.length ? [] : levels.map((l) => ({ value: l, kind: 'level', count: count((s) => s.level === l) }))),
  ];

  const list = enriched
    .filter(({ s }) => !filter || s.instrument === filter || gOf(s).includes(filter) || s.level === filter || (filter === 'Solo de grupo' && s.groupOnly))
    .filter(({ s }) => normalize(`${fullName(s)} ${s.instrument} ${s.level} ${gOf(s).join(' ')} ${s.email} ${s.phone}`).includes(normalize(q)))
    .sort((a, b) =>
      sort === 'progreso' ? b.progress - a.progress
        : sort === 'nivel' ? levelIndex(state.settings, a.s.level) - levelIndex(state.settings, b.s.level) || a.s.firstName.localeCompare(b.s.firstName)
          : fullName(a.s).localeCompare(fullName(b.s), 'es')
    );

  return (
    <>
      <PageHeader
        title="Alumnos"
        subtitle={`${nActivos} alumnos · ${state.settings.subject}`}
        actions={tab === 'grupos'
          ? <Link to="/grupos/nuevo" className="btn-primary !px-3"><Users size={18} /> Nuevo grupo</Link>
          : <Link to="/alumnos/nuevo" className="btn-primary !px-3"><UserPlus size={18} /> Nuevo</Link>}
      />
      <Segmented
        className="mb-3" value={tab} onChange={(v) => { setTab(v); setFilter(''); }}
        options={[
          { value: 'activos', label: 'Activos', count: nActivos },
          { value: 'grupos', label: 'Grupos', count: nGrupos },
          ...(nAntiguos > 0 ? [{ value: 'antiguos', label: 'Antiguos alumnos', count: nAntiguos }] : []),
        ]}
      />
      {tab === 'grupos' ? <GroupList /> : <>
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, nivel, grupo…" />

      <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
        <button onClick={() => setFilter('')} className={`chip !py-1.5 !px-3 transition ${!filter ? 'bg-ink-800 text-white' : 'bg-white text-ink-500 border border-ink-100'}`}>
          Todos
        </button>
        {chips.map(({ value, kind, count }) => (
          <button
            key={`${kind}-${value}`}
            onClick={() => setFilter(filter === value ? '' : value)}
            className={`chip !py-1.5 !px-3 whitespace-nowrap transition ${filter === value ? 'bg-ink-800 text-white' : 'bg-white text-ink-500 border border-ink-100'}`}
          >
            {kind === 'instrument' && <span className={`h-2 w-2 rounded-full ${instrumentStyle(value).dot}`} />} {value}
            <span className="opacity-60">{count}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
        <span>{list.length} resultados</span>
        <label className="flex items-center gap-1.5">
          Ordenar
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-ink-100 bg-white px-2 py-1 text-xs font-semibold text-ink-600">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-2 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {list.map(({ s, progress, pending }, i) => (
          <StudentCard key={s.id} student={s} progress={progress} pending={pending} delay={Math.min(i * 35, 300)} />
        ))}
      </div>
      {!list.length && (
        <EmptyState
          icon={Users}
          title={pool.length ? 'Sin resultados' : tab === 'antiguos' ? 'No hay antiguos alumnos' : 'Aún no hay alumnos'}
          text={pool.length ? 'Prueba con otra búsqueda o filtro.' : tab === 'antiguos' ? 'Al poner la fecha de baja a un alumno, aparece aquí con todo su historial.' : 'Da de alta a tu primer alumno.'}
          action={<Link to="/alumnos/nuevo" className="btn-primary"><UserPlus size={16} /> Nuevo alumno</Link>}
        />
      )}
      </>}
    </>
  );
}
