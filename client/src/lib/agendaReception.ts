/**
 * agendaReception.ts — Recepção do dia: a fila de chegada montada a partir das
 * consultas de um dia (GET /api/operations?resource=day). Funções puras,
 * testáveis sem navegador. O servidor é a autoridade das transições
 * (`appointment_status`); aqui só se organiza e se sugere a próxima ação.
 */
import type { Appointment, AppointmentStatus } from "@shared/operations";

export type ReceptionColumn = "arriving" | "waiting" | "in_care" | "done";

export const RECEPTION_COLUMN_LABELS: Record<ReceptionColumn, string> = {
  arriving: "A chegar",
  waiting: "Na recepção",
  in_care: "Em atendimento",
  done: "Encerradas",
};

const COLUMN_OF: Record<AppointmentStatus, ReceptionColumn> = {
  requested: "arriving",
  confirmed: "arriving",
  checked_in: "waiting",
  in_care: "in_care",
  completed: "done",
  no_show: "done",
  cancelled: "done",
};

/**
 * Ações da recepção por estado, na ordem do balcão. Subconjunto das transições
 * que o servidor aceita (index.ts, `appointment_status`); cancelar continua na
 * aba Agenda, onde a remarcação também está.
 */
export const RECEPTION_ACTIONS: Partial<Record<AppointmentStatus, Array<{ status: AppointmentStatus; label: string }>>> = {
  requested: [
    { status: "confirmed", label: "Confirmar" },
    { status: "no_show", label: "Faltou" },
  ],
  confirmed: [
    { status: "checked_in", label: "Registrar chegada" },
    { status: "no_show", label: "Faltou" },
  ],
  checked_in: [{ status: "in_care", label: "Chamar para atendimento" }],
  in_care: [{ status: "completed", label: "Concluir" }],
};

export interface ReceptionItem {
  appointment: Appointment;
  /** Horário já passou e a família ainda não chegou (só faz sentido no dia de hoje). */
  late: boolean;
  /** Minutos desde o check-in, para quem está na recepção. */
  waitingMinutes: number | null;
}

export interface ReceptionBoard {
  columns: Record<ReceptionColumn, ReceptionItem[]>;
  counts: {
    total: number;
    arriving: number;
    waiting: number;
    inCare: number;
    completed: number;
    noShow: number;
    cancelled: number;
    late: number;
  };
}

/** Minutos inteiros entre um instante ISO e `nowMs`; nunca negativo; `null` se inválido. */
export function minutesSince(iso: string | null, nowMs: number): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.floor((nowMs - at) / 60_000));
}

/**
 * Monta o quadro do dia. `nowLocal` é o "agora" no fuso do profissional
 * (devolvido pelo servidor); `nowMs` é o relógio do navegador para o tempo de
 * espera (o check-in é gravado em ISO UTC).
 */
export function buildReceptionBoard(
  appointments: Appointment[],
  date: string,
  nowLocal: string,
  nowMs: number,
): ReceptionBoard {
  const columns: Record<ReceptionColumn, ReceptionItem[]> = { arriving: [], waiting: [], in_care: [], done: [] };
  const isToday = nowLocal.slice(0, 10) === date;
  const sorted = appointments
    .filter((item) => item.startsAtLocal.startsWith(`${date}T`))
    .sort((a, b) => a.startsAtLocal.localeCompare(b.startsAtLocal) || a.id.localeCompare(b.id));
  const counts = { total: sorted.length, arriving: 0, waiting: 0, inCare: 0, completed: 0, noShow: 0, cancelled: 0, late: 0 };
  for (const appointment of sorted) {
    const column = COLUMN_OF[appointment.status] ?? "done";
    const late = column === "arriving" && isToday && appointment.startsAtLocal < nowLocal;
    const waitingMinutes = column === "waiting" ? minutesSince(appointment.checkedInAt, nowMs) : null;
    columns[column].push({ appointment, late, waitingMinutes });
    if (column === "arriving") counts.arriving += 1;
    if (column === "waiting") counts.waiting += 1;
    if (column === "in_care") counts.inCare += 1;
    if (appointment.status === "completed") counts.completed += 1;
    if (appointment.status === "no_show") counts.noShow += 1;
    if (appointment.status === "cancelled") counts.cancelled += 1;
    if (late) counts.late += 1;
  }
  return { columns, counts };
}

/** "há 5 min", "há 1 h 20 min". */
export function waitingLabel(minutes: number): string {
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `há ${hours} h ${rest} min` : `há ${hours} h`;
}

/** Link `tel:` só com dígitos e `+`; `null` quando não há telefone utilizável. */
export function telHref(phone: string | null): string | null {
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 8 ? `tel:${digits}` : null;
}

const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/;

/** Chave/URL das consultas do dia, com o profissional escolhido pela recepção (se houver). */
export function receptionDayKey(date: string, providerId: string | null): string {
  const params = new URLSearchParams({ resource: "day", date });
  if (providerId && SAFE_ID.test(providerId)) params.set("provider", providerId);
  return `/api/operations?${params.toString()}`;
}

/** Data AAAA-MM-DD deslocada em dias (calendário puro, sem fuso). */
export function shiftLocalDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
