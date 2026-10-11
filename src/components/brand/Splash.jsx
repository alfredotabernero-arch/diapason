import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';
import { APP_CREDIT, APP_VERSION } from '../../config.js';

const KEY = 'diapason:splash';

/** Pantalla de bienvenida (una vez por sesión), unos 6 s como en Atril y Maestro. Pulsar la cierra al momento. */
export default function Splash() {
  const [phase, setPhase] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) ? 'done' : 'show';
    } catch {
      return 'show';
    }
  });

  useEffect(() => {
    if (phase !== 'show') return;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* sin almacenamiento */ }
    const t1 = setTimeout(() => setPhase('leave'), 5500);
    return () => clearTimeout(t1);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'leave') return;
    const t = setTimeout(() => setPhase('done'), 450);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;
  return (
    <div
      onClick={() => setPhase('leave')}
      className={`fixed inset-0 z-[100] grid place-items-center bg-paper transition-opacity duration-500 ${phase === 'leave' ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden="true"
    >
      <div className="flex w-[min(78vw,360px)] flex-col items-center animate-fade-up">
        <Logo variant="lockup" vibrate className="w-full h-auto" />
      </div>
      <div className="absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),1.5rem)] text-center animate-fade-up" style={{ animationDelay: '600ms' }}>
        <p className="font-display text-lg italic text-ink-700">{APP_CREDIT}</p>
        <p className="mt-1 text-xs tracking-wide text-ink-400">Versión {APP_VERSION}</p>
      </div>
    </div>
  );
}
