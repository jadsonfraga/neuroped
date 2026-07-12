import type { InteractiveScaleDef } from "./interactiveScaleItems";
import type { DomainKey } from "./authorialDomainMeta";
import { DOMAIN_LABELS } from "./authorialDomainMeta";
import { AUTHORIAL_DOMAIN_BANK_1 } from "./authorialDomainBank1";
import { AUTHORIAL_DOMAIN_BANK_2 } from "./authorialDomainBank2";
import { AUTHORIAL_DOMAIN_BANK_3 } from "./authorialDomainBank3";

const DOMAIN_BANK: Record<DomainKey, readonly string[]> = {
  ...AUTHORIAL_DOMAIN_BANK_1,
  ...AUTHORIAL_DOMAIN_BANK_2,
  ...AUTHORIAL_DOMAIN_BANK_3,
};

const SENTINEL_ITEMS = [
  "Há perda de habilidades previamente adquiridas.",
  "Há fala de morte, desejo de desaparecer ou ideação autolesiva.",
  "Há automutilação, tentativa de suicídio ou risco imediato.",
  "Há crise convulsiva prolongada, repetida ou com dificuldade respiratória.",
  "Há alteração aguda de consciência, força, marcha ou linguagem.",
  "Há agressividade grave com risco para si ou terceiros.",
  "Há suspeita de abuso, violência, negligência ou ambiente inseguro.",
  "Há relato de vozes, visões ou pensamento muito desorganizado.",
  "Há ronco com pausas respiratórias e sonolência importante.",
  "Há recusa alimentar grave, desidratação ou perda de peso relevante."
];

export const AUTHORIAL_BANDS: InteractiveScaleDef["bands"] = [
  { minPct: 80, classification: "Impacto muito elevado", color: "red", description: "Carga muito elevada. Rever red flags, segurança, prejuízo funcional e necessidade de avaliação prioritária." },
  { minPct: 60, classification: "Impacto importante", color: "red", description: "Há dificuldades importantes em múltiplos itens ou domínios. Requer plano clínico, escolar e familiar integrado." },
  { minPct: 40, classification: "Impacto moderado", color: "orange", description: "Há prejuízo funcional moderado. Investigar causas, comorbidades e prioridades de intervenção." },
  { minPct: 20, classification: "Impacto leve", color: "amber", description: "Há sinais leves ou situacionais. Orientar, monitorar e reavaliar conforme evolução." },
  { minPct: 0, classification: "Baixa carga no registro", color: "emerald", description: "Baixa carga neste preenchimento. Não exclui condição clínica quando houver história, exame ou red flags." },
];

const LABELS = ["0 — ausente/esperado", "1 — leve/ocasional", "2 — moderado/frequente", "3 — intenso ou com prejuízo importante"];

export function buildScale(id: string, domains: DomainKey[], itemsPerDomain: number): InteractiveScaleDef {
  const totalItems = domains.length * itemsPerDomain;
  return {
    instruction: "Pontue cada item nos últimos 30 dias: 0 ausente/esperado; 1 leve ou ocasional; 2 moderado ou frequente; 3 intenso, persistente ou com prejuízo funcional importante.",
    infoBox: `Versão operacional harmonizada no app para ${id}. Instrumento autoral experimental do Dr. Jadson Fraga, sem validação psicométrica publicada. Triagem/monitorização; não estabelece diagnóstico isolado. Red flags exigem avaliação independente do escore total.`,
    labels: LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: `${id} — escore total (0–${totalItems * 3})`,
    bands: [...AUTHORIAL_BANDS],
    domains: domains.map((key) => ({ name: DOMAIN_LABELS[key], items: DOMAIN_BANK[key].slice(0, itemsPerDomain).map((text) => ({ text })) })),
  };
}

export function buildWithSentinels(id: string, core: DomainKey[], coreItems: number, sentinelCount: number): InteractiveScaleDef {
  const def = buildScale(id, core, coreItems);
  def.domains.push({ name: "Itens sentinela de gravidade", items: SENTINEL_ITEMS.slice(0, sentinelCount).map((text) => ({ text, emoji: "⚠️" })) });
  const n = core.length * coreItems + sentinelCount;
  def.totalLabel = `${id} — escore total (0–${n * 3}); sentinelas têm leitura independente`;
  return def;
}
