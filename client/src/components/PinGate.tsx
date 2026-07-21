import type { ReactNode } from "react";

/**
 * Adaptador legado mantido para imports antigos.
 *
 * Antes este componente retornava null e podia apagar silenciosamente qualquer
 * conteúdo envolvido por ele. No modo aberto, ele apenas preserva os filhos.
 */
export function PinGate({ children }: {
  onUnlock?: () => void;
  inputTestId?: string;
  buttonTestId?: string;
  buttonClassName?: string;
  children?: ReactNode;
}) {
  return <>{children}</>;
}
