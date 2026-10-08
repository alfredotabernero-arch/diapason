import { gradeLabel, gradeStyle } from '../../utils/constants.js';

/** Selector de nota 1-10 (entera). `placeholder` muestra la nota propuesta en gris */
export default function GradeSelect({ value, onChange, placeholder, label, className = '' }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <select
      aria-label={label}
      value={empty ? '' : String(value)}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className={`h-9 w-16 rounded-lg border border-ink-100 px-1.5 text-center text-sm font-semibold tabular-nums outline-none focus:ring-4 focus:ring-ink-100 ${
        empty ? 'bg-white text-ink-300' : gradeStyle(value)
      } ${className}`}
      title={empty ? (placeholder ? `Propuesta: ${placeholder} (${gradeLabel(placeholder)})` : 'Sin nota') : gradeLabel(value)}
    >
      <option value="">{placeholder ? `${placeholder}*` : '—'}</option>
      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
}
