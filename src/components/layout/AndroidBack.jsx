import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { LogOut } from 'lucide-react';
import Sheet from '../ui/Sheet.jsx';
import { isNative } from '../../utils/platform.js';
import { closeTopSheet } from '../../utils/backStack.js';
import { useStore } from '../../store/StoreContext.jsx';
import { deviceName, toDevice, hasPending, otherKind } from '../../utils/paso.js';

/** Ruta «madre» a la que volver si no hay historial (p. ej. tras restaurar o abrir directamente) */
function parentOf(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  if (parts[0] === 'clases') return '/clases';
  if (parts[0] === 'alumnos' && parts[2] === 'editar') return `/alumnos/${parts[1]}`;
  return `/${parts[0]}`;
}

/**
 * Botón y gesto «atrás» de Android: cierra la ventana abierta, vuelve a la
 * pantalla anterior y, en Inicio, pregunta si se quiere salir de Diapasón.
 */
export default function AndroidBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const [askExit, setAskExit] = useState(false);
  const { paso } = useStore();
  const unsent = !!paso.lastReceived && hasPending(paso);

  useEffect(() => {
    const open = () => setAskExit(true);
    window.addEventListener('diapason:salir', open);
    return () => window.removeEventListener('diapason:salir', open);
  }, []);

  useEffect(() => {
    if (!isNative()) return;
    const sub = CapApp.addListener('backButton', () => {
      if (closeTopSheet()) return;
      const path = pathRef.current;
      if (path === '/' || path === '') {
        setAskExit(true);
      } else if ((window.history.state?.idx ?? 0) > 0) {
        navigate(-1);
      } else {
        navigate(parentOf(path), { replace: true });
      }
    });
    return () => {
      sub.then((h) => h.remove());
    };
  }, [navigate]);

  return (
    <Sheet
      open={askExit}
      onClose={() => setAskExit(false)}
      title="¿Salir de Diapasón?"
      footer={
        <>
          <button className="btn-secondary" onClick={() => setAskExit(false)}>Cancelar</button>
          <button className="btn-primary" onClick={() => CapApp.exitApp()}>
            <LogOut size={18} /> Salir
          </button>
        </>
      }
    >
      <p className="text-ink-600">Tus datos ya están guardados en este dispositivo. La próxima vez que abras Diapasón seguirás donde lo dejaste.</p>
      {unsent && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tienes cambios sin enviar {toDevice(otherKind(paso))}. Si vas a seguir trabajando allí, envíalos antes desde Ajustes › Enviar datos.
        </p>
      )}
    </Sheet>
  );
}
