// Ayudas en bocadillo: qué hace cada botón (igual que en Atril y Maestro).
// Se activan en Ajustes › «Mostrar ayudas». En el PC salen al dejar el ratón quieto sobre el botón;
// en el móvil y la tablet, al mantenerlo pulsado (sin ejecutar el botón).

/* Una o dos frases. La clave es el atributo data-ayuda, la etiqueta (aria-label) o el texto del botón. */
const AYUDAS = {
  // agenda y clases
  'Cambiar solo este día': 'Mueve esta clase a otro día y hora, o anúlala, solo esta vez. El horario semanal no cambia.',
  'Clase puntual': 'Añade una clase solo un día, para un alumno o un grupo, fuera del horario semanal: un refuerzo, una recuperación, un ensayo antes de la audición.',
  'Registrar clase': 'Apunta la clase: asistencia, trabajo realizado, observaciones y resultado. Un minuto al terminar.',
  'Ver clase registrada': 'La clase ya está registrada: ábrela para revisarla o corregirla.',
  Registrar: 'Registra esta clase o ensayo: asistencia y lo que se ha trabajado.',
  'registrar-grupo': 'Registra el ensayo una sola vez, con la asistencia y la valoración de cada miembro.',
  'ensayo-puntual': 'Pon un ensayo solo un día (lo normal en un dúo o trío ocasional). No cambia el horario del grupo.',
  Recuperar: 'Deshace la anulación: la clase vuelve a su día y hora.',
  'Ver el grupo': 'Abre la ficha del grupo: miembros, repertorio común y ensayos.',
  'Revisar el ensayo': 'Abre el registro del ensayo para revisar la asistencia o lo trabajado.',
  'Registrar el ensayo': 'Registra el ensayo una sola vez, con la asistencia de cada miembro.',
  // alumnos y grupos
  'Cambiar horario': 'Va al horario semanal del alumno: el cambio es para siempre y la agenda se rehace sola. Para un solo día, usa el icono de la clase en la agenda.',
  'Dar de baja…': 'Pasa a antiguo alumno con la fecha de hoy: sale de la agenda y de las listas del curso, pero conserva todo su historial.',
  'Reincorporar a la escuela': 'Quita la fecha de baja: vuelve a la agenda y a las listas del curso.',
  'Nuevo grupo': 'Crea un grupo: conjunto, dúo, trío o clase colectiva, con su horario y sus miembros.',
  'solo-grupo': 'Persona que solo viene al grupo: sin clase individual ni calificaciones. Se lleva su asistencia y recibe los correos del grupo.',
  'Añadir o quitar miembros': 'Marca o desmarca a los alumnos del grupo, o añade a alguien que solo viene al grupo.',
  'Asignar al grupo': 'Asigna una obra a todos los miembros del grupo a la vez.',
  Asignar: 'Añade obras, estudios o escalas de tu biblioteca al repertorio del alumno.',
  correo: 'Abre tu programa de correo con el mensaje preparado: destinatario, asunto, enlaces y los PDF adjuntos. Lo revisas y lo envías tú.',
  'Enviar por correo': 'Abre tu programa de correo con el mensaje preparado: destinatario, asunto, enlaces y los PDF adjuntos. Lo revisas y lo envías tú.',
  'Enviar todo': 'Envía por correo a todo el grupo (en copia oculta) el repertorio común, con enlaces y PDF.',
  Llamar: 'Llama al teléfono de la ficha.',
  Email: 'Escribe un correo al alumno desde tu programa de correo.',
  Clase: 'Registra una clase de este alumno.',
  'Añadir material': 'Adjunta una partitura PDF, un audio o un vídeo, o guarda un enlace.',
  'Nueva tarea': 'Apunta lo que el alumno debe estudiar en casa, con prioridad y fecha.',
  'Editar calificaciones': 'Pon la nota y las observaciones de cada periodo (trimestre, cuatrimestre…) y la final.',
  // listados
  'Hoja de este alumno': 'La hoja de calificaciones en PDF del alumno elegido: logo, notas, observaciones, gráfica y firma.',
  'Todas en un PDF': 'Las hojas de todos los alumnos (o del grupo elegido) en un solo PDF, una por página.',
  'Imprimir / PDF': 'Imprime este listado o guárdalo como PDF.',
  Excel: 'Descarga este listado para abrirlo en Excel.',
  // inicio y ajustes
  Revisar: 'Empieza el curso: da de baja a quien ha terminado su 6.º año y sube de nivel a los demás.',
  'Enviar datos': 'Crea una copia .zip de todo, adjuntos incluidos: es tu copia de seguridad y la forma de pasar los datos a otro aparato.',
  'Recibir datos': 'Carga una copia .zip enviada desde otro aparato. Sustituye los datos de aquí por los de la copia.',
  'Empezar el curso…': 'Revisa el inicio de curso: bajas de quien termina el ciclo y subida de nivel de los demás.',
  'Guardar niveles': 'Aplica la lista de niveles: los nombres cambiados se cambian también en los alumnos.',
  'Valores por defecto': 'Vuelve a la lista de niveles de partida (no se aplica hasta guardar).',
  'Cambiar logo…': 'Pon el logo de tu escuela desde una imagen: sale en la hoja de calificaciones.',
  'Volver al genérico': 'Vuelve al logo genérico de clave de sol y clave de fa.',
  'Salir de Diapasón': 'Cierra la aplicación. Todo queda guardado.',
  Ajustes: 'Tu perfil, la asignatura, el curso, los niveles, el logo, las ayudas y el paso de datos.',
};
const PREFIJOS = ['Todas en un PDF'];

let activas = false;
export const ayudasActivas = () => activas;
export function setAyudas(v) {
  activas = !!v;
  if (!activas) ocultar();
}

function textoDe(el) {
  const label = el.getAttribute('aria-label');
  const texto = (el.textContent || '').trim();
  for (const k of [el.dataset.ayuda, label, texto]) {
    if (k && AYUDAS[k]) return { titulo: label || texto || k, texto: AYUDAS[k] };
  }
  const p = PREFIJOS.find((x) => texto.startsWith(x));
  return p ? { titulo: texto, texto: AYUDAS[p] } : null;
}
const objetivo = (t) => (t && t.closest ? t.closest('[data-ayuda], button, a, [role=button]') : null);

/* ---------- bocadillo ---------- */
let globo = null;
let tOcultar = 0;
function mostrar(el, info) {
  ocultar();
  globo = document.createElement('div');
  globo.className = 'ayuda-globo';
  globo.setAttribute('role', 'tooltip');
  const b = document.createElement('b');
  b.textContent = info.titulo;
  const span = document.createElement('span');
  span.textContent = info.texto;
  globo.append(b, span);
  document.body.appendChild(globo);
  const r = el.getBoundingClientRect();
  const g = globo.getBoundingClientRect();
  const margen = 10;
  let x = r.left + r.width / 2 - g.width / 2;
  x = Math.max(margen, Math.min(window.innerWidth - g.width - margen, x));
  let y = r.top - g.height - 12;
  let abajo = false;
  if (y < margen) { y = r.bottom + 12; abajo = true; }
  globo.style.left = `${x}px`;
  globo.style.top = `${y}px`;
  globo.style.setProperty('--flecha', `${Math.max(14, Math.min(g.width - 14, r.left + r.width / 2 - x))}px`);
  globo.classList.toggle('abajo', abajo);
  const actual = globo;
  requestAnimationFrame(() => actual.classList.add('on'));
  clearTimeout(tOcultar);
  tOcultar = setTimeout(ocultar, Math.max(5000, info.texto.length * 70));
}
function ocultar() {
  clearTimeout(tOcultar);
  if (globo) {
    const g = globo;
    globo = null;
    g.classList.remove('on');
    setTimeout(() => g.remove(), 180);
  }
}

let instalado = false;
/** Escucha el ratón y los dedos en toda la app (una sola vez) */
export function instalarAyudas() {
  if (instalado || typeof document === 'undefined') return;
  instalado = true;

  // ratón: dejar el cursor quieto encima
  let tHover = 0;
  let actual = null;
  document.addEventListener('pointerover', (e) => {
    if (!activas || e.pointerType !== 'mouse') return;
    const el = objetivo(e.target);
    if (el === actual) return;
    actual = el;
    clearTimeout(tHover);
    ocultar();
    if (!el) return;
    const info = textoDe(el);
    if (!info) return;
    if (el.title) { el.dataset.tituloOrig = el.title; el.removeAttribute('title'); } // que no salga a la vez el del navegador
    tHover = setTimeout(() => { if (actual === el && document.body.contains(el)) mostrar(el, info); }, 650);
  }, true);
  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = objetivo(e.target);
    if (el && el.contains(e.relatedTarget)) return;
    if (el && el.dataset.tituloOrig) { el.title = el.dataset.tituloOrig; delete el.dataset.tituloOrig; }
    clearTimeout(tHover);
    actual = null;
    ocultar();
  }, true);

  // dedo: mantener pulsado (no ejecuta el botón)
  let tLargo = 0;
  let inicio = null;
  let tragarClic = false;
  document.addEventListener('pointerdown', (e) => {
    tragarClic = false;
    if (e.pointerType === 'mouse') { clearTimeout(tHover); ocultar(); return; }
    ocultar();
    if (!activas) return;
    const el = objetivo(e.target);
    const info = el && textoDe(el);
    if (!info) return;
    inicio = { x: e.clientX, y: e.clientY };
    clearTimeout(tLargo);
    tLargo = setTimeout(() => { tragarClic = true; mostrar(el, info); if (navigator.vibrate) navigator.vibrate(10); }, 550);
  }, true);
  const cancelar = () => { clearTimeout(tLargo); inicio = null; };
  document.addEventListener('pointermove', (e) => { if (inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 10) cancelar(); }, true);
  document.addEventListener('pointerup', cancelar, true);
  document.addEventListener('pointercancel', cancelar, true);
  document.addEventListener('scroll', () => { cancelar(); ocultar(); }, true);
  document.addEventListener('click', (e) => {
    if (!tragarClic) return;
    tragarClic = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  document.addEventListener('contextmenu', (e) => { if (tragarClic || (activas && inicio)) e.preventDefault(); }, true);
  window.addEventListener('hashchange', ocultar);
}
