/*
 * Diapasón para Windows: la misma app (carpeta dist) dentro de una ventana de Electron, como Atril y Maestro.
 * Los datos se guardan en el PC (%APPDATA%\Diapasón), sin Internet y sin navegador.
 */
const { app, BrowserWindow, protocol, session, shell, Menu, nativeImage, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Origen propio y estable (app://diapason) para que los datos no dependan de la carpeta de instalación
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

const WWW = app.isPackaged ? path.join(process.resourcesPath, 'www') : path.join(__dirname, '..', 'dist');
const ICONO = path.join(__dirname, 'icono.png');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

// El nombre «Diapasón» lleva tilde y el agente de usuario solo admite ASCII: sin esto no carga nada
app.userAgentFallback = app.userAgentFallback.normalize('NFD').replace(/[^\x20-\x7E]/g, '');

if (!app.requestSingleInstanceLock()) app.quit();
let ventana = null;
app.on('second-instance', () => {
  if (ventana) { if (ventana.isMinimized()) ventana.restore(); ventana.focus(); }
});

// Abrir un adjunto (PDF, audio, vídeo) con el programa que tenga Windows para ese tipo de archivo
ipcMain.handle('abrir-archivo', async (_e, nombre, datos) => {
  const carpeta = path.join(os.tmpdir(), 'Diapason-adjuntos');
  fs.mkdirSync(carpeta, { recursive: true });
  const seguro = String(nombre || 'archivo').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120);
  const ruta = path.join(carpeta, seguro);
  fs.writeFileSync(ruta, Buffer.from(datos));
  const error = await shell.openPath(ruta);
  if (error) throw new Error(error);
});
ipcMain.on('salir', () => app.quit());

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    let ruta = decodeURIComponent(new URL(req.url).pathname);
    if (!ruta || ruta === '/') ruta = '/index.html';
    const fichero = path.normalize(path.join(WWW, ruta));
    if (!fichero.startsWith(WWW)) return new Response('No permitido', { status: 403 });
    try {
      const tipo = TIPOS[path.extname(fichero).toLowerCase()] || 'application/octet-stream';
      return new Response(fs.readFileSync(fichero), { headers: { 'content-type': tipo, 'access-control-allow-origin': '*' } });
    } catch {
      return new Response('No encontrado', { status: 404 });
    }
  });

  const PERMITIDOS = ['fullscreen', 'clipboard-sanitized-write'];
  session.defaultSession.setPermissionRequestHandler((wc, permiso, cb) => cb(PERMITIDOS.includes(permiso)));
  session.defaultSession.setPermissionCheckHandler((wc, permiso) => PERMITIDOS.includes(permiso));

  Menu.setApplicationMenu(null);
  ventana = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 560,
    title: 'Diapasón', icon: nativeImage.createFromPath(ICONO), backgroundColor: '#F7F4EE', show: false,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false, preload: path.join(__dirname, 'preload.js') }
  });
  ventana.once('ready-to-show', () => { ventana.maximize(); ventana.show(); });
  ventana.loadURL('app://diapason/index.html');

  // Enlaces externos (YouTube, IMSLP, Drive…), en el navegador del PC
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto|tel):/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  ventana.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) { e.preventDefault(); if (/^(https?|mailto|tel):/i.test(url)) shell.openExternal(url); }
  });

  // F11 pantalla completa · Ctrl+R recargar · Ctrl+más/menos/0 zoom · Ctrl+P imprimir
  ventana.webContents.on('before-input-event', (e, k) => {
    if (k.type !== 'keyDown') return;
    const wc = ventana.webContents;
    if (k.key === 'F11') { ventana.setFullScreen(!ventana.isFullScreen()); e.preventDefault(); }
    else if (k.control && (k.key === 'r' || k.key === 'R')) { wc.reload(); e.preventDefault(); }
    else if (k.control && (k.key === '+' || k.key === '=')) { wc.setZoomLevel(wc.getZoomLevel() + 0.5); e.preventDefault(); }
    else if (k.control && k.key === '-') { wc.setZoomLevel(wc.getZoomLevel() - 0.5); e.preventDefault(); }
    else if (k.control && k.key === '0') { wc.setZoomLevel(0); e.preventDefault(); }
    else if (k.control && k.shift && (k.key === 'I' || k.key === 'i')) { wc.toggleDevTools(); e.preventDefault(); }
  });
});

app.on('window-all-closed', () => app.quit());
