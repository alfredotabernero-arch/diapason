// Dónde se guardan los datos de Diapasón en el dispositivo.
// Desde la 1.6 van en IndexedDB (como Atril y Maestro): admite cientos de megas, años de cursos.
// Hasta la 1.5 iban en localStorage (unos 5 MB); al abrir la 1.6 se copian solos y se conserva
// una copia de seguridad con otro nombre.

const DB_NAME = 'diapason';
const STORE = 'estado';
const KEY = 'principal';
export const LS_KEY = 'diapason:v1';
const LS_LEGACY = 'music-teacher-studio:v1'; // nombre anterior de la app
const LS_COPIA = 'diapason:v1:copia-1.5'; // lo que había en localStorage antes de pasar a IndexedDB

let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB no disponible'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB bloqueada'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function idb(mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transacción cancelada'));
  }));
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY) ?? localStorage.getItem(LS_LEGACY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** true si los datos están en IndexedDB (false: en localStorage, como antes) */
export let usingIndexedDb = false;

/**
 * Carga los datos guardados. Si solo están en localStorage (versiones anteriores),
 * los pasa a IndexedDB, comprueba que se han guardado bien y deja la copia antigua aparte.
 */
export async function loadSaved() {
  try {
    const saved = await idb('readonly', (s) => s.get(KEY));
    if (saved) {
      usingIndexedDb = true;
      return saved;
    }
    const local = readLocal();
    if (local) {
      await idb('readwrite', (s) => s.put(local, KEY));
      const check = await idb('readonly', (s) => s.get(KEY));
      if (check && Array.isArray(check.students) && check.students.length === (local.students || []).length) {
        try {
          localStorage.setItem(LS_COPIA, JSON.stringify(local));
          localStorage.removeItem(LS_KEY);
          localStorage.removeItem(LS_LEGACY);
        } catch {
          /* sin espacio para la copia: se deja todo como estaba */
        }
      }
    }
    usingIndexedDb = true;
    return local;
  } catch {
    // Navegador sin IndexedDB: se sigue usando localStorage, como hasta la 1.5
    usingIndexedDb = false;
    return readLocal();
  }
}

let pending = null;
let writing = false;
/** Guarda el estado. Las escrituras se encadenan: siempre queda guardado el último. */
export function saveState(state) {
  if (!usingIndexedDb) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* cuota superada o modo privado */ }
    return;
  }
  pending = state;
  if (writing) return;
  writing = true;
  const next = () => {
    const s = pending;
    pending = null;
    idb('readwrite', (st) => st.put(s, KEY))
      .catch(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* nada más que hacer */ } })
      .finally(() => {
        if (pending) next();
        else { writing = false; esperando.splice(0).forEach((r) => r()); }
      });
  };
  next();
}

const esperando = [];
/** Espera a que termine de guardarse lo último (antes de cerrar la app) */
export function flushState() {
  if (!writing) return Promise.resolve();
  return new Promise((r) => { esperando.push(r); setTimeout(r, 1500); });
}

/** Pide al sistema que no borre nunca los datos de Diapasón aunque falte espacio */
export async function persistStorage() {
  try {
    if (navigator.storage?.persisted && await navigator.storage.persisted()) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* no disponible */
  }
  return false;
}

/** Espacio usado y disponible (aproximado), para Ajustes */
export async function storageEstimate() {
  try {
    if (navigator.storage?.estimate) return await navigator.storage.estimate();
  } catch {
    /* no disponible */
  }
  return null;
}
