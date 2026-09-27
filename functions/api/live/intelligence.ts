import { buildClinicalIntelligence } from "../../../shared/clinical-intelligence";
import { onRequestGet as readLiveEvents } from "./events/index";
import { tenantError, tenantJson, type TenantEnv } from "../tenant/_core";

/**
 * Same persisted source, authentication, membership, billing, encryption and patient
 * ownership checks as LIVE events. The parent LIVE middleware also audits this read.
 * No POST, publishing, prescription, external AI call or parallel patient storage.
 */
export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const url = new URL(context.request.url);
  const clinicId = url.searchParams.get("clinicId") ?? "";
  const patientId = url.searchParams.get("patientId") ?? "";
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(clinicId) || !/^[A-Za-z0-9_-]{1,80}$/.test(patientId)) {
    return tenantError("Contexto clínico inválido.", "VALIDATION_ERROR", 400);
  }
  try {
    const response = await readLiveEvents(context);
    if (!response.ok) return response;
    const body = await response.json() as { data?: unknown };
    if (!Array.isArray(body.data)) throw new Error("SOURCE_INVALID");
    const summary = buildClinicalIntelligence(body.data, { clinicId, patientId }, {
      now: new Date().toISOString(),
      // The canonical reader currently caps its result at 500, without a cursor.
      // At the cap, completeness MUST NOT be inferred from the successful HTTP response.
      sourceWindowComplete: body.data.length < 500,
    });
    return tenantJson(summary);
  } catch {
    // Never log the exception/payload: the source contains clinical information.
    return tenantError("Resumo indisponível. Nenhuma interpretação foi emitida.", "INTELLIGENCE_UNAVAILABLE", 503);
  }
};
