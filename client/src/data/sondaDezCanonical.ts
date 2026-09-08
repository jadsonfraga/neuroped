export type SondaBandId =
  | "12-23m"
  | "24-35m"
  | "3-4a"
  | "5-7a"
  | "8-11a"
  | "12-17a";

export type SondaResponseCode = "E" | "I" | "P" | "0" | "NA";

export const SONDA_DEZ_VERSION = "2026-09-08";

export const SONDA_DEZ_PROVENANCE = {
  source: "AFN-10 / Sonda Dez",
  instrumentType: "registro observacional clínico piloto",
  validationStatus: "não psicométrico; sem normas, percentis ou pontos de corte",
} as const;

export const SONDA_DEZ_GOLDEN_RULES = [
  "Registre o que você viu nesta aplicação, não substitua pelo relato do responsável.",
  "Ajuda conta como ajuda: não converta resposta mediada em desempenho independente.",
  "Não deu para avaliar é um dado honesto; nunca transforme NA em zero por conveniência.",
] as const;

export const SONDA_DEZ_RESPONSE_LADDER: ReadonlyArray<{
  code: SondaResponseCode;
  icon: string;
  label: string;
  operatorQuestion: string;
  meaning: string;
}> = [
  {
    code: "E",
    icon: "⭐",
    label: "Sozinha",
    operatorQuestion: "Fez sem mediação adicional?",
    meaning: "A resposta apareceu sem ajuda adicional nesta oportunidade.",
  },
  {
    code: "I",
    icon: "👍",
    label: "Com instrução",
    operatorQuestion: "A instrução direta foi suficiente?",
    meaning: "A estrutura verbal direta foi suficiente para evocar a resposta.",
  },
  {
    code: "P",
    icon: "🤝",
    label: "Com ajuda",
    operatorQuestion: "Precisou de pista ou repetição?",
    meaning: "Foi necessária mediação adicional para a resposta aparecer.",
  },
  {
    code: "0",
    icon: "⬜",
    label: "Não fez",
    operatorQuestion: "A resposta não apareceu nesta oportunidade?",
    meaning: "Não demonstrado aqui; isso não prova ausência da habilidade em outros contextos.",
  },
  {
    code: "NA",
    icon: "➖",
    label: "Não deu para avaliar",
    operatorQuestion: "As condições impediram inferência válida?",
    meaning: "A oportunidade não foi válida para concluir presença ou ausência da resposta.",
  },
] as const;

export const SONDA_DEZ_BANDS: ReadonlyArray<{
  id: SondaBandId;
  label: string;
  icon: string;
  specialization: string;
}> = [
  {
    id: "12-23m",
    label: "12–23 meses",
    icon: "🌱",
    specialization: "Interação, compreensão, gestos, brincadeira e autorregulação inicial",
  },
  {
    id: "24-35m",
    label: "24–35 meses",
    icon: "🌿",
    specialization: "Comunicação, simbolismo, resolução de problema e inibição inicial",
  },
  {
    id: "3-4a",
    label: "3–4 anos",
    icon: "🚀",
    specialization: "Interação, conceitos, linguagem, atenção sustentada e troca de regra",
  },
  {
    id: "5-7a",
    label: "5–7 anos",
    icon: "🧭",
    specialization: "Narrativa, memória operacional, atenção, inibição, flexibilidade e visuoconstrução",
  },
  {
    id: "8-11a",
    label: "8–11 anos",
    icon: "🧠",
    specialization: "Pragmática, inferência social, memória operacional, atenção, flexibilidade e planejamento",
  },
  {
    id: "12-17a",
    label: "12–17 anos",
    icon: "✨",
    specialization: "Narrativa, cognição social, atenção seletiva, memória operacional e planejamento executivo",
  },
] as const;

export const SONDA_DEZ_SAFETY_CONTRACT = {
  durationMinutes: 10,
  minimumAgeMonths: 12,
  maximumAgeMonths: 215,
  persistence: "memory-only",
  normativeScore: false,
  percentile: false,
  diagnosticOutput: false,
  medicalIntegrationRequired: true,
} as const;
