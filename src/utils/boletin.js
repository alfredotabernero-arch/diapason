// Hoja de calificaciones por alumno y periodo (PDF, A4), en formato académico.
// Se genera en el propio dispositivo con pdf-lib y letra Times: sin Internet y con texto nítido para imprimir.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { CLAVE_FA, CLAVE_SOL, SELLO } from '../components/brand/clefs.js';
import { TERMS, gradeLabel } from './constants.js';
import { courseLabel, finalGrade } from './courses.js';
import { lastTermKey } from './periodos.js';
import { MONTHS, fromISO } from './dates.js';
import { fullName } from './selectors.js';
import { levelIn, yearLabel } from './school.js';

const A4 = [595.28, 841.89];
const M = 58; // margen
const TINTA = rgb(0.078, 0.102, 0.173); // #141A2C
const GRIS = rgb(0.38, 0.42, 0.52);
const SUAVE = rgb(0.62, 0.66, 0.74);
const ORO = rgb(0.69, 0.5, 0.19); // #B07F30
const FONDO = rgb(0.965, 0.957, 0.937);
const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

/** «Primer trimestre», «Segundo cuatrimestre», «Invierno»… (según Ajustes) */
const ordinal = (key) => (TERMS.find((t) => t.key === key) || {}).ordinal || key;

/** «En Madrid, a 18 de diciembre de 2026» */
export function lugarYFecha(locality, iso) {
  const d = fromISO(iso);
  return `En ${locality?.trim() || '______________'}, a ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

/** Periodos que entran en la hoja del periodo elegido (el 1.º uno; el último, todos) */
export const termsUpTo = (term) => TERMS.slice(0, TERMS.findIndex((t) => t.key === term) + 1);

/**
 * Genera el PDF. alumnos: [{ student, grade }] (una hoja por alumno).
 * opts: { settings, course, term, date }
 */
export async function buildBoletin(alumnos, { settings, course, term, date }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(alumnos.length === 1 ? `Calificaciones de ${fullName(alumnos[0].student)}` : `Calificaciones · ${ordinal(term)}`);
  pdf.setAuthor(settings.teacherName || '');
  pdf.setCreator('Diapasón');
  const F = {
    r: await pdf.embedFont(StandardFonts.TimesRoman),
    b: await pdf.embedFont(StandardFonts.TimesRomanBold),
    i: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };
  // la letra Times de los PDF no tiene todos los signos: los que falten se cambian por equivalentes
  const okSet = new Set(F.r.getCharacterSet());
  const safe = (t) => String(t ?? '').replace(/[♯]/g, '#').replace(/[♭]/g, 'b').split('').map((c) => (okSet.has(c.codePointAt(0)) ? c : c === '\n' ? '\n' : '?')).join('');
  let logo = null;
  if (settings.schoolLogo) {
    try { logo = await pdf.embedPng(settings.schoolLogo); } catch { logo = null; }
  }
  for (const a of alumnos) drawPage(pdf, F, safe, logo, a, { settings, course, term, date });
  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

function wrap(text, font, size, width) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    let line = '';
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) <= width) line = t;
      else { if (line) out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

function drawSello(page, x, yTop, size) {
  const k = size / SELLO.size;
  const P = (u, v) => ({ x: x + u * k, y: yTop - v * k });
  for (const a of SELLO.anillos) {
    page.drawCircle({ ...P(100, 100), size: a.r * k, borderWidth: a.w * k, borderColor: a.color === 'oro' ? hex(SELLO.oro) : hex(SELLO.tinta) });
  }
  for (const y of SELLO.pentagramas.flat()) page.drawLine({ start: P(SELLO.x1, y), end: P(SELLO.x2, y), thickness: SELLO.lineaW * k, color: hex(SELLO.tinta) });
  const y1 = SELLO.pentagramas[0][0], y2 = SELLO.pentagramas[1][4];
  for (const bx of [SELLO.x1, SELLO.x2]) page.drawLine({ start: P(bx, y1), end: P(bx, y2), thickness: SELLO.barraW * k, color: hex(SELLO.tinta) });
  for (const c of SELLO.claves) {
    const o = P(c.x, c.y);
    page.drawSvgPath(c.path === 'sol' ? CLAVE_SOL : CLAVE_FA, { x: o.x, y: o.y, scale: SELLO.escala * k, color: hex(SELLO.tinta) });
  }
}

function drawPage(pdf, F, safe, logo, { student, grade }, { settings, course, term, date }) {
  const page = pdf.addPage(A4);
  const [W, H] = A4;
  const right = W - M;
  const text = (t, x, y, { font = F.r, size = 11, color = TINTA, align = 'left', spacing = 0 } = {}) => {
    const s = safe(t);
    let w = font.widthOfTextAtSize(s, size) + spacing * Math.max(0, s.length - 1);
    const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    if (!spacing) { page.drawText(s, { x: x0, y, size, font, color }); return w; }
    let cx = x0;
    for (const ch of s) { page.drawText(ch, { x: cx, y, size, font, color }); cx += font.widthOfTextAtSize(ch, size) + spacing; }
    return w;
  };

  // ---------- encabezado: logo, escuela, asignatura y profesor
  let y = H - M;
  const L = 64;
  if (logo) {
    const k = Math.min(L / logo.width, L / logo.height);
    page.drawImage(logo, { x: M + (L - logo.width * k) / 2, y: y - L + (L - logo.height * k) / 2, width: logo.width * k, height: logo.height * k });
  } else drawSello(page, M, y, L);
  const tx = M + L + 16;
  // el nombre de la escuela se ajusta al ancho disponible
  const escuela = safe(settings.school || 'Escuela de Música');
  let fs = 18;
  while (fs > 11 && F.b.widthOfTextAtSize(escuela, fs) > right - tx) fs -= 0.5;
  text(escuela, tx, y - 20, { font: F.b, size: fs });
  text(`${settings.subject} · ${courseLabel(course)}`, tx, y - 38, { font: F.i, size: 12, color: GRIS });
  text(`Profesor/a: ${settings.teacherName || ''}`, tx, y - 54, { size: 11, color: GRIS });
  y -= L + 14;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1.2, color: TINTA });
  page.drawLine({ start: { x: M, y: y - 3 }, end: { x: right, y: y - 3 }, thickness: 0.5, color: ORO });

  // ---------- título
  y -= 40;
  text('INFORME DE EVALUACIÓN', W / 2, y, { font: F.b, size: 15, align: 'center', spacing: 2.2 });
  y -= 18;
  text(ordinal(term), W / 2, y, { font: F.i, size: 12.5, color: GRIS, align: 'center' });

  // ---------- datos del alumno
  y -= 30;
  const boxH = 74;
  page.drawRectangle({ x: M, y: y - boxH, width: right - M, height: boxH, color: FONDO, borderColor: rgb(0.86, 0.85, 0.82), borderWidth: 0.6 });
  const col2 = M + (right - M) / 2 + 6;
  const dato = (label, value, x, yy) => {
    text(label.toUpperCase(), x, yy, { size: 7.5, color: SUAVE, spacing: 0.8 });
    text(value || '—', x, yy - 14, { size: 12, font: F.b });
  };
  dato('Alumno/a', fullName(student), M + 14, y - 20);
  dato(settings.subject === student.instrument ? 'Nivel' : 'Especialidad · nivel', settings.subject === student.instrument ? levelIn(student, course) : `${student.instrument} · ${levelIn(student, course)}`, col2, y - 20);
  dato('Grupo', student.group || '—', M + 14, y - 52);
  dato('Año en la escuela', yearLabel(student, course), col2, y - 52);
  y -= boxH + 26;

  // ---------- tabla de calificaciones y observaciones
  const cols = [M, M + 128, M + 238, right];
  const head = (t, i) => text(t.toUpperCase(), cols[i] + 8, y - 13, { size: 8, font: F.b, color: GRIS, spacing: 0.9 });
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.9, color: TINTA });
  head('Evaluación', 0); head('Calificación', 1); head('Observaciones', 2);
  y -= 20;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.4, color: SUAVE });
  const rows = termsUpTo(term).map((t) => ({ label: ordinal(t.key), value: grade?.[t.key], note: grade?.comments?.[t.key] }));
  if (term === lastTermKey()) {
    const fin = finalGrade(grade);
    if (fin !== null && fin !== undefined) rows.push({ label: 'Calificación final', value: fin, note: grade?.comments?.final, final: true });
  }
  const obsW = cols[3] - cols[2] - 16;
  for (const r of rows) {
    const lines = r.note ? wrap(safe(r.note), F.i, 10.5, obsW) : ['—'];
    const rowH = Math.max(34, 14 + lines.length * 13.5 + 8);
    const top = y;
    if (r.final) page.drawRectangle({ x: M, y: y - rowH, width: right - M, height: rowH, color: FONDO });
    text(r.label, cols[0] + 8, top - 20, { font: r.final ? F.b : F.r, size: 11.5 });
    if (r.value !== null && r.value !== undefined && r.value !== '') {
      const w = text(String(r.value), cols[1] + 8, top - 21, { font: F.b, size: 16 });
      text(gradeLabel(r.value), cols[1] + 14 + w, top - 20, { font: F.i, size: 11, color: GRIS });
    } else text('—', cols[1] + 8, top - 20, { color: SUAVE });
    lines.forEach((l, k) => text(l, cols[2] + 8, top - 19 - k * 13.5, { font: r.note ? F.i : F.r, size: 10.5, color: r.note ? TINTA : SUAVE }));
    y -= rowH;
    page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: r.final ? 0.9 : 0.4, color: r.final ? TINTA : SUAVE });
  }
  if (!rows.some((r) => r.final)) page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.9, color: TINTA });

  // ---------- gráfica de evolución
  const puntos = rows.filter((r) => !r.final).map((r, i) => ({ k: TERMS[i].short, v: r.value }));
  const fin = rows.find((r) => r.final);
  if (fin) puntos.push({ k: 'Final', v: fin.value, final: true });
  if (puntos.some((p) => p.v !== null && p.v !== undefined && p.v !== '')) {
    y -= 34;
    text('EVOLUCIÓN', M, y, { size: 8, font: F.b, color: GRIS, spacing: 0.9 });
    const gh = 92, gw = 64 * puntos.length + 30, gx = M + 22, gy = y - 14 - gh;
    for (const v of [0, 5, 10]) {
      const yy = gy + (v / 10) * gh;
      page.drawLine({ start: { x: gx, y: yy }, end: { x: gx + gw, y: yy }, thickness: v === 5 ? 0.4 : 0.3, color: v === 5 ? ORO : SUAVE, dashArray: v === 5 ? [2, 2] : undefined });
      text(String(v), gx - 6, yy - 3, { size: 8, color: SUAVE, align: 'right' });
    }
    puntos.forEach((p, i) => {
      const bx = gx + 18 + i * 64, bw = 30;
      const has = p.v !== null && p.v !== undefined && p.v !== '';
      if (has) {
        const bh = (Number(p.v) / 10) * gh;
        page.drawRectangle({ x: bx, y: gy, width: bw, height: Math.max(1, bh), color: p.final ? ORO : TINTA, opacity: p.final ? 0.9 : 0.82 });
        text(String(p.v), bx + bw / 2, gy + bh + 4, { size: 10, font: F.b, align: 'center' });
      }
      text(p.k, bx + bw / 2, gy - 13, { size: 9, color: GRIS, align: 'center' });
    });
    y = gy - 20;
  }

  // ---------- lugar, fecha y firma
  const fy = M + 96; // lugar, fecha y firma, siempre al pie
  text(lugarYFecha(settings.locality, date), right, fy, { size: 11.5, align: 'right' });
  const sx = right - 200;
  page.drawLine({ start: { x: sx, y: fy - 54 }, end: { x: right, y: fy - 54 }, thickness: 0.5, color: TINTA });
  text('Firma del profesor/a', sx + 100, fy - 67, { size: 9, color: GRIS, align: 'center' });
  text(settings.teacherName || '', sx + 100, fy - 81, { size: 11, align: 'center' });

  // pie discreto
  page.drawLine({ start: { x: M, y: M - 8 }, end: { x: right, y: M - 8 }, thickness: 0.3, color: SUAVE });
  text(`${settings.school || ''} · ${courseLabel(course)}`, M, M - 22, { size: 8, color: SUAVE });
  text('Diapasón', right, M - 22, { size: 8, font: F.i, color: SUAVE, align: 'right' });
}
