/**
 * agendaUnifiedDay.ts — visão unificada do dia da recepção (issue 1064, etapa D).
 * Funções puras, testáveis sem navegador.
 *
 * Só leitura e só no navegador: cada profissional continua sendo buscado pelo mesmo
 * pedido da etapa C (`/api/operations?resource=dashboard&provider=<id>`), então cada
 * pedido é exatamente um par (profissional, clínica) validado no servidor (vínculo,
 * membership, billing). Nada aqui concede acesso nem abre endpoint novo.
 *
 * Invariante central: uma linha nunca recebe o rótulo de um profissional que não é o
 * dono da consulta. Se o servidor devolver uma agenda cujo dono não é o profissional
 * pedido, a fonte inteira é descartada como erro em vez de ser mostrada com o nome
 * errado.
 */
import type { Appointment, OperationsDashboard } from "@shared/operations";
import type { ProviderChoice } from "./agendaProvider";

/** Cada profissional custa um painel completo; acima disso a visão não combina. */
export const UNIFIED_DAY_MAX_PROVIDERS = 8;

/** Mesmas situações que a grade do dia esconde. */
const HIDDEN_STATUSES: ReadonlyArray<Appointment["status"]> = ["cancelled", "no_show"];

export interface UnifiedDaySource {
  choice: ProviderChoice;
  data: OperationsDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
}

export interface UnifiedDayRow {
  /** Estável e único entre agendas: o id de consulta é por profissional. */
  key: string;
  providerId: string;
  providerName: string;
  appointment: Appointment;
}

export type UnifiedProviderState =
  | { providerId: string; providerName: string; status: "loading" }
  | { providerId: string; providerName: string; status: "error" }
  | { providerId: string; providerName: string; status: "ok"; count: number };

export interface UnifiedDay {
  rows: UnifiedDayRow[];
  providers: UnifiedProviderState[];
  /** Fusos distintos entre as agendas carregadas: os horários não são comparáveis. */
  timezones: string[];
}

/** Os primeiros N por nome; o servidor já ordena por nome e id. */
export function selectUnifiedProviders(
  choices: readonly ProviderChoice[],
  max = UNIFIED_DAY_MAX_PROVIDERS,
): { shown: ProviderChoice[]; hidden: number } {
  const limit = Number.isInteger(max) && max > 0 ? max : UNIFIED_DAY_MAX_PROVIDERS;
  return { shown: choices.slice(0, limit), hidden: Math.max(0, choices.length - limit) };
}

/** A agenda é do profissional pedido? Só então as consultas dela podem ser rotuladas. */
function ownsAgenda(choice: ProviderChoice, data: OperationsDashboard): boolean {
  return data.access?.providerUserId === choice.id;
}

export function buildUnifiedDay(date: string, sources: readonly UnifiedDaySource[]): UnifiedDay {
  const rows: UnifiedDayRow[] = [];
  const providers: UnifiedProviderState[] = [];
  const timezones = new Set<string>();

  for (const source of sources) {
    const { choice, data } = source;
    if (!data) {
      providers.push({
        providerId: choice.id,
        providerName: choice.name,
        status: source.isError ? "error" : "loading",
      });
      continue;
    }
    if (!ownsAgenda(choice, data)) {
      providers.push({ providerId: choice.id, providerName: choice.name, status: "error" });
      continue;
    }
    if (data.profile?.timezone) timezones.add(data.profile.timezone);

    let count = 0;
    for (const appointment of data.appointments ?? []) {
      if (appointment.providerUserId !== choice.id) continue;
      if (!appointment.startsAtLocal.startsWith(`${date}T`)) continue;
      if (HIDDEN_STATUSES.includes(appointment.status)) continue;
      rows.push({
        key: `${choice.id}:${appointment.id}`,
        providerId: choice.id,
        providerName: choice.name,
        appointment,
      });
      count += 1;
    }
    providers.push({ providerId: choice.id, providerName: choice.name, status: "ok", count });
  }

  rows.sort(
    (a, b) =>
      a.appointment.startsAtLocal.localeCompare(b.appointment.startsAtLocal) ||
      a.providerName.localeCompare(b.providerName, "pt-BR") ||
      a.key.localeCompare(b.key),
  );

  return { rows, providers, timezones: [...timezones].sort() };
}
