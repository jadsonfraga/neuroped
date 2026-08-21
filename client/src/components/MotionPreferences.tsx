import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * ESTILO: infraestrutura discreta de acessibilidade; a preferência do sistema
 * governa todas as animações montadas dentro do shell sem pesar no entrypoint.
 */
export function MotionPreferences({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
