import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CalendarClock, CalendarPlus, ChevronRight, ClipboardPen, History, Pencil, Plus, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ItemIcon from '../components/repertoire/ItemIcon.jsx';
import AssignSheet from '../components/repertoire/AssignSheet.jsx';
import MailButton from '../components/mail/MailButton.jsx';
import { ExtraSheet } from '../components/agenda/ChangeSheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { ACTIVE_STATUSES, ATTENDANCE_STYLE, attended, itemSubtitle, itemTitle } from '../utils/constants.js';
import { WEEKDAYS, endTime, formatLong, isoWeekday, todayISO } from '../utils/dates.js';
import { byId, fullName, groupMembers } from '../utils/selectors.js';

const TABS = [
  { value: 'miembros', label: 'Miembros' },
  { value: 'repertorio', label: 'Repertorio' },
  { value: 'ensayos', label: 'Ensayos' },
];

/** Ficha de un grupo: miembros, repertorio común (con envío por correo) y ensayos con asistencia */
export default function GroupDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'miembros';
  const { state } = useStore();
  const group = (state.groups || []).find((g) => g.id === id);
  const [extra, setExtra] = useState(false);

  if (!group) {
    return (
      <>
        <PageHeader back title="Grupo" />
        <EmptyState title="Grupo no encontrado" action={<Link to="/alumnos?vista=grupos" className="btn-primary">Volver a grupos</Link>} />
      </>
    );
  }
  const members = groupMembers(state, group);
  const today = todayISO();
  const slotToday = (group.schedule || []).find((s) => Number(s.weekday) === isoWeekday(today));
  const registrar = `/clases/nueva?grupo=${group.id}&fecha=${today}&hora=${slotToday?.time || '19:00'}&duracion=${slotToday?.duration || 60}`;

  return (
    <>
      <PageHeader back title={group.name} subtitle="Grupo" actions={<Link to={`/grupos/${group.id}/editar`} className="btn-ghost !p-2" aria-label="Editar"><Pencil size={19} /></Link>} />
      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="card p-4 animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><Users size={24} /></div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl leading-tight">{group.name}</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="chip bg-ink-50 text-ink-600">{members.length} {members.length === 1 ? 'miembro' : 'miembros'}</span>
                  {group.kind === 'ocasional' && <span className="chip bg-brass-50 text-brass-700">Ocasional</span>}
                  {group.archived && <span className="chip bg-ink-50 text-ink-500">Archivado</span>}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-secondary !px-2" onClick={() => setExtra(true)} data-ayuda="ensayo-puntual"><CalendarPlus size={16} /> Ensayo puntual</button>
              <Link to={registrar} className="btn-primary !px-2" data-ayuda="registrar-grupo"><ClipboardPen size={16} /> Registrar</Link>
            </div>
          </section>
          <section className="card divide-y divide-ink-50">
            <div className="px-4 py-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm text-ink-400"><CalendarClock size={14} /> Horario</p>
                <Link to={`/grupos/${group.id}/editar`} className="btn-ghost !px-2 !py-1 text-xs font-semibold text-brass-600"><Pencil size={13} /> Cambiar</Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(group.schedule || []).map((s, i) => <span key={i} className="chip bg-ink-50 text-ink-700 !py-1">{WEEKDAYS[s.weekday - 1]} {s.time}–{endTime(s.time, s.duration)}</span>)}
                {!group.schedule?.length && <span className="text-sm text-ink-300">{group.kind === 'ocasional' ? 'Sin horario fijo: ensayos puntuales' : 'Sin horario'}</span>}
              </div>
            </div>
            {group.notes && (
              <div className="px-4 py-3">
                <p className="mb-1 text-sm text-ink-400">Observaciones</p>
                <p className="whitespace-pre-line text-sm text-ink-700">{group.notes}</p>
              </div>
            )}
            <p className="px-4 py-3 text-xs text-ink-400">Los grupos no llevan calificación: las notas de cada alumno son las de su clase individual.</p>
          </section>
        </aside>

        <div className="min-w-0">
          <div className="sticky top-[4.6rem] z-20 -mx-4 mt-4 bg-paper/85 px-4 py-2 backdrop-blur-md md:top-[5.4rem] md:mx-0 md:px-0 lg:mt-0">
            <Segmented options={TABS} value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} />
          </div>
          <div key={tab} className="mt-3 animate-fade-up">
            {tab === 'miembros' && <MembersTab group={group} members={members} />}
            {tab === 'repertorio' && <RepertoireTab group={group} members={members} />}
            {tab === 'ensayos' && <SessionsTab group={group} />}
          </div>
        </div>
      </div>
      <ExtraSheet open={extra} onClose={() => setExtra(false)} date={todayISO()} groupId={group.id} />
    </>
  );
}

function MembersTab({ group, members }) {
  const { state } = useStore();
  const lessons = state.lessons.filter((l) => l.groupId === group.id);
  return (
    <div className="space-y-2">
      <Link to={`/grupos/${group.id}/editar`} className="btn-secondary w-full"><Plus size={16} /> Añadir o quitar miembros</Link>
      <ul className="space-y-2">
        {members.map((s) => {
          const mine = lessons.filter((l) => l.studentId === s.id);
          const pct = mine.length ? Math.round((mine.filter(attended).length / mine.length) * 100) : null;
          return (
            <li key={s.id}>
              <Link to={`/alumnos/${s.id}`} className="card card-hover flex items-center gap-3 p-3">
                <Avatar student={s} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink-800">{fullName(s)}</span>
                  <span className="text-xs text-ink-400">{s.groupOnly ? 'Solo de grupo' : [s.instrument !== state.settings.subject ? s.instrument : '', s.level].filter(Boolean).join(' · ')}{s.email ? '' : ' · sin email'}</span>
                </span>
                {pct !== null && <span className="chip bg-ink-50 text-ink-600" title="Asistencia a los ensayos">{pct} %</span>}
                <ChevronRight size={16} className="text-ink-200" />
              </Link>
            </li>
          );
        })}
      </ul>
      {!members.length && <EmptyState icon={Users} title="Sin miembros" text="Añade a los alumnos del grupo y, si hace falta, a personas que solo vienen al grupo." />}
    </div>
  );
}

function RepertoireTab({ group, members }) {
  const { state } = useStore();
  const [assign, setAssign] = useState(false);
  const items = byId(state.items);
  const ids = new Set(members.map((m) => m.id));
  const rows = useMemo(() => {
    const map = new Map();
    for (const a of state.assignments) {
      if (!ids.has(a.studentId) || a.status === 'Terminada') continue;
      const it = items.get(a.itemId);
      if (!it) continue;
      if (!map.has(it.id)) map.set(it.id, { item: it, n: 0, active: 0 });
      const r = map.get(it.id);
      r.n += 1;
      if (ACTIVE_STATUSES.includes(a.status)) r.active += 1;
    }
    return [...map.values()].sort((a, b) => b.n - a.n || itemTitle(a.item).localeCompare(itemTitle(b.item), 'es'));
  }, [state.assignments, members]); // eslint-disable-line react-hooks/exhaustive-deps
  const comunes = rows.filter((r) => r.n === members.length);
  const algunos = rows.filter((r) => r.n < members.length);
  const fila = ({ item, n }) => (
    <li key={item.id} className="card flex items-center gap-3 p-3">
      <ItemIcon type={item.type} size="sm" />
      <Link to={`/repertorio/${item.id}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink-800">{itemTitle(item)}</span>
        <span className="block truncate text-xs text-ink-400">{itemSubtitle(item)}{n < members.length ? ` · ${n} de ${members.length}` : ''}</span>
      </Link>
      <MailButton people={members} items={[item]} group={group.name} iconOnly className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 ring-1 ring-ink-100 hover:text-ink-800" />
    </li>
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={() => setAssign(true)}><Plus size={16} /> Asignar al grupo</button>
        <MailButton people={members} items={comunes.map((r) => r.item)} group={group.name} label="Enviar todo" />
      </div>
      <p className="text-xs text-ink-400">Asignar una obra al grupo se la asigna a cada miembro. El correo va a todos en copia oculta, con los enlaces y los PDF adjuntos.</p>
      <h3 className="section-title">Del grupo · {comunes.length}</h3>
      <ul className="space-y-2">{comunes.map(fila)}</ul>
      {!comunes.length && <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-3 text-sm text-ink-300">Aún no hay obras asignadas a todo el grupo.</p>}
      {algunos.length > 0 && (
        <details className="rounded-2xl bg-ink-50/60 px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-ink-600">De algunos miembros (su repertorio individual) · {algunos.length}</summary>
          <ul className="mt-2 space-y-2">{algunos.map(fila)}</ul>
        </details>
      )}

      {assign && <AssignSheet open members={members} group={group.name} onClose={() => setAssign(false)} />}
    </div>
  );
}

function SessionsTab({ group }) {
  const { state } = useStore();
  const [limit, setLimit] = useState(12);
  const sessions = useMemo(() => {
    const map = new Map();
    for (const l of state.lessons) {
      if (l.groupId !== group.id) continue;
      const key = `${l.date}|${l.time}`;
      if (!map.has(key)) map.set(key, { date: l.date, time: l.time, duration: l.duration, list: [] });
      map.get(key).list.push(l);
    }
    return [...map.values()].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
  }, [state.lessons, group.id]);
  const students = byId(state.students);
  return (
    <div>
      <div className="space-y-2">
        {sessions.slice(0, limit).map((s) => {
          const present = s.list.filter(attended);
          const absent = s.list.filter((l) => !attended(l));
          const work = present[0]?.work || '';
          return (
            <Link key={`${s.date}|${s.time}`} to={`/clases/nueva?grupo=${group.id}&fecha=${s.date}&hora=${s.time}&duracion=${s.duration}`} className="card card-hover block p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-800">{formatLong(s.date)} · {s.time}</p>
                <span className="chip bg-emerald-50 text-emerald-700">{present.length}/{s.list.length}</span>
              </div>
              {work && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{work}</p>}
              {absent.length > 0 && (
                <p className="mt-1.5 flex flex-wrap gap-1">
                  {absent.map((l) => <span key={l.id} className={`chip !py-0.5 ${ATTENDANCE_STYLE[l.attendance].chip}`}>{students.get(l.studentId)?.firstName || '—'} · {l.attendance === 'Falta justificada' ? 'justificada' : 'injustificada'}</span>)}
                </p>
              )}
            </Link>
          );
        })}
      </div>
      {sessions.length > limit && <button onClick={() => setLimit((n) => n + 12)} className="btn-secondary mt-3 w-full">Ver más ({sessions.length - limit})</button>}
      {!sessions.length && <EmptyState icon={History} title="Sin ensayos registrados" text="Registra cada ensayo desde la agenda o con «Registrar»: una sola vez, con la asistencia de cada miembro." />}
    </div>
  );
}
