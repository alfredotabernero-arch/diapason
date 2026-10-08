// Catálogos y estilos compartidos. Las clases de Tailwind se escriben completas
// para que el compilador JIT las detecte.

// ---------- Asignaturas: cada copia de Diapasón pertenece a un profesor y una asignatura
export const SUBJECT_GROUPS = [
  { family: 'cuerda', label: 'Cuerda frotada', subjects: ['Violín', 'Viola', 'Violonchelo', 'Contrabajo'] },
  { family: 'pulsada', label: 'Cuerda pulsada', subjects: ['Guitarra', 'Arpa'] },
  { family: 'teclado', label: 'Tecla', subjects: ['Piano', 'Órgano', 'Clave', 'Acordeón'] },
  { family: 'viento', label: 'Viento', subjects: ['Flauta', 'Oboe', 'Clarinete', 'Fagot', 'Saxofón', 'Trompa', 'Trompeta', 'Trombón', 'Tuba'] },
  { family: 'percusion', label: 'Percusión', subjects: ['Percusión'] },
  { family: 'canto', label: 'Voz', subjects: ['Canto', 'Coro'] },
  { family: 'lenguaje', label: 'Teoría', subjects: ['Lenguaje Musical', 'Armonía'] },
];

export const SUBJECTS = SUBJECT_GROUPS.flatMap((g) => g.subjects);

export function subjectFamily(subject) {
  return SUBJECT_GROUPS.find((g) => g.subjects.includes(subject))?.family || 'cuerda';
}

/** Asignaturas colectivas o teóricas: los alumnos tienen además su propia especialidad instrumental */
export const isInstrumentSubject = (subject) => !['lenguaje'].includes(subjectFamily(subject)) && subject !== 'Coro';

/** Instrumentos que puede tener un alumno (su especialidad) */
export const INSTRUMENTS = SUBJECT_GROUPS.filter((g) => g.family !== 'lenguaje').flatMap((g) => g.subjects).filter((s) => s !== 'Coro');

/** Asignaturas con datos de ejemplo incluidos */
export const DEMO_SUBJECTS = ['Violonchelo', 'Violín', 'Piano', 'Flauta', 'Lenguaje Musical'];

export const TECHNIQUE_BY_FAMILY = {
  cuerda: ['Arco', 'Digitación', 'Afinación', 'Posiciones', 'Sonido'],
  pulsada: ['Pulsación', 'Digitación', 'Sonido', 'Afinación', 'Posiciones'],
  teclado: ['Digitación', 'Pedal', 'Sonido', 'Lectura', 'Memoria'],
  viento: ['Sonido', 'Respiración', 'Articulación', 'Afinación', 'Digitación'],
  percusion: ['Baquetas', 'Coordinación', 'Lectura', 'Sonido'],
  canto: ['Respiración', 'Emisión', 'Afinación', 'Dicción', 'Lectura'],
  lenguaje: ['Ritmo', 'Entonación', 'Dictado', 'Lectura', 'Teoría'],
};
export const techniqueCategories = (subject) => TECHNIQUE_BY_FAMILY[subjectFamily(subject)];

const S = (c, hex) => ({
  dot: `bg-${c}-400`, soft: `bg-${c}-50 text-${c}-700`, ring: `ring-${c}-200`, bar: `bg-${c}-400`, hex, border: `border-l-${c}-400`,
});
// Clases completas para que Tailwind las detecte:
// bg-rose-400 bg-rose-50 text-rose-700 ring-rose-200 border-l-rose-400
// bg-indigo-400 bg-indigo-50 text-indigo-700 ring-indigo-200 border-l-indigo-400
// bg-amber-400 bg-amber-50 text-amber-700 ring-amber-200 border-l-amber-400
// bg-teal-400 bg-teal-50 text-teal-700 ring-teal-200 border-l-teal-400
// bg-fuchsia-400 bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200 border-l-fuchsia-400
// bg-stone-400 bg-stone-50 text-stone-700 ring-stone-200 border-l-stone-400
// bg-orange-400 bg-orange-50 text-orange-700 ring-orange-200 border-l-orange-400
// bg-sky-400 bg-sky-50 text-sky-700 ring-sky-200 border-l-sky-400
// bg-lime-400 bg-lime-50 text-lime-700 ring-lime-200 border-l-lime-400
// bg-red-400 bg-red-50 text-red-700 ring-red-200 border-l-red-400
// bg-pink-400 bg-pink-50 text-pink-700 ring-pink-200 border-l-pink-400
// bg-violet-400 bg-violet-50 text-violet-700 ring-violet-200 border-l-violet-400
// bg-emerald-400 bg-emerald-50 text-emerald-700 ring-emerald-200 border-l-emerald-400
export const INSTRUMENT_STYLE = {
  Violonchelo: S('rose', '#D9667F'),
  Piano: S('indigo', '#6C75E0'),
  Violín: S('amber', '#D99A2B'),
  Flauta: S('teal', '#2A9D8F'),
  Viola: S('fuchsia', '#B85FB8'),
  Contrabajo: S('stone', '#8A7F72'),
  Guitarra: S('orange', '#D97A3A'),
  Clarinete: S('sky', '#3B95C9'),
  Oboe: S('lime', '#7FA33A'),
  Saxofón: S('emerald', '#2E9A6A'),
  Trompeta: S('red', '#C9493F'),
  Canto: S('pink', '#D16A9C'),
  'Lenguaje Musical': S('violet', '#8B6FD6'),
};

export const instrumentStyle = (name) =>
  INSTRUMENT_STYLE[name] || { dot: 'bg-ink-300', soft: 'bg-ink-50 text-ink-600', ring: 'ring-ink-200', bar: 'bg-ink-400', hex: '#9DA9C4', border: 'border-l-ink-300' };

export const LEVELS = [
  'Iniciación',
  'Elemental 1º', 'Elemental 2º', 'Elemental 3º', 'Elemental 4º',
  'Profesional 1º', 'Profesional 2º', 'Profesional 3º', 'Profesional 4º', 'Profesional 5º', 'Profesional 6º',
  'Superior',
  'Adulto · Inicial', 'Adulto · Intermedio', 'Adulto · Avanzado',
];

export const REPERTOIRE_LEVELS = ['Iniciación', 'Elemental', 'Profesional', 'Superior'];

export const STATUSES = ['Pendiente', 'Iniciada', 'En estudio', 'Consolidada', 'Terminada'];

export const STATUS_STYLE = {
  Pendiente: { chip: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300', hex: '#CBD5E1' },
  Iniciada: { chip: 'bg-sky-50 text-sky-700', bar: 'bg-sky-400', hex: '#38BDF8' },
  'En estudio': { chip: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400', hex: '#FBBF24' },
  Consolidada: { chip: 'bg-violet-50 text-violet-700', bar: 'bg-violet-400', hex: '#A78BFA' },
  Terminada: { chip: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', hex: '#10B981' },
};

/** Porcentaje orientativo al cambiar de estado (el profesor puede ajustarlo) */
export const STATUS_DEFAULT_PROGRESS = {
  Pendiente: 0,
  Iniciada: 15,
  'En estudio': 45,
  Consolidada: 80,
  Terminada: 100,
};

export const ACTIVE_STATUSES = ['Iniciada', 'En estudio', 'Consolidada'];

export const REPERTOIRE_TYPES = {
  obra: { label: 'Obras', singular: 'Obra' },
  estudio: { label: 'Estudios', singular: 'Estudio' },
  escala: { label: 'Escalas', singular: 'Escala' },
  tecnica: { label: 'Técnica', singular: 'Ejercicio técnico' },
};


export const ARTICULATIONS = [
  'Legato', 'Détaché', 'Staccato', 'Martelé', 'Spiccato', 'Legato 2 en 2',
  'Legato 4 en 4', 'Picado simple', 'Doble picado', 'Non legato', 'Portato',
];

export const PRIORITIES = ['Alta', 'Media', 'Baja'];

export const PRIORITY_STYLE = {
  Alta: { chip: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  Media: { chip: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  Baja: { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

export const RESULTS = ['Excelente', 'Muy bien', 'Bien', 'Regular', 'Mejorable'];

export const RESULT_STYLE = {
  Excelente: { chip: 'bg-emerald-50 text-emerald-700', score: 5 },
  'Muy bien': { chip: 'bg-teal-50 text-teal-700', score: 4 },
  Bien: { chip: 'bg-sky-50 text-sky-700', score: 3 },
  Regular: { chip: 'bg-amber-50 text-amber-700', score: 2 },
  Mejorable: { chip: 'bg-rose-50 text-rose-700', score: 1 },
};

export const MATERIAL_KINDS = {
  pdf: { label: 'Partitura PDF', accept: 'application/pdf' },
  video: { label: 'Vídeo', accept: 'video/*' },
  audio: { label: 'Audio', accept: 'audio/*' },
  link: { label: 'Enlace web', accept: '' },
};

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function itemTitle(item) {
  if (!item) return 'Elemento eliminado';
  switch (item.type) {
    case 'obra':
      return item.title;
    case 'estudio':
      return `${item.method} nº ${item.number}`;
    case 'escala':
      return `${item.tonality}`;
    case 'tecnica':
      return item.title;
    default:
      return item.title || '';
  }
}

export function itemSubtitle(item) {
  if (!item) return '';
  switch (item.type) {
    case 'obra':
      return item.composer;
    case 'estudio':
      return item.author ? `${item.author} · ${item.level}` : item.level;
    case 'escala':
      return `${item.articulation} · ${item.targetBpm} BPM${item.octaves ? ` · ${item.octaves} oct.` : ''}`;
    case 'tecnica':
      return item.category;
    default:
      return '';
  }
}

// ---------- Asistencia
export const ATTENDANCE = ['Asistió', 'Falta justificada', 'Falta injustificada'];
export const ATTENDANCE_STYLE = {
  'Asistió': { chip: 'bg-emerald-50 text-emerald-700', short: 'A' },
  'Falta justificada': { chip: 'bg-amber-50 text-amber-700', short: 'FJ' },
  'Falta injustificada': { chip: 'bg-rose-50 text-rose-700', short: 'FI' },
};
export const attended = (lesson) => !lesson.attendance || lesson.attendance === 'Asistió';

// ---------- Calificaciones (1-10 enteros)
export const TERMS = [
  { key: 't1', label: '1.er trimestre', short: '1T' },
  { key: 't2', label: '2.º trimestre', short: '2T' },
  { key: 't3', label: '3.er trimestre', short: '3T' },
];

export function gradeLabel(n) {
  if (n === null || n === undefined || n === '') return '';
  const v = Number(n);
  if (v < 5) return 'Insuficiente';
  if (v < 6) return 'Suficiente';
  if (v < 7) return 'Bien';
  if (v < 9) return 'Notable';
  return 'Sobresaliente';
}
export const GRADE_ABBR = { Insuficiente: 'IN', Suficiente: 'SU', Bien: 'BI', Notable: 'NT', Sobresaliente: 'SB' };
export function gradeStyle(n) {
  const l = gradeLabel(n);
  return {
    Insuficiente: 'bg-rose-50 text-rose-700',
    Suficiente: 'bg-amber-50 text-amber-700',
    Bien: 'bg-sky-50 text-sky-700',
    Notable: 'bg-teal-50 text-teal-700',
    Sobresaliente: 'bg-emerald-50 text-emerald-700',
  }[l] || 'bg-ink-50 text-ink-400';
}
