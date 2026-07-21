import { createContext, useContext, type ReactNode } from "react";
import { clearAuth, type AuthUser } from "@/lib/authClient";
import { OPEN_ACCESS_USER } from "@/lib/openAccessApi";
import { queryClient } from "@/lib/queryClient";
import { secureClearAll } from "@/lib/secureStorage";

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
const LOCAL_USER: AuthUser = OPEN_ACCESS_USER;

// Esta build opera exclusivamente no modo aberto. Limpa de forma síncrona
// qualquer sessão remota herdada antes que um filho possa usar authFetch.
// Assim, trocar de uma release autenticada para esta não mantém um bearer
// token administrativo em sessionStorage.
clearAuth();

async function clearSessionScopedClientState(): Promise<void> {
  clearAuth();
  await queryClient.cancelQueries();
  queryClient.clear();
  await secureClearAll();
}

/**
 * Modo aberto por decisão do autor do app.
 *
 * A interface opera como um workspace local administrativo, sem e-mail, PIN ou
 * senha. Dados de pacientes e resultados são persistidos somente no navegador
 * pela API local; este contexto não concede acesso anônimo ao backend remoto.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  async function login(_email: string, _password: string): Promise<void> {
    // Mantém compatibilidade com links antigos sem autenticar nem trocar usuário.
    await clearSessionScopedClientState();
  }

  async function logout(): Promise<void> {
    // Não fecha o workspace, mas elimina caches e rascunhos efêmeros da sessão.
    await clearSessionScopedClientState();
  }

  async function refreshUser(): Promise<void> {
    // O usuário administrativo local é estável durante toda a sessão do app.
  }

  return (
    <AuthContext.Provider
      value={{
        user: LOCAL_USER,
        isAuthenticated: true,
        isLoading: false,
        accessMode: "local",
        remoteConfigured: false,
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
