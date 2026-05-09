import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, Home as HomeIcon } from "lucide-react";
import { fadeIn, slideUpFadeIn, easing, duration } from "@/lib/motion";
import { softTap } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";

export default function SessionExpiredPage() {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse at center, hsl(var(--sidebar)) 0%, hsl(var(--background)) 100%)",
      }}
    >
      <motion.div
        variants={slideUpFadeIn}
        className="max-w-md w-full text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: duration.normal, ease: easing.spring, delay: 0.1 }}
          className="relative inline-block"
        >
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{ background: "hsl(var(--chart-4))" }}
          />
          <div
            className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
            style={{
              background: "linear-gradient(135deg, hsl(var(--chart-4) / 0.15), hsl(var(--chart-5) / 0.1))",
              border: "1px solid hsl(var(--chart-4) / 0.3)",
            }}
          >
            <Clock className="w-9 h-9" style={{ color: "hsl(var(--chart-4))" }} strokeWidth={1.5} />
          </div>
        </motion.div>

        <div className="space-y-2">
          <h1
            className="text-2xl"
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontWeight: 600,
            }}
          >
            Sessão expirada
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Por segurança, sua sessão foi encerrada após inatividade. Faça login novamente para continuar.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: duration.normal, ease: easing.smooth }}
          className="flex flex-col gap-2 max-w-xs mx-auto"
        >
          <Button
            onClick={() => {
              softTap();
              haptic.tap();
              setLocation("/login");
            }}
            className="gap-2 h-11"
          >
            <LogIn className="w-4 h-4" /> Fazer login
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              softTap();
              haptic.tap();
              setLocation("/");
            }}
            className="gap-2 text-sm"
          >
            <HomeIcon className="w-3.5 h-3.5" /> Voltar à área educativa
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
