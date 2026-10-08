/** Selector de pestañas tipo "pastilla" */
export default function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 rounded-2xl bg-ink-100/60 p-1 overflow-x-auto no-scrollbar ${className}`}>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
              active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`ml-1.5 text-xs ${active ? 'text-brass-500' : 'text-ink-300'}`}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
