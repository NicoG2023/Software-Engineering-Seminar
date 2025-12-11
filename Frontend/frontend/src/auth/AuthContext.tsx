// src/auth/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { authHttp } from '../api/http';
import type { AuthResponse, UserResponse } from '../types/auth';

type Session = {
  ready: boolean;
  authenticated: boolean;
  token: string | null;
  username: string | null;
  roles: string[];
  user: UserResponse | null;
  hasRole: (role: string) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

type DecodedToken = {
  sub?: string;
  preferred_username?: string;
  groups?: string[];
  exp?: number;
};

const AuthContext = createContext<Session | null>(null);
const STORAGE_KEY = 'authToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [user, setUser] = useState<UserResponse | null>(null);

  const booted = useRef(false);

  const resetState = () => {
    setToken(null);
    setAuthenticated(false);
    setUsername(null);
    setRoles([]);
    setUser(null);
  };

  const applyToken = (newToken: string | null) => {
    if (!newToken) {
      localStorage.removeItem(STORAGE_KEY);
      resetState();
      return;
    }

    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);

    try {
      const decoded = jwtDecode<DecodedToken>(newToken);
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < nowSeconds) {
        // token expired
        localStorage.removeItem(STORAGE_KEY);
        resetState();
        return;
      }

      const uname = decoded.preferred_username ?? decoded.sub ?? null;
      const groups = decoded.groups ?? [];

      setAuthenticated(true);
      setUsername(uname);
      setRoles(groups);
    } catch (e) {
      console.error('Failed to decode JWT', e);
      localStorage.removeItem(STORAGE_KEY);
      resetState();
    }
  };

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (storedToken) {
      applyToken(storedToken);
      // opcional: también podrías hacer un GET /auth/me para refrescar user
    }
    setReady(true);
  }, []);

  const login = async (uname: string, password: string) => {
    const res = await authHttp.post<AuthResponse>('/auth/login', {
      username: uname,
      password,
    });
    const accessToken = res.data.accessToken;
    applyToken(accessToken);
    setUser(res.data.user ?? null);
  };

  const logout = () => {
    applyToken(null);
  };

  const hasRole = (role: string): boolean => {
    if (!role) return false;
    const want = role.toUpperCase();
    return roles.some(r => r.toUpperCase() === want);
  };

  const value = useMemo<Session>(
    () => ({
      ready,
      authenticated,
      token,
      username,
      roles,
      user,
      hasRole,
      login,
      logout,
    }),
    [ready, authenticated, token, username, roles, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {ready ? children : <div style={{ padding: 16 }}>Loading…</div>}
    </AuthContext.Provider>
  );
}

export function useAuthStrict(): Session {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not mounted');
  return ctx;
}
