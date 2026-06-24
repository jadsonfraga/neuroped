import type { ReactNode } from "react";

// PrivateGate (PIN master) é o único portão de acesso do app.
// Este componente é mantido por compatibilidade mas não bloqueia mais nada.
export function PinGate(_props: {
  onUnlock?: () => void;
  inputTestId?: string;
  buttonTestId?: string;
  buttonClassName?: string;
  children?: ReactNode;
}) {
  return null;
}
