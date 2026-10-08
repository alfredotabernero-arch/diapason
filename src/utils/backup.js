// Copia de seguridad en .zip (datos + archivos adjuntos), como en Atril:
// sirve para guardar una copia y para pasar los datos del PC al iPad o al móvil y al revés.

import JSZip from 'jszip';
import { getFile, saveFile } from './files.js';
import { todayISO } from './dates.js';

const DATA_FILE = 'diapason-datos.json';

export function backupFileName() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `Diapason-copia-${todayISO()}-${hh}${mm}.zip`;
}

export async function createBackup(state) {
  const zip = new JSZip();
  zip.file(DATA_FILE, JSON.stringify({ ...state, exportedAt: new Date().toISOString(), app: 'Diapasón' }, null, 2));
  const files = state.materials.filter((m) => m.source === 'file');
  let missing = 0;
  for (const m of files) {
    try {
      const blob = await getFile(m.id);
      if (blob) zip.file(`adjuntos/${m.id}`, blob);
      else missing++;
    } catch {
      missing++;
    }
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  return { blob, name: backupFileName(), files: files.length - missing, missing };
}

/** Lee una copia .zip (o un .json de versiones anteriores) y devuelve los datos sin aplicarlos */
export async function readBackup(file) {
  if (/\.json$/i.test(file.name)) {
    return { data: JSON.parse(await file.text()), attachments: [] };
  }
  const zip = await JSZip.loadAsync(file);
  const entry = zip.file(DATA_FILE);
  if (!entry) throw new Error('El .zip no contiene una copia de Diapasón');
  const data = JSON.parse(await entry.async('string'));
  const attachments = [];
  zip.folder('adjuntos').forEach((path, f) => attachments.push({ id: path, file: f }));
  return { data, attachments };
}

export async function restoreAttachments(attachments, materials) {
  let restored = 0;
  for (const { id, file } of attachments) {
    const meta = materials.find((m) => m.id === id);
    const blob = await file.async('blob');
    await saveFile(id, meta?.mime ? new Blob([blob], { type: meta.mime }) : blob);
    restored++;
  }
  return restored;
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** En iPad y móvil permite enviar la copia por AirDrop, correo, Drive… */
export async function shareBlob(blob, name) {
  const file = new File([blob], name, { type: 'application/zip' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Copia de Diapasón' });
    return true;
  }
  return false;
}

export const canShareFiles = () => {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'x.zip', { type: 'application/zip' })] });
  } catch {
    return false;
  }
};
