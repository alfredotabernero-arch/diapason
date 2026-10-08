// Crea release/Diapason-PC.zip para el profesor: Diapason.html + «Abrir en el PC.bat» + LEEME.txt
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const zip = new JSZip();
const add = (src, dest) => zip.file(`Diapason/${dest}`, readFileSync(join(root, src)));
add('Diapason.html', 'Diapason.html');
add('Abrir en el PC.bat', 'Abrir en el PC.bat');
add('pc/LEEME.txt', 'LEEME.txt');
mkdirSync(join(root, 'release'), { recursive: true });
const out = join(root, 'release', 'Diapason-PC.zip');
writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`Creado ${out}`);
