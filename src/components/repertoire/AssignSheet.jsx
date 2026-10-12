import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import Segmented from '../ui/Segmented.jsx';
import SearchInput from '../ui/SearchInput.jsx';
import ItemIcon from './ItemIcon.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { REPERTOIRE_TYPES, itemSubtitle, itemTitle } from '../../utils/constants.js';
import { normalize } from '../../utils/selectors.js';
import MailButton from '../mail/MailButton.jsx';

/**
 * Asignar elementos de la biblioteca a un alumno, o a todos los miembros de un grupo (members + group).
 * Después de asignar, el sobre abre el correo para enviarle el material.
 */
export default function AssignSheet({ open, onClose, student, members, group = '', initialType = 'obra' }) {
  const { state, actions } = useStore();
  const [type, setType] = useState(initialType);
  const [q, setQ] = useState('');
  const people = members || (student ? [student] : []);
  const has = (sid, itemId) => state.assignments.some((a) => a.studentId === sid && a.itemId === itemId);
  const assigned = new Set(state.items.filter((i) => people.length && people.every((p) => has(p.id, i.id))).map((i) => i.id));
  const list = useMemo(
    () =>
      state.items.filter(
        (i) =>
          i.type === type &&
          i.instrument === state.settings.subject &&
          normalize(`${itemTitle(i)} ${itemSubtitle(i)} ${i.composer || ''}`).includes(normalize(q))
      ),
    [state.items, state.settings.subject, type, q]
  );

  if (!people.length) return null;
  return (
    <Sheet open={open} onClose={onClose} title={group ? `Repertorio de ${group}` : 'Asignar repertorio'}>
      <div className="space-y-3">
        <Segmented
          value={type}
          onChange={setType}
          options={Object.entries(REPERTOIRE_TYPES).map(([value, t]) => ({ value, label: t.label }))}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Buscar en la biblioteca…" />
        <ul className="space-y-2">
          {list.map((i) => {
            const done = assigned.has(i.id);
            return (
              <li key={i.id} className="flex items-center gap-3 rounded-2xl border border-ink-100 p-2.5">
                <ItemIcon type={i.type} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-800 truncate">{itemTitle(i)}</p>
                  <p className="text-xs text-ink-400 truncate">{itemSubtitle(i)}</p>
                </div>
                {done && <MailButton people={people} items={[i]} group={group} iconOnly className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink-500 ring-1 ring-ink-100 hover:text-ink-800" label="Enviar por correo" />}
                <button
                  disabled={done}
                  onClick={() => {
                    for (const p of people) if (!has(p.id, i.id)) actions.assignItem(p.id, i.id);
                    actions.notify(group ? `Asignado a ${people.length} miembros` : 'Asignado');
                  }}
                  className={`grid h-9 w-9 place-items-center rounded-xl transition ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-800 text-white hover:bg-ink-700'}`}
                  aria-label={done ? 'Ya asignado' : 'Asignar'}
                >
                  {done ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </li>
            );
          })}
          {!list.length && <p className="py-6 text-center text-sm text-ink-400">No hay elementos. Añádelos desde Repertorio.</p>}
        </ul>
      </div>
    </Sheet>
  );
}
