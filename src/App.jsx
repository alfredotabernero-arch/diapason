import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Agenda from './pages/Agenda.jsx';
import Students from './pages/Students.jsx';
import StudentForm from './pages/StudentForm.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import LessonHistory from './pages/LessonHistory.jsx';
import LessonForm from './pages/LessonForm.jsx';
import Repertoire from './pages/Repertoire.jsx';
import RepertoireDetail from './pages/RepertoireDetail.jsx';
import Tasks from './pages/Tasks.jsx';
import Statistics from './pages/Statistics.jsx';
import Settings from './pages/Settings.jsx';
import Listados from './pages/Listados.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="alumnos" element={<Students />} />
        <Route path="alumnos/nuevo" element={<StudentForm />} />
        <Route path="alumnos/:id" element={<StudentDetail />} />
        <Route path="alumnos/:id/editar" element={<StudentForm />} />
        <Route path="clases" element={<LessonHistory />} />
        <Route path="clases/nueva" element={<LessonForm />} />
        <Route path="clases/:id" element={<LessonForm />} />
        <Route path="repertorio" element={<Repertoire />} />
        <Route path="repertorio/:id" element={<RepertoireDetail />} />
        <Route path="tareas" element={<Tasks />} />
        <Route path="listados" element={<Listados />} />
        <Route path="estadisticas" element={<Statistics />} />
        <Route path="ajustes" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
