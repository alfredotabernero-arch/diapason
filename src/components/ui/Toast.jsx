import { CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/StoreContext.jsx';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="pointer-events-none no-print fixed inset-x-0 bottom-24 md:bottom-8 md:pl-64 z-[60] flex justify-center px-4">
      <div key={toast.key} className="animate-fade-up flex items-center gap-2 rounded-2xl bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-lift">
        <CheckCircle2 size={18} className="text-emerald-400" />
        {toast.message}
      </div>
    </div>
  );
}
