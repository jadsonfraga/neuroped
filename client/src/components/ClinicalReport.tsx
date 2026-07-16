import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Home,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";
import { softBell, softSuccess, softTap } from "@/lib/softSounds";
import { play1Up } from "@/lib/sounds";
import {
  buildScaleResponsePrintHtml,
  buildScaleResponseText,
  normalizeScaleResponseItems,
  type ScaleResponseItem,
  type ScaleResponseReport,
} from "@/lib/scaleResponseReport";
import {
  copyText,
  downloadTextDocument,
  openEmailDraft,
  safeTextFilename,
  shareWhatsAppDocument,
} from "@/lib/shareText";

const EMAIL_TO = "drjadsonfraga@proton.me";
const PROFESSIONAL_SIGNATURE = {
  name: "Dr. Jadson Fraga Araújo Júnior",
  specialty: "Neuropediatra",
  registry: "CRM-PE 25227 · RQE 17756",
  service: "NeuroPed — Escalas de Neuropediatria",
};

interface ReportItem {
  question: string;
  answer: string;
}

interface ClinicalReportProps {
  scaleName: string;
  scaleFullName?: string;
  items: ReportItem[];
  patientAge?: string;
}

// Forma interna garantidamente completa consumida pelo render e helpers.
type NormalizedReport = ScaleResponseReport;

function normalizeReportProps(p: ClinicalReportProps): NormalizedReport {
  const items: ScaleResponseItem[] = normalizeScaleResponseItems(p.items);
  return {
    scaleName: p.scaleName,
    scaleFullName: p.scaleFullName,
    items,
    patientAge: p.patientAge,
  };
}

async function sendEmail(
  scaleName: string,
  reportText: string,
  setSent: (v: boolean) => void,
  toast: (opts: any) => void,
) {
  const subject = `[NeuroPed] ${scaleName} — ${new Date().toLocaleDateString("pt-BR")}`;

  try {
    const outcome = await openEmailDraft({
      to: EMAIL_TO,
      subject,
      body: reportText,
      filename: `${safeTextFilename(scaleName)}-respostas`,
    });
    setSent(true);
    play1Up();
    toast({
      title: "✉️ Email aberto",
      description:
        outcome === "inline"
          ? "Seu app de email foi aberto com o relatório. Envie para completar."
          : outcome === "copied-and-downloaded"
            ? "Relatório integral copiado e baixado. Anexe o arquivo no email aberto."
            : "Relatório integral baixado. Anexe o arquivo no email aberto.",
    });
  } catch {
    toast({
      title: "Copie o texto",
      description:
        "Não foi possível enviar. Use o botão Copiar e cole no email.",
      variant: "destructive",
    });
  }
}

function generateReportText(props: NormalizedReport): string {
  return `${buildScaleResponseText(props)}\n---\n${PROFESSIONAL_SIGNATURE.name} — ${PROFESSIONAL_SIGNATURE.specialty}\n${PROFESSIONAL_SIGNATURE.registry}\n${PROFESSIONAL_SIGNATURE.service}\n`;
}

function buildPrintHtml(props: NormalizedReport) {
  return buildScaleResponsePrintHtml(props, PROFESSIONAL_SIGNATURE);
}

export function ClinicalReport(rawProps: ClinicalReportProps) {
  const props = normalizeReportProps(rawProps);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const reportText = generateReportText(props);
  const reportReady = Boolean(props.scaleName && props.items.length > 0);

  async function handleCopy() {
    try {
      const copiedSuccessfully = await copyText(reportText);
      if (!copiedSuccessfully) throw new Error("clipboard unavailable");
      setCopied(true);
      softSuccess();
      haptic.success();
      toast({
        title: "Copiado!",
        description:
          "Relatório completo copiado, incluindo todas as respostas.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar. Tente novamente.",
        variant: "destructive",
      });
    }
  }

  function handlePrint() {
    if (!reportReady) {
      toast({
        title: "Relatório incompleto",
        description: "Finalize as respostas antes de imprimir.",
        variant: "destructive",
      });
      return;
    }

    const html = buildPrintHtml(props);

    // Impressão via iframe OCULTO na própria página — não depende de window.open,
    // que é bloqueado por pop-up blockers (sobretudo no celular) e era a causa de
    // "a tela trava e não gera PDF". O diálogo nativo permite "Salvar como PDF".
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        // Fallback raríssimo: nova aba (pode pedir liberação de pop-up).
        const w = window.open("", "_blank");
        if (w) {
          w.opener = null;
          w.document.write(html);
          w.document.close();
          w.onload = () => w.print();
        }
        iframe.remove();
        return;
      }
      win.focus();
      win.print();
      // Remove o iframe depois que o diálogo de impressão é fechado.
      const cleanup = () => setTimeout(() => iframe.remove(), 500);
      win.onafterprint = cleanup;
      setTimeout(cleanup, 60000); // garantia: remove mesmo se onafterprint não disparar
    };

    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }

    softBell();
    haptic.notify();
    toast({
      title: "PDF / Impressão",
      description:
        "Diálogo de impressão aberto. Escolha “Salvar como PDF” para gerar o arquivo com todas as respostas.",
    });
  }

  async function handleSendWhatsApp() {
    if (!reportReady) {
      toast({
        title: "Relatório incompleto",
        description: "Finalize a escala antes de encaminhar pelo WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    const outcome = await shareWhatsAppDocument({
      title: `${props.scaleName} — respostas completas`,
      text: reportText,
      filename: `${props.scaleName}-respostas-completas`,
    });
    if (outcome === "cancelled") return;
    if (outcome === "failed") {
      toast({
        title: "Não foi possível compartilhar",
        description:
          "Use Copiar texto ou Gerar PDF para preservar todas as respostas.",
        variant: "destructive",
      });
      return;
    }
    softSuccess();
    haptic.success();
    toast({
      title:
        outcome === "opened-whatsapp"
          ? "WhatsApp aberto"
          : "Compartilhamento aberto",
      description:
        outcome === "shared-file"
          ? "Escolha o WhatsApp para enviar o arquivo com todas as perguntas e respostas."
          : outcome === "shared-text"
            ? "Escolha o WhatsApp para enviar todas as perguntas e respostas por extenso."
            : "O WhatsApp foi aberto com o relatório integral pronto para encaminhar.",
    });
  }

  function handleDownload() {
    downloadTextDocument(
      reportText,
      `${safeTextFilename(props.scaleName)}-respostas-completas.txt`,
    );
    toast({
      title: "Arquivo baixado",
      description:
        "O arquivo contém todas as perguntas e respostas por extenso.",
    });
  }

  async function handleSendEmail() {
    if (!reportReady) {
      toast({
        title: "Relatório incompleto",
        description: "Não há conteúdo clínico suficiente para enviar.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    await sendEmail(props.scaleName, reportText, setSent, toast);
    setSending(false);
  }

  return (
    <motion.div
      data-scale-response-report
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: duration.normal,
        ease: easing.smooth,
        delay: 0.1,
      }}
    >
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h3
              className="text-base text-foreground"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Registro Completo de Respostas
            </h3>
            {sent && (
              <Badge className="bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Email preparado
              </Badge>
            )}
          </div>

          <p className="rounded-lg border border-border/70 bg-background/70 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Ao finalizar a escala, este bloco permite gerar PDF, imprimir,
            copiar ou encaminhar pelo WhatsApp o relatório com{" "}
            <strong className="text-foreground">todas as respostas</strong>.
          </p>

          {reportReady && (
            <section
              aria-labelledby="scale-response-list-title"
              className="space-y-3"
            >
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/70 pb-2">
                <div>
                  <h4
                    id="scale-response-list-title"
                    className="text-sm font-semibold text-foreground"
                  >
                    {props.scaleName}
                  </h4>
                  {props.scaleFullName && (
                    <p className="text-xs text-muted-foreground">
                      {props.scaleFullName}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {props.items.length}{" "}
                  {props.items.length === 1 ? "resposta" : "respostas"}
                </Badge>
              </div>

              <ol className="space-y-3">
                {props.items.map((item, index) => (
                  <li
                    key={`${index}-${item.question}`}
                    className="rounded-xl border border-border/70 bg-background p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-sm font-medium leading-relaxed text-foreground">
                          {item.question}
                        </p>
                        <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Resposta entregue
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-primary">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {!reportReady && (
            <div
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
              role="alert"
            >
              O registro só será gerado quando houver perguntas e respostas.
            </div>
          )}

          <Button
            onClick={handlePrint}
            className="h-12 w-full gap-3 bg-gradient-to-r from-primary to-chart-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:from-primary/90 hover:to-chart-2/90"
            disabled={!reportReady}
            data-testid="button-print-report"
          >
            <Printer className="h-5 w-5" />
            Gerar PDF / Imprimir Respostas Completas
          </Button>

          <Button
            onClick={handleSendWhatsApp}
            variant="outline"
            className="h-11 w-full gap-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
            disabled={!reportReady}
            data-testid="button-whatsapp-report"
          >
            <MessageCircle className="h-5 w-5" />
            Enviar relatório pelo WhatsApp / Zap
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-9 gap-2"
              data-testid="button-copy-report"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado" : "Copiar Texto"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!reportReady}
              className="h-9 gap-2"
              data-testid="button-download-report"
            >
              <Download className="h-4 w-4" />
              Baixar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              disabled={sending || sent || !reportReady}
              className="h-9 gap-2"
              data-testid="button-send-email"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : sent ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {sending ? "Preparando..." : sent ? "Preparado" : "Email"}
            </Button>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-xs text-primary hover:underline">
              Ver relatório em texto
            </summary>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-background/80 p-3">
              <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-foreground">
                {reportText}
              </pre>
            </div>
          </details>

          {sent && (
            <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
              Email preparado para {EMAIL_TO}; confirme o envio no aplicativo de
              email.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-1 gap-2"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Refazer
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 gap-2"
                data-testid="button-home"
              >
                <Home className="h-3.5 w-3.5" />
                Início
              </Button>
            </Link>
            <Link href="/filtro">
              <Button
                size="sm"
                onClick={() => {
                  softTap();
                  haptic.tap();
                }}
                className="h-9 flex-1 gap-2 bg-gradient-to-r from-primary to-chart-2 text-white"
                data-testid="button-goto-filter"
              >
                Próxima Escala
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { generateReportText };
export type { ClinicalReportProps };
