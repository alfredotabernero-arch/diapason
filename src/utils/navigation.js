import { useNavigate } from 'react-router-dom';

/** Vuelve a la pantalla anterior o, si se entró directamente por URL, a una ruta de respaldo */
export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  return () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}
