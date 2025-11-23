import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStrict } from '../auth/AuthContext';

export default function NavBar({ title = 'Cinema Management' }: { title?: string }) {
  const { username, authenticated, login, logout, hasRealmRole } = useAuthStrict();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isAdmin = useMemo(
    () => authenticated && hasRealmRole('admin'),
    [authenticated, hasRealmRole]
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

  // detectar rutas activas
  const isMoviesRoute = location.pathname.startsWith('/movies');
  const isRoomsRoute = location.pathname.startsWith('/rooms');
  const isScreeningsRoute = location.pathname.startsWith('/screenings');

  return (
    <header className="w-full bg-[#1E1E1E]">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <nav
          aria-label="Top Navigation"
          className="flex items-center justify-between rounded-2xl bg-[#D90429] px-5 py-3"
        >
          <Link to="/" className="text-xl font-bold tracking-wide text-white">
            {title}
          </Link>

          <div className="flex items-center gap-4">
            {/* 🎞 Movies */}
            {isAdmin && (
              <Link
                to="/movies"
                className={`hidden sm:inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold transition
                  ${
                    isMoviesRoute
                      ? 'bg-[#FFDA63] text-[#1E1E1E] shadow-md'
                      : 'text-white/90 hover:bg-[#BF0320] hover:text-white'
                  }
                `}
              >
                🎞 Movies
              </Link>
            )}

            {/* 🎭 Rooms */}
            {isAdmin && (
              <Link
                to="/rooms"
                className={`hidden sm:inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold transition
                  ${
                    isRoomsRoute
                      ? 'bg-[#FFDA63] text-[#1E1E1E] shadow-md'
                      : 'text-white/90 hover:bg-[#BF0320] hover:text-white'
                  }
                `}
              >
                🎭 Rooms
              </Link>
            )}

            {/* 🎟 Screenings */}
            {isAdmin && (
              <Link
                to="/screenings"
                className={`hidden sm:inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold transition
                  ${
                    isScreeningsRoute
                      ? 'bg-[#FFDA63] text-[#1E1E1E] shadow-md'
                      : 'text-white/90 hover:bg-[#BF0320] hover:text-white'
                  }
                `}
              >
                🎟 Screenings
              </Link>
            )}

            {/* Login / user menu */}
            {!authenticated ? (
              <button
                onClick={login}
                className="rounded-xl bg-[#FFDA63] px-4 py-2 text-sm font-semibold text-[#333333] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FFDA63]/60"
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-full bg-[#333333] pl-2 pr-3 py-1 text-white"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFDA63] text-[#333333] text-sm font-bold">
                    {initial}
                  </span>
                  <span className="text-sm font-medium">{username}</span>
                  <svg
                    className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
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
                    className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#333333] bg-[#1E1E1E] shadow-lg"
                  >
                    {isAdmin && (
                      <>
                        <button
                          onClick={goManageUsers}
                          className="block w-full px-4 py-3 text-left text-sm text-white hover:bg-[#333333]"
                        >
                          Manage Users
                        </button>
                        <div className="h-px bg-[#333333]" />
                      </>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full px-4 py-3 text-left text-sm text-white hover:bg-[#333333]"
                    >
                      logout
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
