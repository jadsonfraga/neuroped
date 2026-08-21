// Design: transição global discreta com foco interativo, conectando cada aba ao mesmo sistema clínico sem bloquear o conteúdo.
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
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
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(-180);
  const pointerY = useMotionValue(-180);
  const focusX = useSpring(pointerX, { stiffness: 210, damping: 28, mass: 0.35 });
  const focusY = useSpring(pointerY, { stiffness: 210, damping: 28, mass: 0.35 });

  return (
    <motion.div
      key={location}
      initial="hidden"
      animate="visible"
      variants={slideUpFadeIn}
      transition={{ duration: duration.normal, ease: easing.smooth }}
      onPointerMove={(event) => {
        if (reduceMotion || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set(event.clientX - bounds.left - 76);
        pointerY.set(event.clientY - bounds.top - 76);
      }}
      onPointerLeave={() => {
        pointerX.set(-180);
        pointerY.set(-180);
      }}
      className="relative min-h-full overflow-hidden"
    >
      {!reduceMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute z-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl"
          style={{ x: focusX, y: focusY }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
