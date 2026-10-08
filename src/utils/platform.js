// Diferencias entre plataformas: navegador del PC, web instalada (iPhone/iPad) y app Android (Capacitor).
import { Capacitor } from '@capacitor/core';

/** true dentro de la app Android */
export const isNative = () => Capacitor.isNativePlatform();

/** true si se abrió como archivo local en el PC (Diapason.html con doble clic) */
export const isLocalFile = () => typeof location !== 'undefined' && location.protocol === 'file:';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Entrega un archivo al usuario.
 * - PC y web: lo descarga.
 * - Android: lo guarda en la caché de la app y abre el menú «Compartir»
 *   (guardar en Drive o Descargas, enviar por correo, WhatsApp…, o abrir con otra app).
 */
export async function deliverFile(blob, name, title = 'Diapasón') {
  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const safe = name.replace(/[\\/:*?"<>|]+/g, '-');
    const written = await Filesystem.writeFile({ path: safe, data: await blobToBase64(blob), directory: Directory.Cache });
    await Share.share({ title, files: [written.uri], dialogTitle: title });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
