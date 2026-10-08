import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import Sheet, { ConfirmDialog } from '../components/ui/Sheet.jsx';
import { StatusBadge } from '../components/ui/Badges.jsx';
import ItemIcon from '../components/repertoire/ItemIcon.jsx';
import ItemFormSheet from '../components/repertoire/ItemFormSheet.jsx';
import AssignmentSheet from '../components/repertoire/AssignmentSheet.jsx';
import MaterialList from '../components/materials/MaterialList.jsx';
import MaterialFormSheet from '../components/materials/MaterialFormSheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { REPERTOIRE_TYPES, itemTitle } from '../utils/constants.js';
import { byId, fullName } from '../utils/selectors.js';

export default function RepertoireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useStore();
  const item = state.items.find((i) => i.id === id);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  if (!item) {
    return (
      <>
        <PageHeader back title="Repertorio" />
        <EmptyState title="Elemento no encontrado" action={<Link to="/repertorio" className="btn-primary">Ir a la biblioteca</Link>} />
      </>
    );
  }

  const students = byId(state.students);
  const assignments = state.assignments.filter((a) => a.itemId === id).map((a) => ({ ...a, item, student: students.get(a.studentId) })).filter((a) => a.student);
  const materials = state.materials.filter((m) => m.itemId === id);
  const tasks = state.tasks.filter((t) => t.itemId === id && !t.done);
  const candidates = state.students.filter((s) => !assignments.some((a) => a.studentId === s.id));

  const fields = {
    obra: [['Título', item.title], ['Compositor', item.composer], ['Nivel', item.level]],
    estudio: [['Método', item.method], ['Número', item.number], ['Autor', item.author], ['Nivel', item.level], ['Objetivo', item.focus]],
    escala: [['Tonalidad', item.tonality], ['Articulación', item.articulation], ['Velocidad objetivo', `${item.targetBpm} BPM`], ['Octavas', item.octaves], ['Nivel', item.level]],
    tecnica: [['Categoría', item.category], ['Ejercicio', item.title], ['Nivel', item.level], ['Descripción', item.description]],
  }[item.type] || [];

  return (
    <>
      <PageHeader
        back
        eyebrow={REPERTOIRE_TYPES[item.type].singular}
        title={item.type === 'obra' ? item.composer?.split(' ').slice(-1)[0] || 'Obra' : itemTitle(item)}
        actions={
          <>
            <button className="btn-ghost !p-2" onClick={() => setEditing(true)} aria-label="Editar"><Pencil size={19} /></button>
            <button className="btn-ghost !p-2 hover:!text-rose-600" onClick={() => setConfirm(true)} aria-label="Eliminar"><Trash2 size={19} /></button>
          </>
        }
      />

      <section className="card p-4">
        <div className="flex items-start gap-3">
          <ItemIcon type={item.type} />
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight">{itemTitle(item)}</h2>
            <div className="mt-1.5"><span className="chip bg-ink-50 text-ink-600">{item.level}</span></div>
          </div>
        </div>
        <dl className="mt-4 divide-y divide-ink-50 text-sm">
          {fields.filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-ink-400">{k}</dt>
              <dd className="text-right font-medium text-ink-700">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="section-title">Alumnos · {assignments.length}</h3>
          <button className="btn-secondary !px-3 !py-1.5" onClick={() => setAssignOpen(true)}><UserPlus size={15} /> Asignar</button>
        </div>
        <div className="space-y-2">
          {assignments.map((a, i) => (
            <button key={a.id} onClick={() => setAssignment(a)} className="card card-hover w-full p-3.5 text-left animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center gap-3">
                <Avatar student={a.student} size="sm" />
                <p className="flex-1 truncate font-semibold text-ink-800">{fullName(a.student)}</p>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-2.5"><ProgressBar value={a.progress} status={a.status} showLabel /></div>
            </button>
          ))}
          {!assignments.length && <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-3 text-sm text-ink-300">Todavía no está asignado a ningún alumno.</p>}
        </div>
      </section>

      {tasks.length > 0 && (
        <section className="mt-5">
          <h3 className="section-title mb-2">Tareas activas</h3>
          <ul className="card divide-y divide-ink-50">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-ink-700">{t.title}</span>
                <Link to={`/alumnos/${t.studentId}?tab=tareas`} className="shrink-0 text-xs font-semibold text-brass-500">{students.get(t.studentId)?.firstName}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="section-title">Material didáctico</h3>
          <button className="btn-secondary !px-3 !py-1.5" onClick={() => setMaterialOpen(true)}><Plus size={15} /> Añadir</button>
        </div>
        {materials.length ? <MaterialList materials={materials} showOwner={false} /> : <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-3 text-sm text-ink-300">Sin partituras, vídeos ni enlaces.</p>}
      </section>

      <ItemFormSheet open={editing} item={item} onClose={() => setEditing(false)} />
      <AssignmentSheet assignment={assignment} onClose={() => setAssignment(null)} studentName={assignment ? fullName(assignment.student) : ''} />
      <MaterialFormSheet open={materialOpen} onClose={() => setMaterialOpen(false)} itemId={item.id} />
      <Sheet open={assignOpen} onClose={() => setAssignOpen(false)} title="Asignar a alumno">
        <ul className="space-y-2">
          {candidates
            .sort((a, b) => a.firstName.localeCompare(b.firstName, 'es'))
            .map((s) => (
              <li key={s.id}>
                <button
                  className="flex w-full items-center gap-3 rounded-2xl border border-ink-100 p-2.5 text-left hover:bg-ink-50"
                  onClick={() => {
                    actions.assignItem(s.id, item.id);
                    actions.notify(`Asignado a ${s.firstName}`);
                    setAssignOpen(false);
                  }}
                >
                  <Avatar student={s} size="sm" />
                  <span className="flex-1">
                    <span className="block font-semibold text-ink-800">{fullName(s)}</span>
                    <span className="text-xs text-ink-400">{s.level}{s.group ? ` · ${s.group}` : ''}</span>
                  </span>
                  <Plus size={18} className="text-ink-300" />
                </button>
              </li>
            ))}
          {!candidates.length && <p className="py-4 text-center text-sm text-ink-400">Todos los alumnos lo tienen asignado.</p>}
        </ul>
      </Sheet>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Eliminar de la biblioteca"
        message={`Se eliminará «${itemTitle(item)}» y se quitará del repertorio de ${assignments.length} alumnos.`}
        onConfirm={() => {
          actions.deleteItem(item.id);
          actions.notify('Eliminado de la biblioteca');
          navigate('/repertorio', { replace: true });
        }}
      />
    </>
  );
}
