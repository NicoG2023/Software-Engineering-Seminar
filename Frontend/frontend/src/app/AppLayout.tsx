import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900">
      <NavBar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
