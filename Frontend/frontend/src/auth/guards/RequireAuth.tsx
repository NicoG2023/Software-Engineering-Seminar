import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStrict } from '../AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = useAuthStrict();
  const loc = useLocation();

  if (!ready) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  return <>{children}</>;
}
