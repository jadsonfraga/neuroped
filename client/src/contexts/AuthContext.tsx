import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type AuthUser,
  getStoredUser,
  loginRequest,
  logoutRequest,
  authFetch,
} from "@/lib/authClient";

const FIXED_EMAIL = "medicina119@gmail.com";
const APP_SECRET = (import.meta.env.VITE_APP_SECRET as string | undefined)?.trim();

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const stored = getStoredUser();
      if (stored) setUser(stored);
      try {
        const r = await authFetch("/api/auth/me");
        if (r.ok) {
          const fresh = await r.json();
          if (!cancelled) setUser(fresh);
        } else if (APP_SECRET) {
          const data = await loginRequest(FIXED_EMAIL, APP_SECRET);
          if (!cancelled) setUser(data.user);
        }
      } catch {
        if (APP_SECRET) {
          try {
            const data = await loginRequest(FIXED_EMAIL, APP_SECRET);
            if (!cancelled) setUser(data.user);
          } catch { /* backend indisponível — PIN master é suficiente */ }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrap();

    async function handleExpired() {
      if (APP_SECRET) {
        try {
          const data = await loginRequest(FIXED_EMAIL, APP_SECRET);
          setUser(data.user);
          return;
        } catch { /* tentativa de renovação falhou */ }
      }
      setUser(null);
    }
    window.addEventListener("auth:expired", handleExpired as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:expired", handleExpired as EventListener);
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    setUser(data.user);
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const r = await authFetch("/api/auth/me");
      if (r.ok) setUser(await r.json());
    } catch { /* sessão não validada (offline/sem backend) — mantém usuário atual */ }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
