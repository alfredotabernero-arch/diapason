// Puente mínimo entre la app y Windows: abrir adjuntos con su programa y cerrar la ventana
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('diapasonPC', {
  escritorio: true,
  abrirArchivo: (nombre, datos) => ipcRenderer.invoke('abrir-archivo', nombre, datos),
  salir: () => ipcRenderer.send('salir'),
});
