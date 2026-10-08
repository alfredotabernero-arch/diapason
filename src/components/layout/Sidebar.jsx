import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Logo from '../brand/Logo.jsx';
import { isNative } from '../../utils/platform.js';
import { requestExit } from '../../utils/backStack.js';
import { useStore } from '../../store/StoreContext.jsx';
import { MAIN_NAV, SECONDARY_NAV } from './navItems.js';
import { instrumentStyle } from '../../utils/constants.js';
import { relativeDay, todayISO } from '../../utils/dates.js';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:bg-white/60 hover:text-ink-800'
  }`;

/** Menú lateral para PC e iPad (desde 768 px) */
export default function Sidebar() {
  const { state } = useStore();
  const { teacherName, school, subject, lastBackup } = state.settings;
  const backupAge = lastBackup ? relativeDay(lastBackup.slice(0, 10), todayISO()) : null;
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-100 bg-paper/95 px-4 pb-4 pt-[max(env(safe-area-inset-top),1.25rem)] md:flex">
      <Link to="/" className="fork-vibrate-hover mb-6 block px-2" aria-label="Diapasón · Inicio">
        <Logo className="h-[76px] w-auto" />
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Navegación principal">
        {MAIN_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
        <div className="my-3 border-t border-ink-100" />
        {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
      </nav>
      <Link to="/ajustes" className="mt-4 rounded-2xl border border-ink-100 bg-white p-3 text-xs hover:shadow-card transition">
        <p className="font-semibold text-ink-800 truncate">{teacherName}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-ink-500">
          <span className={`h-2 w-2 rounded-full ${instrumentStyle(subject).dot}`} /> {subject}
        </p>
        <p className="truncate text-ink-300">{school}</p>
        <p className={`mt-2 ${!lastBackup ? 'text-amber-700' : 'text-ink-300'}`}>
          {lastBackup ? `Última copia: ${backupAge.toLowerCase()}` : 'Sin copia de seguridad'}
        </p>
      </Link>
      {isNative() && (
        <button onClick={requestExit} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 hover:bg-white/60 hover:text-ink-800 transition">
          <LogOut size={19} /> Salir de Diapasón
        </button>
      )}
    </aside>
  );
}
