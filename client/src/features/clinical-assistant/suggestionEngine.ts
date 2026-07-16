import { allScales, type ScaleEntry } from "@/data/scaleFilter";
import type {
  AssistantSuggestion,
  BatteryPhase,
  BatteryScale,
  ClinicianWarning,
  ClinicalAssistantInput,
  SuggestedBattery,
} from "./types";

// Clinical templates for common complaints
const complaintTemplates: Record<string, { screening: string[]; diagnostic: string[]; monitoring: string[] }> = {
  tea: {
    screening: ["mchat"],
    diagnostic: ["ados2", "cars2"],
    monitoring: ["atec"],
  },
  tdah: {
    screening: ["snap"],
    diagnostic: ["conners-pais", "brief2"],
    monitoring: ["vanderbilt"],
  },
  ansiedade: {
    screening: ["scared-pais"],
    diagnostic: ["rcads-pais"],
    monitoring: [],
  },
  depressao: {
    screening: ["cdi2"],
    diagnostic: ["rcads-pais"],
    monitoring: [],
  },
  atraso: {
    screening: ["denver"],
    diagnostic: ["bayley"],
    monitoring: ["asq3"],
  },
  linguagem: {
    screening: ["catclams"],
    diagnostic: ["catclams"],
    monitoring: [],
  },
  comportamento: {
    screening: ["cbcl"],
    diagnostic: ["ecbi"],
    monitoring: ["abc"],
  },
};

function findScaleById(id: string): ScaleEntry | undefined {
  return allScales.find((s) => s.id === id);
}

function convertScaleEntryToBatteryScale(scale: ScaleEntry, reasoning: string): BatteryScale {
  const respondent = scale.respondente[0] || "clinico";
  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)\s*–?\s*(\d+)?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return Math.ceil((min + max) / 2);
    }
    return 10;
  };

  return {
    id: scale.id,
    name: scale.name,
    respondent,
    duration: parseTime(scale.tempo),
    priority: scale.prioridade === "triagem" ? "essential" : "complementary",
    reasoning,
  };
}

function createBatteryPhase(id: BatteryPhase["id"], scales: BatteryScale[]): BatteryPhase {
  const duration = scales.reduce((sum, s) => sum + s.duration, 0);
  const labels: Record<BatteryPhase["id"], string> = {
    screening: "TRIAGEM",
    diagnostic: "DIAGNÓSTICO",
    optional: "APROFUNDAMENTO",
  };

  return {
    id,
    label: labels[id],
    duration,
    scales,
  };
}

function generateSuggestedBattery(
  input: ClinicalAssistantInput,
  templateId: string,
  phases: BatteryPhase[]
): SuggestedBattery {
  const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  const phrasedAge = input.age < 12 ? `${input.age}m` : `${Math.floor(input.age / 12)}a`;

  return {
    id: `battery-${crypto.randomUUID()}`,
    name: `Bateria Otimizada — ${templateId} (${phrasedAge})`,
    totalDuration,
    phases,
    explanation: `Bateria recomendada baseada em suspeita de ${templateId} em criança com ${phrasedAge} respondentes disponíveis: ${input.respondentsAvailable.join(", ")}`,
    clinicalNotes: `Tempo total: ${totalDuration} minutos. Priorize as escalas na FASE 1 (triagem); adicione FASE 2 se houver tempo e suspeita clínica elevada.`,
    estimatedTimeRange: {
      min: totalDuration - 5,
      max: totalDuration + 10,
    },
  };
}

function generateWarnings(input: ClinicalAssistantInput): ClinicianWarning[] {
  const warnings: ClinicianWarning[] = [];

  if (input.age < 24 && !input.childCapabilities?.canRead) {
    warnings.push({
      id: "infant-verbal-dependent",
      severity: "info",
      message: "Criança <2a: escalas devem ser respondidas por cuidadores ou observação clínica direta",
    });
  }

  if (input.timeAvailable < 15) {
    warnings.push({
      id: "limited-time",
      severity: "warning",
      message: `Tempo disponível limitado (${input.timeAvailable}m). Considere modo QUICK SCREENING ou reagendar.`,
      actionItems: [
        "Priorize 1-2 escalas de triagem rápida",
        "Deixe aprofundamento para próxima consulta",
      ],
    });
  }

  if (input.respondentsAvailable.length === 1) {
    warnings.push({
      id: "single-respondent",
      severity: "warning",
      message: `Apenas 1 respondente disponível (${input.respondentsAvailable[0]}). Idealmente colete dados múltiplas fontes.`,
    });
  }

  if (!input.childCapabilities?.verbal) {
    warnings.push({
      id: "nonverbal-child",
      severity: "alert",
      message: "Criança não-verbal. Recomenda-se escalas visuomotoras, gestuais ou AAC.",
    });
  }

  return warnings;
}

export function suggestBattery(input: ClinicalAssistantInput): AssistantSuggestion {
  const complaint = input.complaint.toLowerCase();
  const template = complaintTemplates[complaint] || complaintTemplates.comportamento;

  // Find scales matching the template
  const screeningScales = template.screening
    .map((id) => findScaleById(id))
    .filter(Boolean)
    .map((s) =>
      convertScaleEntryToBatteryScale(s!, "Escala de triagem padrão para suspeita clínica inicial")
    );

  const diagnosticScales = template.diagnostic
    .map((id) => findScaleById(id))
    .filter(Boolean)
    .map((s) =>
      convertScaleEntryToBatteryScale(
        s!,
        "Escala diagnóstica padrão-ouro para confirmação"
      )
    );

  const screeningPhase = createBatteryPhase("screening", screeningScales);
  const diagnosticPhase = createBatteryPhase("diagnostic", diagnosticScales);
  const phases = [screeningPhase, diagnosticPhase];

  const battery = generateSuggestedBattery(input, complaint, phases);
  const warnings = generateWarnings(input);

  // Generate alternative options (simplified)
  const alternatives: SuggestedBattery[] = [];

  return {
    battery,
    alternativeOptions: alternatives,
    warnings,
    confidence: 85, // Placeholder confidence score
  };
}
