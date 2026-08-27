import { clinicMemoryPatchSchema } from "../../../../shared/live-clinic-memory";
import { prepareSaasAudit, tenantError, tenantJson } from "../../tenant/_core";
import { encryptClinicalJson, requireLiveConfiguration, resolveMemoryAccess, tokenHashes, auditForMemory, decryptRow, currentClinicalEncryptionVersion, type MemoryBody, type MemoryRow } from "./_core";

async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function rowQuery() {
  return `SELECT id, clinic_id, scope, kind, patient_id, appointment_id, author_user_id,
                  updated_by_user_id, body_encrypted, encryption_version, client_request_id,
                  revision, status, created_at, updated_at
             FROM live_clinic_memory`;
}

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const id = String(context.params.id ?? "").trim();
  if (!id) return tenantError("memoryId é obrigatório.", "VALIDATION_ERROR", 400);
  const raw = await parseJson(context.request);
  const parsed = clinicMemoryPatchSchema.safeParse(raw);
  if (!parsed.success) return tenantJson({ error: "Dados inválidos para atualização.", code: "VALIDATION_ERROR", issues: parsed.error.issues }, 400);
  const input = parsed.data;
  const access = await resolveMemoryAccess(context, input.clinicId, undefined, "write");
  if (access instanceof Response) return access;
  const { db, user, membership } = access;
  const current = await db.prepare(`${rowQuery()} WHERE id = ? AND clinic_id = ? LIMIT 1`).bind(id, input.clinicId).first<MemoryRow>();
  if (!current) return tenantError("Memória não encontrada.", "NOT_FOUND", 404);
  if (current.kind === "clinical" && membership.role === "assistant") return tenantError("Secretaria não pode editar memória clínica.", "TENANT_FORBIDDEN", 403);
  if (input.expectedRevision !== current.revision) return tenantJson({ error: "A memória foi alterada por outra pessoa.", code: "REVISION_CONFLICT", currentRevision: current.revision }, 409);

  const body = await decryptRow(context.env, current);
  const nextBody: MemoryBody = {
    title: input.title ?? body.title,
    content: input.content ?? body.content,
    category: input.category === undefined ? body.category : input.category,
    tags: input.tags ?? body.tags,
    source: body.source,
  };
  const nextRevision = current.revision + 1;
  const now = new Date().toISOString();
  const bodyEncrypted = await encryptClinicalJson(context.env, input.clinicId, `clinic-memory:${id}`, nextBody);
  const terms = await tokenHashes(context.env, input.clinicId, [nextBody.title, nextBody.content, nextBody.category ?? "", ...nextBody.tags]);
  const nextStatus = input.status ?? current.status;
  await db.batch([
    db.prepare(`UPDATE live_clinic_memory
                   SET body_encrypted = ?, encryption_version = ?, updated_by_user_id = ?,
                       revision = ?, status = ?, updated_at = ?
                 WHERE id = ? AND clinic_id = ? AND revision = ?`)
      .bind(bodyEncrypted, currentClinicalEncryptionVersion(context.env), user.id, nextRevision, nextStatus, now, id, input.clinicId, current.revision),
    db.prepare("DELETE FROM live_clinic_memory_terms WHERE clinic_id = ? AND memory_id = ?").bind(input.clinicId, id),
    ...terms.map((term) => db.prepare("INSERT INTO live_clinic_memory_terms (clinic_id, memory_id, token_hash) VALUES (?, ?, ?)").bind(input.clinicId, id, term)),
    auditForMemory(db, { clinicId: input.clinicId, actorUserId: user.id, memoryId: id, action: nextStatus === "archived" ? "archived" : current.status === "archived" ? "restored" : "updated", revision: nextRevision }),
    prepareSaasAudit(db, { clinicId: input.clinicId, actorUserId: user.id, action: `clinic_memory.${nextStatus === "archived" ? "archived" : "updated"}`, targetType: "clinic_memory", targetId: id, metadata: { revision: nextRevision } }, true),
  ]);
  const updated = await db.prepare(`${rowQuery()} WHERE id = ? AND clinic_id = ? LIMIT 1`).bind(id, input.clinicId).first<MemoryRow>();
  if (!updated) return tenantError("Memória atualizada, mas não pôde ser confirmada.", "DB_ERROR", 500);
  return tenantJson({ item: await decryptRow(context.env, updated), sync: { persisted: true, storage: "cloud-d1", clinicId: input.clinicId, revision: nextRevision, updatedAt: now } });
};

export const onRequestDelete: PagesFunction<TenantEnv> = async (context) => {
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const id = String(context.params.id ?? "").trim();
  const url = new URL(context.request.url);
  const clinicId = url.searchParams.get("clinicId")?.trim() || "";
  const revision = Number(url.searchParams.get("revision"));
  if (!id || !clinicId || !Number.isInteger(revision) || revision < 1) return tenantError("memoryId, clinicId e revision são obrigatórios.", "VALIDATION_ERROR", 400);
  const access = await resolveMemoryAccess(context, clinicId, undefined, "write");
  if (access instanceof Response) return access;
  const { db, user, membership } = access;
  const current = await db.prepare(`${rowQuery()} WHERE id = ? AND clinic_id = ? LIMIT 1`).bind(id, clinicId).first<MemoryRow>();
  if (!current) return tenantError("Memória não encontrada.", "NOT_FOUND", 404);
  if (current.kind === "clinical" && membership.role === "assistant") return tenantError("Secretaria não pode arquivar memória clínica.", "TENANT_FORBIDDEN", 403);
  if (current.revision !== revision) return tenantJson({ error: "A memória foi alterada por outra pessoa.", code: "REVISION_CONFLICT", currentRevision: current.revision }, 409);
  const nextRevision = current.revision + 1;
  const now = new Date().toISOString();
  const result = await db.batch([
    db.prepare(`UPDATE live_clinic_memory SET status = 'archived', updated_by_user_id = ?, revision = ?, updated_at = ?
                 WHERE id = ? AND clinic_id = ? AND revision = ? AND status = 'active'`).bind(user.id, nextRevision, now, id, clinicId, revision),
    auditForMemory(db, { clinicId, actorUserId: user.id, memoryId: id, action: "archived", revision: nextRevision }),
    prepareSaasAudit(db, { clinicId, actorUserId: user.id, action: "clinic_memory.archived", targetType: "clinic_memory", targetId: id, metadata: { revision: nextRevision } }, true),
  ]);
  if ((result[0]?.meta?.changes ?? 0) !== 1) return tenantError("A memória já foi arquivada ou mudou de versão.", "REVISION_CONFLICT", 409);
  return tenantJson({ archived: true, sync: { persisted: true, storage: "cloud-d1", clinicId, revision: nextRevision, updatedAt: now } });
};
