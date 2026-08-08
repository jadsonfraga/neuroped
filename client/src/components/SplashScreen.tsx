import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { easing } from "@/lib/motion";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";

interface SplashScreenProps {
  /** Tempo minimo de exibicao (ms). Default 900ms. */
  minDurationMs?: number;
  /** Callback quando splash terminar. */
  onComplete?: () => void;
  /** Mostrar splash ate algum recurso estar pronto. */
  awaiting?: boolean;
}

/**
 * Splash screen premium com identidade visual NeuroPed EDJ — melhorada.
 *
 * Animacao em 4 atos:
 *  1. Backdrop fade-in com gradiente premium (teal/vinho/marinho)
 *  2. Mesh de fundo neural sutil
 *  3. Escudo Dr. Jadson centralizado com glow
 *  4. Tipografia editorial entra com slide-up elegante
 *  5. Credenciais aparecem em sequencia
 *  6. Loader sutil indica progresso
 *  7. Fade-out elegante quando pronto
 */
export function SplashScreen({
  minDurationMs = 900,
  onComplete,
  awaiting = false,
}: SplashScreenProps) {
  const [show, setShow] = useState(true);
  const [minTimeReached, setMinTimeReached] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

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
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: easing.smooth }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          style={{
            background:
              "var(--splash-bg)",
          }}
          aria-hidden="true"
        >
          {/* Neural mesh background — padrão sutil */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            style={{ mixBlendMode: "overlay" }}
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="neural-mesh" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="1" fill="url(#grad1)" />
                <path d="M 20 40 Q 40 20, 60 40 T 100 40" stroke="var(--splash-mesh-stroke)" strokeWidth="0.5" fill="none" />
              </pattern>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--splash-mesh-stroke)" />
                <stop offset="100%" stopColor="var(--splash-mesh-stroke)" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-mesh)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-lg">
            {/* Escudo Dr. Jadson animado com glow premium */}
            <motion.div
              initial={{ scale: reduceMotion ? 1 : 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.7, ease: easing.spring, delay: reduceMotion ? 0 : 0.08 }}
              className="relative"
            >
              {/* Glow externo premium — teal + vinho */}
              <motion.div
                animate={{ scale: reduceMotion ? 1 : [1, 1.08, 1] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full blur-3xl -z-10"
                style={{
                  background:
                    "var(--splash-glow)",
                  width: "140px",
                  height: "140px",
                  left: "-20px",
                  top: "-20px",
                }}
              />

              {/* Shield container com border premium */}
              <div
                className="relative w-32 h-32 rounded-[1.9rem] overflow-hidden flex items-center justify-center shadow-2xl border-2"
                style={{
                  borderColor: "var(--splash-shield-border)",
                  boxShadow:
                    "var(--splash-shield-shadow)",
                }}
              >
                {/* Master Shield Logo */}
                <img
                  src={drJadsonMasterShieldLogo}
                  alt="Dr. Jadson Fraga Shield"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Wordmark — tipografia premium */}
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: easing.smooth, delay: reduceMotion ? 0 : 0.35 }}
              className="text-center space-y-2"
            >
              <h1
                className="text-4xl leading-tight tracking-tight font-bold"
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--splash-title)",
                  textShadow:
                    "var(--splash-title-shadow)",
                }}
              >
                NeuroPed <span className="opacity-70">EDJ</span>
              </h1>
              <p
                className="text-sm uppercase tracking-[0.18em] font-medium"
                style={{ color: "var(--splash-subtitle)" }}
              >
                Plataforma Clínica Pediátrica
              </p>
            </motion.div>

            {/* Linha decorativa premium */}
            <motion.div
              initial={{ scaleX: reduceMotion ? 1 : 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.7 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: easing.smooth, delay: reduceMotion ? 0 : 0.52 }}
              className="h-0.5 w-32"
              style={{
                background:
                  "var(--splash-divider)",
              }}
            />

            {/* Credenciais institucionais */}
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: easing.smooth, delay: reduceMotion ? 0 : 0.62 }}
              className="text-center space-y-1.5"
            >
              <div
                className="flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ color: "var(--splash-title)" }}
              >
                <Shield className="w-4 h-4" strokeWidth={2} />
                <span>Dr. Jadson Fraga Araújo Júnior</span>
              </div>
              <p
                className="text-xs tracking-wide font-medium"
                style={{ color: "var(--splash-credits)" }}
              >
                Especialista em Neuropediatria · CRM-PE 25227 · RQE 17756
              </p>
            </motion.div>

            {/* Loader premium — dots pulsantes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.75, duration: reduceMotion ? 0 : 0.4 }}
              className="flex items-center gap-2 mt-6"
              aria-hidden="true"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={reduceMotion
                    ? { scale: 1, opacity: 0.8 }
                    : { scale: [0.7, 1.1, 0.7], opacity: [0.4, 1, 0.4] }}
                  transition={reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                  className="rounded-full"
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "var(--splash-dot)",
                    boxShadow: "var(--splash-dot-glow)",
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
