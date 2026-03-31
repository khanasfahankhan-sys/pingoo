import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "pingoo_access_token";
const REFRESH_TOKEN_KEY = "pingoo_refresh_token";

function normalizeError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);

  const firstKey = Object.keys(data)[0];
  const firstVal = data[firstKey];
  if (Array.isArray(firstVal) && firstVal[0]) return String(firstVal[0]);
  return "Request failed. Please check your inputs.";
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY) || "");
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));

  const isAuthenticated = Boolean(accessToken);

  const persistTokens = useCallback((access, refresh) => {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    setAccessToken(access || "");
    setRefreshToken(refresh || "");
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken("");
    setRefreshToken("");
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const res = await api.get("/auth/me/");
    setUser(res.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      try {
        await fetchMe();
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, fetchMe]);

  const login = useCallback(
    async ({ username, password }) => {
      try {
        const res = await api.post("/auth/login/", { username, password });
        persistTokens(res.data.access, res.data.refresh);
        await fetchMe();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: normalizeError(err) };
      }
    },
    [fetchMe, persistTokens]
  );

  const signup = useCallback(
    async ({ username, email, password }) => {
      try {
        await api.post("/auth/register/", { username, email, password });
        // Auto-login after successful registration
        return await login({ username, password });
      } catch (err) {
        return { ok: false, error: normalizeError(err) };
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      accessToken,
      refreshToken,
      login,
      signup,
      logout,
    }),
    [user, isLoading, isAuthenticated, accessToken, refreshToken, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}

