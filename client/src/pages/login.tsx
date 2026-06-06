import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain, Mail, KeyRound, Loader2, Eye, EyeOff,
  ShieldCheck, Stethoscope, ArrowRight,
} from "lucide-react";
import { softTap, softSuccess, softError, softHover } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import {
  fadeIn, slideUpFadeIn, staggerContainer, staggerItem,
  duration, easing,
} from "@/lib/motion";

/**
 * Login page editorial premium.
 * Layout em 2 colunas no desktop (hero + form), centralizado em mobile.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    softTap();
    haptic.tap();
    try {
      await login(email, password);
      softSuccess();
      haptic.success();
      setTimeout(() => setLocation("/"), 200);
    } catch (err: any) {
      softError();
      haptic.error();
      setError(err.message || "Falha ao autenticar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex items-stretch"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(var(--sidebar)) 0%, hsl(var(--background)) 60%)",
      }}
    >
      <div className="w-full grid lg:grid-cols-2 max-w-7xl mx-auto">
        {/* COLUNA HERO (lg+) */}
        <motion.aside
          variants={slideUpFadeIn}
          className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        >
          <DecorativeBg />
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative z-10 space-y-6">
            <motion.div variants={staggerItem} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
                }}
              >
                <Brain className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Plataforma Clínica
                </p>
                <h2
                  className="text-xl"
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  NeuroPed EDJ
                </h2>
              </div>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-4xl xl:text-5xl leading-tight"
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontWeight: 500,
                letterSpacing: "-0.015em",
              }}
            >
              Cuidado clínico com <em className="text-primary not-italic">precisão</em> e <em className="text-primary not-italic">acolhimento</em>.
            </motion.h1>
            <motion.p
              variants={staggerItem}
              className="text-base text-muted-foreground leading-relaxed max-w-md"
            >
              Escalas validadas, prontuário, marcos do desenvolvimento e ferramentas clínicas reunidas em uma plataforma desenhada para neuropediatria.
            </motion.p>
          </motion.div>

          {/* Selo de credenciais */}
          <motion.div
            variants={staggerItem}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="relative z-10 flex items-center gap-3 p-4 rounded-2xl border border-card-border backdrop-blur-sm"
            style={{ background: "hsl(var(--card) / 0.7)" }}
          >
            <Stethoscope className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Dr. Jadson Fraga Araújo Júnior</p>
              <p className="text-[11px] tracking-wider text-muted-foreground">
                Neuropediatria · CRM-PE 25227 · RQE 17756
              </p>
            </div>
          </motion.div>
        </motion.aside>

        {/* COLUNA FORM */}
        <main className="flex items-center justify-center p-6 sm:p-12">
          <motion.div
            variants={slideUpFadeIn}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md space-y-8"
          >
            {/* Header mobile */}
            <div className="lg:hidden text-center space-y-3">
              <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center shadow-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
                  boxShadow: "0 12px 40px hsl(var(--primary) / 0.35)",
                }}
              >
                <Brain className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h1
                  className="text-2xl"
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  NeuroPed EDJ
                </h1>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Acesso profissional
                </p>
              </div>
            </div>

            <div className="hidden lg:block space-y-2">
              <h2
                className="text-3xl"
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                Bem-vindo de volta
              </h2>
              <p className="text-sm text-muted-foreground">
                Acesse sua área clínica para continuar.
              </p>
            </div>

            <Card
              className="border-card-border shadow-xl"
              style={{
                background: "hsl(var(--card))",
                boxShadow: "0 16px 48px hsl(var(--foreground) / 0.05), 0 4px 16px hsl(var(--foreground) / 0.03)",
              }}
            >
              <CardContent className="p-6 sm:p-8 space-y-5">
                <form onSubmit={onSubmit} className="space-y-4">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: duration.fast, ease: easing.smooth }}
                      >
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs">
                      Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onMouseEnter={() => softHover()}
                        placeholder="seu.email@dominio.com"
                        className="pl-9 h-11 transition-all focus:ring-2 focus:ring-primary/30"
                        required
                        disabled={submitting}
                        data-testid="input-login-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs">
                      Senha
                    </Label>
                    <div className="relative group">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onMouseEnter={() => softHover()}
                        className="pl-9 pr-10 h-11 transition-all focus:ring-2 focus:ring-primary/30"
                        required
                        disabled={submitting}
                        data-testid="input-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassword((s) => !s);
                          softTap();
                          haptic.tap();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-11 gap-2 group"
                      disabled={submitting}
                      data-testid="button-login-submit"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                        </>
                      ) : (
                        <>
                          Entrar
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="flex items-center gap-2 pt-3 border-t border-card-border">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Conexão criptografada · Conformidade LGPD · Audit trail ativo
                  </p>
                </div>

                <p className="text-[11px] text-center text-muted-foreground">
                  Esqueceu a senha? Entre em contato com o administrador.
                </p>
              </CardContent>
            </Card>

            <motion.p
              variants={staggerItem}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="text-[11px] text-center text-muted-foreground/70 leading-relaxed max-w-sm mx-auto"
            >
              Conteúdo educativo e clínico de apoio. Não substitui consulta médica, avaliação individualizada, diagnóstico clínico, prescrição ou acompanhamento profissional.
            </motion.p>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}

function DecorativeBg() {
  return (
    <>
      <motion.div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25"
        style={{ background: "hsl(var(--primary))" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: "hsl(var(--chart-2))" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <svg
        className="absolute top-0 right-0 w-1/2 h-1/2 opacity-[0.04]"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
        </pattern>
        <rect width="200" height="200" fill="url(#dot-pattern)" />
      </svg>
    </>
  );
}
