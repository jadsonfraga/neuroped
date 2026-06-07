import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Mail,
  Copy,
  CheckCircle2,
  Loader2,
  Printer,
  Home,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { play1Up } from "@/lib/sounds";
import { softSuccess, softTap, softBell } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { RadarChart } from "@/components/RadarChart";
import { motion } from "framer-motion";
import { easing, duration } from "@/lib/motion";

const EMAIL_TO = "jadsonfraga@hotmail.com";
const WHATSAPP_URL_LIMIT = 6500;

interface DomainResult {
  domain: string;
  score: number;
  classification: string;
}

interface ClinicalReportProps {
  scaleName: string;
  scaleFullName?: string;
  totalScore: number;
  maxScore?: number;
  classification: string;
  description: string;
  domainResults?: DomainResult[];
  items: { question: string; answer: string; value: number }[];
  patientAge?: string;
}

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail(
  scaleName: string,
  reportText: string,
  setSent: (v: boolean) => void,
  toast: (opts: any) => void,
) {
  const subject = `[NeuroPed] ${scaleName} — ${new Date().toLocaleDateString("pt-BR")}`;

  try {
    const res = await apiRequest("POST", "/api/send-report", {
      subject,
      body: reportText,
    });
    if (res.ok) {
      setSent(true);
      play1Up();
      toast({
        title: "✉️ Enviado",
        description: `Relatório enviado para ${EMAIL_TO}`,
      });
      return;
    }
  } catch {
    // Em app estático/offline, segue para fallback mailto.
  }

  try {
    const truncated =
      reportText.length > 1800
        ? `${reportText.slice(0, 1800)}\n\n[...relatório completo truncado por limite de mailto — use Copiar Texto para obter o relatório inteiro]`
        : reportText;
    const mailtoUrl = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`;
    window.open(mailtoUrl, "_blank");
    setSent(true);
    toast({
      title: "✉️ Email aberto",
      description: "Seu app de email foi aberto com o relatório. Envie para completar.",
    });
  } catch {
    toast({
      title: "Copie o texto",
      description: "Não foi possível enviar. Use o botão Copiar e cole no email.",
      variant: "destructive",
    });
  }
}

function generateInterpretation(props: ClinicalReportProps): string {
  const {
    scaleName,
    scaleFullName,
    totalScore,
    maxScore,
    classification,
    description,
    domainResults,
    items,
    patientAge,
  } = props;
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  let text = "";
  text += "RELATÓRIO DE AVALIAÇÃO CLÍNICA\n";
  text += `Escala: ${scaleName}${scaleFullName ? ` (${scaleFullName})` : ""}\n`;
  text += `Data da aplicação: ${dateStr}\n`;
  if (patientAge) text += `Faixa etária do paciente: ${patientAge}\n`;
  text += "\n";

  text += "RESULTADO GERAL\n";
  text += `Pontuação total: ${totalScore}${maxScore ? ` de ${maxScore} pontos possíveis` : ""}\n`;
  text += `Classificação: ${classification}\n`;
  text += `Interpretação: ${description}\n\n`;

  if (domainResults && domainResults.length > 0) {
    text += "RESULTADOS POR DOMÍNIO\n";
    domainResults.forEach((dr) => {
      text += `- ${dr.domain}: ${dr.score} pontos — ${dr.classification}\n`;
    });
    text += "\n";
  }

  text += "DETALHAMENTO DAS RESPOSTAS\n";
  text += "A seguir, são apresentados todos os itens respondidos, com a resposta selecionada e o valor atribuído.\n\n";
  items.forEach((item, i) => {
    text += `Item ${i + 1}: ${item.question}\n`;
    text += `  Resposta: ${item.answer} (valor: ${item.value})\n`;
  });
  text += "\n";

  const highItems = items.filter((it) => {
    const maxVal = Math.max(2, ...items.map((i) => i.value));
    return it.value >= maxVal * 0.75 && it.value > 0;
  });

  if (highItems.length > 0) {
    text += "ITENS COM PONTUAÇÃO ELEVADA\n\n";
    highItems.forEach((item) => {
      text += `- "${item.question}" — Resposta: ${item.answer} (${item.value} pontos)\n`;
    });
    text += "\n";
  }

  text += "OBSERVAÇÕES\n\n";
  text += "Este relatório foi gerado pela plataforma NeuroPed — Escalas de Neuropediatria. ";
  text += "Os resultados devem ser interpretados no contexto clínico global do paciente, considerando anamnese, exame neurológico, exames complementares e avaliação multidisciplinar. ";
  text += "O diagnóstico clínico não deve se basear exclusivamente em pontuações de escalas.\n\n";
  text += "---\nDr. Jadson Fraga — Neuropediatra\nNeuroPed — Escalas de Neuropediatria\n";

  return text;
}

function buildPrintableReport(props: ClinicalReportProps): string {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const maxVal = Math.max(2, ...props.items.map((it) => it.value));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${escapeHtml(props.scaleName)} — ${dateStr}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #6d28d9; padding-bottom: 14px; margin-bottom: 20px; gap: 16px; }
    .doc-title { font-size: 15pt; font-weight: bold; color: #6d28d9; line-height: 1.2; }
    .doc-subtitle { font-size: 10pt; color: #444; margin-top: 2px; }
    .doc-crm { font-size: 8.5pt; color: #666; margin-top: 6px; }
    .header-right { text-align: right; flex-shrink: 0; }
    .scale-name { font-size: 11pt; font-weight: bold; color: #1a1a1a; }
    .scale-meta { font-size: 9pt; color: #666; margin-top: 2px; }
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section h2 { font-size: 12pt; color: #6d28d9; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .result-box { background: #f3f0ff; border-left: 4px solid #6d28d9; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px; }
    .score { font-size: 20pt; font-weight: bold; color: #6d28d9; }
    .label { font-size: 9pt; color: #555; }
    .classification { font-size: 12pt; font-weight: bold; color: #1a1a1a; margin-top: 4px; }
    .domain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .domain-item { background: #faf9ff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 12px; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 9pt; page-break-inside: auto; }
    .items-table th { background: #6d28d9; color: white; padding: 6px 10px; text-align: left; }
    .items-table td { padding: 5px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    .items-table tr { page-break-inside: avoid; page-break-after: auto; }
    .items-table tr:nth-child(even) { background: #faf9ff; }
    .items-table .high { background: #fef3c7; font-weight: bold; }
    .narrative { text-align: justify; }
    .footer { margin-top: 30px; border-top: 2px solid #6d28d9; padding-top: 12px; font-size: 8.5pt; color: #555; display: flex; justify-content: space-between; gap: 12px; }
    .print-note { margin: 0 0 14px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 9pt; color: #475569; }
    @media print { .print-note { display: none; } }
  </style>
</head>
<body>
  <div class="print-note">Use a opção "Salvar como PDF" no diálogo de impressão para gerar o arquivo em PDF. Este relatório inclui todas as respostas registradas.</div>
  <div class="header">
    <div>
      <div class="doc-title">Dr. Jadson Fraga Araújo Júnior</div>
      <div class="doc-subtitle">Neuropediatra | Especialista em Neurologia Infantil e Psiquiatria da Infância e Adolescência</div>
      <div class="doc-crm">CRM-PE 25227 &nbsp;|&nbsp; CRM-BA 23384 &nbsp;|&nbsp; RQE 17756 / 14499 / 13119</div>
    </div>
    <div class="header-right">
      <div class="scale-name">${escapeHtml(props.scaleName)}${props.scaleFullName ? ` (${escapeHtml(props.scaleFullName)})` : ""}</div>
      <div class="scale-meta">Data: ${dateStr}</div>
      ${props.patientAge ? `<div class="scale-meta">Faixa etária: ${escapeHtml(props.patientAge)}</div>` : ""}
    </div>
  </div>

  <div class="section">
    <h2>Resultado Geral</h2>
    <div class="result-box">
      <span class="score">${escapeHtml(props.totalScore)}</span>
      <span class="label">${props.maxScore ? ` / ${escapeHtml(props.maxScore)} pontos` : " pontos"}</span>
      <div class="classification">${escapeHtml(props.classification)}</div>
    </div>
    <p class="narrative">${escapeHtml(props.description)}</p>
  </div>

  ${props.domainResults && props.domainResults.length > 0 ? `
  <div class="section">
    <h2>Resultados por Domínio</h2>
    <div class="domain-grid">
      ${props.domainResults.map((dr) => `<div class="domain-item"><strong>${escapeHtml(dr.domain)}</strong><br>${escapeHtml(dr.score)} pts — ${escapeHtml(dr.classification)}</div>`).join("")}
    </div>
  </div>` : ""}

  <div class="section">
    <h2>Detalhamento de Todas as Respostas</h2>
    <table class="items-table">
      <thead><tr><th>#</th><th>Item</th><th>Resposta</th><th>Valor</th></tr></thead>
      <tbody>
        ${props.items.map((item, i) => {
          const isHigh = item.value >= maxVal * 0.75 && item.value > 0;
          return `<tr class="${isHigh ? "high" : ""}"><td>${i + 1}</td><td>${escapeHtml(item.question)}</td><td>${escapeHtml(item.answer)}</td><td>${escapeHtml(item.value)}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Observações</h2>
    <p class="narrative">Este relatório foi gerado pela plataforma NeuroPed — Escalas de Neuropediatria. Os resultados devem ser interpretados no contexto clínico global do paciente, considerando anamnese, exame neurológico, exames complementares e avaliação multidisciplinar. O diagnóstico clínico não deve se basear exclusivamente em pontuações de escalas.</p>
  </div>

  <div class="footer">
    <div><strong>NeuroPed — Escalas de Neuropediatria</strong><br>Ferramenta educacional. Resultados devem ser interpretados no contexto clínico global.</div>
    <div>Emitido em ${dateStr}<br>Dr. Jadson Fraga</div>
  </div>
</body>
</html>`;
}

async function copyReportToClipboard(reportText: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(reportText);
    return true;
  } catch {
    return false;
  }
}

function buildWhatsappUrl(reportText: string): string {
  const text = reportText.length > WHATSAPP_URL_LIMIT
    ? `${reportText.slice(0, WHATSAPP_URL_LIMIT)}\n\n[Relatório completo copiado para a área de transferência. Cole no WhatsApp para encaminhar todas as respostas.]`
    : reportText;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function ClinicalReport(props: ClinicalReportProps) {
  const [sending, setSending] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const reportText = generateInterpretation(props);
  const reportReady = Boolean(
    props.scaleName &&
      props.classification &&
      props.description &&
      props.items.length > 0,
  );

  async function handleCopy() {
    const ok = await copyReportToClipboard(reportText);
    if (ok) {
      setCopied(true);
      softSuccess();
      haptic.success();
      toast({
        title: "Copiado!",
        description: "Relatório completo copiado, incluindo todas as respostas.",
      });
      setTimeout(() => setCopied(false), 3000);
      return;
    }
    toast({
      title: "Erro",
      description: "Não foi possível copiar. Tente novamente.",
      variant: "destructive",
    });
  }

  function handlePrint() {
    if (!reportReady) {
      toast({
        title: "Relatório incompleto",
        description: "Responda a escala e gere uma interpretação antes de imprimir.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(buildPrintableReport(props));
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    softBell();
    haptic.notify();
    toast({
      title: "PDF / Impressão",
      description: "Janela aberta. Escolha imprimir ou Salvar como PDF; todas as respostas estão incluídas.",
    });
  }

  async function handleSendWhatsApp() {
    if (!reportReady) {
      toast({
        title: "Relatório incompleto",
        description: "Não há respostas suficientes para encaminhar pelo WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    setSharingWhatsApp(true);
    const copiedFullReport = await copyReportToClipboard(reportText);

    try {
      const nav = navigator as Navigator & {
        share?: (data: { title?: string; text?: string }) => Promise<void>;
      };
      if (nav.share) {
        await nav.share({
          title: `NeuroPed — ${props.scaleName}`,
          text: reportText,
        });
        softSuccess();
        haptic.success();
        toast({
          title: "Compartilhamento aberto",
          description: "Escolha WhatsApp para encaminhar o relatório completo.",
        });
        setSharingWhatsApp(false);
        return;
      }
    } catch {
      // Se o usuário cancelar ou o navegador bloquear, segue para fallback por wa.me.
    }

    try {
      window.open(buildWhatsappUrl(reportText), "_blank");
      softSuccess();
      haptic.success();
      toast({
        title: "WhatsApp aberto",
        description: copiedFullReport
          ? "O relatório completo também foi copiado para colar no WhatsApp, se necessário."
          : "WhatsApp aberto com o relatório. Se faltar texto, use Copiar Texto.",
      });
    } catch {
      toast({
        title: "Não foi possível abrir o WhatsApp",
        description: copiedFullReport
          ? "O relatório completo foi copiado. Cole manualmente no WhatsApp."
          : "Use o botão Copiar Texto e cole manualmente no WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setSharingWhatsApp(false);
    }
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: duration.normal,
        ease: easing.smooth,
        delay: 0.1,
      }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" strokeWidth={1.75} />
            <h3
              className="text-base text-foreground"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Relatório Clínico Completo
            </h3>
            {sent && (
              <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Email preparado
              </Badge>
            )}
          </div>

          <p className="rounded-lg border border-border/70 bg-background/70 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Ao finalizar a escala, este bloco gera relatório com <strong className="text-foreground">todas as respostas</strong>. Para PDF, escolha <strong className="text-foreground">Salvar como PDF</strong> na janela de impressão. Para WhatsApp, use o botão Zap/WhatsApp abaixo.
          </p>

          {props.domainResults && props.domainResults.length >= 3 && (
            <div className="py-2">
              <p className="text-[11px] text-muted-foreground text-center mb-2">
                Perfil por Domínio
              </p>
              <RadarChart
                labels={props.domainResults.map((d) => d.domain)}
                values={props.domainResults.map((d) => {
                  const maxPossible = props.maxScore
                    ? props.maxScore / props.domainResults!.length
                    : 30;
                  return Math.min(100, Math.round((d.score / maxPossible) * 100));
                })}
                color="#7c3aed"
                size={220}
              />
            </div>
          )}

          {!reportReady && (
            <div
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
              role="alert"
            >
              Relatório não será gerado sem escala, classificação, interpretação e respostas.
            </div>
          )}

          <Button
            onClick={handlePrint}
            className="w-full h-12 gap-3 bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-white shadow-lg shadow-primary/20 text-sm font-semibold"
            disabled={!reportReady}
            data-testid="button-print-report"
          >
            <Printer className="w-5 h-5" />
            Gerar PDF / Imprimir com Todas as Respostas
          </Button>

          <Button
            onClick={handleSendWhatsApp}
            variant="outline"
            className="w-full h-11 gap-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
            disabled={!reportReady || sharingWhatsApp}
            data-testid="button-whatsapp-report"
          >
            {sharingWhatsApp ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MessageCircle className="w-5 h-5" />
            )}
            {sharingWhatsApp ? "Preparando WhatsApp..." : "Encaminhar pelo WhatsApp / Zap"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 h-9"
              data-testid="button-copy-report"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copiado" : "Copiar Texto"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              disabled={sending || sent || !reportReady}
              className="gap-2 h-9"
              data-testid="button-send-email"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : sent ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {sending ? "Preparando..." : sent ? "Preparado" : "Email"}
            </Button>
          </div>

          <details className="group">
            <summary className="text-xs text-primary cursor-pointer hover:underline">
              Ver relatório em texto
            </summary>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-background/80 border border-border p-3">
              <pre className="text-[11px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {reportText}
              </pre>
            </div>
          </details>

          {sent && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
              Email preparado para jadsonfraga@hotmail.com; confirme o envio no aplicativo de email.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-9"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refazer
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2 h-9"
                data-testid="button-home"
              >
                <Home className="w-3.5 h-3.5" />
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
                className="flex-1 gap-2 h-9 bg-gradient-to-r from-primary to-chart-2 text-white"
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

export { generateInterpretation };
export type { ClinicalReportProps };
