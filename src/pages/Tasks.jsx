import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import TaskItem from '../components/tasks/TaskItem.jsx';
import TaskFormSheet from '../components/tasks/TaskFormSheet.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { PRIORITIES } from '../utils/constants.js';
import { addDays, todayISO } from '../utils/dates.js';
import { byId, fullName, sortTasks } from '../utils/selectors.js';

function bucket(task, today) {
  if (task.done) return 'Completadas';
  if (!task.dueDate) return 'Sin fecha';
  if (task.dueDate < today) return 'Vencidas';
  if (task.dueDate === today) return 'Hoy';
  if (task.dueDate <= addDays(today, 7)) return 'Próximos 7 días';
  return 'Más adelante';
}
const ORDER = ['Vencidas', 'Hoy', 'Próximos 7 días', 'Más adelante', 'Sin fecha', 'Completadas'];

export default function Tasks() {
  const { state } = useStore();
  const [filter, setFilter] = useState('pendientes');
  const [priority, setPriority] = useState('');
  const [studentId, setStudentId] = useState('');
  const [sheet, setSheet] = useState({ open: false, task: null });
  const today = todayISO();
  const students = byId(state.students);
  const items = byId(state.items);

  const all = state.tasks.filter((t) => (!priority || t.priority === priority) && (!studentId || t.studentId === studentId));
  const list = sortTasks(all.filter((t) => (filter === 'pendientes' ? !t.done : filter === 'completadas' ? t.done : true)));
  const groups = ORDER.map((name) => ({ name, tasks: list.filter((t) => bucket(t, today) === name) })).filter((g) => g.tasks.length);
  const pending = all.filter((t) => !t.done).length;
  const done = all.filter((t) => t.done).length;

  return (
    <>
      <PageHeader
        back
        title="Tareas para casa"
        subtitle={`${pending} pendientes · ${done} completadas`}
        actions={<button className="btn-primary !px-3" onClick={() => setSheet({ open: true, task: null })}><Plus size={18} /> Nueva</button>}
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'pendientes', label: 'Pendientes', count: pending },
          { value: 'completadas', label: 'Hechas', count: done },
          { value: 'todas', label: 'Todas' },
        ]}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select className="input !py-2 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)} aria-label="Alumno">
          <option value="">Todos los alumnos</option>
          {state.students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
        </select>
        <select className="input !py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Prioridad">
          <option value="">Cualquier prioridad</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {pending + done > 0 && (
        <div className="card mt-3 p-3.5">
          <div className="flex justify-between text-xs font-semibold text-ink-500">
            <span>Cumplimiento</span>
            <span className="tabular-nums">{Math.round((done / (pending + done)) * 100)}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100/70">
            <div className="h-2 rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${(done / (pending + done)) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-5">
        {groups.map((g) => (
          <section key={g.name}>
            <h2 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${g.name === 'Vencidas' ? 'text-rose-600' : 'text-ink-400'}`}>
              {g.name} · {g.tasks.length}
            </h2>
            <div className="space-y-2">
              {g.tasks.map((t, i) => (
                <TaskItem key={t.id} task={t} student={students.get(t.studentId)} item={items.get(t.itemId)} showStudent onEdit={(task) => setSheet({ open: true, task })} delay={i * 25} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {!groups.length && <EmptyState icon={ListTodo} title="No hay tareas" text="Crea tareas para que tus alumnos sepan qué estudiar." />}
      <TaskFormSheet open={sheet.open} task={sheet.task} onClose={() => setSheet({ open: false, task: null })} />
    </>
  );
}
