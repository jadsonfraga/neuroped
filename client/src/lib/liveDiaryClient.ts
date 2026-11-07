import { apiRequest } from "@/lib/queryClient";
import type { LiveDiaryReporter } from "@shared/live-diaries";

/**
 * Cliente dos diários LIVE (/api/live/diaries). Os registros vivem no servidor,
 * cifrados por clínica e vinculados ao paciente; nada é gravado no navegador.
 */
export interface LiveDiaryRow {
  id: string;
  patientId: string;
  diaryId: string;
  entryDate: string;
  reportedBy: string;
  fields: Record<string, string>;
  status: string;
  createdAt: string;
}

/** Entrada no formato que o DiarioClinico já desenha (data em `date`). */
export interface LiveDiaryEntryView {
  id: string;
  createdAt: number;
  date: string;
  reportedBy: string;
  [key: string]: string | number;
}

export const REPORTER_LABELS: Record<LiveDiaryReporter, string> = {
  family: "Família",
  patient: "Paciente",
  school: "Escola",
  therapist: "Terapeuta",
  clinician: "Equipe clínica",
};

export function liveDiaryEntriesFromResponse(body: unknown): LiveDiaryEntryView[] {
  const rows = (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) return [];
  return (rows as LiveDiaryRow[])
    .filter((row) => row && typeof row.id === "string" && row.status === "active")
    .map((row) => {
      const created = Date.parse(row.createdAt);
      const fields = row.fields && typeof row.fields === "object" ? row.fields : {};
      return {
        ...fields,
        id: row.id,
        createdAt: Number.isFinite(created) ? created : 0,
        date: row.entryDate,
        reportedBy: row.reportedBy,
      };
    });
}

/** Separa a data (vai em entryDate) dos demais campos preenchidos. */
export function liveDiaryWriteBody(params: {
  clinicId: string;
  patientId: string;
  diaryId: string;
  reportedBy: LiveDiaryReporter;
  form: Record<string, string>;
  fallbackDate: string;
}) {
  const { date, ...rest } = params.form;
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(rest)) {
    const text = String(value ?? "").trim();
    if (text) fields[key] = text;
  }
  return {
    clinicId: params.clinicId,
    patientId: params.patientId,
    diaryId: params.diaryId,
    entryDate: (date || params.fallbackDate).trim(),
    reportedBy: params.reportedBy,
    fields,
  };
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export async function listLiveDiaryEntries(clinicId: string, patientId: string, diaryId: string): Promise<LiveDiaryEntryView[]> {
  const response = await fetchLive(
    "GET",
    `/api/live/diaries?clinicId=${encodeURIComponent(clinicId)}&patientId=${encodeURIComponent(patientId)}&diaryId=${encodeURIComponent(diaryId)}`,
  );
  if (!response.ok) throw new Error(await errorMessage(response, "Não foi possível carregar o diário."));
  return liveDiaryEntriesFromResponse(await response.json());
}

export async function createLiveDiaryEntry(body: ReturnType<typeof liveDiaryWriteBody>): Promise<void> {
  const response = await fetchLive("POST", "/api/live/diaries", body);
  if (!response.ok) throw new Error(await errorMessage(response, "Não foi possível salvar no prontuário."));
}

export async function voidLiveDiaryEntry(clinicId: string, id: string): Promise<void> {
  const response = await fetchLive("PATCH", "/api/live/diaries", { clinicId, id, action: "void" });
  if (!response.ok) throw new Error(await errorMessage(response, "Não foi possível anular o registro."));
}

/** apiRequest lança em status não-2xx; aqui o erro do servidor vira mensagem legível. */
async function fetchLive(method: string, url: string, body?: unknown): Promise<Response> {
  try {
    return await apiRequest(method, url, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const match = message.match(/^\d{3}: (.*)$/s);
    const text = match ? parseServerError(match[1]) : null;
    throw new Error(text ?? "Serviço do diário indisponível. Nada foi gravado.", { cause: error });
  }
}

function parseServerError(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    return typeof parsed?.error === "string" ? parsed.error : null;
  } catch {
    return null;
  }
}
