import { useState } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import { canShareFiles, createBackup, downloadBlob, shareBlob } from './backup.js';

/**
 * «Enviar datos»: crea la copia .zip de todo y la entrega según el dispositivo
 * (PC: guardar; Android: menú Compartir; iPad, iPhone y Mac: AirDrop, Archivos, correo…).
 */
export function useEnviarDatos() {
  const { actions, paso } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const { blob, name, missing } = await createBackup(actions.getState(), paso);
      if (canShareFiles()) {
        const ok = await shareBlob(blob, name).catch((e) => {
          if (e?.name === 'AbortError') return 'cancel';
          throw e;
        });
        if (ok === 'cancel') return false;
        if (!ok) await downloadBlob(blob, name);
      } else {
        await downloadBlob(blob, name);
      }
      actions.markSent();
      actions.notify(missing ? `Datos enviados (${missing} adjuntos no encontrados)` : 'Datos preparados para enviar ✓');
      return true;
    } catch (e) {
      if (/cancel/i.test(e?.message || '')) return false; // menú Compartir cerrado sin elegir
      setError(`No se pudieron preparar los datos: ${e.message}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { send, busy, error };
}
