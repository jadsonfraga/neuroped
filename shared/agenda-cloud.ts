import { z } from "zod";

export const AGENDA_CLOUD_WORKSPACE_ID = "clinic-primary";

export const agendaStatuses = [
  "agendado",
  "confirmado",
  "aguardando",
  "em-atendimento",
  "concluido",
  "faltou",
  "cancelado",
] as const;
export type AgendaCloudStatus = (typeof agendaStatuses)[number];

export const agendaVisitTypes = [
  "primeira-consulta",
  "retorno",
  "reavaliacao-neurodesenvolvimento",
  "epilepsia-eeg",
  "encaixe",
] as const;
export type AgendaCloudVisitType = (typeof agendaVisitTypes)[number];

export const agendaWaitlistStatuses = ["aguardando", "ofertado", "agendado"] as const;
export type AgendaCloudWaitlistStatus = (typeof agendaWaitlistStatuses)[number];

export const agendaPreferredPeriods = ["manha", "tarde", "qualquer"] as const;
export type AgendaCloudPreferredPeriod = (typeof agendaPreferredPeriods)[number];

const idSchema = z.string().trim().min(1).max(128);
const shortText = z.string().trim().min(1).max(80);
const optionalShortText = z.string().trim().max(80).optional();
const operationalText = z.string().trim().max(160).optional();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const isoSchema = z.string().datetime({ offset: true }).or(z.string().datetime());

export const agendaCloudAppointmentSchema = z
  .object({
    id: idSchema,
    patientId: z.string().trim().max(128).optional(),
    patientLabel: shortText,
    guardianLabel: optionalShortText,
    date: dateSchema,
    startTime: timeSchema,
    durationMinutes: z.number().int().min(10).max(240),
    visitType: z.enum(agendaVisitTypes),
    status: z.enum(agendaStatuses),
    operationalNote: operationalText,
    createdAt: isoSchema,
    updatedAt: isoSchema,
  })
  .strict();

export const agendaCloudBlockSchema = z
  .object({
    id: idSchema,
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    label: shortText,
    createdAt: isoSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (timeToMinutes(value.endTime) <= timeToMinutes(value.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Fim do bloqueio deve ser posterior ao início.",
      });
    }
  });

export const agendaCloudWaitlistSchema = z
  .object({
    id: idSchema,
    patientId: z.string().trim().max(128).optional(),
    patientLabel: shortText,
    guardianLabel: optionalShortText,
    visitType: z.enum(agendaVisitTypes),
    preferredPeriod: z.enum(agendaPreferredPeriods),
    status: z.enum(agendaWaitlistStatuses),
    availabilityNote: operationalText,
    createdAt: isoSchema,
    updatedAt: isoSchema,
  })
  .strict();

export const agendaCloudWorkspaceSchema = z
  .object({
    version: z.literal(2),
    appointments: z.array(agendaCloudAppointmentSchema).max(2000),
    blocks: z.array(agendaCloudBlockSchema).max(500),
    waitlist: z.array(agendaCloudWaitlistSchema).max(1000),
  })
  .strict()
  .superRefine((workspace, ctx) => {
    const ids = new Set<string>();
    for (const [collectionName, items] of [
      ["appointments", workspace.appointments],
      ["blocks", workspace.blocks],
      ["waitlist", workspace.waitlist],
    ] as const) {
      items.forEach((item, index) => {
        if (ids.has(item.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [collectionName, index, "id"],
            message: "Identificador duplicado na agenda.",
          });
        }
        ids.add(item.id);
      });
    }

    const conflicts = findAgendaWorkspaceConflicts(workspace);
    conflicts.slice(0, 20).forEach((conflict) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appointments"],
        message: conflict.label,
      });
    });
  });

export type AgendaCloudAppointment = z.infer<typeof agendaCloudAppointmentSchema>;
export type AgendaCloudBlock = z.infer<typeof agendaCloudBlockSchema>;
export type AgendaCloudWaitlistItem = z.infer<typeof agendaCloudWaitlistSchema>;
export type AgendaCloudWorkspace = z.infer<typeof agendaCloudWorkspaceSchema>;

export const agendaCloudWriteSchema = z
  .object({
    expectedRevision: z.number().int().min(0),
    workspace: agendaCloudWorkspaceSchema,
  })
  .strict();
export type AgendaCloudWrite = z.infer<typeof agendaCloudWriteSchema>;

export type AgendaCloudStorageMode = "remote-live" | "demo-cloud";

export interface AgendaCloudSnapshot {
  workspace: AgendaCloudWorkspace;
  revision: number;
  mode: AgendaCloudStorageMode;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface AgendaCloudAuditEntry {
  id: string;
  userId: string | null;
  action: string;
  summary: string;
  createdAt: string;
}

export interface AgendaWorkspaceConflict {
  aId: string;
  bId: string;
  label: string;
}

export function emptyAgendaCloudWorkspace(): AgendaCloudWorkspace {
  return { version: 2, appointments: [], blocks: [], waitlist: [] };
}

export function timeToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

export function findAgendaWorkspaceConflicts(
  workspace: Pick<AgendaCloudWorkspace, "appointments" | "blocks">,
): AgendaWorkspaceConflict[] {
  const active = workspace.appointments.filter((item) => item.status !== "cancelado");
  const conflicts: AgendaWorkspaceConflict[] = [];

  for (let i = 0; i < active.length; i += 1) {
    const first = active[i];
    const firstStart = timeToMinutes(first.startTime);
    const firstEnd = firstStart + first.durationMinutes;
    for (let j = i + 1; j < active.length; j += 1) {
      const second = active[j];
      if (first.date !== second.date) continue;
      const secondStart = timeToMinutes(second.startTime);
      const secondEnd = secondStart + second.durationMinutes;
      if (overlaps(firstStart, firstEnd, secondStart, secondEnd)) {
        conflicts.push({
          aId: first.id,
          bId: second.id,
          label: `Conflito entre agendamentos ${first.id} e ${second.id}.`,
        });
      }
    }

    for (const block of workspace.blocks) {
      if (first.date !== block.date) continue;
      if (
        overlaps(
          firstStart,
          firstEnd,
          timeToMinutes(block.startTime),
          timeToMinutes(block.endTime),
        )
      ) {
        conflicts.push({
          aId: first.id,
          bId: block.id,
          label: `Agendamento ${first.id} conflita com bloqueio ${block.id}.`,
        });
      }
    }
  }

  return conflicts;
}

export function isDemoSafeAgendaWorkspace(workspace: AgendaCloudWorkspace): boolean {
  const demoLabel = (value: string | undefined) =>
    !value || /^(demo([\s_-]|$)|fict[ií]cio([\s_-]|$)|paciente demo)/i.test(value.trim());

  return (
    workspace.appointments.every(
      (item) =>
        demoLabel(item.patientLabel) &&
        demoLabel(item.guardianLabel) &&
        !item.patientId &&
        !item.operationalNote,
    ) &&
    workspace.waitlist.every(
      (item) =>
        demoLabel(item.patientLabel) &&
        demoLabel(item.guardianLabel) &&
        !item.patientId &&
        !item.availabilityNote,
    ) &&
    workspace.blocks.every((item) => /^demo([\s_-]|$)/i.test(item.label.trim()))
  );
}
