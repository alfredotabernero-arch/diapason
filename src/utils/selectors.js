// Cálculos derivados del estado: agenda, estadísticas y agrupaciones.

import { ACTIVE_STATUSES, RESULT_STYLE, attended } from './constants.js';
import { addDays, addMonths, isoWeekday, monthShort, startOfMonth, timeToMinutes, todayISO } from './dates.js';

export const fullName = (s) => (s ? `${s.firstName} ${s.lastName}` : 'Alumno eliminado');
export const initials = (s) => (s ? `${s.firstName[0] || ''}${s.lastName[0] || ''}`.toUpperCase() : '?');

export function byId(list) {
  const map = new Map();
  for (const x of list) map.set(x.id, x);
  return map;
}

/** Citas de un día: horario semanal de cada alumno + estado de registro de la clase */
export function appointmentsForDate(state, date) {
  const wd = isoWeekday(date);
  const out = [];
  for (const st of state.students) {
    if (st.since && date < st.since) continue;
    for (const slot of st.schedule || []) {
      if (Number(slot.weekday) !== wd) continue;
      const lesson = state.lessons.find((l) => l.studentId === st.id && l.date === date && l.time === slot.time)
        || state.lessons.find((l) => l.studentId === st.id && l.date === date);
      out.push({
        key: `${st.id}-${date}-${slot.time}`,
        student: st,
        date,
        time: slot.time,
        duration: Number(slot.duration),
        lesson: lesson || null,
      });
    }
  }
  return out.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

/**
 * Agenda del día: las clases de grupo (alumnos con el mismo grupo, hora y duración)
 * se unen en una sola cita. Cada entrada lleva students[] y lessons[].
 */
export function agendaForDate(state, date) {
  const map = new Map();
  for (const a of appointmentsForDate(state, date)) {
    const g = a.student.group || '';
    const key = g ? `g:${g}|${a.time}|${a.duration}` : `s:${a.student.id}|${a.time}`;
    if (!map.has(key)) map.set(key, { key: `${key}|${date}`, date, time: a.time, duration: a.duration, group: g, students: [], lessons: [] });
    const e = map.get(key);
    e.students.push(a.student);
    if (a.lesson) e.lessons.push(a.lesson);
  }
  return [...map.values()].map((e) => ({
    ...e,
    student: e.students[0],
    lesson: e.students.length === 1 ? e.lessons[0] || null : null,
    isGroup: e.students.length > 1,
    registered: e.lessons.length >= e.students.length,
  }));
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
export function weeklySlots(state) {
  const set = new Set();
  for (const s of state.students) {
    for (const x of s.schedule || []) set.add(s.group ? `g:${s.group}|${x.weekday}|${x.time}` : `s:${s.id}|${x.weekday}|${x.time}`);
  }
  return set.size;
}

export function weeklyClassCount(state) {
  return state.students.reduce((n, s) => n + (s.schedule?.length || 0), 0);
}

export function weeklyMinutes(state) {
  const seen = new Map();
  for (const s of state.students) {
    for (const x of s.schedule || []) seen.set(s.group ? `g:${s.group}|${x.weekday}|${x.time}` : `s:${s.id}|${x.weekday}|${x.time}`, Number(x.duration));
  }
  return [...seen.values()].reduce((a, b) => a + b, 0);
}

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
  const groupOf = new Map(state.students.map((s) => [s.id, s.group || '']));
  const map = new Map();
  for (const l of lessons) {
    if (!attended(l)) continue;
    const g = groupOf.get(l.studentId);
    const key = g ? `g:${g}|${l.date}|${l.time}` : l.id;
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
