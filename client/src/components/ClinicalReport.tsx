import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Copy, CheckCircle2, Loader2, Printer, Home, RotateCcw } from "lucide-react";
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

async function sendEmail(
  scaleName: string,
  reportText: string,
  setSent: (v: boolean) => void,
  toast: (opts: any) => void
) {
  const subject = `[NeuroPed] ${scaleName} \u2014 ${new Date().toLocaleDateString("pt-BR")}`;
  
  // Tentar via backend primeiro
  try {
    const res = await apiRequest("POST", "/api/send-report", { subject, body: reportText });
    if (res.ok) {
      setSent(true);
      play1Up();
      toast({ title: "\u2709\ufe0f Enviado", description: `Relat\u00f3rio enviado para ${EMAIL_TO}` });
      return;
    }
  } catch { /* intentional */ }

  // Fallback: abrir cliente de email com mailto
  try {
    const truncated = reportText.length > 1800 ? reportText.slice(0, 1800) + "\n\n[...relat\u00f3rio completo truncado por limite de mailto — use Copiar Texto para obter o relat\u00f3rio inteiro]" : reportText;
    const mailtoUrl = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`;
    window.open(mailtoUrl, "_blank");
    setSent(true);
    toast({ title: "\u2709\ufe0f Email aberto", description: "Seu app de email foi aberto com o relat\u00f3rio. Envie para completar." });
  } catch {
    toast({ title: "Copie o texto", description: "N\u00e3o foi poss\u00edvel enviar. Use o bot\u00e3o Copiar e cole no email.", variant: "destructive" });
  }
}

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

function generateInterpretation(props: ClinicalReportProps): string {
  const { scaleName, scaleFullName, totalScore, maxScore, classification, description, domainResults, items, patientAge } = props;
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  let text = "";
  text += `RELATÓRIO DE AVALIAÇÃO CLÍNICA\n`;
  text += `Escala: ${scaleName}${scaleFullName ? ` (${scaleFullName})` : ""}\n`;
  text += `Data da aplicação: ${dateStr}\n`;
  if (patientAge) text += `Faixa etária do paciente: ${patientAge}\n`;
  text += `\n`;

  text += `RESULTADO GERAL\n`;
  text += `Pontuação total: ${totalScore}${maxScore ? ` de ${maxScore} pontos possíveis` : ""}\n`;
  text += `Classificação: ${classification}\n`;
  text += `Interpretação: ${description}\n`;
  text += `\n`;

  if (domainResults && domainResults.length > 0) {
    text += `RESULTADOS POR DOMÍNIO\n`;
    domainResults.forEach(dr => {
      text += `- ${dr.domain}: ${dr.score} pontos — ${dr.classification}\n`;
    });
    text += `\n`;
  }

  text += `DETALHAMENTO DAS RESPOSTAS\n`;
  text += `A seguir, são apresentados todos os itens respondidos na avaliação, com a resposta selecionada e o valor atribuído.\n\n`;

  items.forEach((item, i) => {
    text += `Item ${i + 1}: ${item.question}\n`;
    text += `  Resposta: ${item.answer} (valor: ${item.value})\n`;
  });
  text += `\n`;

  // Detailed clinical narrative
  text += `INTERPRETAÇÃO CLÍNICA DETALHADA\n\n`;

  text += `A aplicação da ${scaleName} resultou em uma pontuação total de ${totalScore}`;
  if (maxScore) text += ` em um total máximo de ${maxScore} pontos`;
  text += `, o que corresponde à classificação "${classification}". `;
  text += `${description}\n\n`;

  if (domainResults && domainResults.length > 0) {
    text += `Na análise por domínios, observou-se o seguinte perfil:\n\n`;
    domainResults.forEach(dr => {
      text += `No domínio "${dr.domain}", a pontuação obtida foi de ${dr.score} pontos, classificada como "${dr.classification}". `;
      const severity = dr.classification.toLowerCase();
      if (severity.includes("normal") || severity.includes("típic") || severity.includes("baixo risco") || severity.includes("adequad")) {
        text += `Este resultado sugere funcionamento dentro dos parâmetros esperados para este domínio, sem indicativos de comprometimento significativo. `;
      } else if (severity.includes("leve") || severity.includes("borderline") || severity.includes("limítrofe") || severity.includes("risco")) {
        text += `Este resultado sugere a presença de dificuldades leves a moderadas neste domínio, que merecem acompanhamento e reavaliação. Recomenda-se monitorização clínica e eventual encaminhamento para avaliação complementar. `;
      } else if (severity.includes("moderado") || severity.includes("moder")) {
        text += `Este resultado indica comprometimento moderado neste domínio, sugerindo necessidade de intervenção terapêutica direcionada e acompanhamento especializado. `;
      } else if (severity.includes("grave") || severity.includes("alto") || severity.includes("clínico") || severity.includes("significativ") || severity.includes("elevad")) {
        text += `Este resultado indica comprometimento significativo neste domínio, sinalizando necessidade de intervenção imediata e acompanhamento multidisciplinar intensivo. `;
      }
      text += `\n`;
    });
    text += `\n`;
  }

  // Highlight items with high scores
  const highItems = items.filter(it => {
    const maxVal = Math.max(2, ...items.map(i => i.value));
    return it.value >= maxVal * 0.75 && it.value > 0;
  });

  if (highItems.length > 0) {
    text += `ITENS COM PONTUAÇÃO ELEVADA\n\n`;
    text += `Os seguintes itens receberam pontuação elevada, indicando áreas de maior preocupação clínica:\n\n`;
    highItems.forEach(item => {
      text += `- "${item.question}" — Resposta: ${item.answer} (${item.value} pontos)\n`;
    });
    text += `\n`;
    text += `Estes itens devem ser considerados prioritariamente no planejamento terapêutico e na orientação aos cuidadores.\n\n`;
  }

  // Zero/low items
  const lowItems = items.filter(it => it.value === 0);
  if (lowItems.length > 0 && lowItems.length < items.length) {
    text += `ÁREAS DE FUNCIONAMENTO PRESERVADO\n\n`;
    text += `${lowItems.length} de ${items.length} itens receberam pontuação zero, sugerindo funcionamento preservado nas seguintes áreas:\n`;
    lowItems.slice(0, 10).forEach(item => {
      text += `- "${item.question}"\n`;
    });
    if (lowItems.length > 10) text += `  ... e mais ${lowItems.length - 10} itens.\n`;
    text += `\n`;
  }

  text += `OBSERVAÇÕES\n\n`;
  text += `Este relatório foi gerado automaticamente pela plataforma NeuroPed — Escalas de Neuropediatria, `;
  text += `ferramenta educacional desenvolvida pelo Dr. Jadson Fraga (Neuropediatra). `;
  text += `Os resultados apresentados devem ser interpretados no contexto clínico global do paciente, `;
  text += `considerando a anamnese, o exame neurológico, os exames complementares e a avaliação multidisciplinar. `;
  text += `O diagnóstico clínico não deve se basear exclusivamente em pontuações de escalas.\n\n`;
  text += `---\nDr. Jadson Fraga — Neuropediatra\nNeuroPed — Escalas de Neuropediatria\n`;

  return text;
}

export function ClinicalReport(props: ClinicalReportProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const autoSentRef = useRef(false);

  const reportText = generateInterpretation(props);

  // Envio automático ao montar (quando resultado é exibido)
  useEffect(() => {
    if (autoSentRef.current) return;
    autoSentRef.current = true;
    sendEmail(props.scaleName, reportText, setSent, toast);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      softSuccess();
      haptic.success();
      toast({ title: "Copiado!", description: "Relatório copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar. Tente novamente.", variant: "destructive" });
    }
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Erro", description: "Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.", variant: "destructive" });
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${props.scaleName} — ${dateStr}</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
      @bottom-center {
        content: "Página " counter(page) " de " counter(pages);
        font-size: 8pt;
        color: #888;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; padding: 0; }

    /* ── Cabeçalho institucional ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 3px solid #6d28d9;
      padding-bottom: 14px;
      margin-bottom: 20px;
      gap: 16px;
    }
    .header-left { flex: 1; }
    .header-left .doc-title { font-size: 15pt; font-weight: bold; color: #6d28d9; line-height: 1.2; }
    .header-left .doc-subtitle { font-size: 10pt; color: #444; margin-top: 2px; }
    .header-left .doc-crm { font-size: 8.5pt; color: #666; margin-top: 6px; }
    .header-right { text-align: right; flex-shrink: 0; }
    .header-right .scale-name { font-size: 11pt; font-weight: bold; color: #1a1a1a; }
    .header-right .scale-meta { font-size: 9pt; color: #666; margin-top: 2px; }

    .section { margin-bottom: 18px; }
    .section h2 { font-size: 12pt; color: #6d28d9; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .result-box { background: #f3f0ff; border-left: 4px solid #6d28d9; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px; }
    .result-box .score { font-size: 20pt; font-weight: bold; color: #6d28d9; }
    .result-box .label { font-size: 9pt; color: #555; }
    .result-box .classification { font-size: 12pt; font-weight: bold; color: #1a1a1a; margin-top: 4px; }
    .domain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .domain-item { background: #faf9ff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 12px; }
    .domain-item .name { font-weight: bold; font-size: 10pt; }
    .domain-item .detail { font-size: 9pt; color: #555; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .items-table th { background: #6d28d9; color: white; padding: 6px 10px; text-align: left; }
    .items-table td { padding: 5px 10px; border-bottom: 1px solid #eee; }
    .items-table tr:nth-child(even) { background: #faf9ff; }
    .items-table .high { background: #fef3c7; font-weight: bold; }
    .narrative { text-align: justify; }

    /* ── Rodapé ── */
    .footer {
      margin-top: 30px;
      border-top: 2px solid #6d28d9;
      padding-top: 12px;
      font-size: 8.5pt;
      color: #555;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }
    .footer-left { flex: 1; }
    .footer-left .doc-name { font-size: 10pt; font-weight: bold; color: #1a1a1a; }
    .footer-left .doc-info { margin-top: 2px; }
    .footer-right { text-align: right; font-size: 8pt; color: #777; }

    @media print {
      body { padding: 0; }
      .footer { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="doc-title">Dr. Jadson Fraga Araújo Júnior</div>
      <div class="doc-subtitle">Neuropediatra | Especialista em Neurologia Infantil e Psiquiatria da Infância e Adolescência</div>
      <div class="doc-crm">CRM-PE 25227 &nbsp;|&nbsp; CRM-BA 23384 &nbsp;|&nbsp; RQE 17756 / 14499 / 13119</div>
    </div>
    <div class="header-right">
      <div class="scale-name">${props.scaleName}${props.scaleFullName ? ` (${props.scaleFullName})` : ""}</div>
      <div class="scale-meta">Data: ${dateStr}</div>
      ${props.patientAge ? `<div class="scale-meta">Faixa etária: ${props.patientAge}</div>` : ""}
    </div>
  </div>

  <div class="section">
    <h2>Resultado Geral</h2>
    <div class="result-box">
      <span class="score">${props.totalScore}</span>
      <span class="label">${props.maxScore ? ` / ${props.maxScore} pontos` : " pontos"}</span>
      <div class="classification">${props.classification}</div>
    </div>
    <p class="narrative">${props.description}</p>
  </div>

  ${props.domainResults && props.domainResults.length > 0 ? `
  <div class="section">
    <h2>Resultados por Domínio</h2>
    <div class="domain-grid">
      ${props.domainResults.map(dr => `
        <div class="domain-item">
          <div class="name">${dr.domain}</div>
          <div class="detail">${dr.score} pts — ${dr.classification}</div>
        </div>
      `).join("")}
    </div>
  </div>` : ""}

  <div class="section">
    <h2>Detalhamento das Respostas</h2>
    <table class="items-table">
      <thead><tr><th>#</th><th>Item</th><th>Resposta</th><th>Valor</th></tr></thead>
      <tbody>
        ${props.items.map((item, i) => {
          const maxVal = Math.max(2, ...props.items.map(it => it.value));
          const isHigh = item.value >= maxVal * 0.75 && item.value > 0;
          return `<tr class="${isHigh ? "high" : ""}"><td>${i + 1}</td><td>${item.question}</td><td>${item.answer}</td><td>${item.value}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Interpretação Clínica Detalhada</h2>
    <p class="narrative">${props.description}</p>
    ${props.domainResults && props.domainResults.length > 0 ? `<p class="narrative" style="margin-top:10px;">Na análise por domínios: ${props.domainResults.map(dr => `${dr.domain} obteve ${dr.score} pontos (${dr.classification})`).join("; ")}.` : ""}
  </div>

  <div class="section">
    <h2>Observações</h2>
    <p class="narrative">Este relatório foi gerado pela plataforma NeuroPed — Escalas de Neuropediatria, ferramenta educacional desenvolvida pelo Dr. Jadson Fraga (Neuropediatra). Os resultados devem ser interpretados no contexto clínico global do paciente, considerando anamnese, exame neurológico, exames complementares e avaliação multidisciplinar. O diagnóstico clínico não deve se basear exclusivamente em pontuações de escalas.</p>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="doc-name">NeuroPed — Escalas de Neuropediatria</div>
      <div class="doc-info">Ferramenta educacional. Resultados devem ser interpretados no contexto clínico global.</div>
    </div>
    <div class="footer-right">
      Emitido em ${dateStr}<br>
      NeuroPed v2.0 · Dr. Jadson Fraga
    </div>
  </div>
</body>
</html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    softBell();
    haptic.notify();
    toast({ title: "Impressão", description: "Janela de impressão aberta." });
  }

  async function handleSendEmail() {
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
          {sent && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Enviado</Badge>}
        </div>

        {/* Gráfico Radar — visível quando há resultados por domínio */}
        {props.domainResults && props.domainResults.length >= 3 && (
          <div className="py-2">
            <p className="text-[11px] text-muted-foreground text-center mb-2">Perfil por Domínio</p>
            <RadarChart
              labels={props.domainResults.map(d => d.domain)}
              values={props.domainResults.map(d => {
                const maxPossible = props.maxScore ? (props.maxScore / props.domainResults!.length) : 30;
                return Math.min(100, Math.round((d.score / maxPossible) * 100));
              })}
              color="#7c3aed"
              size={220}
            />
          </div>
        )}

        {/* PDF / Print — botão principal grande */}
        <Button
          onClick={handlePrint}
          className="w-full h-12 gap-3 bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-white shadow-lg shadow-primary/20 text-sm font-semibold"
          data-testid="button-print-report"
        >
          <Printer className="w-5 h-5" />
          Gerar PDF / Imprimir Relatório
        </Button>

        {/* Ações secundárias */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 h-9"
            data-testid="button-copy-report"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado" : "Copiar Texto"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={sending || sent}
            className="gap-2 h-9"
            data-testid="button-send-email"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Mail className="w-4 h-4" />}
            {sending ? "Enviando..." : sent ? "Enviado" : "Email"}
          </Button>
        </div>

        {/* Preview colapsável */}
        <details className="group">
          <summary className="text-xs text-primary cursor-pointer hover:underline">Ver relatório em texto</summary>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-background/80 border border-border p-3">
            <pre className="text-[11px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {reportText}
            </pre>
          </div>
        </details>

        {sent && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
            Relatório enviado para jadsonfraga@hotmail.com
          </p>
        )}

        {/* Navegação pós-avaliação */}
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
              onClick={() => { softTap(); haptic.tap(); }}
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
