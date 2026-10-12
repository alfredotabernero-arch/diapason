import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useStore } from '../../store/StoreContext.jsx';
import { abrirCorreo, avisoCorreo, correoRepertorio } from '../../utils/correo.js';

/**
 * «Enviar por correo»: abre el correo del profesor con el repertorio (enlaces y adjuntos)
 * para un alumno o para todos los miembros de un grupo (en copia oculta). Lo envía el profesor.
 */
export default function MailButton({ people, items, group = '', label = 'Enviar por correo', className = 'btn-secondary', iconOnly = false }) {
  const { state, actions } = useStore();
  const [busy, setBusy] = useState(false);
  const sinEmail = people.every((p) => !(p.email || '').trim());
  const send = async (e) => {
    e?.stopPropagation();
    if (!items.length) return;
    if (sinEmail) {
      actions.notify(people.length === 1 ? 'Este alumno no tiene email en su ficha' : 'Ningún miembro tiene email en su ficha');
      return;
    }
    setBusy(true);
    try {
      const mail = correoRepertorio(state, { people, items, group });
      const r = await abrirCorreo(mail);
      actions.notify(avisoCorreo(r, mail));
    } catch (err) {
      actions.notify(err?.message || 'No se pudo abrir el correo');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={send} disabled={busy || !items.length} className={`${className} ${sinEmail ? 'opacity-60' : ''}`} aria-label={label} title={sinEmail ? 'Sin email en la ficha' : label} data-ayuda="correo">
      <Mail size={iconOnly ? 17 : 16} />{!iconOnly && ` ${label}`}
    </button>
  );
}
