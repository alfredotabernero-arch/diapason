import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { buildSeed } from '../data/seed.js';
import { todayISO } from '../utils/dates.js';
import { uid, STATUS_DEFAULT_PROGRESS, isInstrumentSubject } from '../utils/constants.js';
import { DEFAULT_TERMS } from '../utils/courses.js';
import { deleteFile } from '../utils/files.js';

const STORAGE_KEY = 'diapason:v1';
const LEGACY_KEY = 'music-teacher-studio:v1'; // nombre anterior de la app
const StoreContext = createContext(null);

/** Completa datos guardados por versiones anteriores con los campos nuevos */
export function migrate(data) {
  const counts = {};
  for (const s of data.students || []) counts[s.instrument] = (counts[s.instrument] || 0) + 1;
  const guess = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Violonchelo';
  return {
    ...data,
    settings: { terms: DEFAULT_TERMS, lastBackup: null, subject: guess, ...data.settings },
    students: (data.students || []).map((s) => ({ group: '', ...s })),
    lessons: (data.lessons || []).map((l) => ({ attendance: 'Asistió', ...l })),
    grades: data.grades || [],
    notes: data.notes || [],
    materials: data.materials || [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.version === 1) return migrate(data);
    }
  } catch {
    /* almacenamiento no disponible: se usan los datos de ejemplo */
  }
  return buildSeed();
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
    case 'replace':
      return action.state;
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* cuota superada o modo privado: la sesión sigue funcionando en memoria */
    }
  }, [state]);

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
        const item = data.id ? data : { ...data, id: uid('st'), since: todayISO(), createdAt: todayISO() };
        upsert('students', item);
        return item;
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
      markBackup() {
        const st = stateRef.current;
        dispatch({ type: 'replace', state: { ...st, settings: { ...st.settings, lastBackup: new Date().toISOString() } } });
      },
      resetDemo(subject) {
        const { settings } = stateRef.current;
        dispatch({ type: 'replace', state: buildSeed({ subject: subject || settings.subject, settings: { teacherName: settings.teacherName, school: settings.school, terms: settings.terms } }) });
      },
      getState() {
        return stateRef.current;
      },
      replaceState(data) {
        if (!data || data.version !== 1 || !Array.isArray(data.students)) throw new Error('El archivo no es una copia de Diapasón');
        dispatch({ type: 'replace', state: migrate(data) });
      },
    };
  }, [notify]);

  const value = useMemo(() => ({ state, actions, toast }), [state, actions, toast]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider');
  return ctx;
}
