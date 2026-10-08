import { NavLink } from 'react-router-dom';
import { MAIN_NAV } from './navItems.js';

/** Barra inferior: teléfono y tablet en vertical estrecha (se oculta desde 768 px) */
export default function BottomNav() {
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/90 backdrop-blur-lg pb-safe md:hidden" aria-label="Navegación principal">
      <ul className="mx-auto grid max-w-2xl grid-cols-6">
        {MAIN_NAV.map(({ to, short, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[10.5px] font-semibold transition-colors ${
                  isActive ? 'text-ink-900' : 'text-ink-300 hover:text-ink-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`absolute top-0 h-0.5 rounded-full bg-brass-400 transition-all duration-300 ${isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'}`} />
                  <span className={`grid h-8 w-11 place-items-center rounded-full transition-all duration-300 ${isActive ? 'bg-ink-50 scale-105' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.3 : 1.9} />
                  </span>
                  {short}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
