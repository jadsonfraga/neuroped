import type { ClinicalEvent, ClinicalEventInput } from "@shared/clinical-core";

/**
 * Fonte única dos eventos do Clinical Core para a ficha do paciente.
 *
 * Produção (sessão remota autenticada) só tem o Clinical Core LIVE, isolado por
 * clínica: `GET/POST /api/live/events`. A rota `/api/clinical-core/events`
 * existe apenas no adaptador Express de desenvolvimento/modo local; chamá-la em
 * LIVE caía no 404 das Functions e a ficha mostrava "Indisponível".
 *
 * `clinicId === null` em sessão LIVE significa contexto de clínica ainda não
 * resolvido: a consulta fica desabilitada em vez de cair na rota legada.
 */
export interface ClinicalEventsSource {
  live: boolean;
  clinicId: string | null;
}

export function clinicalEventsQueryKey(patientId: string, source: ClinicalEventsSource): string {
  const patient = encodeURIComponent(patientId);
  return source.live
    ? `/api/live/events?clinicId=${encodeURIComponent(source.clinicId ?? "")}&patientId=${patient}`
    : `/api/clinical-core/events?patient_id=${patient}&days=3650`;
}

export function clinicalEventsReady(patientId: string, source: ClinicalEventsSource): boolean {
  return Boolean(patientId) && (!source.live || Boolean(source.clinicId));
}

interface LiveClinicalEventRow {
  id: string;
  patientId: string;
  eventType: string;
  occurredAt: string;
  encounterId?: string | null;
  provenanceKind?: string;
  provenanceSource?: string;
  payload?: unknown;
  supersedesEventId?: string | null;
  status?: string;
}

/** Converte a linha LIVE (payload/provenanceKind) no formato canônico da UI. */
export function normalizeLiveClinicalEvent(row: LiveClinicalEventRow): ClinicalEvent {
  return {
    id: row.id,
    patientId: row.patientId,
    eventType: row.eventType,
    occurredAt: row.occurredAt,
    ...(row.encounterId ? { encounterId: row.encounterId } : {}),
    ...(row.supersedesEventId ? { supersedesEventId: row.supersedesEventId } : {}),
    provenance: { kind: row.provenanceKind, source: row.provenanceSource },
    data: row.payload && typeof row.payload === "object" ? row.payload : {},
    status: row.status ?? "active",
  } as unknown as ClinicalEvent;
}

const CANONICAL_TYPES = new Set(["encounter", "problem", "medication", "observation", "plan", "outcome", "safety"]);

/** Lê a resposta de qualquer uma das fontes e devolve só eventos canônicos. */
export function clinicalEventsFromResponse(body: unknown, source: ClinicalEventsSource): ClinicalEvent[] {
  const rows = (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) return [];
  if (!source.live) return rows as ClinicalEvent[];
  // LIVE também guarda `document` e `scale_result`, que não são eventos do
  // cockpit; mantê-los quebraria rótulos e derivações por tipo.
  return (rows as LiveClinicalEventRow[])
    .filter((row) => CANONICAL_TYPES.has(row.eventType))
    .map(normalizeLiveClinicalEvent);
}

/** Corpo de escrita: o contrato LIVE exige clinicId e proveniência achatada. */
export function clinicalEventWriteRequest(
  input: ClinicalEventInput,
  source: ClinicalEventsSource,
): { url: string; body: unknown } {
  if (!source.live) return { url: "/api/clinical-core/events", body: input };
  if (!source.clinicId) throw new Error("Selecione a clínica ativa antes de registrar no prontuário.");
  return {
    url: "/api/live/events",
    body: {
      clinicId: source.clinicId,
      patientId: input.patientId,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      ...(input.encounterId ? { encounterId: input.encounterId } : {}),
      ...(input.supersedesEventId ? { supersedesEventId: input.supersedesEventId } : {}),
      provenanceKind: input.provenance.kind,
      provenanceSource: input.provenance.source,
      payload: input.data,
    },
  };
}

export function clinicalEventFromWriteResponse(body: unknown, source: ClinicalEventsSource): ClinicalEvent {
  return source.live
    ? normalizeLiveClinicalEvent(body as LiveClinicalEventRow)
    : (body as ClinicalEvent);
}
