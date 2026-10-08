import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import Sidebar from './Sidebar.jsx';
import Toast from '../ui/Toast.jsx';
import Splash from '../brand/Splash.jsx';

export default function AppLayout() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar />
      <main key={location.pathname} className="mx-auto max-w-2xl px-4 pb-28 md:max-w-5xl md:px-8 md:pb-12 xl:max-w-6xl animate-fade-up">
        <Outlet />
      </main>
      <BottomNav />
      <Toast />
      <Splash />
    </div>
  );
}
