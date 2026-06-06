import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type AuthUser,
  getStoredUser,
  loginRequest,
  logoutRequest,
  refreshTokenRequest,
  clearAuth,
  authFetch,
} from "@/lib/authClient";

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
        }
      } catch { /* sessão não validada (offline/sem backend) — mantém usuário local */ }
      finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrap();

    function handleExpired() {
      setUser(null);
    }
    window.addEventListener("auth:expired", handleExpired);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:expired", handleExpired);
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
