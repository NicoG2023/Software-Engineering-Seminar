/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { keycloak, initKeycloak } from './keycloak';

interface KeycloakTokenParsed {
  preferred_username?: string;
  resource_access?: Record<string, { roles: string[] }>;
  realm_access?: { roles: string[] }
}

type Session = {
  ready: boolean;
  authenticated: boolean;
  token?: string | null;
  username?: string | null;
  hasClientRole: (role: string, clientId?: string) => boolean;
  hasRealmRole: (role: string) => boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<Session | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const booted = useRef(false);
  const intervalId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    let cancelled = false;

    (async () => {
      try {
        await initKeycloak();
        if (cancelled) return;

        setAuthenticated(!!keycloak.authenticated);
        setReady(true);

        const params = new URLSearchParams(window.location.search);
        const authParams = ['code', 'state', 'session_state'] as const;
        let mutated = false;

        authParams.forEach((param) => {
          if (params.has(param)) {
            params.delete(param);
            mutated = true;
          }
        });

        if (mutated) {
          const query = params.toString();
          const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
          window.history.replaceState(null, document.title, nextUrl);
        }

        intervalId.current = window.setInterval(() => {
          if (keycloak.authenticated) {
            keycloak.updateToken(60).catch(() => keycloak.login());
          }
        }, 30_000);

        keycloak.onAuthSuccess = () => setAuthenticated(true);
        keycloak.onAuthError = () => setAuthenticated(false);
        keycloak.onAuthLogout = () => setAuthenticated(false);
        keycloak.onTokenExpired = () => {
          if (keycloak.authenticated) {
            keycloak.updateToken(60).catch(() => keycloak.login());
          }
        };
      } catch (err) {
        console.error('Keycloak init failed', err);
        if (!cancelled) {
          setAuthenticated(false);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId.current) window.clearInterval(intervalId.current);
      keycloak.onAuthSuccess = undefined;
      keycloak.onAuthError = undefined;
      keycloak.onAuthLogout = undefined;
      keycloak.onTokenExpired = undefined;
      booted.current = false;
    };
  }, []);

  const value = useMemo<Session>(() => {
    const tp = keycloak.tokenParsed as KeycloakTokenParsed | undefined;
    return {
      ready,
      authenticated,
      token: keycloak.token ?? null,
      username: tp?.preferred_username ?? null,
      hasClientRole: (role: string, clientId = 'quarkus-api') => { // cspell:ignore quarkus
        const roles: string[] = tp?.resource_access?.[clientId]?.roles ?? [];
        return roles.includes(role);
      },
      hasRealmRole: (role: string) => {
        const rr: string[] = tp?.realm_access?.roles ?? [];
        return rr.includes(role);
      },
      login: () => keycloak.login(),
      logout: () => keycloak.logout(),
    };
  }, [ready, authenticated]);

  return (
    <AuthContext.Provider value={value}>
      {ready ? children : <div style={{ padding: 16 }}>Loading…</div>}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto
export function useAuthStrict(): Session {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not mounted');
  return ctx;
}