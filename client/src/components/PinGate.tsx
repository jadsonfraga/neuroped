import type { ReactNode } from "react";

/**
 * Adaptador legado mantido para imports antigos.
 *
 * Antes este componente retornava null e podia apagar silenciosamente qualquer
 * conteúdo envolvido por ele. A proteção efetiva agora é centralizada em
 * PrivateGate e RouteGuard; este adaptador apenas preserva os filhos.
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
