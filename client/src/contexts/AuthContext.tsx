import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type AuthUser,
  getStoredUser,
  loginRequest,
  signupRequest,
  changePasswordRequest,
  logoutRequest,
  authFetch,
  getAccessToken,
  getRefreshToken,
  getAuthCapability,
} from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import { secureClearAll } from "@/lib/secureStorage";
import { clearInMemoryScaleDrafts } from "@/hooks/useSecureScaleDraft";

export type AccessMode = "checking" | "remote" | "local";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessMode: AccessMode;
  remoteConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Dados do React Query e rascunhos cifrados/efêmeros pertencem à sessão clínica
 * atual. Nunca podem sobreviver a expiração, logout ou troca de conta no mesmo SPA.
 */
async function clearSessionScopedClientState(): Promise<void> {
  try {
    await queryClient.cancelQueries();
  } catch {
    // A limpeza abaixo continua obrigatória mesmo se algum observer falhar.
  }
  queryClient.clear();
  clearInMemoryScaleDrafts();
  await secureClearAll();
}

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
      const hasSessionCredentials = Boolean(getAccessToken() || getRefreshToken());
      if (!hasSessionCredentials) {
        // Sem credenciais não há sessão a validar. Evita um 401 esperado no
        // console do navegador e mantém o acesso anônimo explicitamente fechado.
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (stored) setUser(stored);
      try {
        const response = await authFetch("/api/auth/me");
        if (response.ok) {
          const fresh = await response.json();
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
    void bootstrap();

    function handleExpired() {
      setUser(null);
      void clearSessionScopedClientState();
    }
    window.addEventListener("auth:expired", handleExpired as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:expired", handleExpired as EventListener);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const data = await loginRequest(email, password);
    await clearSessionScopedClientState();
    setUser(data.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    const data = await signupRequest(name, email, password);
    await clearSessionScopedClientState();
    setUser(data.user);
  }, []);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    const data = await changePasswordRequest(currentPassword, newPassword);
    // A família anterior foi revogada no servidor e os tokens já foram trocados
    // pelo authClient. Nenhum cache clínico pré-rotação pode sobreviver à sessão nova.
    await clearSessionScopedClientState();
    setUser(data.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    try {
      await logoutRequest();
    } finally {
      await clearSessionScopedClientState();
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await authFetch("/api/auth/me");
      if (response.ok) setUser(await response.json());
    } catch {
      // Sessão não validada (offline/sem backend): mantém o estado atual.
    }
  }, []);

  // Identidade estável do value: sem isso, todo render do provider re-renderiza
  // todos os consumidores de useAuth() mesmo sem mudança de estado.
  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      accessMode,
      remoteConfigured,
      login,
      signup,
      changePassword,
      logout,
      refreshUser,
    }),
    [user, isLoading, accessMode, remoteConfigured, login, signup, changePassword, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
