import type { ReactNode } from "react";

/**
 * Compatibilidade estrutural do shell.
 *
 * O NeuroPed funciona em modo local aberto, portanto este componente não pede
 * PIN, senha ou qualquer outra credencial. O backend remoto permanece protegido;
 * os dados do workspace aberto ficam somente no navegador.
 */
export function PrivateGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
