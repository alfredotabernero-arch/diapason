import { Link } from 'react-router-dom';
import { Archive, ChevronRight, Users } from 'lucide-react';
import EmptyState from '../ui/EmptyState.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { WEEKDAYS } from '../../utils/dates.js';
import { groupMembers } from '../../utils/selectors.js';

const horario = (g) => (g.schedule || []).map((s) => `${WEEKDAYS[s.weekday - 1].slice(0, 3)} ${s.time}`).join(' · ');

function GroupCard({ g, delay }) {
  const { state } = useStore();
  const members = groupMembers(state, g);
  const solo = members.filter((s) => s.groupOnly).length;
  return (
    <Link to={`/grupos/${g.id}`} className="card card-hover block p-3.5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><Users size={20} /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-800">{g.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
            <span>{members.length} {members.length === 1 ? 'miembro' : 'miembros'}{solo ? ` · ${solo} solo de grupo` : ''}</span>
            {g.kind === 'ocasional' && <span className="chip bg-brass-50 text-brass-700">Ocasional</span>}
            {g.archived && <span className="chip bg-ink-50 text-ink-500">Archivado</span>}
          </div>
        </div>
        <ChevronRight size={18} className="text-ink-200" />
      </div>
      <p className="mt-3 truncate text-xs text-ink-400">{horario(g) || (g.kind === 'ocasional' ? 'Sin horario fijo: clases puntuales' : 'Sin horario')}</p>
    </Link>
  );
}

/** Pestaña «Grupos» de Alumnos: conjuntos estables, dúos y tríos ocasionales y archivados */
export default function GroupList() {
  const { state } = useStore();
  const all = [...(state.groups || [])].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const activos = all.filter((g) => !g.archived);
  const archivados = all.filter((g) => g.archived);
  return (
    <>
      <p className="mb-3 text-sm text-ink-400">Conjuntos, dúos, tríos y clases colectivas. Una persona puede estar en varios grupos y tener además su clase individual.</p>
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {activos.map((g, i) => <GroupCard key={g.id} g={g} delay={Math.min(i * 35, 300)} />)}
      </div>
      {!activos.length && (
        <EmptyState icon={Users} title="Aún no hay grupos" text="Crea un grupo para sus ensayos: horario, miembros, asistencia y repertorio común." action={<Link to="/grupos/nuevo" className="btn-primary"><Users size={16} /> Nuevo grupo</Link>} />
      )}
      {archivados.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300"><Archive size={13} /> Archivados · {archivados.length}</h3>
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {archivados.map((g, i) => <GroupCard key={g.id} g={g} delay={i * 35} />)}
          </div>
        </>
      )}
    </>
  );
}
