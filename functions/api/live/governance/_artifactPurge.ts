/**
 * _artifactPurge.ts — eliminação dos artefatos de exportação no storage privado.
 *
 * O purge de D1 (`_purge.ts`) apaga o dado clínico do titular, mas uma
 * exportação já executada deixou um ciphertext no bucket. Sem este passo, a
 * eliminação apaga o prontuário e preserva uma cópia integral dele no storage:
 * um `completed` que mente sobre o efeito material.
 *
 * Por que antes do purge de D1: `live_export_requests` é tabela preservada,
 * porém o purge SOLTA o `patient_id` dela para liberar o DELETE do paciente
 * (ver GOVERNANCE_PATIENT_REFERENCES). Depois disso não há mais como dizer
 * quais exportações eram daquele titular, então as chaves precisam ser lidas —
 * e os objetos apagados — enquanto o vínculo ainda existe.
 *
 * O `artifact_key` permanece no ledger depois da eliminação. Ele é metadado
 * operacional, não PHI, e apagá-lo destruiria a prova de que a exportação
 * existiu e foi eliminada.
 */
import type { PrivateArtifactStore } from "./_worker-executor";
import type { LgpdScope } from "./_worker-executor";

export type ArtifactPurgeFailure =
  | "EXPORT_ARTIFACT_STORE_REQUIRED"
  | "EXPORT_ARTIFACT_DELETE_FAILED"
  | "EXPORT_ARTIFACT_STILL_PRESENT";

export interface ArtifactPurgeOutcome {
  keysFound: number;
  keysDeleted: number;
}

export interface PurgeExportArtifactsParams {
  db: D1Database;
  /** Null quando o bucket não está provisionado. */
  store: PrivateArtifactStore | null;
  scope: LgpdScope;
  clinicId: string;
  /** Obrigatório quando scope === 'patient'. */
  patientId?: string | null;
}

/**
 * Lê as chaves de artefato do escopo e apaga cada uma, confirmando por readback.
 *
 * Nada a apagar é sucesso, inclusive sem bucket: uma clínica que nunca exportou
 * não pode ser impedida de eliminar por causa de um binding ausente. Mas se há
 * chave registrada e não há bucket, a operação recusa — declarar eliminado o
 * que não se consegue alcançar seria exatamente o falso `completed` que o resto
 * do fluxo impede.
 */
export async function purgeExportArtifacts(
  params: PurgeExportArtifactsParams,
): Promise<{ ok: true; outcome: ArtifactPurgeOutcome } | { ok: false; failure: ArtifactPurgeFailure }> {
  const { db, store, scope, clinicId, patientId } = params;

  // O tenant se repete no predicado final das duas tabelas: o request_id
  // sozinho nunca decide de quem é o artefato.
  const patientScoped = scope === "patient";
  const rows = await db
    .prepare(
      `SELECT DISTINCT j.artifact_key AS artifact_key
         FROM live_lgpd_worker_jobs j
         JOIN live_export_requests e
           ON e.id = j.request_id
          AND e.clinic_id = j.clinic_id
        WHERE j.request_type = 'export'
          AND j.clinic_id = ?
          AND e.clinic_id = ?
          AND j.artifact_key IS NOT NULL
          AND (? = 0 OR e.patient_id = ?)`,
    )
    .bind(clinicId, clinicId, patientScoped ? 1 : 0, patientId ?? null)
    .all<{ artifact_key: string }>();

  const keys = [...new Set((rows.results ?? []).map((row) => row.artifact_key).filter(Boolean))];
  if (keys.length === 0) return { ok: true, outcome: { keysFound: 0, keysDeleted: 0 } };
  if (!store) return { ok: false, failure: "EXPORT_ARTIFACT_STORE_REQUIRED" };

  let keysDeleted = 0;
  for (const key of keys) {
    try {
      await store.delete(key);
    } catch {
      return { ok: false, failure: "EXPORT_ARTIFACT_DELETE_FAILED" };
    }
    // Delete sem erro não é prova de ausência. O readback é o que autoriza
    // dizer que o objeto não existe mais.
    let residual: Uint8Array | null;
    try {
      residual = await store.get(key);
    } catch {
      return { ok: false, failure: "EXPORT_ARTIFACT_DELETE_FAILED" };
    }
    if (residual !== null) return { ok: false, failure: "EXPORT_ARTIFACT_STILL_PRESENT" };
    keysDeleted += 1;
  }

  return { ok: true, outcome: { keysFound: keys.length, keysDeleted } };
}
