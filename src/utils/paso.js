// Paso de datos entre dispositivos (PC, Mac, iPad, móvil), como en Maestro.
// Cada dispositivo lleva la cuenta de su último cambio, su último envío y su última recepción.
// Se guarda aparte de los datos para que NO viaje dentro de la copia.
import { deviceKind } from './platform.js';

const KEY = 'diapason:paso';

const SLUG = { PC: 'pc', Mac: 'mac', iPad: 'ipad', iPhone: 'iphone', Android: 'movil', Navegador: 'navegador' };
const NAME = { PC: 'el PC', Mac: 'el Mac', iPad: 'el iPad', iPhone: 'el iPhone', Android: 'el móvil', Navegador: 'otro navegador' };
const LABEL = { PC: 'PC', Mac: 'Mac', iPad: 'iPad', iPhone: 'iPhone', Android: 'Móvil o tablet Android', Navegador: 'Navegador' };

export const deviceName = (kind) => NAME[kind] || 'otro dispositivo';
/** «al PC», «al iPad», «al móvil» */
export const toDevice = (kind) => deviceName(kind).replace(/^el /, 'al ').replace(/^otro /, 'a otro ');
export const deviceLabel = (kind) => LABEL[kind] || kind || '—';
export const deviceSlug = (kind) => SLUG[kind] || 'copia';

function newId() {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function readPaso() {
  let p = {};
  try {
    p = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    /* sin almacenamiento */
  }
  if (!p.deviceId) {
    p.deviceId = newId();
    writePaso(p);
  }
  return { lastChange: null, lastSent: null, lastReceived: null, ...p, device: deviceKind() };
}

export function writePaso(p) {
  try {
    const { device, ...rest } = p;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* sin almacenamiento */
  }
}

/** true si en este dispositivo hay algo apuntado después del último envío y de la última recepción */
export function hasPending(p) {
  if (!p?.lastChange) return false;
  const ref = [p.lastSent, p.lastReceived?.at].filter(Boolean).sort().pop();
  return !ref || p.lastChange > ref;
}

/** Datos de origen que se guardan dentro de cada copia */
export function originInfo(p) {
  return { deviceId: p.deviceId, device: p.device, createdAt: new Date().toISOString() };
}

/** Nombre del fichero: diapason-ipad-2026-10-09-1730.zip */
export function transferFileName(kind, date = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  const d = `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}-${z(date.getHours())}${z(date.getMinutes())}`;
  return `diapason-${deviceSlug(kind)}-${d}.zip`;
}

/** Avisos antes de recibir una copia, como en Maestro */
export function receiveWarnings(p, origin) {
  const w = [];
  if (origin?.deviceId && origin.deviceId === p.deviceId) {
    w.push({ id: 'mismo', title: 'Esta copia se hizo en este mismo dispositivo', text: `Es la que enviaste desde aquí. Cancela y elige la que viene de ${deviceName(otherKind(p))}.` });
  }
  if (origin?.createdAt && p.lastReceived?.createdAt && origin.createdAt < p.lastReceived.createdAt) {
    w.push({ id: 'antigua', title: 'Es más antigua que la última copia que recibiste', text: 'Cancela y elige la más reciente: la fecha y la hora están en el nombre del fichero.' });
  }
  if (hasPending(p)) {
    w.push({ id: 'pendientes', title: 'Aquí hay cambios sin enviar', text: 'Has apuntado cosas en este dispositivo y no las has enviado. Si recibes, se perderán. Si quieres conservarlas, cancela, envíalas desde aquí y sigue en el otro dispositivo.' });
  }
  return w;
}

/** El «otro» dispositivo con el que se intercambian datos (el de la última recepción) */
export function otherKind(p) {
  return p.lastReceived?.from || null;
}

/** «hoy a las 17:30», «ayer a las 9:05», «el 3 de octubre a las 18:00» */
export function whenLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 86_400_000);
  if (days === 0) return `hoy a las ${hm}`;
  if (days === 1) return `ayer a las ${hm}`;
  const m = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()];
  return `el ${d.getDate()} de ${m}${d.getFullYear() !== new Date().getFullYear() ? ` de ${d.getFullYear()}` : ''} a las ${hm}`;
}
