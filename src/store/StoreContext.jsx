import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { buildSeed } from '../data/seed.js';
import { isoWeekday, todayISO } from '../utils/dates.js';
import { uid, STATUS_DEFAULT_PROGRESS, isInstrumentSubject } from '../utils/constants.js';
import { DEFAULT_TERMS, courseOf } from '../utils/courses.js';
import { DEFAULT_LEVELS } from '../utils/school.js';
import { deleteFile } from '../utils/files.js';
import { readPaso, writePaso } from '../utils/paso.js';
import { saveState } from '../utils/storage.js';
import { instalarAyudas, setAyudas } from '../utils/ayuda.js';

const StoreContext = createContext(null);

/**
 * 1.6: los grupos pasan a ser fichas propias (nombre, horario, miembros).
 * Hasta la 1.5 cada alumno tenía un texto «Grupo» y su horario era el del grupo:
 * cada grupo se convierte en una ficha con sus miembros y ese horario, y las clases
 * ya registradas a esas horas pasan a ser clases del grupo.
 */
function migrateGroups(data) {
  if (Array.isArray(data.groups)) return data;
  const students = data.students || [];
  const names = [...new Set(students.map((s) => s.group).filter(Boolean))];
  const groups = names.map((name) => {
    const members = students.filter((s) => s.group === name);
    return {
      id: uid('gr'), name, kind: 'estable', schedule: (members[0].schedule || []).map((x) => ({ ...x })),
      memberIds: members.map((m) => m.id), archived: false, notes: '', createdAt: todayISO(),
    };
  });
  const byName = new Map(groups.map((g) => [g.name, g]));
  const groupOf = new Map(students.filter((s) => s.group).map((s) => [s.id, byName.get(s.group)]));
  return {
    ...data,
    groups,
    students: students.map(({ group, ...s }) => (group ? { ...s, schedule: [] } : s)),
    lessons: (data.lessons || []).map((l) => {
      const g = groupOf.get(l.studentId);
      if (!g || l.groupId) return l;
      const wd = isoWeekday(l.date);
      return (g.schedule || []).some((x) => Number(x.weekday) === wd && x.time === l.time) ? { ...l, groupId: g.id } : l;
    }),
    changes: (data.changes || []).map((c) => (c.group && byName.has(c.group) && !c.groupId ? { ...c, groupId: byName.get(c.group).id } : c)),
  };
}

/** Completa datos guardados por versiones anteriores con los campos nuevos */
export function migrate(input) {
  const data = migrateGroups(input);
  const counts = {};
  for (const s of data.students || []) counts[s.instrument] = (counts[s.instrument] || 0) + 1;
  const guess = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Violonchelo';
  return {
    ...data,
    // 1.5: niveles editables, localidad y logo de la escuela, y curso ya empezado (para el aviso de inicio de curso)
    settings: { terms: DEFAULT_TERMS, lastBackup: null, subject: guess, levels: DEFAULT_LEVELS, locality: '', schoolLogo: null, courseOpened: courseOf(), showHelp: false, ...data.settings },
    // 1.5: alta (since), baja (leftAt), alumno permanente, corrección del año en la escuela y nivel de cada curso
    students: (data.students || []).map((s) => ({ groupOnly: false, leftAt: null, permanent: false, yearAdjust: 0, ...s, levelHistory: { [courseOf()]: s.level, ...(s.levelHistory || {}) } })),
    changes: data.changes || [],
    groups: data.groups || [],
    lessons: (data.lessons || []).map((l) => ({ attendance: 'Asistió', ...l })),
    grades: data.grades || [],
    notes: data.notes || [],
    materials: data.materials || [],
  };
}

/** Datos guardados (IndexedDB o, en versiones anteriores, localStorage) o, la primera vez, los de ejemplo */
function load(saved) {
  try {
    if (saved && saved.version === 1) return migrate(saved);
  } catch {
    /* datos dañados: se usan los de ejemplo */
  }
  // instalación nueva: las ayudas en bocadillo vienen activadas
  const seed = buildSeed();
  return migrate({ ...seed, settings: { ...seed.settings, showHelp: true } });
}

function reducer(state, action) {
  switch (action.type) {
    case 'upsert': {
      const list = state[action.collection];
      const exists = list.some((x) => x.id === action.item.id);
      return {
        ...state,
        [action.collection]: exists
          ? list.map((x) => (x.id === action.item.id ? { ...x, ...action.item } : x))
          : [action.item, ...list],
      };
    }
    case 'remove':
      return { ...state, [action.collection]: state[action.collection].filter((x) => x.id !== action.id) };
    case 'removeStudent': {
      const keep = (x) => x.studentId !== action.id;
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.id),
        assignments: state.assignments.filter(keep),
        tasks: state.tasks.filter(keep),
        lessons: state.lessons.filter(keep),
        notes: state.notes.filter(keep),
        materials: state.materials.filter(keep),
        grades: state.grades.filter(keep),
        changes: (state.changes || []).map((c) => ({ ...c, studentIds: c.studentIds.filter((x) => x !== action.id) })).filter((c) => c.groupId || c.studentIds.length),
        groups: (state.groups || []).map((g) => ({ ...g, memberIds: g.memberIds.filter((x) => x !== action.id) })),
      };
    }
    case 'removeGroup': {
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.id),
        changes: (state.changes || []).filter((c) => c.groupId !== action.id),
        // las clases ya dadas se conservan en el historial de cada alumno, como clases sueltas
        lessons: state.lessons.map((l) => (l.groupId === action.id ? { ...l, groupId: null, groupName: action.name } : l)),
      };
    }
    case 'removeItem': {
      const keep = (x) => x.itemId !== action.id;
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
        assignments: state.assignments.filter(keep),
        materials: state.materials.filter(keep),
        tasks: state.tasks.map((t) => (t.itemId === action.id ? { ...t, itemId: null } : t)),
      };
    }
    case 'setStudentGroups': {
      const { studentId, groupIds } = action;
      return {
        ...state,
        groups: (state.groups || []).map((g) => {
          const has = g.memberIds.includes(studentId);
          const want = groupIds.includes(g.id);
          if (has === want) return g;
          return { ...g, memberIds: want ? [...g.memberIds, studentId] : g.memberIds.filter((x) => x !== studentId) };
        }),
      };
    }
    case 'replace':
      return action.state;
    default:
      return state;
  }
}

export function StoreProvider({ children, saved = null }) {
  const [state, dispatch] = useReducer(reducer, saved, load);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const stateRef = useRef(state);
  stateRef.current = state;
  // Paso de datos entre dispositivos: último cambio, envío y recepción de ESTE dispositivo
  const [paso, setPaso] = useState(readPaso);
  const silent = useRef(true); // el primer guardado (al abrir) y el de una copia recibida no cuentan como cambio

  const updatePaso = useCallback((patch) => {
    setPaso((p) => {
      const next = { ...p, ...patch };
      writePaso(next);
      return next;
    });
  }, []);

  useEffect(() => {
    saveState(state);
    if (silent.current) silent.current = false;
    else updatePaso({ lastChange: new Date().toISOString() });
  }, [state, updatePaso]);

  // Ayudas en bocadillo (Ajustes › Mostrar ayudas)
  useEffect(() => { instalarAyudas(); }, []);
  useEffect(() => { setAyudas(state.settings.showHelp); }, [state.settings.showHelp]);

  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast({ message, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const actions = useMemo(() => {
    const upsert = (collection, item) => dispatch({ type: 'upsert', collection, item });
    return {
      notify,
      saveStudent(data) {
        const base = data.id ? data : { since: todayISO(), leftAt: null, permanent: false, yearAdjust: 0, ...data, id: uid('st'), createdAt: todayISO() };
        // el nivel de este curso queda apuntado para las estadísticas por curso
        const item = { ...base, levelHistory: { ...(base.levelHistory || {}), [courseOf()]: base.level } };
        upsert('students', item);
        return item;
      },
      /** Cambio puntual de la agenda: anular o mover una clase un día, o añadir una clase suelta */
      saveChange(data) {
        const item = data.id ? data : { ...data, id: uid('ch'), createdAt: todayISO() };
        upsert('changes', item);
        return item;
      },
      /** Grupo: nombre, tipo (estable u ocasional), horario, miembros y observaciones */
      saveGroup(data) {
        const item = data.id ? data : { kind: 'estable', schedule: [], memberIds: [], archived: false, notes: '', ...data, id: uid('gr'), createdAt: todayISO() };
        upsert('groups', item);
        return item;
      },
      deleteGroup(group) {
        dispatch({ type: 'removeGroup', id: group.id, name: group.name });
      },
      /** Cambia los grupos de una persona (desde su ficha) */
      setStudentGroups(studentId, groupIds) {
        dispatch({ type: 'setStudentGroups', studentId, groupIds });
      },
      deleteChange(id) {
        dispatch({ type: 'remove', collection: 'changes', id });
      },
      /**
       * Guarda la lista de niveles. renames: { viejo: nuevo } se aplica a los alumnos (también a su historial).
       */
      saveLevels(levels, renames = {}) {
        const st = stateRef.current;
        const ren = (l) => renames[l] ?? l;
        const students = st.students.map((s) => ({
          ...s,
          level: ren(s.level),
          levelHistory: Object.fromEntries(Object.entries(s.levelHistory || {}).map(([c, l]) => [c, ren(l)])),
        }));
        dispatch({ type: 'replace', state: { ...st, students, settings: { ...st.settings, levels } } });
      },
      /**
       * Empezar el curso: da de baja a los que terminan (leftAt) y sube de nivel a los elegidos.
       * bajas: [ids] · niveles: { id: nivelNuevo } · leftAt: fecha de baja
       */
      startCourse({ course, bajas = [], niveles = {}, leftAt }) {
        const st = stateRef.current;
        const students = st.students.map((s) => {
          let n = s;
          if (bajas.includes(s.id)) n = { ...n, leftAt };
          else if (niveles[s.id]) n = { ...n, level: niveles[s.id] };
          if (!n.leftAt || n.leftAt >= `${course.slice(0, 4)}-09-01`) n = { ...n, levelHistory: { ...(n.levelHistory || {}), [course]: n.level } };
          return n;
        });
        dispatch({ type: 'replace', state: { ...st, students, settings: { ...st.settings, courseOpened: course } } });
      },
      deleteStudent(id) {
        dispatch({ type: 'removeStudent', id });
      },
      saveItem(data) {
        const item = data.id ? data : { ...data, id: uid('it') };
        upsert('items', item);
        return item;
      },
      deleteItem(id) {
        dispatch({ type: 'removeItem', id });
      },
      assignItem(studentId, itemId) {
        const today = todayISO();
        const item = {
          id: uid('a'), studentId, itemId, status: 'Pendiente', progress: 0,
          assignedAt: today, updatedAt: today, log: [{ date: today, progress: 0 }],
        };
        upsert('assignments', item);
        return item;
      },
      updateAssignment(assignment, changes) {
        const today = todayISO();
        let next = { ...assignment, ...changes, updatedAt: today };
        if (changes.status && changes.progress === undefined) {
          next.progress = Math.max(
            changes.status === 'Pendiente' ? 0 : assignment.progress,
            STATUS_DEFAULT_PROGRESS[changes.status]
          );
          if (changes.status === 'Pendiente') next.progress = 0;
        }
        if (changes.progress !== undefined && changes.status === undefined) {
          const p = changes.progress;
          next.status = p >= 100 ? 'Terminada' : p >= 75 ? 'Consolidada' : p >= 35 ? 'En estudio' : p > 0 ? 'Iniciada' : 'Pendiente';
        }
        const log = (assignment.log || []).filter((e) => e.date !== today);
        next.log = [...log, { date: today, progress: next.progress }];
        upsert('assignments', next);
      },
      removeAssignment(id) {
        dispatch({ type: 'remove', collection: 'assignments', id });
      },
      saveTask(data) {
        const item = data.id ? data : { ...data, id: uid('tk'), createdAt: todayISO(), done: false, completedAt: null };
        upsert('tasks', item);
        return item;
      },
      toggleTask(task) {
        upsert('tasks', { ...task, done: !task.done, completedAt: task.done ? null : todayISO() });
      },
      deleteTask(id) {
        dispatch({ type: 'remove', collection: 'tasks', id });
      },
      saveLesson(data) {
        const item = data.id ? data : { ...data, id: uid('l') };
        upsert('lessons', item);
        return item;
      },
      deleteLesson(id) {
        dispatch({ type: 'remove', collection: 'lessons', id });
      },
      saveNote(data) {
        const item = data.id ? data : { ...data, id: uid('n'), date: todayISO() };
        upsert('notes', item);
      },
      deleteNote(id) {
        dispatch({ type: 'remove', collection: 'notes', id });
      },
      saveMaterial(data) {
        const item = data.id ? data : { ...data, id: uid('m'), createdAt: todayISO() };
        upsert('materials', item);
        return item;
      },
      deleteMaterial(material) {
        if (material.source === 'file') deleteFile(material.id);
        dispatch({ type: 'remove', collection: 'materials', id: material.id });
      },
      /** Registra a la vez la clase de todos los alumnos de un grupo */
      saveLessons(list) {
        list.forEach((l) => upsert('lessons', l.id ? l : { ...l, id: uid('l') }));
      },
      saveGrade(studentId, course, changes) {
        const id = `${studentId}_${course}`;
        const current = stateRef.current.grades.find((g) => g.id === id) || { id, studentId, course, t1: null, t2: null, t3: null, final: null, comments: {} };
        upsert('grades', { ...current, ...changes, comments: { ...current.comments, ...(changes.comments || {}) } });
      },
      saveSettings(settings) {
        const st = stateRef.current;
        const old = st.settings.subject;
        let students = st.students;
        // Al cambiar de instrumento, los alumnos que tenían el anterior pasan al nuevo
        if (old && settings.subject !== old && isInstrumentSubject(settings.subject)) {
          students = students.map((s) => (s.instrument === old ? { ...s, instrument: settings.subject } : s));
        }
        dispatch({ type: 'replace', state: { ...st, students, settings: { ...st.settings, ...settings } } });
      },
      /** Se ha enviado (o guardado) una copia desde este dispositivo */
      markSent() {
        updatePaso({ lastSent: new Date().toISOString() });
      },
      resetDemo(subject) {
        const { settings } = stateRef.current;
        dispatch({ type: 'replace', state: migrate(buildSeed({ subject: subject || settings.subject, settings: { teacherName: settings.teacherName, school: settings.school, terms: settings.terms, locality: settings.locality, schoolLogo: settings.schoolLogo, levels: settings.levels } })) });
      },
      /** Empezar de cero: borra alumnos y todo su seguimiento; conserva perfil, asignatura, trimestres y biblioteca */
      clearAll() {
        const st = stateRef.current;
        for (const m of st.materials) if (m.source === 'file') deleteFile(m.id);
        dispatch({
          type: 'replace',
          state: {
            ...st,
            students: [], assignments: [], tasks: [], lessons: [], materials: [], notes: [], grades: [], changes: [], groups: [],
            items: st.items.filter((i) => i.instrument === st.settings.subject),
          },
        });
      },
      getState() {
        return stateRef.current;
      },
      /** Recibir datos: sustituye todo por la copia y apunta de dónde y de cuándo es */
      replaceState(data) {
        if (!data || data.version !== 1 || !Array.isArray(data.students)) throw new Error('El archivo no es una copia de Diapasón');
        const { origen, exportedAt, app, ...clean } = data;
        silent.current = true;
        dispatch({ type: 'replace', state: migrate(clean) });
        updatePaso({ lastReceived: { at: new Date().toISOString(), from: origen?.device || null, createdAt: origen?.createdAt || exportedAt || null } });
      },
    };
  }, [notify, updatePaso]);

  const value = useMemo(() => ({ state, actions, toast, paso }), [state, actions, toast, paso]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider');
  return ctx;
}
