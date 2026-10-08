import { useEffect, useRef } from 'react';
import { pushBackHandler } from '../../utils/backStack.js';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Panel modal: hoja inferior en móvil, diálogo centrado en pantallas grandes */
export default function Sheet({ open, onClose, title, children, footer }) {
  // El botón «atrás» de Android cierra primero la ventana abierta más reciente
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    return pushBackHandler(() => closeRef.current?.());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-lift animate-sheet-up sm:animate-pop"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ink-200 sm:hidden" />
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} className="btn-ghost !p-2 -mr-2" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-ink-100 px-5 py-3 pb-safe flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, title = '¿Seguro?', message, confirmLabel = 'Eliminar', onConfirm, onClose }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-ink-600">{message}</p>
    </Sheet>
  );
}
