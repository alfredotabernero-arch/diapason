// Periodos del curso (1.7): tres trimestres por defecto, o dos periodos (cuatrimestres, semestres
// o con el nombre que quiera la escuela: «Invierno», «Primavera»…), y cómo se propone la nota final.
// La configuración vive en Ajustes (settings.periods); aquí se guarda la activa para que todas las
// pantallas la usen sin tener que pasarla de mano en mano. TERMS es la lista de periodos activos.

export const PERIOD_KINDS = [
  { value: 'trimestre', label: 'Trimestres' },
  { value: 'cuatrimestre', label: 'Cuatrimestres' },
  { value: 'semestre', label: 'Semestres' },
  { value: 'personalizado', label: 'Otro nombre' },
];

export const DEFAULT_PERIODS = { count: 3, kind: 'trimestre', names: ['', '', ''], finalMode: 'media' };

const ALL_KEYS = ['t1', 't2', 't3'];
const ORD = ['Primer', 'Segundo', 'Tercer'];
const ORD_CORTO = ['1.er', '2.º', '3.er'];
const LETRA = { trimestre: 'T', cuatrimestre: 'C', semestre: 'S' };

let config = { ...DEFAULT_PERIODS };
/** Periodos activos: [{ key, label, short, ordinal }] (se actualiza en el sitio) */
export const TERMS = [];

/** Nombre corto de un periodo con nombre propio: «Invierno» → «Inv» */
const corto = (nombre, i) => {
  const n = (nombre || '').trim();
  if (!n) return `P${i + 1}`;
  return n.length <= 4 ? n : n.slice(0, 3);
};

function construir(cfg) {
  const out = [];
  for (let i = 0; i < cfg.count; i++) {
    const key = ALL_KEYS[i];
    if (cfg.kind === 'personalizado') {
      const nombre = (cfg.names?.[i] || '').trim() || `Periodo ${i + 1}`;
      out.push({ key, label: nombre, short: corto(cfg.names?.[i], i), ordinal: nombre });
    } else {
      out.push({ key, label: `${ORD_CORTO[i]} ${cfg.kind}`, short: `${i + 1}${LETRA[cfg.kind]}`, ordinal: `${ORD[i]} ${cfg.kind}` });
    }
  }
  return out;
}

/** Normaliza lo guardado en Ajustes (datos de versiones anteriores: tres trimestres y media) */
export function normalizarPeriodos(p) {
  const c = { ...DEFAULT_PERIODS, ...(p || {}) };
  c.count = c.count === 2 ? 2 : 3;
  if (!PERIOD_KINDS.some((k) => k.value === c.kind)) c.kind = 'trimestre';
  c.names = [0, 1, 2].map((i) => (c.names && c.names[i]) || '');
  c.finalMode = c.finalMode === 'ultimo' ? 'ultimo' : 'media';
  return c;
}

/** Aplica la configuración de Ajustes a toda la aplicación */
export function configurarPeriodos(p) {
  config = normalizarPeriodos(p);
  TERMS.splice(0, TERMS.length, ...construir(config));
  return config;
}
configurarPeriodos(DEFAULT_PERIODS);

export const periodos = () => config;
export const termKeys = () => TERMS.map((t) => t.key);
export const lastTermKey = () => TERMS[TERMS.length - 1].key;
/** Vista previa de los periodos de una configuración sin aplicarla (para Ajustes) */
export const vistaPeriodos = (p) => construir(normalizarPeriodos(p));

/** «trimestres», «cuatrimestres», «semestres» o «periodos» */
export function nombrePlural(cfg = config) {
  return cfg.kind === 'personalizado' ? 'periodos' : `${cfg.kind}s`;
}
/** «trimestre», «cuatrimestre», «semestre» o «periodo» */
export function nombreSingular(cfg = config) {
  return cfg.kind === 'personalizado' ? 'periodo' : cfg.kind;
}

const NUM = { 2: 'dos', 3: 'tres' };
/** «del 2.º trimestre» o «de «Primavera»» */
export function delPeriodo(key, cfg = config) {
  const t = construir(cfg).find((x) => x.key === key) || TERMS[TERMS.length - 1];
  return cfg.kind === 'personalizado' ? `de «${t.label}»` : `del ${t.label}`;
}
/** Cómo se propone la final, en palabras: «media de los tres trimestres» / «la del 2.º cuatrimestre» */
export function textoFinal(cfg = config) {
  const t = construir(cfg);
  return cfg.finalMode === 'ultimo' ? (cfg.kind === 'personalizado' ? `la de «${t[t.length - 1].label}»` : `la del ${t[t.length - 1].label}`) : `media de los ${NUM[cfg.count]} ${nombrePlural(cfg)}`;
}
/** Qué falta para proponer la final */
export function textoFinalPendiente(cfg = config) {
  const t = construir(cfg);
  return cfg.finalMode === 'ultimo'
    ? `Se propondrá ${cfg.kind === 'personalizado' ? `la de «${t[t.length - 1].label}»` : `la del ${t[t.length - 1].label}`} cuando tenga nota`
    : `Se propondrá la media cuando estén los ${NUM[cfg.count]} ${nombrePlural(cfg)}`;
}
