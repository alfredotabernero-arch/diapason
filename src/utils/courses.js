// Curso académico y periodos (trimestres o dos periodos). Las fechas de los periodos se guardan como 'MM-DD'
// en Ajustes y se aplican a cualquier curso (septiembre-junio).

import { todayISO } from './dates.js';
import { periodos, termKeys, lastTermKey } from './periodos.js';

export const DEFAULT_TERMS = {
  t1: { from: '09-15', to: '12-22' },
  t2: { from: '01-08', to: '03-31' },
  t3: { from: '04-01', to: '06-20' },
};
/** Fechas por defecto con dos periodos (1.7): de septiembre a enero y de febrero a junio */
export const DEFAULT_TERMS_2 = {
  t1: { from: '09-15', to: '01-31' },
  t2: { from: '02-01', to: '06-20' },
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

/** Fechas ISO de inicio y fin de cada periodo de un curso (solo los periodos activos; el curso acaba con el último) */
export function courseRanges(course, terms = DEFAULT_TERMS, keys = termKeys()) {
  const y1 = Number(course.slice(0, 4));
  const y2 = y1 + 1;
  const at = (md) => `${Number(md.slice(0, 2)) >= 9 ? y1 : y2}-${md}`;
  const r = {};
  for (const k of keys) { const t = (terms && terms[k]) || DEFAULT_TERMS[k]; r[k] = { from: at(t.from), to: at(t.to) }; }
  r.course = { from: r[keys[0]].from, to: r[keys[keys.length - 1]].to };
  return r;
}

/** Periodo ('t1' | 't2' | 't3') de una fecha, o null si está fuera del periodo lectivo */
export function termOf(iso, terms = DEFAULT_TERMS) {
  const r = courseRanges(courseOf(iso), terms);
  for (const k of termKeys()) if (iso >= r[k].from && iso <= r[k].to) return k;
  return null;
}

export const inTerms = (iso, terms) => termOf(iso, terms) !== null;

const tieneNota = (v) => v !== null && v !== undefined && v !== '';

/**
 * Nota final propuesta: la media de los periodos (cuando todos tienen nota) o, si así se ha elegido
 * en Ajustes, la del último periodo.
 */
export function proposedFinal(g) {
  if (!g) return null;
  if (periodos().finalMode === 'ultimo') { const v = g[lastTermKey()]; return tieneNota(v) ? Number(v) : null; }
  const keys = termKeys();
  const vals = keys.map((k) => g[k]).filter(tieneNota);
  if (vals.length < keys.length) return null;
  return Math.round(vals.reduce((a, b) => a + Number(b), 0) / vals.length);
}

export function finalGrade(g) {
  if (!g) return null;
  return g.final !== null && g.final !== undefined && g.final !== '' ? Number(g.final) : proposedFinal(g);
}

export function partialMean(g) {
  const vals = termKeys().map((k) => g?.[k]).filter(tieneNota);
  return vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null;
}
