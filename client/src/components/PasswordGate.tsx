import type { ReactNode } from "react";

/**
 * Adaptador legado mantido para compatibilidade.
 * A proteção efetiva é centralizada em PrivateGate e RouteGuard.
 */
export function PasswordGate({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
