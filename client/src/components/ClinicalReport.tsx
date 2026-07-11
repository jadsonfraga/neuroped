import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  FileText,
  Home,
  Loader2,
  Mail,
  Printer,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadarChart } from "@/components/RadarChart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";
import { softBell, softSuccess, softTap } from "@/lib/softSounds";
import { play1Up } from "@/lib/sounds";

const EMAIL_TO = "drjadsonfraga@proton.me";
const WHATSAPP_URL_LIMIT = 6500;

const PROFESSIONAL_SIGNATURE = {
  name: "Dr. Jadson Fraga Araújo Júnior",
  specialty: "Neuropediatra",
  registry: "CRM-PE 25227 · RQE 17756",
  service: "NeuroPed — Escalas de Neuropediatria",
};

interface DomainResult {
  domain: string;
  score: number;
  classification: string;
}

interface ReportItem {
  question: string;
  answer: string;
  value: number;
}

// API pública: aceita a forma canônica (scaleName/totalScore/items…) E a forma
// legada de relatório seccionado (title/sections) usada pelas páginas de teste
// direto. Os campos canônicos são opcionais; normalizeReportProps consolida.
interface ClinicalReportProps {
  scaleName?: string;
  scaleFullName?: string;
  totalScore?: number;
  maxScore?: number;
  classification?: string;
  description?: string;
  domainResults?: DomainResult[];
  items?: ReportItem[];
  patientAge?: string;
  /** Oculta escore/pontuação/classificação — relatório vira só perguntas+respostas. */
  hideScore?: boolean;
  // Forma legada (relatório por seções):
  title?: string;
  sections?: { title: string; content: string }[];
}

// Forma interna garantidamente completa consumida pelo render e helpers.
interface NormalizedReport {
  scaleName: string;
  scaleFullName?: string;
  totalScore: number;
  maxScore?: number;
  classification: string;
  description: string;
  domainResults?: DomainResult[];
  items: ReportItem[];
  patientAge?: string;
  hideScore: boolean;
}

function normalizeReportProps(p: ClinicalReportProps): NormalizedReport {
  const items: ReportItem[] =
    p.items ?? (p.sections ?? []).map((s) => ({ question: s.title, answer: s.content, value: 0 }));
  return {
    scaleName: p.scaleName ?? p.title ?? "Relatório",
    scaleFullName: p.scaleFullName,
    totalScore: p.totalScore ?? 0,
    maxScore: p.maxScore,
    classification: p.classification ?? "",
    description: p.description ?? "",
    domainResults: p.hideScore ? undefined : p.domainResults,
    items,
    patientAge: p.patientAge,
    hideScore: p.hideScore ?? false,
  };
}

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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
      to: EMAIL_TO,
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
    // location.href abre o app de email sem criar aba em branco (window.open
    // em "_blank" deixava uma aba vazia quando não há cliente de email).
    window.location.href = mailtoUrl;
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

function generateInterpretation(props: NormalizedReport): string {
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
  const dateStr = formatDate();

  let text = "";
  text += "RELATÓRIO DE AVALIAÇÃO CLÍNICA\n";
  text += `Escala: ${scaleName}${scaleFullName ? ` (${scaleFullName})` : ""}\n`;
  text += `Data da aplicação: ${dateStr}\n`;
  if (patientAge) text += `Faixa etária do paciente: ${patientAge}\n`;
  text += "\n";

  if (props.hideScore) {
    text += "REGISTRO DE RESPOSTAS\n";
    text += `${description || "Transcrição por extenso das perguntas e respostas selecionadas — sem escore ou classificação."}\n\n`;
  } else {
    text += "RESULTADO GERAL\n";
    text += `Pontuação total: ${totalScore}${maxScore ? ` de ${maxScore} pontos possíveis` : ""}\n`;
    text += `Classificação: ${classification}\n`;
    text += `Interpretação: ${description}\n\n`;
  }

  if (!props.hideScore && domainResults && domainResults.length > 0) {
    text += "RESULTADOS POR DOMÍNIO\n";
    domainResults.forEach((dr) => {
      text += `- ${dr.domain}: ${dr.score} pontos — ${dr.classification}\n`;
    });
    text += "\n";
  }

  text += "PERGUNTAS E RESPOSTAS\n";
  text += props.hideScore
    ? "Cada item com a resposta selecionada, por extenso.\n\n"
    : "A seguir, são apresentados todos os itens respondidos, com a resposta selecionada e o valor atribuído.\n\n";
  items.forEach((item, i) => {
    text += `${i + 1}. ${item.question}\n`;
    text += props.hideScore
      ? `   Resposta: ${item.answer}\n`
      : `   Resposta: ${item.answer} (valor: ${item.value})\n`;
  });
  text += "\n";

  const maxVal = Math.max(2, ...items.map((i) => i.value));
  const highItems = items.filter((it) => it.value >= maxVal * 0.75 && it.value > 0);
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
  text += `---\n${PROFESSIONAL_SIGNATURE.name} — ${PROFESSIONAL_SIGNATURE.specialty}\n${PROFESSIONAL_SIGNATURE.registry}\n${PROFESSIONAL_SIGNATURE.service}\n`;

  return text;
}

function buildWhatsAppText(reportText: string): string {
  if (reportText.length <= WHATSAPP_URL_LIMIT) return reportText;
  return `${reportText.slice(0, WHATSAPP_URL_LIMIT)}\n\n[Relatório completo copiado para a área de transferência. Cole manualmente no WhatsApp para encaminhar todas as respostas.]`;
}

function buildPrintHtml(props: NormalizedReport) {
  const dateStr = formatDate();
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
    .section { margin-bottom: 18px; }
    .section h2 { font-size: 12pt; color: #6d28d9; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .result-box { background: #f3f0ff; border-left: 4px solid #6d28d9; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px; }
    .score { font-size: 20pt; font-weight: bold; color: #6d28d9; }
    .label { font-size: 9pt; color: #555; }
    .classification { font-size: 12pt; font-weight: bold; color: #1a1a1a; margin-top: 4px; }
    .domain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .domain-item { background: #faf9ff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 12px; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .items-table th { background: #6d28d9; color: white; padding: 6px 10px; text-align: left; }
    .items-table td { padding: 5px 10px; border-bottom: 1px solid #eee; }
    .items-table tr:nth-child(even) { background: #faf9ff; }
    .items-table .high { background: #fef3c7; font-weight: bold; }
    .narrative { text-align: justify; }
    .footer { margin-top: 30px; border-top: 2px solid #6d28d9; padding-top: 12px; font-size: 8.5pt; color: #555; display: flex; justify-content: space-between; gap: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="doc-title">${PROFESSIONAL_SIGNATURE.name}</div>
      <div class="doc-subtitle">${PROFESSIONAL_SIGNATURE.specialty}</div>
      <div class="doc-crm">${PROFESSIONAL_SIGNATURE.registry}</div>
    </div>
    <div class="header-right">
      <div class="scale-name">${escapeHtml(props.scaleName)}${props.scaleFullName ? ` (${escapeHtml(props.scaleFullName)})` : ""}</div>
      <div class="scale-meta">Data: ${dateStr}</div>
      ${props.patientAge ? `<div class="scale-meta">Faixa etária: ${escapeHtml(props.patientAge)}</div>` : ""}
    </div>
  </div>

  <div class="section">
    <h2>${props.hideScore ? "Registro de respostas" : "Resultado Geral"}</h2>
    ${props.hideScore ? "" : `<div class="result-box">
      <span class="score">${escapeHtml(props.totalScore)}</span>
      <span class="label">${props.maxScore ? ` / ${escapeHtml(props.maxScore)} pontos` : " pontos"}</span>
      <div class="classification">${escapeHtml(props.classification)}</div>
    </div>`}
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
    <div><strong>${PROFESSIONAL_SIGNATURE.service}</strong><br>Ferramenta de apoio clínico. Resultados devem ser interpretados no contexto clínico global.</div>
    <div>Emitido em ${dateStr}<br>${PROFESSIONAL_SIGNATURE.name}<br>${PROFESSIONAL_SIGNATURE.registry}</div>
  </div>
</body>
</html>`;
}

export function ClinicalReport(rawProps: ClinicalReportProps) {
  const props = normalizeReportProps(rawProps);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const reportText = generateInterpretation(props);
  const reportReady = Boolean(props.scaleName && props.items.length > 0);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      softSuccess();
      haptic.success();
      toast({ title: "Copiado!", description: "Relatório completo copiado, incluindo todas as respostas." });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar. Tente novamente.", variant: "destructive" });
    }
  }

  function handlePrint() {
    if (!reportReady) {
      toast({ title: "Relatório incompleto", description: "Responda a escala e gere uma interpretação antes de imprimir.", variant: "destructive" });
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
        if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
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
    toast({ title: "PDF / Impressão", description: "Diálogo de impressão aberto. Escolha “Salvar como PDF” para gerar o arquivo com todas as respostas." });
  }

  function handleSendWhatsApp() {
    if (!reportReady) {
      toast({ title: "Relatório incompleto", description: "Finalize a escala antes de encaminhar pelo WhatsApp.", variant: "destructive" });
      return;
    }

    navigator.clipboard.writeText(reportText).catch(() => undefined);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(reportText))}`;
    window.open(whatsappUrl, "_blank");
    softSuccess();
    haptic.success();
    toast({ title: "WhatsApp / Zap", description: "Relatório preparado. Se o texto vier cortado, cole o conteúdo copiado manualmente." });
  }

  async function handleSendEmail() {
    if (!reportReady) {
      toast({ title: "Relatório incompleto", description: "Não há conteúdo clínico suficiente para enviar.", variant: "destructive" });
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
      transition={{ duration: duration.normal, ease: easing.smooth, delay: 0.1 }}
    >
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h3 className="text-base text-foreground" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
              Relatório Clínico Completo
            </h3>
            {sent && <Badge className="bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Email preparado</Badge>}
          </div>

          <p className="rounded-lg border border-border/70 bg-background/70 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Ao finalizar a escala, este bloco permite gerar PDF, imprimir, copiar ou encaminhar pelo WhatsApp o relatório com <strong className="text-foreground">todas as respostas</strong>.
          </p>

          {props.domainResults && props.domainResults.length >= 3 && (
            <div className="py-2">
              <p className="mb-2 text-center text-[11px] text-muted-foreground">Perfil por Domínio</p>
              <RadarChart
                labels={props.domainResults.map((d) => d.domain)}
                values={props.domainResults.map((d) => {
                  const maxPossible = props.maxScore ? props.maxScore / props.domainResults!.length : 30;
                  return Math.min(100, Math.round((d.score / maxPossible) * 100));
                })}
                color="#7c3aed"
                size={220}
              />
            </div>
          )}

          {!reportReady && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200" role="alert">
              Relatório não será gerado sem escala, classificação, interpretação e respostas.
            </div>
          )}

          <Button onClick={handlePrint} className="h-12 w-full gap-3 bg-gradient-to-r from-primary to-chart-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:from-primary/90 hover:to-chart-2/90" disabled={!reportReady} data-testid="button-print-report">
            <Printer className="h-5 w-5" />
            Gerar PDF / Imprimir com Todas as Respostas
          </Button>

          <Button onClick={handleSendWhatsApp} variant="outline" className="h-11 w-full gap-3 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300" disabled={!reportReady} data-testid="button-whatsapp-report">
            <Mail className="h-5 w-5" />
            Encaminhar pelo WhatsApp / Zap
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="h-9 gap-2" data-testid="button-copy-report">
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar Texto"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={sending || sent || !reportReady} className="h-9 gap-2" data-testid="button-send-email">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : sent ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Mail className="h-4 w-4" />}
              {sending ? "Preparando..." : sent ? "Preparado" : "Email"}
            </Button>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-xs text-primary hover:underline">Ver relatório em texto</summary>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-background/80 p-3">
              <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-foreground">{reportText}</pre>
            </div>
          </details>

          {sent && (
            <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
              Email preparado para {EMAIL_TO}; confirme o envio no aplicativo de email.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-9 flex-1 gap-2" onClick={() => window.history.back()} data-testid="button-back">
              <RotateCcw className="h-3.5 w-3.5" />
              Refazer
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="h-9 flex-1 gap-2" data-testid="button-home">
                <Home className="h-3.5 w-3.5" />
                Início
              </Button>
            </Link>
            <Link href="/filtro">
              <Button size="sm" onClick={() => { softTap(); haptic.tap(); }} className="h-9 flex-1 gap-2 bg-gradient-to-r from-primary to-chart-2 text-white" data-testid="button-goto-filter">
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
