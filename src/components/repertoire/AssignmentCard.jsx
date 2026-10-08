import ItemIcon from './ItemIcon.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { StatusBadge } from '../ui/Badges.jsx';
import { itemSubtitle, itemTitle } from '../../utils/constants.js';

/** Elemento de repertorio asignado a un alumno con estado y % de progreso */
export default function AssignmentCard({ assignment, onClick, label, delay = 0 }) {
  const { item } = assignment;
  return (
    <button onClick={onClick} className="card card-hover w-full p-3.5 text-left animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <ItemIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-ink-800 line-clamp-2">{label || itemTitle(item)}</p>
          <p className="text-xs text-ink-400 truncate">{itemSubtitle(item)}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>
      <div className="mt-3">
        <ProgressBar value={assignment.progress} status={assignment.status} showLabel />
      </div>
    </button>
  );
}
