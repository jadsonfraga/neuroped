import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type AuthUser,
  getStoredUser,
  loginRequest,
  logoutRequest,
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
    // Só revalida uma sessão já existente (token no sessionStorage). NÃO existe
    // mais auto-login com segredo embutido no bundle — para acessar rotas
    // clínicas é preciso passar pela tela de login (/login) com credenciais
    // reais, validadas pelo backend.
    async function bootstrap() {
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
        /* backend indisponível — mantém o usuário armazenado, se houver */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrap();

    // Sessão expirada e refresh falhou: derruba o usuário. O RouteGuard
    // redireciona para /login quando a rota exige sessão.
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
