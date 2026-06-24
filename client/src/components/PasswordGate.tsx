import type { ReactNode } from "react";

// PrivateGate (PIN master) é o único portão de acesso do app.
// Este componente é mantido por compatibilidade mas não bloqueia mais nada.
export function PasswordGate({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
