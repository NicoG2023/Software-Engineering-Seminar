import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStrict } from '../auth/AuthContext';

export default function NavBar() {
  const { username, authenticated, hasRole, logout } = useAuthStrict();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isAdmin = useMemo(
    () => authenticated && hasRole('ADMIN'),
    [authenticated, hasRole],
  );

  const initial = useMemo(() => {
    if (!username) return '?';
    const base = username.split('@')[0]?.trim() || username.trim();
    return base.charAt(0).toUpperCase();
  }, [username]);

  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        buttonRef.current &&
        !buttonRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const goManageUsers = () => navigate('/users-management');
  const goLogin = () => navigate('/login');

  // detectar rutas activas
  const isMoviesRoute = location.pathname.startsWith('/movies');
  const isRoomsRoute = location.pathname.startsWith('/rooms');
  const isScreeningsRoute = location.pathname.startsWith('/screenings');

  return (
    <header className="w-full bg-[#6366F1] shadow-md">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav
          aria-label="Top Navigation"
          className="flex items-center justify-between"
        >
          {/* Brand */}
          <Link to="/catalog" className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FFDA63] text-[#1E1E1E] text-lg font-extrabold shadow">
              C
            </span>
            <span className="text-xl font-semibold tracking-wide text-white">
              Cinema Management
            </span>
          </Link>

          {/* LINKS + USER */}
          <div className="flex items-center gap-5">

            {/* Admin Links */}
            {isAdmin && (
              <>
                <Link
                  to="/movies"
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    isMoviesRoute
                      ? "bg-white/20 text-white shadow"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  🎞 Movies
                </Link>

                <Link
                  to="/rooms"
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    isRoomsRoute
                      ? "bg-white/20 text-white shadow"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  🎭 Rooms
                </Link>

                <Link
                  to="/screenings"
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    isScreeningsRoute
                      ? "bg-white/20 text-white shadow"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  🎟 Screenings
                </Link>
              </>
            )}

            {/* LOGIN / USER MENU */}
            {!authenticated ? (
              <button
                onClick={goLogin}
                className="rounded-xl bg-[#FFDA63] px-4 py-2 text-sm font-semibold text-[#1E1E1E] shadow-md hover:bg-[#F5C94E] transition"
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setOpen(v => !v)}
                  className="flex items-center gap-3 rounded-full bg-white/20 pl-2 pr-3 py-1 text-white shadow hover:bg-white/30 transition"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFDA63] text-[#1E1E1E] text-sm font-bold">
                    {initial}
                  </span>
                  <span className="text-sm font-medium max-w-[140px] truncate text-white">
                    {username}
                  </span>
                  <svg
                    className={`h-4 w-4 text-white transition-transform ${open ? "rotate-180" : ""}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {open && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 z-20 mt-2 w-56 rounded-xl overflow-hidden bg-white shadow-xl"
                  >
                    {isAdmin && (
                      <>
                        <button
                          onClick={goManageUsers}
                          className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Manage Users
                        </button>
                        <div className="h-px bg-slate-200" />
                      </>
                    )}

                    <button
                      onClick={logout}
                      className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
