// Convierte build-pc/ en un único «Diapason.html» autosuficiente (JS, CSS, tipografías e icono dentro).
// Se abre con doble clic desde el PC, sin servidor ni Internet, como Atril y Maestro.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dir = join(root, 'build-pc');
let html = readFileSync(join(dir, 'index.html'), 'utf8');

const assets = readdirSync(join(dir, 'assets'));
const js = assets.find((f) => f.endsWith('.js'));
const css = assets.find((f) => f.endsWith('.css'));
const jsCode = readFileSync(join(dir, 'assets', js), 'utf8').replace(/<\/script/gi, '<\\/script');
const cssCode = css ? readFileSync(join(dir, 'assets', css), 'utf8').replace(/<\/style/gi, '<\\/style') : '';
const favicon = `data:image/svg+xml;base64,${readFileSync(join(dir, 'favicon.svg')).toString('base64')}`;

html = html
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="${favicon}" />`)
  .replace(/\s*<link rel="stylesheet"[^>]*>/, '')
  .replace(/\s*<script type="module" crossorigin src="[^"]*"><\/script>/, '')
  .replace('</head>', () => `  <style>${cssCode}</style>\n  </head>`)
  .replace('</body>', () => `  <script type="module">${jsCode}</script>\n  </body>`);

const out = join(root, 'Diapason.html');
writeFileSync(out, html);
console.log(`Creado ${out} (${(html.length / 1024 / 1024).toFixed(1)} MB)`);
