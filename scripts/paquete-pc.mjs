// Crea release/Diapason-PC.zip: la app compilada + «Abrir en el PC.bat», lista para el profesor.
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import JSZip from 'jszip';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const zip = new JSZip();
const base = 'Diapason';
const add = (src, dest) => zip.file(`${base}/${dest}`, readFileSync(join(root, src)));
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

for (const f of walk(join(root, 'dist'))) zip.file(`${base}/app/${relative(join(root, 'dist'), f).replace(/\\/g, '/')}`, readFileSync(f));
add('Abrir en el PC.bat', 'Abrir en el PC.bat');
add('pc/servidor-diapason.ps1', 'servidor-diapason.ps1');
add('pc/LEEME.txt', 'LEEME.txt');

mkdirSync(join(root, 'release'), { recursive: true });
const out = join(root, 'release', 'Diapason-PC.zip');
writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`Creado ${out}`);
