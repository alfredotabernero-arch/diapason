// Escuela: niveles editables, años en la escuela (ciclo de seis), altas y bajas, y nivel de cada curso.

import { courseOf } from './courses.js';
import { todayISO } from './dates.js';

/** Niveles de partida (los de conservatorio). Cada profesor puede cambiarlos en Ajustes › Niveles. */
export const DEFAULT_LEVELS = [
  'Iniciación',
  'Elemental 1º', 'Elemental 2º', 'Elemental 3º', 'Elemental 4º',
  'Profesional 1º', 'Profesional 2º', 'Profesional 3º', 'Profesional 4º', 'Profesional 5º', 'Profesional 6º',
  'Superior',
  'Adulto · Inicial', 'Adulto · Intermedio', 'Adulto · Avanzado',
];

/** Duración del ciclo en la escuela (años) */
export const CYCLE_YEARS = 6;

/** Lista de niveles del profesor (con los que tengan sus alumnos aunque ya no estén en la lista) */
export function levelsOf(settings) {
  return settings?.levels?.length ? settings.levels : DEFAULT_LEVELS;
}

/** Orden de un nivel según la lista del profesor (los desconocidos, al final) */
export function levelIndex(settings, level) {
  const i = levelsOf(settings).indexOf(level);
  return i < 0 ? 999 : i;
}

/** Nivel siguiente en la lista (o el mismo si es el último) */
export function nextLevel(settings, level) {
  const list = levelsOf(settings);
  const i = list.indexOf(level);
  return i >= 0 && i < list.length - 1 ? list[i + 1] : level;
}

const courseStartYear = (course) => Number(course.slice(0, 4));

/** Día de alta del alumno */
export const altaOf = (s) => s?.since || s?.createdAt || todayISO();

/** Curso en que empezó: un alta en julio o agosto cuenta para el curso que empieza en septiembre */
export function altaCourse(s) {
  const a = altaOf(s);
  const m = Number(a.slice(5, 7));
  return m === 7 || m === 8 ? courseOf(`${a.slice(0, 4)}-09-01`) : courseOf(a);
}

/** ¿Sigue en la escuela en esa fecha? (sin baja, o con la baja ese día o después) */
export function isActive(s, date = todayISO()) {
  return !s.leftAt || s.leftAt >= date;
}

export const activeStudents = (state, date = todayISO()) => state.students.filter((s) => isActive(s, date));
/** Alumnos con calificaciones: todos menos los miembros «solo de grupo» */
export const isGraded = (s) => !s?.groupOnly;
export const formerStudents = (state, date = todayISO()) => state.students.filter((s) => !isActive(s, date));

/**
 * Año del alumno en la escuela en un curso: el curso de alta es el 1.º.
 * Se puede corregir a mano (yearAdjust) si se incorporó en otro año, repitió o paró un curso.
 * Los alumnos permanentes no cuentan años: devuelve null.
 */
export function schoolYear(s, course = courseOf()) {
  if (s?.permanent) return null;
  const base = courseStartYear(course) - courseStartYear(altaCourse(s)) + 1;
  return Math.max(1, base + (Number(s?.yearAdjust) || 0));
}

/** Texto del año: «3.º año» · «Permanente» */
export function yearLabel(s, course = courseOf()) {
  if (s?.permanent) return 'Permanente';
  return `${schoolYear(s, course)}.º año`;
}

/** Años que estuvo en la escuela (para antiguos alumnos) */
export function yearsStayed(s) {
  const end = s.leftAt ? courseOf(s.leftAt) : courseOf();
  return Math.max(1, courseStartYear(end) - courseStartYear(altaCourse(s)) + 1);
}

/** Nivel que tenía en un curso (se guarda cada curso; si no, el actual) */
export function levelIn(s, course = courseOf()) {
  return s?.levelHistory?.[course] || s?.level || '';
}

/** Primer día de un curso (1 de septiembre) y último del anterior (31 de agosto) */
export const courseStart = (course) => `${courseStartYear(course)}-09-01`;
export const courseEndBefore = (course) => `${courseStartYear(course)}-08-31`;
