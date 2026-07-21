import type { ReactNode } from "react";

/**
 * Adaptador legado mantido para compatibilidade.
 * O modo aberto não bloqueia nem oculta os componentes envolvidos por ele.
 */
export function PasswordGate({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
