import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type AuthUser,
  getStoredUser,
  loginRequest,
  logoutRequest,
  authFetch,
  getAuthCapability,
} from "@/lib/authClient";

export type AccessMode = "checking" | "remote" | "local";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessMode: AccessMode;
  remoteConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessMode, setAccessMode] = useState<AccessMode>("checking");
  const [remoteConfigured, setRemoteConfigured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const capability = await getAuthCapability();
      if (cancelled) return;
      const nextMode: AccessMode = capability.required ? "remote" : "local";
      setAccessMode(nextMode);
      setRemoteConfigured(capability.configured);

      if (nextMode === "local") {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const stored = getStoredUser();
      if (stored) setUser(stored);
      try {
        const r = await authFetch("/api/auth/me");
        if (r.ok) {
          const fresh = await r.json();
          if (!cancelled) setUser(fresh);
        } else if (!cancelled) {
          setUser(null);
        }
      } catch {
        // A capacidade informou backend clínico: falhar fechado, sem auto-login.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrap();

    function handleExpired() {
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
    setUser(null);
    await logoutRequest();
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
        accessMode,
        remoteConfigured,
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
