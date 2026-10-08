// Curso académico y trimestres. Las fechas de los trimestres se guardan como 'MM-DD'
// en Ajustes y se aplican a cualquier curso (septiembre-junio).

import { todayISO } from './dates.js';

export const DEFAULT_TERMS = {
  t1: { from: '09-15', to: '12-22' },
  t2: { from: '01-08', to: '03-31' },
  t3: { from: '04-01', to: '06-20' },
};

/** Curso al que pertenece una fecha: de septiembre a agosto ('2026-2027') */
export function courseOf(iso = todayISO()) {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export const courseLabel = (course) => `Curso ${course.replace('-', '/')}`;

export function shiftCourse(course, delta) {
  const y = Number(course.slice(0, 4)) + delta;
  return `${y}-${y + 1}`;
}

/** Fechas ISO de inicio y fin de cada trimestre de un curso */
export function courseRanges(course, terms = DEFAULT_TERMS) {
  const y1 = Number(course.slice(0, 4));
  const y2 = y1 + 1;
  const at = (md) => `${Number(md.slice(0, 2)) >= 9 ? y1 : y2}-${md}`;
  const r = {};
  for (const k of ['t1', 't2', 't3']) r[k] = { from: at(terms[k].from), to: at(terms[k].to) };
  r.course = { from: r.t1.from, to: r.t3.to };
  return r;
}

/** Trimestre ('t1' | 't2' | 't3') de una fecha, o null si está fuera del periodo lectivo */
export function termOf(iso, terms = DEFAULT_TERMS) {
  const r = courseRanges(courseOf(iso), terms);
  for (const k of ['t1', 't2', 't3']) if (iso >= r[k].from && iso <= r[k].to) return k;
  return null;
}

export const inTerms = (iso, terms) => termOf(iso, terms) !== null;

/** Nota final efectiva: la que ha puesto el profesor o, si no, la media propuesta */
export function proposedFinal(g) {
  if (!g) return null;
  const vals = [g.t1, g.t2, g.t3].filter((v) => v !== null && v !== undefined && v !== '');
  if (vals.length < 3) return null;
  return Math.round(vals.reduce((a, b) => a + Number(b), 0) / vals.length);
}

export function finalGrade(g) {
  if (!g) return null;
  return g.final !== null && g.final !== undefined && g.final !== '' ? Number(g.final) : proposedFinal(g);
}

export function partialMean(g) {
  const vals = [g?.t1, g?.t2, g?.t3].filter((v) => v !== null && v !== undefined && v !== '');
  return vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null;
}
