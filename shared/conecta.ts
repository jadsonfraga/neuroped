import { z } from "zod";

export const conectaCategories = [
  "sono",
  "humor",
  "irritabilidade",
  "atencao",
  "energia_agitacao",
  "apetite",
  "medicacao",
  "efeito_percebido",
  "efeito_adverso",
  "escola",
  "terapia",
  "crise_epileptica",
  "cefaleia",
  "intercorrencia",
  "comportamento",
  "autonomia",
  "sensorial",
  "comunicacao",
  "observacao",
] as const;

export type ConectaCategory = (typeof conectaCategories)[number];

export const conectaContexts = [
  "casa",
  "escola",
  "terapia",
  "consulta",
  "outro",
] as const;
export type ConectaContext = (typeof conectaContexts)[number];

export const conectaCategoryLabels: Record<ConectaCategory, string> = {
  sono: "Sono",
  humor: "Humor",
  irritabilidade: "Irritabilidade",
  atencao: "Atenção",
  energia_agitacao: "Energia / agitação",
  apetite: "Apetite",
  medicacao: "Medicação",
  efeito_percebido: "Efeito percebido",
  efeito_adverso: "Efeito adverso",
  escola: "Escola",
  terapia: "Terapia",
  crise_epileptica: "Crise epiléptica",
  cefaleia: "Cefaleia",
  intercorrencia: "Intercorrência",
  comportamento: "Comportamento",
  autonomia: "Autonomia",
  sensorial: "Sensorial",
  comunicacao: "Comunicação",
  observacao: "Observação livre",
};

export const conectaContextLabels: Record<ConectaContext, string> = {
  casa: "Casa",
  escola: "Escola",
  terapia: "Terapia",
  consulta: "Consulta",
  outro: "Outro",
};

const detailSchema = z
  .object({
    medicationTaken: z.boolean().optional(),
    perceivedEffect: z.string().trim().max(240).optional(),
    adverseEffect: z.string().trim().max(240).optional(),
    recovery: z.string().trim().max(240).optional(),
    trigger: z.string().trim().max(240).optional(),
    schoolSupport: z.string().trim().max(240).optional(),
  })
  .strict()
  .optional();

export const conectaEventInputSchema = z
  .object({
    patientId: z.string().trim().min(1).max(128),
    category: z.enum(conectaCategories),
    occurredAt: z.string().datetime({ offset: true }),
    context: z.enum(conectaContexts).optional(),
    value: z.number().int().min(1).max(5).optional(),
    durationMinutes: z.number().int().min(0).max(7 * 24 * 60).optional(),
    note: z.string().trim().max(1_000).optional(),
    detail: detailSchema,
  })
  .strict();

export type ConectaEventInput = z.infer<typeof conectaEventInputSchema>;

export interface ConectaEvent extends ConectaEventInput {
  id: string;
  authorUserId?: string | null;
  createdAt: string;
  storageMode?: "remote" | "local" | "demo-db";
}

export interface ConectaInsightEvidence {
  periodDays: number;
  recordCount: number;
  sources: string[];
  relatedRecordIds: string[];
  limitations: string[];
}

export interface ConectaInsight {
  id: string;
  kind: "tendencia" | "associacao" | "ambiente" | "horario" | "evolucao" | "mudanca" | "neurologico";
  title: string;
  body: string;
  evidence: ConectaInsightEvidence;
}

export const CONECTA_DISCLAIMER =
  "Insight informativo baseado nos registros disponíveis. Não constitui diagnóstico, prescrição ou ajuste de tratamento.";

export const CONECTA_MIN_RECORDS_FOR_INSIGHT = 4;
