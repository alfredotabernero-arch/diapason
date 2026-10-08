/** Pila de ventanas abiertas (hojas y diálogos) que el botón «atrás» debe cerrar antes de cambiar de pantalla */
const stack = [];

export function pushBackHandler(fn) {
  const entry = { fn };
  stack.push(entry);
  return () => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Cierra la última ventana abierta. Devuelve true si había alguna. */
export function closeTopSheet() {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.fn();
  return true;
}

/** Pide abrir el diálogo «Salir de Diapasón» (lo escucha AndroidBack) */
export function requestExit() {
  window.dispatchEvent(new CustomEvent('diapason:salir'));
}
