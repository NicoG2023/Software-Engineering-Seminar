// src/app/AppLayout.tsx
import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <NavBar />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
