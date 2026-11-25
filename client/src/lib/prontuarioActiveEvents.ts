interface ActiveEvent {
  id: string;
  clinicId: string;
  patientId: string;
  status: "active";
  eventType: string;
  occurredAt: string;
  encounterId?: string | null;
  payload?: Record<string, unknown>;
}

function isActiveEvent(value: unknown, clinicId: string, patientId: string): value is ActiveEvent {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<ActiveEvent>;
  return typeof row.id === "string" && Boolean(row.id)
    && row.clinicId === clinicId && row.patientId === patientId && row.status === "active"
    && typeof row.eventType === "string" && typeof row.occurredAt === "string";
}

/** Nunca devolve uma parte do prontuário como se fosse a leitura completa. */
export async function loadProntuarioActiveEvents(
  clinicId: string,
  patientId: string,
  load: (path: string) => Promise<unknown>,
  isCancelled: () => boolean,
): Promise<{ data: ActiveEvent[] }> {
  const data: ActiveEvent[] = [];
  const seenIds = new Set<string>();
  const seenCursors = new Set<string>();
  const params = new URLSearchParams({ clinicId, patientId, status: "active" });
  for (let page = 0; page < 100; page++) {
    if (isCancelled()) throw new Error("Leitura do prontuário cancelada.");
    const payload = await load(`/api/live/events?${params}`);
    if (isCancelled()) throw new Error("Leitura do prontuário cancelada.");
    const body = payload as { data?: unknown; nextCursor?: unknown } | null;
    if (!body || !Array.isArray(body.data) || body.data.length > 100) {
      throw new Error("Página de eventos do prontuário inválida.");
    }
    for (const row of body.data) {
      if (!isActiveEvent(row, clinicId, patientId) || seenIds.has(row.id)) {
        throw new Error("Eventos do prontuário inválidos ou repetidos.");
      }
      seenIds.add(row.id);
      data.push(row);
    }
    const cursor = body.nextCursor;
    if (cursor === null) return { data };
    if (typeof cursor !== "string" || !cursor || cursor.length > 1024 || seenCursors.has(cursor) || !body.data.length) {
      throw new Error("Paginação do prontuário incompleta.");
    }
    seenCursors.add(cursor);
    params.set("cursor", cursor);
  }
  throw new Error("Leitura do prontuário excedeu o limite seguro de páginas.");
}
