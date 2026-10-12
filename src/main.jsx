import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
// Tipografías incluidas en la app: no se descarga nada de Internet
import '@fontsource/instrument-sans/latin-400.css';
import '@fontsource/instrument-sans/latin-500.css';
import '@fontsource/instrument-sans/latin-600.css';
import '@fontsource/instrument-sans/latin-700.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import App from './App.jsx';
import { StoreProvider } from './store/StoreContext.jsx';
import { isLocalFile, isNative } from './utils/platform.js';
import { loadSaved, persistStorage } from './utils/storage.js';
import './index.css';

// Los datos se leen de IndexedDB antes de pintar la app (en las versiones anteriores, de localStorage)
loadSaved().then((saved) => ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider saved={saved}>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>
));
// Que el sistema no borre nunca los datos aunque falte espacio (sobre todo en el iPad)
persistStorage();

// Web instalada (iPhone, iPad, navegador): guarda la app en el dispositivo para usarla sin conexión.
// No se usa en la app Android ni al abrir Diapason.html desde el PC, que ya son locales.
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isNative() && !isLocalFile() && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
