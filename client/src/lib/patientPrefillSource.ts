import { loadAllPatientResults } from "@/lib/patientResultsPagination";
import { apiRequest } from "@/lib/queryClient";
import type { ClinicalEventsSource } from "@/lib/clinicalEventsSource";

/**
 * Pré-preenchimento de documentos a partir do paciente.
 *
 * Em sessão LIVE os pacientes vivem em /api/live/patients (por clínica). O
 * cadastro legado /api/patients (tabelas *_demo, por dono) não tem esses IDs:
 * Laudo, Laudo em um clique e Evolução falhavam em silêncio e o médico
 * redigitava nome, nascimento e CID — justamente onde um erro de digitação
 * compromete o documento.
 */
export type PatientDataSource = ClinicalEventsSource;

export interface PatientPrefill {
  name: string;
  birthDate: string;
  diagnosisCode: string;
  guardianName: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function patientProfileUrl(patientId: string, source: PatientDataSource): string {
  const patient = encodeURIComponent(patientId);
  if (!source.live) return `/api/patients/${patient}`;
  if (!source.clinicId) throw new Error("Clínica ativa não resolvida.");
  return `/api/live/patients/${patient}?clinicId=${encodeURIComponent(source.clinicId)}`;
}

export function patientPrefillFromPayload(payload: unknown, source: PatientDataSource): PatientPrefill {
  const body = (payload ?? {}) as Record<string, any>;
  const patient = source.live ? body.profile ?? {} : body.patient ?? body.data ?? body;
  return {
    name: text(patient?.name),
    birthDate: text(patient?.birthDate),
    diagnosisCode: text(patient?.diagnosisCode),
    guardianName: text(patient?.guardianName),
  };
}

export async function loadPatientPrefill(patientId: string, source: PatientDataSource): Promise<PatientPrefill> {
  const response = await apiRequest("GET", patientProfileUrl(patientId, source));
  return patientPrefillFromPayload(await response.json(), source);
}

/**
 * Avaliações LIVE guardam respostas, não escore nem classificação. O formato
 * devolvido segue o legado, com escore nulo e classificação vazia: nada é
 * inventado, e as telas tratam a escala como "sem escore". Versões corrigidas
 * (supersedidas) ficam de fora.
 */
export function liveAssessmentsToResults(payload: unknown): unknown[] {
  const rows = (payload as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) return [];
  // O GET devolve também versões supersedidas ('corrected'): só a aplicação
  // vigente entra no laudo e na evolução, senão a correção conta em dobro.
  return rows
    .filter((assessment: any) => (assessment?.status ?? "active") === "active")
    .map((assessment: any) => ({
    id: assessment?.id,
    scaleName: assessment?.payload?.title ?? assessment?.instrumentId ?? "",
    instrumentId: assessment?.instrumentId,
    scaleVersion: assessment?.instrumentVersion,
    totalScore: null,
    classification: "",
    appliedAt: assessment?.appliedAt,
    createdAt: assessment?.appliedAt,
    status: assessment?.status,
  }));
}

export async function loadPatientScaleResults(patientId: string, source: PatientDataSource): Promise<unknown[]> {
  if (!source.live) return loadAllPatientResults(patientId);
  if (!source.clinicId) throw new Error("Clínica ativa não resolvida.");
  const response = await apiRequest(
    "GET",
    `/api/live/assessments?clinicId=${encodeURIComponent(source.clinicId)}&patientId=${encodeURIComponent(patientId)}`,
  );
  return liveAssessmentsToResults(await response.json());
}
