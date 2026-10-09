// Almacenamiento de archivos adjuntos (PDF, audio, vídeo) en IndexedDB del navegador.
// Los metadatos viven en el estado de la app; el contenido binario, aquí.
import { deliverFile, isDesktop, isNative } from './platform.js';

// Nombre interno heredado de la primera versión: se conserva para no perder adjuntos ya guardados
const DB_NAME = 'music-teacher-studio-files';
const STORE = 'files';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB no disponible'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result);
    t.onerror = () => reject(t.error);
  });
}

export const saveFile = (id, blob) => tx('readwrite', (s) => s.put(blob, id));
export const getFile = (id) => tx('readonly', (s) => s.get(id));
export const deleteFile = (id) => tx('readwrite', (s) => s.delete(id)).catch(() => {});

export async function openFile(id, name = 'archivo') {
  const blob = await getFile(id);
  if (!blob) throw new Error('Archivo no encontrado en este dispositivo');
  // En Android se abre con el menú Compartir («Abrir con…» el lector de PDF, el reproductor…)
  if (isNative()) return deliverFile(blob, name, name);
  // En el programa de Windows se abre con el programa del PC (lector de PDF, reproductor…)
  if (isDesktop()) return window.diapasonPC.abrirArchivo(name, await blob.arrayBuffer());
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} MB`;
}
