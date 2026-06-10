// ============================================================
// PDF GENERATOR — Geração de relatórios em PDF
// Sistema para gerar gabaritos e relatórios de escalas
// ============================================================

import { ScaleResult } from "@/shared/schema";
import { ScaleMetadata, ScaleScoringCutoff } from "@/data/scaleQuestions";

interface PDFGenerationOptions {
  includeInterpretation?: boolean;
  includeReferences?: boolean;
  includeFooter?: boolean;
  patientName?: string;
  patientAge?: string;
  applicationDate?: string;
  professionalName?: string;
  professionalRegistry?: string;
}

interface ScaleReportData {
  scaleId: string;
  scaleName: string;
  scaleFullName: string;
  totalScore: number;
  maxScore: number;
  classification: string;
  description: string;
  scoringCutoffs?: ScaleScoringCutoff[];
  answers: Array<{
    itemNumber: number;
    question: string;
    answer: string;
    value: number;
  }>;
  domainScores?: Array<{
    domain: string;
    score: number;
    maxScore: number;
    classification: string;
  }>;
  metadata?: ScaleMetadata;
  options?: PDFGenerationOptions;
}

/**
 * Gera HTML para relatório de escala
 * Pode ser convertido para PDF usando pdfkit, html-to-pdf, ou impresso diretamente
 */
export function generateScaleReportHTML(data: ScaleReportData): string {
  const {
    scaleId,
    scaleName,
    scaleFullName,
    totalScore,
    maxScore,
    classification,
    description,
    answers,
    domainScores,
    metadata,
    options = {},
  } = data;

  const {
    includeInterpretation = true,
    includeReferences = true,
    includeFooter = true,
    patientName = "Paciente",
    patientAge = "",
    applicationDate = new Date().toLocaleDateString("pt-BR"),
    professionalName = "Dr. Jadson Fraga Araújo Júnior",
    professionalRegistry = "CRM-PE 25227 · RQE 17756",
  } = options;

  const percentage = ((totalScore / maxScore) * 100).toFixed(1);
  const isHighRisk = classification.toLowerCase().includes("alto") ||
                      classification.toLowerCase().includes("elevado") ||
                      classification.toLowerCase().includes("risco");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scaleName} - NeuroPed</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
            padding: 20px;
        }

        .page {
            max-width: 8.5in;
            height: 11in;
            margin: 0 auto 20px;
            background: white;
            padding: 40px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            page-break-after: always;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header-logo {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }

        .header-subtitle {
            font-size: 12px;
            color: #666;
        }

        .patient-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 13px;
        }

        .patient-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .patient-info-row:last-child {
            margin-bottom: 0;
        }

        .info-label {
            font-weight: 600;
            color: #374151;
        }

        .info-value {
            color: #666;
        }

        .scale-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin: 25px 0 10px 0;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }

        .scale-subtitle {
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
        }

        .result-box {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }

        .result-score {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }

        .result-max-score {
            font-size: 14px;
            opacity: 0.9;
        }

        .result-classification {
            font-size: 18px;
            font-weight: 600;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .result-classification.high-risk {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        .result-classification.moderate-risk {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
        }

        .result-classification.low-risk {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        }

        .percentage-bar {
            width: 100%;
            height: 12px;
            background: #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
            margin: 10px 0;
        }

        .percentage-fill {
            height: 100%;
            background: linear-gradient(90deg, #1e40af 0%, #1e3a8a 100%);
            border-radius: 6px;
        }

        .high-risk .percentage-fill {
            background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
        }

        .moderate-risk .percentage-fill {
            background: linear-gradient(90deg, #ea580c 0%, #c2410c 100%);
        }

        .low-risk .percentage-fill {
            background: linear-gradient(90deg, #16a34a 0%, #15803d 100%);
        }

        .answers-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
        }

        .answers-table th {
            background: #f3f4f6;
            color: #1f2937;
            font-weight: 600;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #d1d5db;
        }

        .answers-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
        }

        .answers-table tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        .item-number {
            font-weight: 600;
            width: 40px;
            text-align: center;
        }

        .answer-value {
            text-align: center;
            font-weight: 600;
            color: #1e40af;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
            margin-top: 20px;
            margin-bottom: 10px;
            border-left: 3px solid #1e40af;
            padding-left: 10px;
        }

        .interpretation {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
            font-size: 12px;
            line-height: 1.5;
        }

        .cutoff-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }

        .cutoff-table th {
            background: #f3f4f6;
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #d1d5db;
            font-weight: 600;
        }

        .cutoff-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #666;
            text-align: center;
        }

        .professional-signature {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
        }

        .professional-name {
            font-weight: 600;
            margin-bottom: 5px;
        }

        .professional-registry {
            font-size: 10px;
            color: #666;
        }

        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
            font-size: 11px;
        }

        @media print {
            body {
                padding: 0;
                background: white;
            }
            .page {
                box-shadow: none;
                margin: 0;
                padding: 20mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="header-logo">NeuroPed</div>
            <div class="header-subtitle">Sistema de Escalas de Neuropediatria</div>
        </div>

        <div class="patient-info">
            <div class="patient-info-row">
                <span class="info-label">Paciente:</span>
                <span class="info-value">${patientName}</span>
            </div>
            ${patientAge ? `
            <div class="patient-info-row">
                <span class="info-label">Idade:</span>
                <span class="info-value">${patientAge}</span>
            </div>
            ` : ''}
            <div class="patient-info-row">
                <span class="info-label">Data da Avaliação:</span>
                <span class="info-value">${applicationDate}</span>
            </div>
            <div class="patient-info-row">
                <span class="info-label">Escala:</span>
                <span class="info-value">${scaleName}</span>
            </div>
        </div>

        <div class="scale-title">${scaleName}</div>
        <div class="scale-subtitle">${scaleFullName}</div>

        <div class="result-box ${isHighRisk ? 'high-risk' : (totalScore > maxScore * 0.4 ? 'moderate-risk' : 'low-risk')}">
            <div>Escore Total</div>
            <div class="result-score">${totalScore}/${maxScore}</div>
            <div class="percentage-bar">
                <div class="percentage-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="result-max-score">${percentage}% do escore máximo</div>
            <div class="result-classification">${classification}</div>
        </div>

        <div class="interpretation">
            <strong>Interpretação:</strong><br>
            ${description}
        </div>

        ${domainScores && domainScores.length > 0 ? `
        <div class="section-title">Escores por Domínio</div>
        <table class="answers-table">
            <thead>
                <tr>
                    <th>Domínio</th>
                    <th style="text-align: center;">Escore</th>
                    <th style="text-align: center;">Classificação</th>
                </tr>
            </thead>
            <tbody>
                ${domainScores.map(domain => `
                <tr>
                    <td>${domain.domain}</td>
                    <td class="answer-value">${domain.score}/${domain.maxScore}</td>
                    <td>${domain.classification}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        <div class="section-title">Respostas Detalhadas</div>
        <table class="answers-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th>Questão</th>
                    <th style="width: 25%;">Resposta</th>
                    <th style="width: 10%;">Ponto</th>
                </tr>
            </thead>
            <tbody>
                ${answers.map((answer, idx) => `
                <tr>
                    <td class="item-number">${answer.itemNumber}</td>
                    <td>${answer.question}</td>
                    <td>${answer.answer}</td>
                    <td class="answer-value">${answer.value}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        ${includeInterpretation && metadata?.scoringCutoffs ? `
        <div class="section-title">Tabela de Classificação</div>
        <table class="cutoff-table">
            <thead>
                <tr>
                    <th>Intervalo</th>
                    <th>Classificação</th>
                    <th>Descrição</th>
                </tr>
            </thead>
            <tbody>
                ${metadata.scoringCutoffs.map(cutoff => `
                <tr>
                    <td>${cutoff.minScore}–${cutoff.maxScore}</td>
                    <td><strong>${cutoff.classification}</strong></td>
                    <td>${cutoff.description}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        ${metadata?.clinicalNotes ? `
        <div class="warning-box">
            <strong>⚠️ Nota Clínica:</strong><br>
            ${metadata.clinicalNotes}
        </div>
        ` : ''}

        ${includeReferences && metadata?.references ? `
        <div class="section-title">Referências</div>
        <div style="font-size: 10px; line-height: 1.4; margin-top: 10px;">
            ${metadata.references.map((ref, idx) => `
            <div style="margin-bottom: 5px;"><strong>[${idx + 1}]</strong> ${ref}</div>
            `).join('')}
        </div>
        ` : ''}

        ${includeFooter ? `
        <div class="professional-signature">
            <div style="margin-bottom: 60px;">_________________________</div>
            <div class="professional-name">${professionalName}</div>
            <div class="professional-registry">${professionalRegistry}</div>
            <div style="margin-top: 10px; color: #999;">NeuroPed — Escalas de Neuropediatria</div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Este relatório foi gerado automaticamente pelo sistema NeuroPed em ${new Date().toLocaleString('pt-BR')}.</p>
            <p style="margin-top: 10px; font-size: 9px;">Este documento não substitui a avaliação clínica presencial e deve ser interpretado por profissional habilitado.</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Gera PDF em base64 (para envio por email ou download)
 * Nota: Esta função requer a biblioteca 'html-to-pdf' ou similar
 * Para implementação completa, será necessário instalar: npm install html2pdf
 */
export async function generateScaleReportPDF(
  data: ScaleReportData,
): Promise<Buffer> {
  // Esta é uma implementação placeholder
  // Em produção, usaria html2pdf ou puppeteer
  const html = generateScaleReportHTML(data);

  // Retornaria Buffer PDF
  // Para agora, retorna HTML como string em buffer
  return Buffer.from(html, "utf-8");
}

/**
 * Gera CSV com respostas para importação em Excel
 */
export function generateScaleReportCSV(data: ScaleReportData): string {
  const lines: string[] = [];

  lines.push(`Escala,${data.scaleName}`);
  lines.push(`Nome Completo,${data.scaleFullName}`);
  lines.push(`Escore Total,${data.totalScore}/${data.maxScore}`);
  lines.push(`Classificação,${data.classification}`);
  lines.push("");
  lines.push("Resposta Detalhada");
  lines.push("Item,Questão,Resposta,Ponto");

  data.answers.forEach((answer) => {
    const question = answer.question.replace(/,/g, ";");
    const answerText = answer.answer.replace(/,/g, ";");
    lines.push(`${answer.itemNumber},"${question}","${answerText}",${answer.value}`);
  });

  return lines.join("\n");
}

export default {
  generateScaleReportHTML,
  generateScaleReportPDF,
  generateScaleReportCSV,
};
