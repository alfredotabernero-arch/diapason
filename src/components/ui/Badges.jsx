import { instrumentStyle, PRIORITY_STYLE, RESULT_STYLE, STATUS_STYLE } from '../../utils/constants.js';

export function StatusBadge({ status }) {
  return <span className={`chip ${STATUS_STYLE[status]?.chip || 'bg-ink-50 text-ink-600'}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  const st = PRIORITY_STYLE[priority] || PRIORITY_STYLE.Media;
  return (
    <span className={`chip ${st.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
      {priority}
    </span>
  );
}

export function InstrumentBadge({ instrument }) {
  const st = instrumentStyle(instrument);
  return (
    <span className={`chip ${st.soft}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
      {instrument}
    </span>
  );
}

export function ResultBadge({ result }) {
  if (!result) return null;
  return <span className={`chip ${RESULT_STYLE[result]?.chip || 'bg-ink-50 text-ink-600'}`}>{result}</span>;
}

export function LevelBadge({ level }) {
  return <span className="chip bg-ink-50 text-ink-600">{level}</span>;
}
