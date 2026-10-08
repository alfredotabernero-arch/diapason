// Generador de datos de ejemplo por asignatura. Las fechas se calculan respecto al día
// actual para que la demo siempre tenga clases hoy, tareas próximas e historial reciente.

import { LIBRARY } from './library.js';
import { addDays, startOfWeek, todayISO } from '../utils/dates.js';
import { DEFAULT_TERMS, courseOf, courseRanges, inTerms } from '../utils/courses.js';
import { DEMO_SUBJECTS, itemTitle, isInstrumentSubject } from '../utils/constants.js';

// Generador pseudoaleatorio con semilla: los datos son siempre los mismos
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const round5 = (n) => Math.round(n / 5) * 5;

const PEOPLE = [
  { id: 'st1', firstName: 'Lucía', lastName: 'Fernández Ortega', phone: '612 345 781', email: 'lucia.fernandez@correo.es', sinceWeeks: 60, ability: 8.4 },
  { id: 'st2', firstName: 'Pablo', lastName: 'Martín Ruiz', phone: '623 118 904', email: 'familia.martin.ruiz@correo.es', sinceWeeks: 40, ability: 6.6 },
  { id: 'st3', firstName: 'Elena', lastName: 'Sánchez Gil', phone: '654 902 337', email: 'elena.sgil@correo.es', sinceWeeks: 26, ability: 7.2 },
  { id: 'st4', firstName: 'Javier', lastName: 'López Moreno', phone: '677 410 256', email: 'javier.lopez.m@correo.es', sinceWeeks: 70, ability: 8.9 },
  { id: 'st5', firstName: 'Carmen', lastName: 'Díaz Navarro', phone: '690 233 145', email: 'carmen.diaz.familia@correo.es', sinceWeeks: 18, ability: 5.8 },
  { id: 'st6', firstName: 'Marcos', lastName: 'Romero Vidal', phone: '611 874 520', email: 'marcos.romero@correo.es', sinceWeeks: 34, ability: 6.9 },
  { id: 'st7', firstName: 'Sofía', lastName: 'Torres Castillo', phone: '633 562 019', email: 'sofia.torres@correo.es', sinceWeeks: 52, ability: 8.1 },
  { id: 'st8', firstName: 'Daniel', lastName: 'Herrera Molina', phone: '644 781 302', email: 'herrera.molina@correo.es', sinceWeeks: 22, ability: 7.0 },
  { id: 'st9', firstName: 'Irene', lastName: 'Morales Prieto', phone: '622 905 418', email: 'irene.morales@correo.es', sinceWeeks: 46, ability: 7.8 },
  { id: 'st10', firstName: 'Hugo', lastName: 'Jiménez Serrano', phone: '699 314 627', email: 'familia.jimenez.s@correo.es', sinceWeeks: 12, ability: 6.2 },
];

const OBSERVACIONES = [
  'Prepara la prueba de acceso al siguiente curso. Muy constante; trabajar la relajación.',
  'Contacto con la madre (Ana). Tiende a correr en los pasajes rápidos.',
  'Alumna adulta, participa en una agrupación amateur. Prefiere repertorio lírico.',
  'Quiere presentarse a la prueba de Superior el próximo curso. Buen nivel técnico.',
  'Lectura algo lenta: dedicar 5 minutos de cada clase a la lectura a primera vista.',
  'Gran oído. Le cuesta mantener el estudio diario regular durante la semana.',
  'Muy implicada en las actividades del centro. Revisar tensión en hombros.',
  'Muy motivado; necesita trabajar la postura.',
  'Prepara un concurso de jóvenes intérpretes en primavera.',
  'Empezó este curso. Conviene un atril más bajo en casa; comentado con la familia.',
];

const EXTRA_NOTES = {
  st1: 'Hablar con su tutora sobre las fechas de la prueba de acceso.',
  st2: 'Ha mejorado mucho la postura desde el verano.',
  st4: 'Valorar el programa para la prueba de Superior.',
  st7: 'Propuesta para actuar como solista en la audición de primavera.',
  st9: 'Bases del concurso: obra obligatoria + obra libre. Enviar inscripción antes de fin de mes.',
};

// Asignaturas instrumentales: clases individuales
const INSTRUMENT_PLAN = {
  levels: ['Profesional 3º', 'Elemental 4º', 'Adulto · Intermedio', 'Profesional 5º', 'Elemental 2º', 'Profesional 1º', 'Profesional 2º', 'Elemental 3º', 'Profesional 4º', 'Elemental 1º'],
  schedules: [
    [{ weekday: 1, time: '17:00', duration: 60 }, { weekday: 4, time: '17:00', duration: 60 }],
    [{ weekday: 2, time: '16:00', duration: 45 }],
    [{ weekday: 3, time: '19:30', duration: 60 }],
    [{ weekday: 1, time: '18:30', duration: 60 }, { weekday: 4, time: '18:30', duration: 60 }],
    [{ weekday: 2, time: '17:00', duration: 45 }],
    [{ weekday: 3, time: '16:30', duration: 60 }, { weekday: 6, time: '11:30', duration: 60 }],
    [{ weekday: 2, time: '18:00', duration: 60 }, { weekday: 5, time: '17:00', duration: 60 }],
    [{ weekday: 4, time: '16:00', duration: 45 }],
    [{ weekday: 5, time: '18:30', duration: 60 }],
    [{ weekday: 6, time: '10:30', duration: 45 }],
  ],
};

// Lenguaje Musical: dos grupos, cada alumno con su especialidad instrumental
const GROUP_A = { name: '2.º Elemental · A', level: 'Elemental 2º', schedule: [{ weekday: 1, time: '17:00', duration: 60 }, { weekday: 3, time: '17:00', duration: 60 }] };
const GROUP_B = { name: '1.º Profesional · B', level: 'Profesional 1º', schedule: [{ weekday: 2, time: '18:00', duration: 60 }, { weekday: 4, time: '18:00', duration: 60 }] };
const LM_PLAN = {
  groups: [GROUP_B, GROUP_A, GROUP_A, GROUP_B, GROUP_A, GROUP_B, GROUP_B, GROUP_A, GROUP_B, GROUP_A],
  instruments: ['Violonchelo', 'Violonchelo', 'Guitarra', 'Piano', 'Piano', 'Clarinete', 'Violín', 'Violín', 'Flauta', 'Flauta'],
};

const IMSLP = (q) => `https://imslp.org/index.php?title=Special:Search&search=${encodeURIComponent(q)}`;
const YT = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const ITEM_MATERIALS = [
  { kind: 'pdf', title: 'Suites para violonchelo (IMSLP)', url: 'https://imslp.org/wiki/6_Cello_Suites,_BWV_1007-1012_(Bach,_Johann_Sebastian)', itemId: 'o2' },
  { kind: 'video', title: 'Interpretaciones de referencia del Preludio', url: YT('Bach cello suite 1 prelude'), itemId: 'o2' },
  { kind: 'pdf', title: 'Dotzauer · 113 Estudios (IMSLP)', url: IMSLP('Dotzauer 113 studies'), itemId: 'e1' },
  { kind: 'pdf', title: 'Suite bergamasque (IMSLP)', url: 'https://imslp.org/wiki/Suite_bergamasque_(Debussy,_Claude)', itemId: 'o11' },
  { kind: 'pdf', title: 'Sonatinas Op. 36 (IMSLP)', url: IMSLP('Clementi 6 Sonatinas Op.36'), itemId: 'o13' },
  { kind: 'pdf', title: 'Meditación de Thaïs — parte de violín', url: IMSLP('Massenet Thais Meditation violin'), itemId: 'o18' },
  { kind: 'video', title: 'Grabaciones del Concierto de Seitz', url: YT('Seitz concerto no 2 op 13'), itemId: 'o17' },
  { kind: 'audio', title: 'Grabaciones del concierto KV 313', url: YT('Mozart flute concerto G major KV 313'), itemId: 'o23' },
  { kind: 'pdf', title: 'Syrinx (IMSLP)', url: IMSLP('Debussy Syrinx'), itemId: 'o25' },
  { kind: 'video', title: 'Canon «Frère Jacques» a tres voces', url: YT('Frère Jacques canon a tres voces'), itemId: 'lm_o1' },
  { kind: 'pdf', title: 'Coral BWV 147 (IMSLP)', url: IMSLP('Bach BWV 147'), itemId: 'lm_o5' },
  { kind: 'link', title: 'Elementary Training for Musicians — referencia', url: 'https://www.google.com/search?q=Hindemith+Elementary+Training+for+Musicians', itemId: 'lm_e5' },
];

const OBSERVATIONS = {
  Excelente: ['Clase muy productiva: ha llegado con todo preparado.', 'Gran salto en seguridad; se nota el estudio diario.', 'Muy concentrado; afinación y pulso muy estables.'],
  'Muy bien': ['Buen trabajo en casa; pulir detalles de dinámica.', 'Avanza bien. Insistir en trabajar con metrónomo.', 'La obra empieza a sonar con carácter.'],
  Bien: ['Progreso correcto, aunque algunos pasajes siguen inseguros.', 'Repasamos digitaciones y fraseo; falta continuidad.', 'Estudio irregular esta semana, pero buena actitud en clase.'],
  Regular: ['Poco estudio en casa; dedicamos la clase a leer despacio.', 'Cansancio por exámenes del colegio. Clase más ligera.', 'Dificultades con el ritmo en los compases nuevos.'],
  Mejorable: ['No ha trabajado lo acordado. Hablamos de organizar el estudio.', 'Clase con mucha distracción; repetir el plan de la semana.'],
};
const INCIDENTS = ['Llegó 10 minutos tarde.', 'Olvidó la partitura; trabajamos de memoria.', 'Clase recuperada de una semana anterior.', 'Le costó concentrarse; venía de un examen.', 'Salió 10 minutos antes (cita médica).'];

const levelCat = (level) =>
  /Iniciación|Elemental|Inicial/.test(level) ? 'Elemental' : /Intermedio/.test(level) ? null : 'Profesional';

const shortTitle = (item) => {
  const t = itemTitle(item).split(/ \(| —|, Op\.| —/)[0];
  return t.length > 42 ? `${t.slice(0, 40)}…` : t;
};

function taskTitle(rand, item, lm) {
  switch (item.type) {
    case 'obra': {
      const a = 1 + Math.floor(rand() * 5) * 8;
      return pick(rand, lm
        ? [`${shortTitle(item)}: entonar compases ${a}-${a + 15}`, `${shortTitle(item)}: memorizar la letra y la melodía`]
        : [`${shortTitle(item)}: compases ${a}-${a + 15} lento con metrónomo`, `${shortTitle(item)}: memorizar la primera sección`, `${shortTitle(item)}: grabar y enviar audio`]);
    }
    case 'estudio':
      return lm ? `${itemTitle(item)}: leer y medir` : `Estudio ${itemTitle(item)}`;
    case 'escala':
      return lm ? `Entonar la escala de ${item.tonality} y sus grados tonales` : `Escala de ${item.tonality} a ${item.targetBpm} BPM`;
    default:
      return `${item.title}: 10 minutos diarios`;
  }
}

function workFor(rand, chosen, recency, lm) {
  return chosen
    .map((item) => {
      if (item.type === 'obra') {
        const start = 1 + Math.floor(rand() * 6) * 8;
        return `${item.title}: compases ${start}-${start + 15}`;
      }
      if (item.type === 'escala') return lm ? `Entonación: escala de ${item.tonality}` : `Escala de ${item.tonality} a ${Math.round(item.targetBpm * (0.7 + recency * 0.25))} BPM`;
      if (item.type === 'estudio') return lm ? `Lección ${itemTitle(item)}` : `Estudio ${itemTitle(item)}`;
      return `${item.category}: ${item.title}`;
    })
    .join('. ') + '.';
}

export function buildSeed({ subject = 'Violonchelo', today = todayISO(), settings: prev } = {}) {
  if (!DEMO_SUBJECTS.includes(subject)) subject = 'Violonchelo';
  const lm = !isInstrumentSubject(subject);
  const rand = mulberry32(42 + subject.length);
  const settings = {
    teacherName: 'Prof. Laura Medina',
    school: 'Escuela Municipal de Música',
    terms: DEFAULT_TERMS,
    lastBackup: null,
    ...(prev || {}),
    subject,
  };

  // ---------- Alumnos
  const students = PEOPLE.map(({ sinceWeeks, ability, ...p }, i) => {
    const group = lm ? LM_PLAN.groups[i] : null;
    return {
      ...p,
      instrument: lm ? LM_PLAN.instruments[i] : subject,
      level: lm ? group.level : INSTRUMENT_PLAN.levels[i],
      group: group ? group.name : '',
      schedule: lm ? group.schedule.map((s) => ({ ...s })) : INSTRUMENT_PLAN.schedules[i].map((s) => ({ ...s })),
      notes: OBSERVACIONES[i],
      since: addDays(today, -sinceWeeks * 7),
      createdAt: addDays(today, -sinceWeeks * 7),
    };
  });
  const abilityOf = Object.fromEntries(PEOPLE.map((p) => [p.id, p.ability]));

  // ---------- Repertorio asignado
  const library = LIBRARY.filter((i) => i.instrument === subject);
  const byType = (type, cat) => {
    const all = library.filter((i) => i.type === type);
    const lvl = cat ? all.filter((i) => i.level === cat) : all;
    return lvl.length >= 2 ? lvl : all;
  };
  const PATTERNS = [
    ['Terminada', 'En estudio', 'Consolidada', 'Iniciada'],
    ['En estudio', 'Terminada', 'Pendiente'],
    ['Consolidada', 'En estudio', 'Terminada'],
    ['Terminada', 'Consolidada', 'En estudio', 'Iniciada'],
  ];
  const progressFor = (status) =>
    ({ Terminada: 100, Consolidada: round5(75 + rand() * 15), 'En estudio': round5(40 + rand() * 25), Iniciada: round5(10 + rand() * 20), Pendiente: 0 })[status];

  const assignments = [];
  students.forEach((st, idx) => {
    const cat = levelCat(st.level);
    // En Lenguaje Musical el grupo comparte repertorio: el desplazamiento depende del grupo
    const offset = lm ? (st.group === GROUP_A.name ? 0 : 2) : idx;
    const plan = [];
    const obras = byType('obra', cat);
    PATTERNS[offset % PATTERNS.length].forEach((status, k) => plan.push([obras[(offset + k) % obras.length], status]));
    const estudios = byType('estudio', cat);
    plan.push([estudios[offset % estudios.length], idx % 3 === 2 ? 'Terminada' : 'En estudio']);
    plan.push([estudios[(offset + 1) % estudios.length], idx % 2 ? 'Iniciada' : 'Pendiente']);
    const escalas = byType('escala', cat);
    plan.push([escalas[offset % escalas.length], idx % 2 ? 'Consolidada' : 'En estudio']);
    plan.push([escalas[(offset + 1) % escalas.length], 'Iniciada']);
    const tecnica = byType('tecnica', cat);
    plan.push([tecnica[offset % tecnica.length], idx % 3 ? 'En estudio' : 'Consolidada']);
    if (tecnica.length > 2) plan.push([tecnica[(offset + 1) % tecnica.length], 'Iniciada']);

    const seen = new Set();
    plan.forEach(([item, status], k) => {
      if (!item || seen.has(item.id)) return;
      seen.add(item.id);
      const progress = progressFor(status);
      const assignedDaysAgo = status === 'Pendiente' ? 3 : 20 + Math.floor(rand() * 120);
      const assignedAt = addDays(today, -assignedDaysAgo);
      const steps = status === 'Pendiente' ? 0 : 3 + Math.floor(rand() * 3);
      const log = [{ date: assignedAt, progress: 0 }];
      for (let s = 1; s <= steps; s++) {
        log.push({ date: addDays(assignedAt, Math.round((assignedDaysAgo * s) / steps)), progress: Math.round((progress * s) / steps) });
      }
      assignments.push({ id: `a_${st.id}_${k}`, studentId: st.id, itemId: item.id, status, progress, assignedAt, updatedAt: log[log.length - 1].date, log });
    });
  });
  const itemById = new Map(library.map((i) => [i.id, i]));

  // ---------- Tareas para casa
  const tasks = [];
  const PRIOS = ['Alta', 'Media', 'Media', 'Baja'];
  students.forEach((st, idx) => {
    const mine = assignments.filter((a) => a.studentId === st.id);
    const active = mine.filter((a) => a.status !== 'Pendiente' && a.status !== 'Terminada').slice(0, 3);
    active.forEach((a, k) => {
      const dueIn = 2 + ((idx + k * 3) % 7);
      tasks.push({
        id: `tk_${st.id}_${k}`, studentId: st.id, title: taskTitle(rand, itemById.get(a.itemId), lm), description: '',
        priority: PRIOS[(idx + k) % 4], dueDate: addDays(today, dueIn), done: false, completedAt: null,
        itemId: a.itemId, createdAt: addDays(today, -5),
      });
    });
    const finished = mine.find((a) => a.status === 'Terminada');
    if (finished) {
      tasks.push({
        id: `tk_${st.id}_d`, studentId: st.id, title: `${shortTitle(itemById.get(finished.itemId))}: repasar antes de la audición`,
        description: '', priority: 'Media', dueDate: addDays(today, -3 - (idx % 4)), done: true,
        completedAt: addDays(today, -4 - (idx % 4)), itemId: finished.itemId, createdAt: addDays(today, -14),
      });
    }
  });
  // Una tarea vencida, para que se vea el aviso
  const overdue = tasks.find((t) => t.studentId === 'st7' && !t.done);
  if (overdue) overdue.dueDate = addDays(today, -1);

  // ---------- Notas y material
  const notes = Object.entries(EXTRA_NOTES).map(([studentId, text], i) => ({ id: `n_${studentId}`, studentId, date: addDays(today, -3 - i * 9), text }));
  const materials = ITEM_MATERIALS.filter((m) => itemById.has(m.itemId)).map((m, i) => ({ id: `m${i + 1}`, source: 'url', studentId: null, createdAt: addDays(today, -15), ...m }));
  materials.push(
    { id: 'm_st2', kind: 'video', source: 'url', title: 'Vídeo: postura y relajación', url: YT(`postura ${subject.toLowerCase()} relajación`), studentId: 'st2', itemId: null, createdAt: addDays(today, -10) },
    { id: 'm_st9', kind: 'link', source: 'url', title: 'Bases del concurso (pendiente de publicar)', url: 'https://www.google.com/search?q=concurso+j%C3%B3venes+int%C3%A9rpretes', studentId: 'st9', itemId: null, createdAt: addDays(today, -8) },
  );

  // ---------- Historial de clases con asistencia
  const lessons = [];
  const lrand = mulberry32(20261008);
  const thisMonday = startOfWeek(today);
  const WEEKS_BACK = 22;
  const groupWork = new Map();
  for (const st of students) {
    const studying = assignments.filter((a) => a.studentId === st.id && a.status !== 'Pendiente').map((a) => itemById.get(a.itemId)).filter(Boolean);
    for (let w = WEEKS_BACK; w >= 0; w--) {
      for (const slot of st.schedule) {
        const date = addDays(thisMonday, -7 * w + (slot.weekday - 1));
        if (date >= today || date < st.since || !inTerms(date, settings.terms)) continue;
        const recency = 1 - w / WEEKS_BACK;
        const roll = lrand();
        const attendance = roll < 0.05 ? 'Falta justificada' : roll < 0.07 ? 'Falta injustificada' : 'Asistió';
        const base = {
          id: `l_${st.id}_${date}_${slot.time.replace(':', '')}`, studentId: st.id, date, time: slot.time,
          duration: slot.duration, attendance, itemIds: [],
        };
        if (attendance !== 'Asistió') {
          lessons.push({ ...base, work: '', observations: attendance === 'Falta justificada' ? 'Aviso previo de la familia.' : '', incidents: '', result: '' });
          continue;
        }
        const r = lrand() * 0.6 + recency * 0.25 + (abilityOf[st.id] - 5) * 0.06;
        const result = r > 0.82 ? 'Excelente' : r > 0.6 ? 'Muy bien' : r > 0.38 ? 'Bien' : r > 0.2 ? 'Regular' : 'Mejorable';
        const key = `${st.group || st.id}|${date}|${slot.time}`;
        if (!groupWork.has(key)) {
          const chosen = [...studying].sort(() => lrand() - 0.5).slice(0, 2 + Math.floor(lrand() * 2));
          groupWork.set(key, { work: workFor(lrand, chosen, recency, lm), itemIds: chosen.map((i) => i.id) });
        }
        const gw = groupWork.get(key);
        lessons.push({
          ...base, work: gw.work, itemIds: gw.itemIds, result,
          observations: pick(lrand, OBSERVATIONS[result]),
          incidents: lrand() < 0.1 ? pick(lrand, INCIDENTS) : '',
        });
      }
    }
  }
  lessons.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  // ---------- Calificaciones: trimestres ya terminados del curso actual y del anterior
  const grades = [];
  const current = courseOf(today);
  const startYear = Number(current.slice(0, 4));
  const courses = [`${startYear - 1}-${startYear}`, current];
  const grand = mulberry32(7);
  for (const course of courses) {
    const ranges = courseRanges(course, settings.terms);
    for (const st of students) {
      const g = { id: `${st.id}_${course}`, studentId: st.id, course, t1: null, t2: null, t3: null, final: null, comments: {} };
      let any = false;
      ['t1', 't2', 't3'].forEach((t, k) => {
        if (ranges[t].to >= today || st.since > ranges[t].to) return;
        const v = Math.round(abilityOf[st.id] - 0.6 + k * 0.4 + (grand() - 0.5) * 1.6);
        g[t] = Math.max(3, Math.min(10, v));
        any = true;
      });
      if (!any) continue;
      if (g.t3 !== null && st.id === 'st4') g.final = Math.min(10, Math.round((g.t1 + g.t2 + g.t3) / 3) + 1);
      if (st.id === 'st4' && g.final) g.comments.final = 'Se sube la final por la evolución y la audición de fin de curso.';
      if (g.t1 !== null && g.t1 < 5) g.comments.t1 = 'Debe reforzar el estudio diario; se acuerda un plan con la familia.';
      grades.push(g);
    }
  }

  return {
    version: 1,
    seededAt: today,
    settings,
    students,
    items: library.map((i) => ({ ...i })),
    assignments,
    tasks,
    lessons,
    materials,
    notes,
    grades,
  };
}
