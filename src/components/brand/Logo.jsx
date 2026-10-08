import { FORK_PATHS, LOCKUP_VIEWBOX, LOGO_VIEWBOX, MARK_VIEWBOX, SLOGAN, SLOGAN_PATH, WORD_PATH } from './logoData.js';

const TONES = {
  color: { word: '#141A2C', fork: '#B07F30', slogan: '#4D5D84' },
  negativo: { word: '#FFFFFF', fork: '#DBB66A', slogan: '#C6CEDF' },
  mono: { word: 'currentColor', fork: 'currentColor', slogan: 'currentColor' },
};

/**
 * Logotipo de Diapasón: la «i» es un diapasón A440 a escala real.
 * variant: 'logo' (palabra) · 'lockup' (palabra + eslogan) · 'mark' (solo el diapasón)
 * tone: 'color' · 'negativo' (sobre fondo oscuro) · 'mono' (hereda el color del texto)
 * vibrate: anima las púas como si el diapasón sonara
 */
export default function Logo({ variant = 'logo', tone = 'color', className = '', style, vibrate = false, title = 'Diapasón' }) {
  const c = TONES[tone] || TONES.color;
  const vb = variant === 'lockup' ? LOCKUP_VIEWBOX : variant === 'mark' ? MARK_VIEWBOX : LOGO_VIEWBOX;
  const fullTitle = variant === 'lockup' ? `${title} — ${SLOGAN}` : title;
  return (
    <svg viewBox={vb.join(' ')} className={className} style={style} role="img" aria-label={fullTitle}>
      <title>{fullTitle}</title>
      {variant !== 'mark' && <path d={WORD_PATH} fill={c.word} />}
      <g fill={c.fork} className={vibrate ? 'fork-vibrate' : undefined}>
        {FORK_PATHS.map((d) => <path key={d.slice(0, 24)} d={d} />)}
      </g>
      {variant === 'lockup' && <path d={SLOGAN_PATH} fill={c.slogan} />}
    </svg>
  );
}

export { SLOGAN };
