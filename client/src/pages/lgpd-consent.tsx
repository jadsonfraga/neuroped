import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { authFetch } from "@/lib/authClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  Loader2,
  FileText,
  Lock,
  Heart,
  Check,
  ArrowLeft,
  Home,
} from "lucide-react";
import { softTap, softSuccess, softError, softTick } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { fadeIn, slideUpFadeIn } from "@/lib/motion";

const CONSENT_VERSION = "2026-05-08-v1";
const LOCAL_CONSENT_KEY = "neuroped:lgpd-consent";
const LOCAL_POSTPONE_KEY = "neuroped:lgpd-postponed";

const CONSENT_BLOCKS = [
  {
    type: "termo_uso" as const,
    icon: FileText,
    title: "Termo de uso",
    short: "O NeuroPed é ferramenta clínica de apoio; não substitui julgamento médico.",
    text: "O NeuroPed EDJ é ferramenta clínica do Dr. Jadson Fraga (CRM-PE 25227, RQE 17756), destinada ao apoio de profissionais de saúde habilitados e pacientes em acompanhamento.",
    legalBasis: "Art. 7º, V — execução de contrato",
    purpose: "Disponibilização da plataforma para uso profissional",
  },
  {
    type: "politica_privacidade" as const,
    icon: Lock,
    title: "Privacidade",
    short: "Dados informados devem ser usados apenas para finalidade clínica e operacional.",
    text: "Dados clínicos e respostas de escalas devem ser tratados com sigilo, controle de acesso e finalidade definida. Quando houver backend disponível, os registros seguem o fluxo seguro da plataforma.",
    legalBasis: "Art. 7º, II — obrigação legal / Art. 7º, V",
    purpose: "Operação do serviço e direitos do titular",
  },
  {
    type: "tratamento_dados_saude" as const,
    icon: Heart,
    title: "Dados de saúde",
    short: "Dados de saúde são sensíveis e exigem cuidado adicional.",
    text: "O tratamento de dados de saúde deve ocorrer apenas para avaliação, acompanhamento, prescrição, documentação clínica e suporte assistencial, sob responsabilidade profissional.",
    legalBasis: "Art. 11, II, f — proteção da saúde por profissional habilitado",
    purpose: "Cuidado clínico individualizado",
  },
];

type ConsentType = (typeof CONSENT_BLOCKS)[number]["type"];

class RemoteConsentError extends Error {
  constructor(readonly status: number) {
    super(`Registro remoto indisponível (${status}).`);
  }
}

export default function LgpdConsentPage() {
  const [, setLocation] = useLocation();
  const [granted, setGranted] = useState<Record<ConsentType, boolean>>({
    termo_uso: false,
    politica_privacidade: false,
    tratamento_dados_saude: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allGranted = CONSENT_BLOCKS.every((b) => granted[b.type]);

  function goHome() {
    softTap();
    haptic.tap();
    setLocation("/");
  }

  function postpone() {
    softTap();
    haptic.tap();
    try {
      localStorage.setItem(
        LOCAL_POSTPONE_KEY,
        JSON.stringify({ postponedAt: new Date().toISOString(), version: CONSENT_VERSION }),
      );
    } catch {
      // Sem localStorage: apenas segue para o app.
    }
    setLocation("/");
  }

  async function onSubmit() {
    softTap();
    haptic.tap();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const acceptedAt = new Date().toISOString();
    const payload = {
      version: CONSENT_VERSION,
      acceptedAt,
      consents: CONSENT_BLOCKS.map((b) => ({
        consentType: b.type,
        consentVersion: CONSENT_VERSION,
        consentText: b.text,
        granted: true,
        legalBasis: b.legalBasis,
        purpose: b.purpose,
      })),
    };

    try {
      // Um único lote evita que apenas parte dos três consentimentos seja
      // persistida quando a conexão falha durante o envio.
      const response = await authFetch("/api/consents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new RemoteConsentError(response.status);
      try {
        localStorage.setItem(
          LOCAL_CONSENT_KEY,
          JSON.stringify({ ...payload, localOnly: false }),
        );
      } catch {
        // Registro remoto foi suficiente.
      }
      softSuccess();
      haptic.success();
      setMessage("Consentimentos registrados com segurança na sua conta.");
    } catch (reason) {
      const remoteStatus = reason instanceof RemoteConsentError ? reason.status : null;
      const localReason =
        remoteStatus === 401
          ? "Não há sessão autenticada; o aceite não foi enviado ao servidor."
          : remoteStatus === 403
            ? "A sessão atual não autorizou o registro remoto."
            : "O servidor não estava disponível para confirmar o registro.";
      try {
        localStorage.setItem(
          LOCAL_CONSENT_KEY,
          JSON.stringify({
            ...payload,
            localOnly: true,
            pendingRemoteSync: true,
            remoteStatus,
          }),
        );
        softSuccess();
        haptic.success();
        setMessage(
          `${localReason} Consentimentos salvos somente neste dispositivo; o app continua liberado.`,
        );
      } catch {
        softError();
        haptic.error();
        setError("Não foi possível registrar agora. Mesmo assim, o acesso ao app não será bloqueado.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="page-enter mx-auto w-full max-w-4xl space-y-5 pb-8"
    >
      <motion.header
        variants={slideUpFadeIn}
        className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                LGPD · aviso não bloqueante
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                Privacidade e consentimento
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Este aviso explica o uso de dados no NeuroPed. Ele não deve impedir a navegação: você pode registrar o consentimento agora ou continuar para o app e revisar depois.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={goHome} className="gap-2 sm:shrink-0">
            <Home className="h-4 w-4" /> Ir para o app
          </Button>
        </div>
      </motion.header>

      {message && (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-100">
          <Check className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        {CONSENT_BLOCKS.map((block) => {
          const Icon = block.icon;
          return (
            <Card key={block.type} className="border-border/70 bg-card/90">
              <CardContent className="flex h-full flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{block.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{block.short}</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">{block.text}</p>

                <div className="mt-auto space-y-2 rounded-2xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                  <p><strong className="text-foreground">Base:</strong> {block.legalBasis}</p>
                  <p><strong className="text-foreground">Finalidade:</strong> {block.purpose}</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 text-xs font-semibold text-foreground transition hover:border-primary/40">
                  <Checkbox
                    checked={granted[block.type]}
                    onCheckedChange={(v) => {
                      setGranted((prev) => ({ ...prev, [block.type]: Boolean(v) }));
                      if (v) {
                        softTick();
                        haptic.select();
                      }
                    }}
                    data-testid={`checkbox-consent-${block.type}`}
                  />
                  <span>Li e concordo com este item</span>
                </label>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardContent className="space-y-4 p-4">
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
            <strong>Importante:</strong> este fluxo não deve travar o app. Caso o backend esteja offline, o aceite é salvo localmente neste dispositivo e o usuário continua navegando. Áreas sensíveis continuam protegidas pelo bloqueio clínico local.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={postpone} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Continuar sem registrar agora
            </Button>
            <Button onClick={onSubmit} disabled={!allGranted || submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {submitting ? "Registrando..." : "Registrar consentimento"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
