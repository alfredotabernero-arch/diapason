import { ExternalLink, FileText, Film, Link as LinkIcon, Music, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/StoreContext.jsx';
import { ConfirmDialog } from '../ui/Sheet.jsx';
import { MATERIAL_KINDS, itemTitle } from '../../utils/constants.js';
import { formatBytes, openFile } from '../../utils/files.js';
import { byId, fullName } from '../../utils/selectors.js';

const ICONS = {
  pdf: { icon: FileText, cls: 'bg-rose-50 text-rose-600' },
  video: { icon: Film, cls: 'bg-violet-50 text-violet-600' },
  audio: { icon: Music, cls: 'bg-teal-50 text-teal-600' },
  link: { icon: LinkIcon, cls: 'bg-sky-50 text-sky-600' },
};

export default function MaterialList({ materials, showOwner = true }) {
  const { state, actions } = useStore();
  const [toDelete, setToDelete] = useState(null);
  const items = byId(state.items);
  const students = byId(state.students);

  const open = async (m) => {
    if (m.source === 'file') {
      try {
        await openFile(m.id, m.fileName || m.title);
      } catch (e) {
        actions.notify(e.message);
      }
    }
  };

  return (
    <>
      <ul className="space-y-2">
        {materials.map((m, idx) => {
          const { icon: Icon, cls } = ICONS[m.kind] || ICONS.link;
          const owner = [m.studentId && fullName(students.get(m.studentId)), m.itemId && itemTitle(items.get(m.itemId))].filter(Boolean).join(' · ');
          return (
            <li key={m.id} className="card flex items-center gap-3 p-3 animate-fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cls}`}>
                <Icon size={18} />
              </div>
              <Opener m={m} onOpen={open} className="min-w-0 flex-1 text-left">
                <p className="truncate font-semibold text-ink-800">{m.title}</p>
                <p className="truncate text-xs text-ink-400">
                  {MATERIAL_KINDS[m.kind]?.label}
                  {m.source === 'file' ? ` · ${m.fileName} · ${formatBytes(m.size)}` : ''}
                  {showOwner && owner ? ` · ${owner}` : ''}
                </p>
              </Opener>
              <Opener m={m} onOpen={open} className="p-2 text-ink-300 hover:text-ink-700" aria-label="Abrir">
                <ExternalLink size={17} />
              </Opener>
              <button onClick={() => setToDelete(m)} className="p-2 text-ink-300 hover:text-rose-600" aria-label="Eliminar">
                <Trash2 size={17} />
              </button>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar material"
        message={`Se eliminará «${toDelete?.title}».`}
        onConfirm={() => {
          actions.deleteMaterial(toDelete);
          actions.notify('Material eliminado');
        }}
      />
    </>
  );
}

/** Los enlaces son <a> reales (abren en pestaña nueva); los archivos guardados se abren desde IndexedDB */
function Opener({ m, onOpen, children, ...props }) {
  if (m.source !== 'file') {
    return <a href={m.url} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
  }
  return <button type="button" onClick={() => onOpen(m)} {...props}>{children}</button>;
}
