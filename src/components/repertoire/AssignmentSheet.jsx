import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Trash2 } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { STATUSES, STATUS_STYLE, STATUS_DEFAULT_PROGRESS, itemSubtitle, itemTitle } from '../../utils/constants.js';
import { formatShort } from '../../utils/dates.js';

/** Editar estado y progreso de una asignación */
export default function AssignmentSheet({ assignment, onClose, studentName }) {
  const { actions } = useStore();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Pendiente');

  useEffect(() => {
    if (assignment) {
      setProgress(assignment.progress);
      setStatus(assignment.status);
    }
  }, [assignment]);

  if (!assignment) return null;
  const { item } = assignment;
  const log = assignment.log || [];

  // Ajusta el porcentaje si queda fuera de la franja del estado elegido
  const BANDS = { Pendiente: [0, 0], Iniciada: [1, 34], 'En estudio': [35, 74], Consolidada: [75, 99], Terminada: [100, 100] };
  const applyStatus = (s) => {
    const [min, max] = BANDS[s];
    setStatus(s);
    if (progress < min || progress > max) setProgress(STATUS_DEFAULT_PROGRESS[s]);
  };

  return (
    <Sheet
      open={!!assignment}
      onClose={onClose}
      title="Progreso"
      footer={
        <>
          <button
            className="btn-danger mr-auto"
            onClick={() => {
              actions.removeAssignment(assignment.id);
              actions.notify('Quitado del repertorio del alumno');
              onClose();
            }}
          >
            <Trash2 size={16} /> Quitar
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              actions.updateAssignment(assignment, { progress, status });
              actions.notify('Progreso guardado');
              onClose();
            }}
          >
            Guardar
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="font-semibold text-ink-800 leading-snug">{itemTitle(item)}</p>
          <p className="text-sm text-ink-400">{itemSubtitle(item)}{studentName ? ` · ${studentName}` : ''}</p>
          <Link to={`/repertorio/${item.id}`} onClick={onClose} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brass-500">
            Ver en la biblioteca <ExternalLink size={12} />
          </Link>
        </div>

        <div>
          <span className="label">Estado</span>
          <div className="grid grid-cols-5 gap-1.5">
            {STATUSES.map((s, i) => (
              <button
                key={s}
                onClick={() => applyStatus(s)}
                className={`rounded-xl px-1 py-2 text-[11px] font-semibold leading-tight transition-all ${
                  status === s ? `${STATUS_STYLE[s].chip} ring-2 ring-current scale-[1.03]` : 'bg-ink-50 text-ink-400'
                }`}
              >
                <span className="block text-base leading-none mb-0.5">{i + 1}</span>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="label">Porcentaje de progreso</span>
            <span className="font-display text-3xl tabular-nums">{progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => {
              const p = Number(e.target.value);
              setProgress(p);
              setStatus(p >= 100 ? 'Terminada' : p >= 75 ? 'Consolidada' : p >= 35 ? 'En estudio' : p > 0 ? 'Iniciada' : 'Pendiente');
            }}
            className="w-full accent-ink-800"
            aria-label="Porcentaje de progreso"
          />
          <ProgressBar value={progress} status={status} size="lg" />
        </div>

        {log.length > 1 && (
          <div>
            <span className="label">Evolución</span>
            <div className="flex items-end gap-1 h-16">
              {log.slice(-10).map((e, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${formatShort(e.date)}: ${e.progress}%`}>
                  <div className="w-full rounded-t-md bg-ink-200 transition-all" style={{ height: `${Math.max(4, e.progress * 0.5)}px` }} />
                  <span className="text-[9px] text-ink-300">{formatShort(e.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
