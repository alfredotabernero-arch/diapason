// Cálculos derivados del estado: agenda, estadísticas y agrupaciones.

import { ACTIVE_STATUSES, RESULT_STYLE, attended } from './constants.js';
import { addDays, addMonths, isoWeekday, monthShort, startOfMonth, timeToMinutes, todayISO } from './dates.js';
import { isActive } from './school.js';

export const fullName = (s) => (s ? `${s.firstName} ${s.lastName}` : 'Alumno eliminado');
export const initials = (s) => (s ? `${s.firstName[0] || ''}${s.lastName[0] || ''}`.toUpperCase() : '?');

export function byId(list) {
  const map = new Map();
  for (const x of list) map.set(x.id, x);
  return map;
}

/** Grupos en activo (no archivados) */
export const activeGroups = (state) => (state.groups || []).filter((g) => !g.archived);
/** Grupos a los que pertenece una persona */
export const groupsOf = (state, studentId) => activeGroups(state).filter((g) => (g.memberIds || []).includes(studentId));
/** «Décimo Arco, Superchelos» */
export const groupNames = (state, s) => (s ? groupsOf(state, s.id).map((g) => g.name).join(', ') : '');
/** Miembros de un grupo en activo en una fecha (sin los antiguos alumnos ni los que aún no estaban) */
export function groupMembers(state, group, date = todayISO()) {
  const ids = new Set(group?.memberIds || []);
  return state.students.filter((s) => ids.has(s.id) && !(s.since && date < s.since) && !(s.leftAt && date > s.leftAt));
}

/** Cambio puntual que afecta a la clase individual de un alumno en un día y hora de su horario (anulada o movida) */
export function changeFor(state, studentId, date, time) {
  return (state.changes || []).find((c) => !c.groupId && (c.kind === 'anular' || c.kind === 'mover') && c.date === date && c.time === time && c.studentIds.includes(studentId));
}
/** Lo mismo para la clase de un grupo */
export function groupChangeFor(state, groupId, date, time) {
  return (state.changes || []).find((c) => c.groupId === groupId && (c.kind === 'anular' || c.kind === 'mover') && c.date === date && c.time === time);
}

/**
 * Clases individuales de un día: horario semanal de cada alumno, con los cambios puntuales aplicados
 * (clases anuladas o movidas ese día, y clases movidas a ese día o añadidas sueltas),
 * más el estado de registro de la clase.
 */
export function appointmentsForDate(state, date) {
  const wd = isoWeekday(date);
  const out = [];
  const students = new Map(state.students.map((s) => [s.id, s]));
  const indiv = (l) => !l.groupId;
  const lessonOf = (st, time) => state.lessons.find((l) => indiv(l) && l.studentId === st.id && l.date === date && l.time === time)
    || state.lessons.find((l) => indiv(l) && l.studentId === st.id && l.date === date);
  const enActivo = (st) => !(st.since && date < st.since) && !(st.leftAt && date > st.leftAt);
  for (const st of state.students) {
    if (!enActivo(st)) continue;
    for (const slot of st.schedule || []) {
      if (Number(slot.weekday) !== wd) continue;
      if (changeFor(state, st.id, date, slot.time)) continue; // anulada o movida a otro día
      out.push({ key: `${st.id}-${date}-${slot.time}`, student: st, date, time: slot.time, duration: Number(slot.duration), lesson: lessonOf(st, slot.time) || null });
    }
  }
  // clases individuales movidas a este día y clases sueltas
  for (const c of state.changes || []) {
    if (c.groupId) continue;
    const here = (c.kind === 'mover' && c.toDate === date) || (c.kind === 'extra' && c.date === date);
    if (!here) continue;
    const time = c.kind === 'mover' ? c.toTime : c.time;
    for (const id of c.studentIds) {
      const st = students.get(id);
      if (!st || (st.leftAt && date > st.leftAt)) continue;
      out.push({ key: `${id}-${date}-${time}-${c.id}`, student: st, date, time, duration: Number(c.duration), lesson: lessonOf(st, time) || null, change: c });
    }
  }
  return out.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

/** Clases de grupo de un día: horario de cada grupo, sus cambios puntuales y las clases sueltas del grupo */
export function groupAppointmentsForDate(state, date) {
  const wd = isoWeekday(date);
  const out = [];
  const groups = new Map((state.groups || []).map((g) => [g.id, g]));
  const make = (g, time, duration, change = null) => {
    const students = groupMembers(state, g, date);
    const lessons = state.lessons.filter((l) => l.groupId === g.id && l.date === date && l.time === time);
    return {
      key: `g:${g.id}|${time}|${date}${change ? `|${change.id}` : ''}`, date, time, duration: Number(duration),
      group: g.name, groupId: g.id, groupObj: g, students, lessons, change, student: students[0] || null,
      lesson: null, isGroup: true, registered: lessons.length > 0 && lessons.length >= students.length,
    };
  };
  for (const g of activeGroups(state)) {
    for (const slot of g.schedule || []) {
      if (Number(slot.weekday) !== wd) continue;
      if (groupChangeFor(state, g.id, date, slot.time)) continue;
      out.push(make(g, slot.time, slot.duration));
    }
  }
  for (const c of state.changes || []) {
    if (!c.groupId) continue;
    const here = (c.kind === 'mover' && c.toDate === date) || (c.kind === 'extra' && c.date === date);
    const g = groups.get(c.groupId);
    if (!here || !g) continue;
    out.push(make(g, c.kind === 'mover' ? c.toTime : c.time, c.duration, c));
  }
  return out;
}

/** Clases anuladas un día (para verlas tachadas y poder recuperarlas) */
export function cancelledForDate(state, date) {
  const map = new Map();
  const groups = new Map((state.groups || []).map((g) => [g.id, g]));
  for (const c of state.changes || []) {
    if (c.kind !== 'anular' || c.date !== date) continue;
    const g = c.groupId ? groups.get(c.groupId) : null;
    const sts = g ? groupMembers(state, g, date) : c.studentIds.map((id) => state.students.find((s) => s.id === id)).filter(Boolean);
    if (sts.length || g) map.set(c.id, { change: c, students: sts, time: c.time, duration: Number(c.duration), group: g ? g.name : '' });
  }
  return [...map.values()].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

/** Agenda del día: clases individuales y de grupo. Cada entrada lleva students[] y lessons[]. */
export function agendaForDate(state, date) {
  const indiv = appointmentsForDate(state, date).map((a) => ({
    ...a, key: `s:${a.student.id}|${a.time}|${date}${a.change ? `|${a.change.id}` : ''}`, group: '', students: [a.student],
    lessons: a.lesson ? [a.lesson] : [], isGroup: false, registered: !!a.lesson,
  }));
  return [...indiv, ...groupAppointmentsForDate(state, date)].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

export function nextAppointment(state, fromDate = todayISO(), fromMinutes = 0) {
  for (let i = 0; i < 14; i++) {
    const date = addDays(fromDate, i);
    const list = agendaForDate(state, date).filter((a) => i > 0 || timeToMinutes(a.time) + a.duration > fromMinutes);
    if (list.length) return list[0];
  }
  return null;
}

/** Clases a la semana (una clase de grupo cuenta una vez) */
function weeklyMap(state) {
  const seen = new Map();
  for (const s of state.students.filter((x) => isActive(x))) {
    for (const x of s.schedule || []) seen.set(`s:${s.id}|${x.weekday}|${x.time}`, Number(x.duration));
  }
  for (const g of activeGroups(state)) {
    if (!groupMembers(state, g).length) continue;
    for (const x of g.schedule || []) seen.set(`g:${g.id}|${x.weekday}|${x.time}`, Number(x.duration));
  }
  return seen;
}
export const weeklySlots = (state) => weeklyMap(state).size;
export const weeklyClassCount = weeklySlots;
export const weeklyMinutes = (state) => [...weeklyMap(state).values()].reduce((a, b) => a + b, 0);

export function studentAssignments(state, studentId, itemsMap = byId(state.items)) {
  return state.assignments
    .filter((a) => a.studentId === studentId)
    .map((a) => ({ ...a, item: itemsMap.get(a.itemId) }))
    .filter((a) => a.item);
}

export function studentStats(state, studentId) {
  const itemsMap = byId(state.items);
  const as = studentAssignments(state, studentId, itemsMap);
  const all = state.lessons.filter((l) => l.studentId === studentId);
  const lessons = all.filter(attended);
  const tasks = state.tasks.filter((t) => t.studentId === studentId);
  const minutes = lessons.reduce((n, l) => n + Number(l.duration || 0), 0);
  const scored = lessons.filter((l) => RESULT_STYLE[l.result]);
  const avg = scored.length ? scored.reduce((n, l) => n + RESULT_STYLE[l.result].score, 0) / scored.length : 0;
  const isObra = (a) => a.item.type === 'obra';
  const active = (a) => ACTIVE_STATUSES.includes(a.status);
  const activeAll = as.filter(active);
  return {
    obrasTerminadas: as.filter((a) => isObra(a) && a.status === 'Terminada').length,
    obrasActivas: as.filter((a) => isObra(a) && active(a)).length,
    estudiosActivos: as.filter((a) => a.item.type === 'estudio' && active(a)).length,
    escalasActivas: as.filter((a) => a.item.type === 'escala' && active(a)).length,
    horasClase: minutes,
    // Estimación de estudio en casa: 4 días/semana × 30 min por cada semana con clase
    horasEstimadas: minutes + new Set(lessons.map((l) => weekKey(l.date))).size * 120,
    clases: lessons.length,
    faltas: all.length - lessons.length,
    asistencia: all.length ? Math.round((lessons.length / all.length) * 100) : null,
    mediaResultado: avg,
    tareasPendientes: tasks.filter((t) => !t.done).length,
    tareasCompletadas: tasks.filter((t) => t.done).length,
    progresoMedio: activeAll.length ? Math.round(activeAll.reduce((n, a) => n + a.progress, 0) / activeAll.length) : 0,
  };
}

function weekKey(iso) {
  return addDays(iso, 1 - isoWeekday(iso));
}

/**
 * Sesiones impartidas por el profesor: una clase de grupo cuenta una sola vez
 * aunque genere un registro por alumno. Solo cuenta si asistió al menos un alumno.
 */
export function teacherSessions(state, lessons = state.lessons) {
  const map = new Map();
  for (const l of lessons) {
    if (!attended(l)) continue;
    const key = l.groupId ? `g:${l.groupId}|${l.date}|${l.time}` : l.id;
    if (!map.has(key)) map.set(key, l);
  }
  return [...map.values()];
}

/** Evolución mensual de los últimos `months` meses */
export function monthlyEvolution(state, months = 6, today = todayISO()) {
  const first = addMonths(startOfMonth(today), -(months - 1));
  const rows = [];
  for (let i = 0; i < months; i++) {
    const m = addMonths(first, i);
    const key = m.slice(0, 7);
    const monthLessons = state.lessons.filter((l) => l.date.startsWith(key) && attended(l));
    const lessons = teacherSessions(state, monthLessons);
    rows.push({
      key,
      mes: monthShort(m),
      clases: lessons.length,
      horas: Math.round((lessons.reduce((n, l) => n + Number(l.duration || 0), 0) / 60) * 10) / 10,
      alumnos: new Set(monthLessons.map((l) => l.studentId)).size,
      tareas: state.tasks.filter((t) => t.done && t.completedAt?.startsWith(key)).length,
      terminadas: state.assignments.filter((a) => a.status === 'Terminada' && a.updatedAt?.startsWith(key)).length,
    });
  }
  return rows;
}

/** Media de resultados por mes de un alumno (1-5) */
export function studentMonthlyResults(state, studentId, months = 6, today = todayISO()) {
  const first = addMonths(startOfMonth(today), -(months - 1));
  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(first, i);
    const key = m.slice(0, 7);
    const ls = state.lessons.filter((l) => l.studentId === studentId && l.date.startsWith(key) && RESULT_STYLE[l.result]);
    return {
      mes: monthShort(m),
      clases: ls.length,
      media: ls.length ? Math.round((ls.reduce((n, l) => n + RESULT_STYLE[l.result].score, 0) / ls.length) * 10) / 10 : null,
    };
  });
}

export function groupBy(list, fn) {
  const map = new Map();
  for (const x of list) {
    const k = fn(x);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(x);
  }
  return map;
}

export function sortTasks(tasks) {
  const prio = { Alta: 0, Media: 1, Baja: 2 };
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.dueDate !== b.dueDate) return (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1;
    return prio[a.priority] - prio[b.priority];
  });
}

export function normalize(text) {
  return (text || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
