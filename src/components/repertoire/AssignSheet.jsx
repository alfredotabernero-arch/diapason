import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import Segmented from '../ui/Segmented.jsx';
import SearchInput from '../ui/SearchInput.jsx';
import ItemIcon from './ItemIcon.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { REPERTOIRE_TYPES, itemSubtitle, itemTitle } from '../../utils/constants.js';
import { normalize } from '../../utils/selectors.js';

/** Asignar elementos de la biblioteca a un alumno */
export default function AssignSheet({ open, onClose, student, initialType = 'obra' }) {
  const { state, actions } = useStore();
  const [type, setType] = useState(initialType);
  const [q, setQ] = useState('');

  const assigned = new Set(state.assignments.filter((a) => a.studentId === student?.id).map((a) => a.itemId));
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

  if (!student) return null;
  return (
    <Sheet open={open} onClose={onClose} title="Asignar repertorio">
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
                <button
                  disabled={done}
                  onClick={() => {
                    actions.assignItem(student.id, i.id);
                    actions.notify('Asignado');
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
