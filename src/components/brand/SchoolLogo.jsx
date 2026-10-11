import { CLAVE_FA, CLAVE_SOL, SELLO } from './clefs.js';

/** SVG del logo genérico de la escuela (clave de sol y de fa en un sello circular) */
export function selloSVG() {
  const S = SELLO;
  const col = (c) => (c === 'oro' ? S.oro : S.tinta);
  const lineas = S.pentagramas.flat().map((y) => `<line x1="${S.x1}" x2="${S.x2}" y1="${y}" y2="${y}" stroke="${S.tinta}" stroke-width="${S.lineaW}"/>`).join('');
  const [p1, p2] = [S.pentagramas[0][0], S.pentagramas[1][4]];
  const barras = `<line x1="${S.x1}" x2="${S.x1}" y1="${p1}" y2="${p2}" stroke="${S.tinta}" stroke-width="${S.barraW}"/><line x1="${S.x2}" x2="${S.x2}" y1="${p1}" y2="${p2}" stroke="${S.tinta}" stroke-width="${S.barraW}"/>`;
  const anillos = S.anillos.map((a) => `<circle cx="100" cy="100" r="${a.r}" fill="none" stroke="${col(a.color)}" stroke-width="${a.w}"/>`).join('');
  const claves = S.claves.map((c) => `<g transform="translate(${c.x},${c.y}) scale(${S.escala})" fill="${S.tinta}"><path d="${c.path === 'sol' ? CLAVE_SOL : CLAVE_FA}"/></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${anillos}${lineas}${barras}${claves}</svg>`;
}

/** El logo de la escuela: el que haya subido el profesor o, si no, el genérico */
export default function SchoolLogo({ src, className = '', alt = 'Logo de la escuela' }) {
  if (src) return <img src={src} alt={alt} className={`object-contain ${className}`} />;
  return <span role="img" aria-label={alt} className={`inline-block [&>svg]:h-full [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: selloSVG() }} />;
}
