export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6 animate-fade-up">
      {Icon && (
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brass-50 text-brass-500">
          <Icon size={26} />
        </div>
      )}
      <p className="font-semibold text-ink-700">{title}</p>
      {text && <p className="mt-1 text-sm text-ink-400 max-w-xs">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
