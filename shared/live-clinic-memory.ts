import { z } from "zod";

export const clinicMemoryScopes = ["clinic", "patient", "appointment"] as const;
export type ClinicMemoryScope = (typeof clinicMemoryScopes)[number];

export const clinicMemoryKinds = ["operational", "clinical"] as const;
export type ClinicMemoryKind = (typeof clinicMemoryKinds)[number];

export const clinicMemoryStatuses = ["active", "archived"] as const;
export type ClinicMemoryStatus = (typeof clinicMemoryStatuses)[number];

const nonEmpty = (max: number) => z.string().trim().min(1).max(max);

export const clinicMemoryInputSchema = z.object({
  clinicId: nonEmpty(80),
  scope: z.enum(clinicMemoryScopes),
  kind: z.enum(clinicMemoryKinds),
  patientId: z.string().trim().max(80).nullable().optional(),
  appointmentId: z.string().trim().max(80).nullable().optional(),
  title: nonEmpty(200),
  content: nonEmpty(20_000),
  category: z.string().trim().max(80).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  source: z.string().trim().max(80).default("clinic_panel"),
  clientRequestId: z.string().trim().min(16).max(120),
  expectedRevision: z.number().int().min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.scope === "patient" && !value.patientId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["patientId"], message: "patientId é obrigatório no escopo patient." });
  }
  if (value.scope === "appointment" && !value.appointmentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["appointmentId"], message: "appointmentId é obrigatório no escopo appointment." });
  }
  if (value.kind === "clinical" && value.scope === "clinic") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scope"], message: "Memória clínica deve estar vinculada a paciente ou atendimento." });
  }
});

export const clinicMemoryPatchSchema = z.object({
  clinicId: nonEmpty(80),
  title: nonEmpty(200).optional(),
  content: nonEmpty(20_000).optional(),
  category: z.string().trim().max(80).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  status: z.enum(clinicMemoryStatuses).optional(),
  clientRequestId: z.string().trim().min(16).max(120),
  expectedRevision: z.number().int().min(1),
});

export const clinicMemoryQuerySchema = z.object({
  clinicId: nonEmpty(80),
  scope: z.enum(clinicMemoryScopes).optional(),
  kind: z.enum(clinicMemoryKinds).optional(),
  patientId: z.string().trim().max(80).optional(),
  appointmentId: z.string().trim().max(80).optional(),
  q: z.string().trim().max(120).optional(),
  cursor: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ClinicMemoryInput = z.infer<typeof clinicMemoryInputSchema>;
export type ClinicMemoryPatch = z.infer<typeof clinicMemoryPatchSchema>;
export type ClinicMemoryQuery = z.infer<typeof clinicMemoryQuerySchema>;

export interface ClinicMemoryRecord {
  id: string;
  clinicId: string;
  scope: ClinicMemoryScope;
  kind: ClinicMemoryKind;
  patientId: string | null;
  appointmentId: string | null;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  source: string;
  authorUserId: string;
  status: ClinicMemoryStatus;
  revision: number;
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicMemorySyncState {
  persisted: true;
  storage: "cloud-d1";
  clinicId: string;
  revision: number;
  updatedAt: string;
}

export function normalizeClinicMemoryTokens(value: string): string[] {
  return [...new Set(
    value
      .normalize("NFKC")
      .toLocaleLowerCase("pt-BR")
      .split(/[^\p{L}\p{N}]+/u)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .slice(0, 80),
  )];
}
