import {
  persistentSecureClear,
  persistentSecureGet,
  persistentSecureSet,
} from "@/lib/persistentSecureStorage";

export type AgendaStatus =
  | "agendado"
  | "confirmado"
  | "aguardando"
  | "em-atendimento"
  | "concluido"
  | "faltou"
  | "cancelado";

export type AgendaVisitType =
  | "primeira-consulta"
  | "retorno"
  | "reavaliacao-neurodesenvolvimento"
  | "epilepsia-eeg"
  | "encaixe";

export type WaitlistStatus = "aguardando" | "ofertado" | "agendado";
export type PreferredPeriod = "manha" | "tarde" | "qualquer";

export interface AgendaAppointment {
  id: string;
  patientLabel: string;
  guardianLabel?: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  visitType: AgendaVisitType;
  status: AgendaStatus;
  operationalNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  createdAt: string;
}

export interface AgendaWaitlistItem {
  id: string;
  patientLabel: string;
  guardianLabel?: string;
  visitType: AgendaVisitType;
  preferredPeriod: PreferredPeriod;
  status: WaitlistStatus;
  availabilityNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaWorkspace {
  version: 1;
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
  waitlist: AgendaWaitlistItem[];
}

export interface AgendaConflict {
  kind: "appointment" | "block";
  id: string;
  label: string;
}

export const AGENDA_STORAGE_KEY = "agenda:workspace:v1";
export const AGENDA_TIMEZONE = "America/Recife";

export const agendaStatusLabels: Record<AgendaStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  aguardando: "Aguardando",
  "em-atendimento": "Em atendimento",
  concluido: "Concluído",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

export const agendaVisitLabels: Record<AgendaVisitType, string> = {
  "primeira-consulta": "Primeira consulta",
  retorno: "Retorno",
  "reavaliacao-neurodesenvolvimento": "Reavaliação do neurodesenvolvimento",
  "epilepsia-eeg": "Epilepsia / correlação com EEG",
  encaixe: "Encaixe",
};

export const preferredPeriodLabels: Record<PreferredPeriod, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  qualquer: "Qualquer período",
};

export const waitlistStatusLabels: Record<WaitlistStatus, string> = {
  aguardando: "Aguardando vaga",
  ofertado: "Horário ofertado",
  agendado: "Agendado",
};

export function emptyAgendaWorkspace(): AgendaWorkspace {
  return { version: 1, appointments: [], blocks: [], waitlist: [] };
}

function safeText(value: unknown, max = 160): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function toMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(total: number): string {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, total));
  const hour = Math.floor(bounded / 60);
  const minute = bounded % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

function isAgendaStatus(value: unknown): value is AgendaStatus {
  return [
    "agendado",
    "confirmado",
    "aguardando",
    "em-atendimento",
    "concluido",
    "faltou",
    "cancelado",
  ].includes(String(value));
}

function isVisitType(value: unknown): value is AgendaVisitType {
  return [
    "primeira-consulta",
    "retorno",
    "reavaliacao-neurodesenvolvimento",
    "epilepsia-eeg",
    "encaixe",
  ].includes(String(value));
}

function isWaitlistStatus(value: unknown): value is WaitlistStatus {
  return ["aguardando", "ofertado", "agendado"].includes(String(value));
}

function isPreferredPeriod(value: unknown): value is PreferredPeriod {
  return ["manha", "tarde", "qualquer"].includes(String(value));
}

function normalizeAppointment(value: unknown): AgendaAppointment | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AgendaAppointment>;
  if (
    typeof item.id !== "string" ||
    !safeText(item.patientLabel, 80) ||
    !isDate(item.date) ||
    !isTime(item.startTime) ||
    !Number.isInteger(item.durationMinutes) ||
    Number(item.durationMinutes) < 10 ||
    Number(item.durationMinutes) > 240 ||
    !isVisitType(item.visitType) ||
    !isAgendaStatus(item.status) ||
    typeof item.createdAt !== "string" ||
    typeof item.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    id: item.id,
    patientLabel: safeText(item.patientLabel, 80),
    ...(safeText(item.guardianLabel, 80) ? { guardianLabel: safeText(item.guardianLabel, 80) } : {}),
    date: item.date,
    startTime: item.startTime,
    durationMinutes: Number(item.durationMinutes),
    visitType: item.visitType,
    status: item.status,
    ...(safeText(item.operationalNote, 160) ? { operationalNote: safeText(item.operationalNote, 160) } : {}),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function normalizeBlock(value: unknown): AgendaBlock | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AgendaBlock>;
  if (
    typeof item.id !== "string" ||
    !isDate(item.date) ||
    !isTime(item.startTime) ||
    !isTime(item.endTime) ||
    toMinutes(item.endTime) <= toMinutes(item.startTime) ||
    !safeText(item.label, 80) ||
    typeof item.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: item.id,
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    label: safeText(item.label, 80),
    createdAt: item.createdAt,
  };
}

function normalizeWaitlistItem(value: unknown): AgendaWaitlistItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AgendaWaitlistItem>;
  if (
    typeof item.id !== "string" ||
    !safeText(item.patientLabel, 80) ||
    !isVisitType(item.visitType) ||
    !isPreferredPeriod(item.preferredPeriod) ||
    !isWaitlistStatus(item.status) ||
    typeof item.createdAt !== "string" ||
    typeof item.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    id: item.id,
    patientLabel: safeText(item.patientLabel, 80),
    ...(safeText(item.guardianLabel, 80) ? { guardianLabel: safeText(item.guardianLabel, 80) } : {}),
    visitType: item.visitType,
    preferredPeriod: item.preferredPeriod,
    status: item.status,
    ...(safeText(item.availabilityNote, 160)
      ? { availabilityNote: safeText(item.availabilityNote, 160) }
      : {}),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function normalizeAgendaWorkspace(value: unknown): AgendaWorkspace {
  if (!value || typeof value !== "object") return emptyAgendaWorkspace();
  const candidate = value as Partial<AgendaWorkspace>;
  const appointments = Array.isArray(candidate.appointments)
    ? candidate.appointments.map(normalizeAppointment).filter((item): item is AgendaAppointment => item != null)
    : [];
  const blocks = Array.isArray(candidate.blocks)
    ? candidate.blocks.map(normalizeBlock).filter((item): item is AgendaBlock => item != null)
    : [];
  const waitlist = Array.isArray(candidate.waitlist)
    ? candidate.waitlist.map(normalizeWaitlistItem).filter((item): item is AgendaWaitlistItem => item != null)
    : [];
  return { version: 1, appointments, blocks, waitlist };
}

export async function loadAgendaWorkspace(): Promise<AgendaWorkspace> {
  const stored = await persistentSecureGet<AgendaWorkspace>(AGENDA_STORAGE_KEY);
  return normalizeAgendaWorkspace(stored);
}

export async function saveAgendaWorkspace(workspace: AgendaWorkspace): Promise<boolean> {
  return persistentSecureSet(AGENDA_STORAGE_KEY, normalizeAgendaWorkspace(workspace));
}

export async function clearAgendaWorkspace(): Promise<void> {
  await persistentSecureClear(AGENDA_STORAGE_KEY);
}

export function createAgendaAppointment(
  input: Omit<AgendaAppointment, "id" | "createdAt" | "updatedAt">,
): AgendaAppointment {
  if (!safeText(input.patientLabel, 80)) throw new Error("Paciente/código é obrigatório.");
  if (!isDate(input.date) || !isTime(input.startTime)) throw new Error("Data ou horário inválido.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 10 || input.durationMinutes > 240) {
    throw new Error("Duração inválida.");
  }
  const now = new Date().toISOString();
  return {
    ...input,
    patientLabel: safeText(input.patientLabel, 80),
    ...(safeText(input.guardianLabel, 80) ? { guardianLabel: safeText(input.guardianLabel, 80) } : {}),
    ...(safeText(input.operationalNote, 160)
      ? { operationalNote: safeText(input.operationalNote, 160) }
      : {}),
    id: `agenda-${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };
}

export function createAgendaBlock(
  input: Omit<AgendaBlock, "id" | "createdAt">,
): AgendaBlock {
  if (!isDate(input.date) || !isTime(input.startTime) || !isTime(input.endTime)) {
    throw new Error("Data ou horário do bloqueio inválido.");
  }
  if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
    throw new Error("O fim do bloqueio deve ser depois do início.");
  }
  if (!safeText(input.label, 80)) throw new Error("Motivo operacional do bloqueio é obrigatório.");
  return {
    ...input,
    label: safeText(input.label, 80),
    id: `block-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
}

export function createWaitlistItem(
  input: Omit<AgendaWaitlistItem, "id" | "createdAt" | "updatedAt" | "status">,
): AgendaWaitlistItem {
  if (!safeText(input.patientLabel, 80)) throw new Error("Paciente/código é obrigatório.");
  const now = new Date().toISOString();
  return {
    ...input,
    patientLabel: safeText(input.patientLabel, 80),
    ...(safeText(input.guardianLabel, 80) ? { guardianLabel: safeText(input.guardianLabel, 80) } : {}),
    ...(safeText(input.availabilityNote, 160)
      ? { availabilityNote: safeText(input.availabilityNote, 160) }
      : {}),
    id: `wait-${crypto.randomUUID()}`,
    status: "aguardando",
    createdAt: now,
    updatedAt: now,
  };
}

export function findAppointmentConflicts(
  candidate: Pick<AgendaAppointment, "id" | "date" | "startTime" | "durationMinutes" | "status">,
  workspace: AgendaWorkspace,
): AgendaConflict[] {
  if (candidate.status === "cancelado") return [];
  const candidateStart = toMinutes(candidate.startTime);
  const candidateEnd = candidateStart + candidate.durationMinutes;
  const conflicts: AgendaConflict[] = [];

  for (const appointment of workspace.appointments) {
    if (appointment.id === candidate.id || appointment.date !== candidate.date || appointment.status === "cancelado") {
      continue;
    }
    const start = toMinutes(appointment.startTime);
    const end = start + appointment.durationMinutes;
    if (overlaps(candidateStart, candidateEnd, start, end)) {
      conflicts.push({
        kind: "appointment",
        id: appointment.id,
        label: `${appointment.startTime} · ${appointment.patientLabel}`,
      });
    }
  }

  for (const block of workspace.blocks) {
    if (block.date !== candidate.date) continue;
    if (overlaps(candidateStart, candidateEnd, toMinutes(block.startTime), toMinutes(block.endTime))) {
      conflicts.push({ kind: "block", id: block.id, label: `${block.startTime}–${block.endTime} · ${block.label}` });
    }
  }

  return conflicts;
}

export function findBlockConflicts(
  candidate: Pick<AgendaBlock, "id" | "date" | "startTime" | "endTime">,
  workspace: AgendaWorkspace,
): AgendaConflict[] {
  const start = toMinutes(candidate.startTime);
  const end = toMinutes(candidate.endTime);
  const conflicts: AgendaConflict[] = [];

  for (const block of workspace.blocks) {
    if (block.id === candidate.id || block.date !== candidate.date) continue;
    if (overlaps(start, end, toMinutes(block.startTime), toMinutes(block.endTime))) {
      conflicts.push({ kind: "block", id: block.id, label: `${block.startTime}–${block.endTime} · ${block.label}` });
    }
  }

  for (const appointment of workspace.appointments) {
    if (appointment.date !== candidate.date || appointment.status === "cancelado") continue;
    const appointmentStart = toMinutes(appointment.startTime);
    const appointmentEnd = appointmentStart + appointment.durationMinutes;
    if (overlaps(start, end, appointmentStart, appointmentEnd)) {
      conflicts.push({
        kind: "appointment",
        id: appointment.id,
        label: `${appointment.startTime} · ${appointment.patientLabel}`,
      });
    }
  }

  return conflicts;
}

export function appointmentEndTime(appointment: Pick<AgendaAppointment, "startTime" | "durationMinutes">): string {
  return minutesToTime(toMinutes(appointment.startTime) + appointment.durationMinutes);
}

export function sortAgendaAppointments(items: AgendaAppointment[]): AgendaAppointment[] {
  return [...items].sort((a, b) =>
    `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
  );
}

export function formatAgendaDate(value: string): string {
  if (!isDate(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function buildAppointmentReminder(appointment: AgendaAppointment): string {
  const responsible = appointment.guardianLabel ? `, ${appointment.guardianLabel}` : "";
  return `Olá${responsible}. Lembrete da consulta NeuroPed de ${appointment.patientLabel} em ${formatAgendaDate(
    appointment.date,
  )} às ${appointment.startTime}. Se precisar remarcar, entre em contato com a recepção.`;
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function compactLocalDateTime(date: string, time: string): string {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

function compactUtcNow(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildPrivateAppointmentIcs(appointment: AgendaAppointment): string {
  const endTime = appointmentEndTime(appointment);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NeuroPed//Agenda NeuroPed//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${icsEscape(appointment.id)}@neuroped.local`,
    `DTSTAMP:${compactUtcNow()}`,
    `DTSTART;TZID=${AGENDA_TIMEZONE}:${compactLocalDateTime(appointment.date, appointment.startTime)}`,
    `DTEND;TZID=${AGENDA_TIMEZONE}:${compactLocalDateTime(appointment.date, endTime)}`,
    "SUMMARY:Consulta NeuroPed",
    "DESCRIPTION:Agendamento NeuroPed. Dados clínicos e identificação do paciente não foram incluídos neste arquivo.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  return lines.join("\r\n");
}
