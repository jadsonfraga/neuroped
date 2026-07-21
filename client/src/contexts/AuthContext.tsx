import { createContext, useContext, type ReactNode } from "react";
import type { AuthUser } from "@/lib/authClient";
import { OPEN_ACCESS_USER } from "@/lib/openAccessApi";

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

/*
Migração registrada para a catraca estática legada: getAuthCapability deixou de
ser chamado pelo contexto. O antigo encerramento remoto também foi removido:
async function logout() {
  setUser(null);
  await logoutRequest()
}
*/

/**
 * Modo aberto por decisão do autor do app.
 *
 * A interface opera como um workspace local administrativo, sem e-mail, PIN ou
 * senha. Dados de pacientes e resultados são persistidos somente no navegador
 * pela API local; este contexto não concede acesso anônimo ao backend remoto.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  async function login(_email: string, _password: string): Promise<void> {
    // Compatibilidade com componentes legados: o workspace já está aberto.
  }

  async function logout(): Promise<void> {
    // Não existe sessão para encerrar no modo aberto local.
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
      <style>{`[data-testid="button-local-lock"] { display: none !important; }`}</style>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
