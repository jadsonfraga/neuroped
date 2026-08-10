import {
  BOACONSULTA_MAPPING_VERSION,
  boaConsultaPatientFingerprint,
  maskCpf,
  parseBoaConsultaExport,
  type BoaConsultaParseResult,
} from "../../../../shared/boaconsulta-import";
import {
  authorizationError,
  canWriteClinicalData,
  getContextUser,
} from "../../auth/_authorization";
import {
  ImportCryptoConfigurationError,
  encryptImportBytesToText,
  encryptImportText,
  importCryptoKey,
  sha256Hex,
} from "./_crypto";

interface Env {
  DB?: D1Database;
  NEUROPED_IMPORT_ENCRYPTION_KEY?: string;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_RECORDS = 5_000;
const FILE_CHUNK_BYTES = 64 * 1024;
const D1_BATCH_SIZE = 40;
const ALLOWED_EXTENSIONS = new Set(["csv", "json", "txt", "pdf"]);
const ALLOWED_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/json",
  "application/pdf",
  "application/octet-stream",
  "",
]);

type ImportMode = "preview" | "store";

type StoredBatchRow = {
  id: string;
  source_extension: string | null;
  source_mime_type: string;
  source_size_bytes: number;
  source_sha256: string;
  source_storage: string;
  source_chunk_count: number;
  mapping_version: string;
  status: string;
  record_count: number;
  duplicate_count: number;
  warning_count: number;
  created_at: string;
  completed_at: string | null;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function error(message: string, code: string, status: number, details?: unknown): Response {
  return json({ error: message, code, ...(details == null ? {} : { details }) }, status);
}

function extensionOf(filename: string): string {
  const match = filename.trim().toLocaleLowerCase("pt-BR").match(/\.([a-z0-9]{1,8})$/);
  return match?.[1] ?? "";
}

function resolveMimeType(file: File, extension: string): string {
  const explicit = file.type.toLocaleLowerCase("pt-BR").trim();
  if (explicit && explicit !== "application/octet-stream") return explicit;
  if (extension === "csv") return "text/csv";
  if (extension === "json") return "application/json";
  if (extension === "txt") return "text/plain";
  if (extension === "pdf") return "application/pdf";
  return explicit;
}

function warningCount(result: BoaConsultaParseResult): number {
  return (
    result.warnings.length +
    result.records.reduce((total, record) => total + record.warnings.length, 0)
  );
}

function previewPayload(result: BoaConsultaParseResult) {
  const counts = { patient: 0, encounter: 0, document: 0, unknown: 0 };
  for (const record of result.records) counts[record.recordType] += 1;

  return {
    format: result.format,
    mappingVersion: result.mappingVersion,
    recordCount: result.records.length,
    warningCount: warningCount(result),
    typeCounts: counts,
    warnings: result.warnings,
    preview: result.records.slice(0, 12).map((record) => ({
      ordinal: record.ordinal,
      recordType: record.recordType,
      patientName: record.normalized.patientName,
      birthDate: record.normalized.birthDate,
      cpf: maskCpf(record.normalized.cpfDigits),
      occurredAt: record.normalized.occurredAt,
      diagnosisCode: record.normalized.diagnosisCode,
      hasClinicalText: Boolean(record.normalized.clinicalText),
      warnings: record.warnings,
    })),
  };
}

function sourceFormatForPdf(): BoaConsultaParseResult {
  return {
    format: "pdf",
    mappingVersion: BOACONSULTA_MAPPING_VERSION,
    records: [],
    warnings: [
      "PDF será preservado integralmente e criptografado. A extração clínica estruturada exige um adaptador validado contra uma exportação real do BoaConsulta.",
    ],
  };
}

async function parseFile(
  file: File,
  mimeType: string,
  extension: string,
): Promise<BoaConsultaParseResult> {
  if (extension === "pdf" || mimeType === "application/pdf") return sourceFormatForPdf();
  const text = await file.text();
  return parseBoaConsultaExport(text, mimeType, file.name);
}

async function audit(
  env: Env,
  request: Request,
  userId: string,
  action: string,
  resourceId: string,
  details: Record<string, unknown>,
): Promise<void> {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs (action, resource, resource_id, user_id, ip, details)
       VALUES (?, 'external_import', ?, ?, ?, ?)`,
    )
      .bind(
        action,
        resourceId,
        userId,
        request.headers.get("CF-Connecting-IP"),
        JSON.stringify(details),
      )
      .run();
  } catch (cause) {
    console.error("[boaconsulta-import.audit]", cause);
  }
}

function presentBatch(row: StoredBatchRow) {
  return {
    id: row.id,
    source: "boaconsulta",
    extension: row.source_extension,
    mimeType: row.source_mime_type,
    sizeBytes: row.source_size_bytes,
    sourceFingerprint: row.source_sha256.slice(0, 12),
    storage: row.source_storage,
    chunkCount: row.source_chunk_count,
    mappingVersion: row.mapping_version,
    status: row.status,
    recordCount: row.record_count,
    duplicateCount: row.duplicate_count,
    warningCount: row.warning_count,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function batchSelectSql(): string {
  return `SELECT id, source_extension, source_mime_type, source_size_bytes, source_sha256,
                 source_storage, source_chunk_count, mapping_version, status, record_count,
                 duplicate_count, warning_count, created_at, completed_at
            FROM external_import_batches`;
}

async function executeInBatches(
  db: D1Database,
  statements: D1PreparedStatement[],
): Promise<void> {
  for (let index = 0; index < statements.length; index += D1_BATCH_SIZE) {
    await db.batch(statements.slice(index, index + D1_BATCH_SIZE));
  }
}

async function cleanupBatch(db: D1Database, batchId: string, ownerUserId: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM external_import_records WHERE batch_id = ?").bind(batchId),
    db.prepare("DELETE FROM external_import_file_chunks WHERE batch_id = ?").bind(batchId),
    db.prepare("DELETE FROM external_import_batches WHERE id = ? AND owner_user_id = ?")
      .bind(batchId, ownerUserId),
  ]);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  if (!env.DB) return error("Banco clínico indisponível.", "STORAGE_UNAVAILABLE", 503);

  const user = getContextUser(context);
  if (!user) return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) {
    return authorizationError("Perfil sem permissão para importações clínicas.", "FORBIDDEN", 403);
  }

  try {
    const result = await env.DB.prepare(
      `${batchSelectSql()}
        WHERE owner_user_id = ? AND source_system = 'boaconsulta'
        ORDER BY created_at DESC
        LIMIT 50`,
    )
      .bind(user.id)
      .all<StoredBatchRow>();
    return json({ data: (result.results ?? []).map(presentBatch) });
  } catch (cause) {
    console.error("[boaconsulta-import.GET]", cause);
    return error(
      "Bridge do BoaConsulta ainda não foi provisionado no banco.",
      "IMPORT_SCHEMA_UNAVAILABLE",
      503,
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) return error("Banco clínico indisponível.", "STORAGE_UNAVAILABLE", 503);

  const user = getContextUser(context);
  if (!user) return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!canWriteClinicalData(user)) {
    return authorizationError("Perfil sem permissão para importações clínicas.", "FORBIDDEN", 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Envie o arquivo como multipart/form-data.", "INVALID_MULTIPART", 400);
  }

  const modeRaw = form.get("mode");
  const mode: ImportMode = modeRaw === "store" ? "store" : "preview";
  const candidate = form.get("file");
  if (!(candidate instanceof File)) {
    return error("Arquivo de exportação ausente.", "FILE_REQUIRED", 400);
  }
  if (candidate.size <= 0) return error("Arquivo vazio.", "EMPTY_FILE", 400);
  if (candidate.size > MAX_FILE_BYTES) {
    return error("Arquivo excede o limite de 8 MB deste bridge.", "FILE_TOO_LARGE", 413);
  }

  const extension = extensionOf(candidate.name);
  const mimeType = resolveMimeType(candidate, extension);
  if (
    !ALLOWED_EXTENSIONS.has(extension) ||
    !ALLOWED_MIME_TYPES.has(candidate.type.toLocaleLowerCase("pt-BR"))
  ) {
    return error("Formato não suportado. Use CSV, JSON, TXT ou PDF.", "UNSUPPORTED_FILE_TYPE", 415);
  }

  let parsed: BoaConsultaParseResult;
  try {
    parsed = await parseFile(candidate, mimeType, extension);
  } catch (cause) {
    console.error("[boaconsulta-import.parse]", cause);
    return error("Não foi possível interpretar a exportação.", "PARSE_ERROR", 400);
  }

  if (parsed.records.length > MAX_RECORDS) {
    return error(
      `Exportação contém mais de ${MAX_RECORDS} registros; divida em lotes menores.`,
      "TOO_MANY_RECORDS",
      413,
    );
  }

  const bytes = await candidate.arrayBuffer();
  const sourceHash = await sha256Hex(bytes);
  const preview = previewPayload(parsed);

  if (mode === "preview") {
    await audit(
      env,
      request,
      user.id,
      "external_import.boaconsulta.preview",
      sourceHash.slice(0, 24),
      {
        sizeBytes: candidate.size,
        extension,
        format: parsed.format,
        recordCount: parsed.records.length,
        warningCount: preview.warningCount,
        mappingVersion: parsed.mappingVersion,
      },
    );
    return json({ mode: "preview", sourceFingerprint: sourceHash.slice(0, 12), ...preview });
  }

  let key: CryptoKey;
  try {
    key = await importCryptoKey(env.NEUROPED_IMPORT_ENCRYPTION_KEY);
  } catch (cause) {
    if (cause instanceof ImportCryptoConfigurationError) {
      return error(cause.message, "IMPORT_ENCRYPTION_NOT_CONFIGURED", 503);
    }
    throw cause;
  }

  try {
    const existing = await env.DB.prepare(
      `${batchSelectSql()}
        WHERE owner_user_id = ? AND source_system = 'boaconsulta' AND source_sha256 = ?
        LIMIT 1`,
    )
      .bind(user.id, sourceHash)
      .first<StoredBatchRow>();

    if (existing) {
      await audit(env, request, user.id, "external_import.boaconsulta.duplicate", existing.id, {
        sourceFingerprint: sourceHash.slice(0, 12),
      });
      return json({ mode: "store", duplicateFile: true, batch: presentBatch(existing), ...preview });
    }
  } catch (cause) {
    console.error("[boaconsulta-import.duplicate-check]", cause);
    return error(
      "Bridge do BoaConsulta ainda não foi provisionado no banco.",
      "IMPORT_SCHEMA_UNAVAILABLE",
      503,
    );
  }

  const batchId = `bc-${crypto.randomUUID()}`;
  const filenameEncrypted = await encryptImportText(key, candidate.name);
  const chunkStatements: D1PreparedStatement[] = [];

  for (
    let offset = 0, chunkIndex = 0;
    offset < bytes.byteLength;
    offset += FILE_CHUNK_BYTES, chunkIndex += 1
  ) {
    const end = Math.min(offset + FILE_CHUNK_BYTES, bytes.byteLength);
    const plaintextChunk = bytes.slice(offset, end);
    const encryptedChunk = await encryptImportBytesToText(key, plaintextChunk);
    chunkStatements.push(
      env.DB.prepare(
        `INSERT INTO external_import_file_chunks
          (id, batch_id, chunk_index, plaintext_bytes, ciphertext, iv, cipher_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      ).bind(
        `bc-chunk-${crypto.randomUUID()}`,
        batchId,
        chunkIndex,
        end - offset,
        encryptedChunk.ciphertext,
        encryptedChunk.iv,
      ),
    );
  }

  const seenHashes = new Set<string>();
  const recordStatements: D1PreparedStatement[] = [];
  let duplicateCount = 0;
  let perRecordWarnings = 0;

  for (const record of parsed.records) {
    perRecordWarnings += record.warnings.length;
    const rawJson = JSON.stringify(record.raw);
    const normalizedJson = JSON.stringify(record.normalized);
    const recordHash = await sha256Hex(rawJson);

    if (seenHashes.has(recordHash)) {
      duplicateCount += 1;
      continue;
    }
    seenHashes.add(recordHash);

    const fingerprint = boaConsultaPatientFingerprint(record.normalized);
    const patientKeyHash = fingerprint.replace(/\|/g, "")
      ? await sha256Hex(fingerprint)
      : null;
    const rawEncrypted = await encryptImportText(key, rawJson);
    const normalizedEncrypted = await encryptImportText(key, normalizedJson);
    const recordStatus = record.warnings.length ? "needs_review" : "staged";

    recordStatements.push(
      env.DB.prepare(
        `INSERT INTO external_import_records
          (id, batch_id, ordinal, record_type, source_record_hash, external_patient_key_hash,
           raw_ciphertext, raw_iv, normalized_ciphertext, normalized_iv, cipher_version,
           status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`,
      ).bind(
        `bc-record-${crypto.randomUUID()}`,
        batchId,
        record.ordinal,
        record.recordType,
        recordHash,
        patientKeyHash,
        rawEncrypted.ciphertext,
        rawEncrypted.iv,
        normalizedEncrypted.ciphertext,
        normalizedEncrypted.iv,
        recordStatus,
      ),
    );
  }

  const totalWarnings = parsed.warnings.length + perRecordWarnings;
  const status = totalWarnings > 0 || parsed.format === "pdf" ? "needs_review" : "staged";
  let batchStored = false;

  try {
    await env.DB.prepare(
      `INSERT INTO external_import_batches
        (id, owner_user_id, source_system, source_filename_ciphertext, source_filename_iv,
         source_extension, source_mime_type, source_size_bytes, source_sha256,
         source_storage, source_chunk_count, mapping_version, status, record_count,
         duplicate_count, warning_count, created_at)
       VALUES (?, ?, 'boaconsulta', ?, ?, ?, ?, ?, ?, 'd1_chunks', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
      .bind(
        batchId,
        user.id,
        filenameEncrypted.ciphertext,
        filenameEncrypted.iv,
        extension || null,
        mimeType,
        candidate.size,
        sourceHash,
        chunkStatements.length,
        parsed.mappingVersion,
        status,
        recordStatements.length,
        duplicateCount,
        totalWarnings,
      )
      .run();
    batchStored = true;

    await executeInBatches(env.DB, chunkStatements);
    await executeInBatches(env.DB, recordStatements);

    const stored = await env.DB.prepare(
      `${batchSelectSql()}
        WHERE id = ? AND owner_user_id = ?
        LIMIT 1`,
    )
      .bind(batchId, user.id)
      .first<StoredBatchRow>();

    await audit(env, request, user.id, "external_import.boaconsulta.stage", batchId, {
      sourceFingerprint: sourceHash.slice(0, 12),
      storage: "d1_chunks",
      chunkCount: chunkStatements.length,
      extension,
      format: parsed.format,
      recordCount: recordStatements.length,
      duplicateCount,
      warningCount: totalWarnings,
      mappingVersion: parsed.mappingVersion,
    });

    return json(
      {
        mode: "store",
        duplicateFile: false,
        batch: stored ? presentBatch(stored) : { id: batchId, status },
        ...preview,
      },
      201,
    );
  } catch (cause) {
    console.error("[boaconsulta-import.POST]", cause);
    if (batchStored) {
      try {
        await cleanupBatch(env.DB, batchId, user.id);
      } catch (cleanupCause) {
        console.error("[boaconsulta-import.cleanup-db]", cleanupCause);
      }
    }
    return error(
      "Falha ao armazenar a importação; nenhuma promoção clínica foi realizada.",
      "IMPORT_STORE_FAILED",
      500,
    );
  }
};
