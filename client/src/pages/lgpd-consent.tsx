import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/authClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck, Loader2, FileText, Lock, Heart,
  ArrowRight, ArrowLeft, Check,
} from "lucide-react";
import { softTap, softSuccess, softError, softTick } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import {
  fadeIn, slideRightFadeIn, slideUpFadeIn,
  duration, easing,
} from "@/lib/motion";

const CONSENT_VERSION = "2026-05-08-v1";

const CONSENT_BLOCKS = [
  {
    type: "termo_uso" as const,
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    title: "Termo de Uso",
    short: "Como usar a plataforma",
    text: `O NeuroPed EDJ é ferramenta clínica do Dr. Jadson Fraga (CRM-PE 25227, RQE 17756). É destinada exclusivamente a profissionais de saúde habilitados e seus pacientes em acompanhamento. As escalas e instrumentos disponíveis não substituem julgamento clínico, avaliação individualizada nem diagnóstico médico formal. O uso é por sua conta e risco.`,
    legalBasis: "Art. 7º, V — execução de contrato",
    purpose: "Disponibilização da plataforma para uso profissional",
  },
  {
    type: "politica_privacidade" as const,
    icon: Lock,
    color: "from-emerald-500 to-teal-500",
    title: "Privacidade dos Dados",
    short: "Como protegemos suas informações",
    text: `Os dados que você informar (nome, dados clínicos, respostas de escalas) serão armazenados em servidor controlado pelo Dr. Jadson Fraga. Campos sensíveis são criptografados em repouso (AES-256-GCM). Não compartilhamos seus dados com terceiros sem sua autorização explícita ou ordem judicial. Você pode exportar ou apagar seus dados a qualquer momento via /configuracoes.`,
    legalBasis: "Art. 7º, II — cumprimento de obrigação legal",
    purpose: "Operação do serviço e direitos do titular",
  },
  {
    type: "tratamento_dados_saude" as const,
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    title: "Dados Sensíveis de Saúde",
    short: "Tratamento especial conforme LGPD art. 11",
    text: `Autorizo o tratamento dos meus dados de saúde (ou do paciente sob minha responsabilidade) para finalidade exclusiva de avaliação, acompanhamento, prescrição e suporte clínico. Estou ciente de que dados de saúde são classificados como sensíveis (LGPD art. 5º, II) e que o tratamento ampara-se no art. 11, II, alínea "f" (proteção da saúde por profissional habilitado).`,
    legalBasis: "Art. 11, II, f — proteção da saúde por profissional",
    purpose: "Cuidado clínico individualizado",
  },
];

export default function LgpdConsentPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const block = CONSENT_BLOCKS[step];
  const isLast = step === CONSENT_BLOCKS.length - 1;
  const allGranted = CONSENT_BLOCKS.every((b) => granted[b.type]);

  function nextStep() {
    softTap();
    haptic.tap();
    if (step < CONSENT_BLOCKS.length - 1) {
      setStep(step + 1);
    }
  }

  function prevStep() {
    softTap();
    haptic.tap();
    if (step > 0) setStep(step - 1);
  }

  async function onSubmit() {
    softTap();
    haptic.tap();
    setError(null);
    setSubmitting(true);
    try {
      for (const b of CONSENT_BLOCKS) {
        if (!granted[b.type]) continue;
        const r = await authFetch("/api/consents", {
          method: "POST",
          body: JSON.stringify({
            consentType: b.type,
            consentVersion: CONSENT_VERSION,
            consentText: b.text,
            granted: true,
            legalBasis: b.legalBasis,
            purpose: b.purpose,
          }),
        });
        if (!r.ok) throw new Error("Falha ao registrar consentimento");
      }
      softSuccess();
      haptic.success();
      setSuccess(true);
      setTimeout(() => setLocation("/"), 1500);
    } catch (e: any) {
      softError();
      haptic.error();
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background: "radial-gradient(ellipse at top, hsl(var(--sidebar)) 0%, hsl(var(--background)) 70%)",
      }}
    >
      <motion.div variants={slideUpFadeIn} className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: duration.normal, ease: easing.spring }}
            className="inline-flex w-14 h-14 rounded-2xl items-center justify-center shadow-xl"
            style={{
              background: "linear-gradient(135deg, hsl(var(--chart-3)), hsl(var(--primary)))",
              boxShadow: "0 12px 40px hsl(var(--chart-3) / 0.3)",
            }}
          >
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
          </motion.div>
          <h1
            className="text-2xl"
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontWeight: 600,
            }}
          >
            Consentimento LGPD
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Para usar o NeuroPed EDJ com segurança legal, leia e aceite os três termos abaixo.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3">
          {CONSENT_BLOCKS.map((b, i) => (
            <div key={b.type} className="flex items-center">
              <motion.div
                animate={{
                  scale: i === step ? 1.15 : 1,
                  opacity: i <= step ? 1 : 0.4,
                }}
                transition={{ duration: 0.2 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  background:
                    granted[b.type]
                      ? "hsl(var(--primary))"
                      : i === step
                      ? "hsl(var(--card))"
                      : "hsl(var(--muted))",
                  color: granted[b.type] ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                  border:
                    i === step && !granted[b.type]
                      ? "2px solid hsl(var(--primary))"
                      : "1px solid hsl(var(--border))",
                }}
              >
                {granted[b.type] ? <Check className="w-4 h-4" /> : i + 1}
              </motion.div>
              {i < CONSENT_BLOCKS.length - 1 && (
                <div
                  className="w-12 h-px mx-1"
                  style={{
                    background: i < step ? "hsl(var(--primary))" : "hsl(var(--border))",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
            >
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert>
                <AlertDescription>
                  Consentimentos registrados. Redirecionando...
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bloco atual com transicao */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideRightFadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="overflow-hidden border-card-border shadow-lg">
              <div
                className="h-1.5 w-full bg-gradient-to-r"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-2)))`,
                }}
              />
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))`,
                    }}
                  >
                    <block.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{block.title}</h2>
                    <p className="text-xs text-muted-foreground">{block.short}</p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90">{block.text}</p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-card-border">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Base legal
                    </p>
                    <p className="text-xs">{block.legalBasis}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Finalidade
                    </p>
                    <p className="text-xs">{block.purpose}</p>
                  </div>
                </div>

                <label
                  className="flex items-center gap-3 p-3 rounded-lg border border-card-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onMouseEnter={() => softTick()}
                >
                  <Checkbox
                    checked={granted[block.type] || false}
                    onCheckedChange={(v) => {
                      const newVal = !!v;
                      setGranted((prev) => ({ ...prev, [block.type]: newVal }));
                      if (newVal) {
                        softTick();
                        haptic.select();
                      }
                    }}
                    data-testid={`checkbox-consent-${block.type}`}
                  />
                  <span className="text-sm font-medium">Li e concordo com este termo</span>
                </label>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navegacao */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 0 || submitting}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </Button>

          <p className="text-xs text-muted-foreground">
            {step + 1} de {CONSENT_BLOCKS.length}
          </p>

          {!isLast ? (
            <Button onClick={nextStep} disabled={!granted[block.type] || submitting} className="gap-1.5">
              Próximo <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={!allGranted || submitting} className="gap-1.5">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registrando
                </>
              ) : (
                <>
                  Aceitar e continuar <Check className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-[11px] text-center text-muted-foreground/80">
          Você pode revogar qualquer consentimento em <code className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">/configuracoes</code>. A revogação não afeta o tratamento já realizado, mas interrompe o tratamento futuro.
        </p>
      </motion.div>
    </motion.div>
  );
}
