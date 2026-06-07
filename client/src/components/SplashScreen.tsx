import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { duration, easing } from "@/lib/motion";
import { BrandMark } from "@/components/BrandAssets";

interface SplashScreenProps {
  /** Tempo minimo de exibicao (ms). Default 900ms. */
  minDurationMs?: number;
  /** Callback quando splash terminar. */
  onComplete?: () => void;
  /** Mostrar splash ate algum recurso estar pronto. */
  awaiting?: boolean;
}

/**
 * Splash screen premium com identidade visual NeuroPed EDJ.
 *
 * Animacao em 3 atos:
 *  1. Backdrop fade-in com gradiente warm
 *  2. Escudo Dr. Jadson Fraga escala + pulse
 *  3. Tipografia editorial entra com slide-up suave
 *  4. Subtitulo + credenciais aparecem em sequencia
 *  5. Loader sutil indica progresso enquanto awaiting=true
 *  6. Fade-out elegante quando awaiting=false e minDuration cumprido
 */
export function SplashScreen({
  minDurationMs = 900,
  onComplete,
  awaiting = false,
}: SplashScreenProps) {
  const [show, setShow] = useState(true);
  const [minTimeReached, setMinTimeReached] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeReached(true), minDurationMs);
    return () => clearTimeout(t);
  }, [minDurationMs]);

  useEffect(() => {
    if (minTimeReached && !awaiting) {
      const t = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [minTimeReached, awaiting, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: easing.smooth }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(var(--background)) 0%, hsl(var(--sidebar)) 100%)",
          }}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-6 px-6 max-w-md">
            {/* Logo animado */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: duration.splash, ease: easing.spring, delay: 0.05 }}
              className="relative"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: "hsl(var(--primary) / 0.3)" }}
              />
              <div
                className="relative rounded-[1.75rem] p-1 shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, hsl(43 86% 61%) 0%, hsl(0 72% 36%) 54%, hsl(199 65% 18%) 100%)",
                  boxShadow: "0 20px 60px hsl(0 72% 36% / 0.32), 0 8px 24px hsl(43 86% 61% / 0.2)",
                }}
              >
                <BrandMark size="lg" imageClassName="rounded-[1.45rem]" />
              </div>
            </motion.div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.normal, ease: easing.smooth, delay: 0.25 }}
              className="text-center space-y-1.5"
            >
              <h1
                className="text-3xl tracking-tight"
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "hsl(var(--foreground))",
                }}
              >
                NeuroPed <span className="text-amber-500">EDJ</span>
              </h1>
              <p
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Ecossistema Clínico Dr. Jadson Fraga
              </p>
            </motion.div>

            {/* Linha decorativa */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.6 }}
              transition={{ duration: 0.5, ease: easing.smooth, delay: 0.45 }}
              className="h-px w-24"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
              }}
            />

            {/* Credenciais */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: duration.normal, ease: easing.smooth, delay: 0.55 }}
              className="text-center space-y-0.5"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "hsl(var(--foreground))" }}>
                <Stethoscope className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 500 }}>Dr. Jadson Fraga Araújo Júnior</span>
              </div>
              <p className="text-[10px] tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                Neuropediatria · CRM-PE 25227 · RQE 17756
              </p>
            </motion.div>

            {/* Loader sutil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex items-center gap-1.5 mt-4"
              aria-hidden="true"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
