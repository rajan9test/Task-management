import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.js';
import { MESSAGES, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // True while a stored token is being checked at startup.
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()));

  const logout = useCallback(
    (flash) => {
      clearToken();
      setUser(null);
      navigate('/login', { replace: true, state: flash ? { flash } : undefined });
    },
    [navigate],
  );

  // Any 401 on a request that sent a token ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => logout({ type: 'error', message: MESSAGES.sessionExpired }));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // On startup, check that a stored token is still valid.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        // 401 is handled by the unauthorized handler. Any other failure (e.g. server down)
        // leaves the user logged out but keeps the token, so a reload can retry.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await authApi.login({ email, password });
    setToken(token);
    setUser(loggedInUser);
  }, []);

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
