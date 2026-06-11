import { motion, AnimatePresence } from "framer-motion";
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
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0f4c3a 0%, #1a2559 50%, #3d1428 100%)",
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
                <path d="M 20 40 Q 40 20, 60 40 T 100 40" stroke="#ffffff" strokeWidth="0.5" fill="none" />
              </pattern>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-mesh)" />
          </svg>
          <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-lg">
            {/* Escudo Dr. Jadson animado com glow premium */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: easing.spring, delay: 0.08 }}
              className="relative"
            >
              {/* Glow externo premium — teal + vinho */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full blur-3xl -z-10"
                style={{
                  background:
                    "radial-gradient(circle, rgba(15, 76, 58, 0.5) 0%, rgba(61, 20, 40, 0.3) 100%)",
                  width: "140px",
                  height: "140px",
                  left: "-20px",
                  top: "-20px",
                }}
              />

              {/* Shield container com border premium */}
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-2"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 245, 0.9) 100%)",
                  borderColor: "rgba(15, 76, 58, 0.3)",
                  boxShadow:
                    "0 25px 80px rgba(15, 76, 58, 0.4), 0 12px 40px rgba(61, 20, 40, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                }}
              >
                {/* Master Shield Logo */}
                <img
                  src={drJadsonMasterShieldLogo}
                  alt="Dr. Jadson Fraga Shield"
                  className="w-24 h-24 object-contain drop-shadow-lg"
                />
              </div>
            </motion.div>

            {/* Wordmark — tipografia premium */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing.smooth, delay: 0.35 }}
              className="text-center space-y-2"
            >
              <h1
                className="text-4xl leading-tight tracking-tight font-bold"
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                  textShadow:
                    "0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(15, 76, 58, 0.1)",
                }}
              >
                NeuroPed <span className="opacity-70">EDJ</span>
              </h1>
              <p
                className="text-sm uppercase tracking-[0.18em] font-medium"
                style={{ color: "rgba(255, 255, 255, 0.85)" }}
              >
                Plataforma Clínica Pediátrica
              </p>
            </motion.div>

            {/* Linha decorativa premium */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.7 }}
              transition={{ duration: 0.6, ease: easing.smooth, delay: 0.52 }}
              className="h-0.5 w-32"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(15, 244, 200, 0.6), transparent)",
              }}
            />

            {/* Credenciais institucionais */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing.smooth, delay: 0.62 }}
              className="text-center space-y-1.5"
            >
              <div
                className="flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ color: "#ffffff" }}
              >
                <Shield className="w-4 h-4" strokeWidth={2} />
                <span>Dr. Jadson Fraga Araújo Júnior</span>
              </div>
              <p
                className="text-xs tracking-wide font-medium"
                style={{ color: "rgba(255, 255, 255, 0.75)" }}
              >
                Especialista em Neuropediatria · CRM-PE 25227 · RQE 17756
              </p>
            </motion.div>

            {/* Loader premium — dots pulsantes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              className="flex items-center gap-2 mt-6"
              aria-hidden="true"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  className="rounded-full"
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "rgba(15, 244, 200, 0.8)",
                    boxShadow: "0 0 8px rgba(15, 244, 200, 0.5)",
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
