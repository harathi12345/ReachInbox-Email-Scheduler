/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authLogin, authLogout, authMe, authRegister, updateProfile, type AuthUser } from "../lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (name: string, email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenKey = "reachinbox_token";

const checkInitialToken = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get("token") || localStorage.getItem(tokenKey));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(checkInitialToken);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParams = params.get("token");
    if (tokenParams) {
      localStorage.setItem(tokenKey, tokenParams);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    authMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem(tokenKey);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const result = await authLogin({ email, password });
        localStorage.setItem(tokenKey, result.token);
        setUser(result.user);
      },
      register: async (name, email, password) => {
        const result = await authRegister({ name, email, password });
        localStorage.setItem(tokenKey, result.token);
        setUser(result.user);
      },
      logout: async () => {
        try {
          await authLogout();
        } catch {
          // ignore logout network errors
        } finally {
          localStorage.removeItem(tokenKey);
          setUser(null);
        }
      },
      saveProfile: async (name, email) => {
        const updated = await updateProfile({ name, email });
        setUser(updated);
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};