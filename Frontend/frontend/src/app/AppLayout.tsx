// app/AppLayout.tsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useAuthStrict } from '../auth/AuthContext';

export default function AppLayout() {
  const {
    username,
    authenticated,
    login,
    logout,
    hasRealmRole,
  } = useAuthStrict();

  const nav = useNavigate();
  const loc = useLocation();

  // Chequeo de admin basado en realm role (opción B)
  const isAdmin = useMemo(() => {
    return authenticated && hasRealmRole('admin');
  }, [authenticated, hasRealmRole]);

  // BONUS: si inicia sesión y es admin, envía a /admin (salvo que venga de "from")
  useEffect(() => {
    if (!authenticated) return;

    const from = (loc.state as any)?.from?.pathname;
    if (from) return; // respeta la navegación original

    if (isAdmin && loc.pathname !== '/admin') {
      nav('/admin', { replace: true });
    }
  }, [authenticated, isAdmin, loc.pathname, loc.state, nav]);

  return (
    <div className="container">
      <nav style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 0' }}>
        <Link to="/">Cinema</Link>

        {/* Link a Admin solo si es admin por realm role */}
        {authenticated && isAdmin && <Link to="/admin">Admin</Link>}

        <div style={{ marginLeft: 'auto' }}>
          {authenticated ? (
            <>
              <span>{username}</span>
              <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
            </>
          ) : (
            <button onClick={login}>Login</button>
          )}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
