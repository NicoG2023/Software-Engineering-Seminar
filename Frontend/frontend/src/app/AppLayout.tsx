// app/AppLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import { useAuthStrict } from '../auth/AuthContext';

export default function AppLayout() {
  const { username, logout, hasClientRole, authenticated, login } = useAuthStrict();
  return (
    <div className="container">
      <nav style={{ display:'flex', gap:16, alignItems:'center', padding:'8px 0' }}>
        <Link to="/">Cinema</Link>
        {authenticated && hasClientRole('admin') && <Link to="/admin">Admin</Link>}
        <div style={{ marginLeft:'auto' }}>
          {authenticated ? (
            <>
              <span>{username}</span>
              <button onClick={logout} style={{ marginLeft:12 }}>Logout</button>
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
