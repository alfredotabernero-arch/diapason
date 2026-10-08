import { BarChart3, CalendarDays, ClipboardList, History, Home, Library, ListTodo, Settings, Users } from 'lucide-react';

export const MAIN_NAV = [
  { to: '/', label: 'Inicio', short: 'Inicio', icon: Home, end: true },
  { to: '/agenda', label: 'Agenda', short: 'Agenda', icon: CalendarDays },
  { to: '/alumnos', label: 'Alumnos', short: 'Alumnos', icon: Users },
  { to: '/repertorio', label: 'Repertorio', short: 'Repertorio', icon: Library },
  { to: '/listados', label: 'Listados', short: 'Listados', icon: ClipboardList },
  { to: '/estadisticas', label: 'Estadísticas', short: 'Gráficos', icon: BarChart3 },
];

export const SECONDARY_NAV = [
  { to: '/tareas', label: 'Tareas para casa', icon: ListTodo },
  { to: '/clases', label: 'Historial de clases', icon: History },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];
