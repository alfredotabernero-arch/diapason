import { Check, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '../ui/Badges.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { relativeDay, todayISO } from '../../utils/dates.js';
import { fullName } from '../../utils/selectors.js';
import { itemTitle } from '../../utils/constants.js';

export default function TaskItem({ task, student, item, onEdit, showStudent = false, delay = 0 }) {
  const { actions } = useStore();
  const overdue = !task.done && task.dueDate && task.dueDate < todayISO();
  return (
    <div className="card flex items-start gap-3 p-3.5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={() => {
          actions.toggleTask(task);
          if (!task.done) actions.notify('Tarea completada');
        }}
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all duration-200 ${
          task.done ? 'border-emerald-500 bg-emerald-500 text-white scale-95' : 'border-ink-200 hover:border-ink-400'
        }`}
        aria-label={task.done ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {task.done && <Check size={14} strokeWidth={3} className="animate-pop" />}
      </button>
      <button className="min-w-0 flex-1 text-left" onClick={() => onEdit?.(task)}>
        <p className={`font-medium leading-snug transition-colors ${task.done ? 'text-ink-300 line-through' : 'text-ink-800'}`}>{task.title}</p>
        {task.description && <p className="mt-0.5 text-sm text-ink-400 line-clamp-2">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          {!task.done && <PriorityBadge priority={task.priority} />}
          {task.dueDate && (
            <span className={`chip ${overdue ? 'bg-rose-600 text-white' : 'bg-ink-50 text-ink-500'}`}>
              {overdue ? 'Vencida · ' : ''}
              {relativeDay(task.dueDate)}
            </span>
          )}
          {item && (
            <span className="chip bg-brass-50 text-brass-600 max-w-[12rem]">
              <Link2 size={11} /> <span className="truncate">{itemTitle(item)}</span>
            </span>
          )}
        </div>
      </button>
      {showStudent && student && (
        <Link to={`/alumnos/${student.id}`} className="shrink-0 text-xs font-semibold text-ink-400 hover:text-ink-700">
          {fullName(student).split(' ').slice(0, 2).join(' ')}
        </Link>
      )}
    </div>
  );
}
