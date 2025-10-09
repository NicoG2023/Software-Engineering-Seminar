import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStrict } from '../AuthContext';

export default function RequireRole({ role, children }:{ role:string; children:React.ReactNode }) {
  const { ready, authenticated, hasClientRole } = useAuthStrict();
  const loc = useLocation();
  if (!ready) return null;
  if (!authenticated) return <Navigate to="/" state={{ from: loc }} replace />;
  if (!hasClientRole(role)) return <Navigate to="/404" state={{ from: loc }} replace />;
  return <>{children}</>;
}
