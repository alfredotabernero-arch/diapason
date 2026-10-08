// Utilidades de fechas sin dependencias externas. Las fechas se guardan como 'YYYY-MM-DD'.

const pad = (n) => String(n).padStart(2, '0');

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = () => toISO(new Date());

export function addDays(iso, days) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function addMonths(iso, months) {
  const d = fromISO(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return toISO(d);
}

/** Día de la semana con lunes = 1 … domingo = 7 */
export function isoWeekday(iso) {
  const day = fromISO(iso).getDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(iso) {
  return addDays(iso, 1 - isoWeekday(iso));
}

export function startOfMonth(iso) {
  return iso.slice(0, 8) + '01';
}

export function daysBetween(a, b) {
  return Math.round((fromISO(b) - fromISO(a)) / 86400000);
}

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatLong(iso) {
  const d = fromISO(iso);
  return cap(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
}

export function formatShort(iso) {
  return fromISO(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function formatFull(iso) {
  return fromISO(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function monthLabel(iso) {
  const d = fromISO(iso);
  return `${cap(MONTHS[d.getMonth()])} ${d.getFullYear()}`;
}

export function monthShort(iso) {
  const d = fromISO(iso);
  return cap(MONTHS[d.getMonth()].slice(0, 3));
}

/** Texto relativo: "Hoy", "Mañana", "Ayer", "En 3 días", "Hace 2 días" */
export function relativeDay(iso, ref = todayISO()) {
  const diff = daysBetween(ref, iso);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1) return diff < 7 ? `En ${diff} días` : formatShort(iso);
  return -diff < 7 ? `Hace ${-diff} días` : formatShort(iso);
}

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function endTime(time, duration) {
  return minutesToTime(timeToMinutes(time) + Number(duration));
}

export function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function formatHours(minutes) {
  const h = minutes / 60;
  return h % 1 === 0 ? `${h} h` : `${h.toFixed(1).replace('.', ',')} h`;
}
