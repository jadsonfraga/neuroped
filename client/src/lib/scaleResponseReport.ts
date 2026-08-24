import { escapeHtml } from "./htmlEscape";
import { formatClinicalDateTime, formatClinicalLongDate } from "./clinicalDate";

export interface ScaleResponseItem {
  question: string;
  answer: string;
}

export interface ScaleResponseReport {
  scaleName: string;
  scaleFullName?: string;
  patientAge?: string;
  /** Instante em que a aplicação foi concluída, não o instante da exportação. */
  applicationDate?: string | Date;
  items: ScaleResponseItem[];
}

const ANALYSIS_SECTION =
  /(?:pontua(?:c|ç)[aã]o|escore|score|classifica(?:c|ç)[aã]o|interpreta(?:c|ç)[aã]o|s[ií]ntese|resultado geral|desempenho|percentual|n[ií]vel global)/i;

function clean(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

/**
 * O registro integral é uma transcrição literal da alternativa selecionada.
 * Não removemos prefixos, sufixos, códigos ou números do rótulo: qualquer
 * transformação aqui faria a tela/PDF divergir do que a família marcou.
 */
export function formatScaleResponseAnswer(value: unknown): string {
  return clean(value, "Não respondida");
}

export function responseItemsFromLegacySections(
  sections: Array<{ title: string; content: string }> = [],
): ScaleResponseItem[] {
  return sections
    .filter((section) => !ANALYSIS_SECTION.test(section.title))
    .map((section) => ({
      question: clean(section.title, "Item"),
      answer: formatScaleResponseAnswer(section.content),
    }));
}

export function normalizeScaleResponseItems(
  items: Array<{ question: string; answer: string }> = [],
): ScaleResponseItem[] {
  return items.map((item, index) => ({
    question: clean(item.question, `Pergunta ${index + 1}`),
    // O relatório deve repetir exatamente o rótulo selecionado, inclusive
    // códigos/prefixos que façam parte da opção original.
    answer: clean(item.answer, "Não respondida"),
  }));
}

export function formatScaleResponseDate(date = new Date()): string {
  return formatClinicalLongDate(date);
}

export function formatScaleResponseDateTime(
  date: string | Date = new Date(),
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "Data não informada";
  const dateLabel = formatClinicalLongDate(value);
  const timeLabel = formatClinicalDateTime(value).match(/\d{2}:\d{2}:\d{2}/)?.[0];
  return timeLabel ? `${dateLabel} às ${timeLabel}` : dateLabel;
}

export function buildScaleResponseText(
  report: ScaleResponseReport,
  date = new Date(),
): string {
  const items = normalizeScaleResponseItems(report.items);
  const applicationDate = report.applicationDate ?? date;
  let text = "REGISTRO INTEGRAL DE RESPOSTAS\n";
  text += `Escala: ${report.scaleName}${report.scaleFullName ? ` (${report.scaleFullName})` : ""}\n`;
  text += `Data da aplicação: ${formatScaleResponseDateTime(applicationDate)}\n`;
  if (report.patientAge) text += `Faixa etária: ${report.patientAge}\n`;
  text += `Itens registrados: ${items.length}\n\n`;
  text += "PERGUNTAS E RESPOSTAS\n\n";

  items.forEach((item, index) => {
    text += `${index + 1}. ${item.question}\n`;
    text += `   Resposta: ${item.answer}\n\n`;
  });

  text += "Registro descritivo para revisão do profissional responsável.\n";
  return text;
}

export function buildScaleResponsePrintHtml(
  report: ScaleResponseReport,
  professional: {
    name: string;
    specialty: string;
    registry: string;
    service: string;
  },
  date = new Date(),
): string {
  const items = normalizeScaleResponseItems(report.items);
  const applicationDate = report.applicationDate ?? date;
  const dateLabel = formatScaleResponseDateTime(applicationDate);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Respostas — ${escapeHtml(report.scaleName)}</title>
  <style>
    @page { margin: 1.7cm; size: A4; }
    :root { --doc-ink: #172033; --doc-accent: #243a62; --doc-muted: #526079; --doc-inverse: #fff; --doc-rule: #dce2ec; --doc-zebra: #f6f8fb; --doc-number: #667085; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.45; color: var(--doc-ink); }
    .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 3px solid var(--doc-accent); padding-bottom: 12px; margin-bottom: 18px; }
    .brand { font-size: 15pt; font-weight: 700; color: var(--doc-accent); }
    .meta { margin-top: 3px; color: var(--doc-muted); font-size: 8.5pt; }
    .scale { max-width: 48%; text-align: right; font-weight: 700; }
    h1 { margin: 0 0 4px; color: var(--doc-accent); font-size: 13pt; text-transform: uppercase; letter-spacing: .4px; }
    .summary { margin: 0 0 16px; color: var(--doc-muted); font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { padding: 7px 8px; background: var(--doc-accent); color: var(--doc-inverse); text-align: left; font-size: 8.5pt; }
    td { padding: 8px; border-bottom: 1px solid var(--doc-rule); vertical-align: top; overflow-wrap: anywhere; }
    tr:nth-child(even) td { background: var(--doc-zebra); }
    .number { width: 7%; text-align: center; color: var(--doc-number); }
    .question { width: 58%; }
    .answer { width: 35%; font-weight: 700; color: var(--doc-accent); }
    .footer { margin-top: 24px; border-top: 2px solid var(--doc-accent); padding-top: 10px; display: flex; justify-content: space-between; gap: 16px; color: var(--doc-muted); font-size: 8pt; }
    tr { break-inside: avoid; }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <div class="brand">${escapeHtml(professional.name)}</div>
      <div class="meta">${escapeHtml(professional.specialty)} · ${escapeHtml(professional.registry)}</div>
    </div>
    <div class="scale">
      ${escapeHtml(report.scaleName)}${report.scaleFullName ? `<div class="meta">${escapeHtml(report.scaleFullName)}</div>` : ""}
      <div class="meta">${dateLabel}</div>
      ${report.patientAge ? `<div class="meta">Faixa etária: ${escapeHtml(report.patientAge)}</div>` : ""}
    </div>
  </header>

  <main>
    <h1>Registro integral de respostas</h1>
    <p class="summary">${items.length} ${items.length === 1 ? "item registrado" : "itens registrados"}. Cada pergunta é apresentada com a resposta selecionada por extenso.</p>
    <table>
      <thead><tr><th class="number">Nº</th><th class="question">Pergunta</th><th class="answer">Resposta</th></tr></thead>
      <tbody>
        ${items.map((item, index) => `<tr><td class="number">${index + 1}</td><td class="question">${escapeHtml(item.question)}</td><td class="answer">${escapeHtml(item.answer)}</td></tr>`).join("")}
      </tbody>
    </table>
  </main>

  <footer class="footer">
    <div><strong>${escapeHtml(professional.service)}</strong><br>Registro descritivo para revisão profissional.</div>
    <div>${escapeHtml(professional.name)}<br>${escapeHtml(professional.registry)}</div>
  </footer>
</body>
</html>`;
}
