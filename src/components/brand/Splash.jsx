import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';

const KEY = 'diapason:splash';

/** Pantalla de bienvenida breve (una vez por sesión). Pulsar la cierra al momento. */
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
    const t1 = setTimeout(() => setPhase('leave'), 1500);
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
    </div>
  );
}
