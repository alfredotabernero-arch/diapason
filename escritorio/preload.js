// Puente mínimo entre la app y Windows: abrir adjuntos con su programa, preparar adjuntos de correo y cerrar la ventana
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('diapasonPC', {
  escritorio: true,
  abrirArchivo: (nombre, datos) => ipcRenderer.invoke('abrir-archivo', nombre, datos),
  // Correo: deja los adjuntos en una carpeta y la abre, para arrastrarlos al mensaje
  prepararAdjuntos: (archivos) => ipcRenderer.invoke('preparar-adjuntos', archivos),
  salir: () => ipcRenderer.send('salir'),
});
