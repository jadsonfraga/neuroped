// Gerador de Relatório PDF Clínico
// Exporta recomendações em formato clínico profissional

import { ScaleEntry } from "@/data/scaleFilter";
import { BatteryRecommendation } from "@/data/batteryRecommendations";
import { ValidationAlert } from "@/data/crossValidations";

export interface PatientData {
  name: string;
  age: number; // meses
  dateOfBirth?: string;
  parentName?: string;
  referralSource?: string;
  clinicalNote?: string;
}

export interface ReportData {
  patient: PatientData;
  detectedPattern: string;
  goldStandardScale?: ScaleEntry;
  recommendedBattery?: BatteryRecommendation;
  selectedScales: ScaleEntry[];
  validationAlerts: ValidationAlert[];
  generatedAt: Date;
}

// Template de relatório em texto (pode ser convertido para PDF)
export function generateClinicalReport(data: ReportData): string {
  const ageYears = Math.floor(data.patient.age / 12);
  const ageMonths = data.patient.age % 12;

  const report = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE AVALIAÇÃO CLÍNICA                          ║
║                          NeuroPed Assessment System                        ║
╚════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO PACIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nome:                    ${data.patient.name}
Idade:                   ${ageYears} anos e ${ageMonths} meses (${data.patient.age} meses)
Data de Nascimento:      ${data.patient.dateOfBirth || "Não informado"}
Responsável:             ${data.patient.parentName || "Não informado"}
Encaminhamento:          ${data.patient.referralSource || "Não informado"}

Nota Clínica Inicial:
${data.patient.clinicalNote || "Não informado"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PADRÃO CLÍNICO DETECTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Padrão:                  ${data.detectedPattern}
${data.goldStandardScale ? `Escala Padrão-Ouro:      ${data.goldStandardScale.name} (${data.goldStandardScale.fullName})` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATERIA RECOMENDADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.recommendedBattery ? `
Bateria:                 ${data.recommendedBattery.name}
Descrição:               ${data.recommendedBattery.description}
Tempo Estimado:          ${data.recommendedBattery.estimatedTime}
Custo Estimado:          ${estimateCostLabel(data.recommendedBattery.estimatedCost)}

Razão Clínica:
${wrapText(data.recommendedBattery.rationale, 80)}

Próximos Passos:
${data.recommendedBattery.nextSteps.map((step, i) => `  ${i + 1}. ${step}`).join("\n")}

Escalas Incluídas:
${data.recommendedBattery.scales
  .map(
    (scale, i) =>
      `  ${i + 1}. ${scale.scaleName} (${scale.role})
     Propósito: ${scale.purpose}
     Tempo: ${scale.estimatedTime}`
  )
  .join("\n\n")}
${
  data.recommendedBattery.warnings && data.recommendedBattery.warnings.length > 0
    ? `
Avisos Clínicos:
${data.recommendedBattery.warnings.map((w) => `  ⚠️  ${w}`).join("\n")}
`
    : ""
}
` : "Nenhuma bateria recomendada"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESCALAS SELECIONADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.selectedScales
  .map(
    (scale, i) =>
      `${i + 1}. ${scale.name} - ${scale.fullName}
   ID: ${scale.id}
   Faixa etária: ${Math.floor(scale.ageMin / 12)}-${Math.floor(scale.ageMax / 12)} anos
   Tempo: ${scale.tempo}
   Respondentes: ${scale.respondente.join(", ")}
   Descrição: ${scale.description}
   Licença: ${scale.licencaUso || "Não especificada"}
`
  )
  .join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDAÇÕES CRUZADAS E ALERTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  data.validationAlerts.length > 0
    ? data.validationAlerts
        .map(
          (alert) =>
            `${alert.severity.toUpperCase()}: ${alert.title}
${wrapText(alert.message, 80)}
Recomendação: ${wrapText(alert.recommendation, 80)}
`
        )
        .join("\n")
    : "✓ Nenhum alerta de validação. Seleção de escalas é compatível."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMENDAÇÕES CLÍNICAS FINAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. APLICAÇÃO DAS ESCALAS
   • Usar ambiente tranquilo e criança descansada
   • Aplicar escalas na ordem: triagem → diagnóstica → complementares
   • Permitir pausas entre escalas
   • Respeitar tempo estimado para cada escala

2. DOCUMENTAÇÃO
   • Registrar data, hora e condições da aplicação
   • Anotar comportamentos observados durante teste
   • Documentar dificuldades ou não-conformidades
   • Manter original + cópia para prontuário

3. PRÓXIMAS AÇÕES
   • Revisar resultados em consulta de retorno (7-14 dias)
   • Discutir achados com família
   • Encaminhar para intervenção/tratamento conforme indicação
   • Agendar reavaliação conforme protocolo (3-6 meses)

4. CONSIDERAÇÕES ESPECIAIS
   ${data.patient.age < 36 ? "• Corrigir idade por prematuridade se aplicável (até 24 meses)" : ""}
   ${data.patient.age > 216 ? "• Considerar transição para escalas adultas" : ""}
   • Comunicar resultados ao responsável em linguagem acessível
   • Oferecer orientações de apoio baseadas em resultados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMAÇÕES DO RELATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data de Geração:         ${formatDate(data.generatedAt)}
Sistema:                 NeuroPed Filter Assessment v1.0
Validação:               Recomendações baseadas em padrões clínicos validados
Disclaimer:              Este relatório é suporte ao clínico, não substitui diagnóstico.
                        Sempre consulte literatura original e considere contexto clínico.

╔════════════════════════════════════════════════════════════════════════════╗
║ Assinado digitalmente pelo Sistema NeuroPed em ${formatDate(data.generatedAt)}              ║
║ Para mais informações: neuroped.app                                        ║
╚════════════════════════════════════════════════════════════════════════════╝
`;

  return report;
}

// Exportar como arquivo de texto
export function exportReportAsText(data: ReportData, filename?: string): void {
  const report = generateClinicalReport(data);
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report));
  element.setAttribute("download", filename || `relatorio_${data.patient.name}_${formatDate(new Date())}.txt`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Utilitários
function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function wrapText(text: string, maxWidth: number): string {
  const words = text.split(" ");
  let lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxWidth) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }

  if (currentLine) lines.push(currentLine.trim());
  return lines.map(l => "  " + l).join("\n");
}

function estimateCostLabel(cost: "baixo" | "médio" | "alto"): string {
  return {
    baixo: "R$ 50-150 (Baixo)",
    médio: "R$ 150-400 (Médio)",
    alto: "R$ 400-1000+ (Alto)"
  }[cost];
}

// Função para preparar dados para PDF (integração futura com biblioteca PDF)
export function prepareForPDF(data: ReportData): Record<string, any> {
  return {
    title: "Relatório de Avaliação Clínica",
    patient: {
      name: data.patient.name,
      age: `${Math.floor(data.patient.age / 12)}a ${data.patient.age % 12}m`,
      dob: data.patient.dateOfBirth,
      parent: data.patient.parentName
    },
    pattern: data.detectedPattern,
    goldStandard: data.goldStandardScale?.name,
    battery: data.recommendedBattery?.name,
    scales: data.selectedScales.map(s => ({ id: s.id, name: s.name })),
    alerts: data.validationAlerts.length,
    generatedAt: formatDate(data.generatedAt)
  };
}
