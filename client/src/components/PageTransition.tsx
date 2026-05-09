import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { slideUpFadeIn, easing, duration } from "@/lib/motion";

/**
 * Wrapper que aplica transicao suave em toda mudanca de rota.
 *
 * Uso: envolver cada conteudo de pagina ou usar uma vez em <AppRouter />
 * para aplicar a transicao globalmente quando o location mudar.
 *
 * O location e usado como `key` para forcar re-mount + animacao em cada rota.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <motion.div
      key={location}
      initial="hidden"
      animate="visible"
      variants={slideUpFadeIn}
      transition={{ duration: duration.normal, ease: easing.smooth }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
