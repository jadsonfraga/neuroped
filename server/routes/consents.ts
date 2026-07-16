import type { Express, Request } from "express";
import { requireAuth } from "../middleware/auth.js";
import { writeRateLimit } from "../middleware/security.js";
import { getAuditContextFromRequest } from "../lib/audit.js";
import {
  MAX_CONSENT_REQUEST_BYTES,
  REQUIRED_CONSENT_TYPES,
  parseConsentBatchPayload,
  type ConsentBatchInput,
  type RequiredConsentType,
} from "../lib/consentContract.js";
import { sqlite } from "../storage.js";

interface ConsentDatabaseRow {
  id: string;
  batch_id: string | null;
  consent_type: RequiredConsentType;
  consent_version: string;
  consent_text: string;
  granted: number;
  accepted_at: string;
  legal_basis: string | null;
  purpose: string | null;
  created_at: string;
}

export interface PersistedConsentBatch {
  batchId: string;
  version: string;
  acceptedAt: string;
  consents: ReturnType<typeof presentConsent>[];
  idempotent: boolean;
}

export interface RecordConsentBatchParams {
  userId: string;
  input: ConsentBatchInput;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string;
}

export class ConsentBatchConflictError extends Error {
  constructor() {
    super(
      "Lote anterior está inconsistente; revisão administrativa necessária.",
    );
  }
}

function findExistingBatch(
  database: typeof sqlite,
  userId: string,
  version: string,
  acceptedAt: string,
): ConsentDatabaseRow[] {
  return database
    .prepare(
      `SELECT id, batch_id, consent_type, consent_version, consent_text,
              granted, accepted_at, legal_basis, purpose,
              granted_at AS created_at
         FROM consents
        WHERE user_id = ? AND consent_version = ? AND accepted_at = ?
        ORDER BY consent_type ASC`,
    )
    .all(userId, version, acceptedAt) as ConsentDatabaseRow[];
}

function completeBatch(rows: ConsentDatabaseRow[]): boolean {
  return (
    rows.length === REQUIRED_CONSENT_TYPES.length &&
    REQUIRED_CONSENT_TYPES.every((type) =>
      rows.some((row) => row.consent_type === type),
    )
  );
}

function presentConsent(row: ConsentDatabaseRow) {
  return {
    id: row.id,
    batchId: row.batch_id ?? row.id,
    consentType: row.consent_type,
    consentVersion: row.consent_version,
    consentText: row.consent_text,
    granted: row.granted === 1,
    acceptedAt: row.accepted_at,
    legalBasis: row.legal_basis,
    purpose: row.purpose,
    createdAt: row.created_at,
  };
}

function presentBatch(
  rows: ConsentDatabaseRow[],
  version: string,
  acceptedAt: string,
  idempotent: boolean,
): PersistedConsentBatch {
  return {
    batchId: rows[0]?.batch_id ?? rows[0]?.id ?? "",
    version,
    acceptedAt,
    consents: rows.map(presentConsent),
    idempotent,
  };
}

/**
 * Consulta, grava os três itens e registra a auditoria na mesma transação.
 * A restrição UNIQUE do banco torna reenvios concorrentes idempotentes.
 */
export function recordConsentBatch(
  params: RecordConsentBatchParams,
  database: typeof sqlite = sqlite,
): PersistedConsentBatch {
  const createdAt = params.createdAt ?? new Date().toISOString();
  const transaction = database.transaction(() => {
    const existing = findExistingBatch(
      database,
      params.userId,
      params.input.version,
      params.input.acceptedAt,
    );
    if (completeBatch(existing)) {
      return presentBatch(
        existing,
        params.input.version,
        params.input.acceptedAt,
        true,
      );
    }
    if (existing.length > 0) throw new ConsentBatchConflictError();

    const batchId = crypto.randomUUID();
    const insert = database.prepare(
      `INSERT INTO consents
        (id, batch_id, user_id, patient_id, consent_type, consent_version,
         consent_text, granted, granted_at, accepted_at, revoked_at,
         ip_address, user_agent, legal_basis, purpose)
       VALUES (?, ?, ?, NULL, ?, ?, ?, 1, ?, ?, NULL, ?, ?, ?, ?)`,
    );

    for (const consent of params.input.consents) {
      insert.run(
        crypto.randomUUID(),
        batchId,
        params.userId,
        consent.consentType,
        consent.consentVersion,
        consent.consentText,
        createdAt,
        params.input.acceptedAt,
        params.ipAddress ?? null,
        params.userAgent ?? null,
        consent.legalBasis,
        consent.purpose,
      );
    }

    database
      .prepare(
        `INSERT INTO audit_logs
          (id, user_id, event_type, target_type, target_id, metadata,
           ip_address, user_agent, success, created_at)
         VALUES (?, ?, 'consent.batch.granted', 'consent_batch', ?, ?, ?, ?, 1, ?)`,
      )
      .run(
        crypto.randomUUID(),
        params.userId,
        batchId,
        JSON.stringify({
          version: params.input.version,
          acceptedAt: params.input.acceptedAt,
          consentTypes: REQUIRED_CONSENT_TYPES,
          count: params.input.consents.length,
        }),
        params.ipAddress ?? null,
        params.userAgent ?? null,
        createdAt,
      );

    const rows = findExistingBatch(
      database,
      params.userId,
      params.input.version,
      params.input.acceptedAt,
    );
    if (!completeBatch(rows)) {
      throw new Error("Lote de consentimentos não foi persistido por completo.");
    }
    return presentBatch(
      rows,
      params.input.version,
      params.input.acceptedAt,
      false,
    );
  });

  try {
    return transaction();
  } catch (error) {
    if (error instanceof ConsentBatchConflictError) throw error;

    // Outro processo pode ter concluído o mesmo lote entre a leitura e a
    // aquisição do write lock. Após a restrição UNIQUE vencer a corrida,
    // convertemos o replay em sucesso idempotente.
    try {
      const concurrent = findExistingBatch(
        database,
        params.userId,
        params.input.version,
        params.input.acceptedAt,
      );
      if (completeBatch(concurrent)) {
        return presentBatch(
          concurrent,
          params.input.version,
          params.input.acceptedAt,
          true,
        );
      }
    } catch {
      // Preserva a causa original para diagnóstico e resposta DB_ERROR.
    }
    throw error;
  }
}

export function listOwnConsents(
  userId: string,
  database: typeof sqlite = sqlite,
): ReturnType<typeof presentConsent>[] {
  const rows = database
    .prepare(
      `SELECT id, batch_id, consent_type, consent_version, consent_text,
              granted, COALESCE(accepted_at, granted_at) AS accepted_at,
              legal_basis, purpose, granted_at AS created_at
         FROM consents
        WHERE user_id = ?
        ORDER BY COALESCE(accepted_at, granted_at) DESC, consent_type ASC
        LIMIT 100`,
    )
    .all(userId) as ConsentDatabaseRow[];
  return rows.map(presentConsent);
}

function requestBodyIsTooLarge(req: Request): boolean {
  const contentLength = Number(req.headers["content-length"] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_CONSENT_REQUEST_BYTES) {
    return true;
  }
  if (Buffer.isBuffer(req.rawBody)) {
    return req.rawBody.byteLength > MAX_CONSENT_REQUEST_BYTES;
  }
  try {
    return (
      Buffer.byteLength(JSON.stringify(req.body ?? null), "utf8") >
      MAX_CONSENT_REQUEST_BYTES
    );
  } catch {
    return true;
  }
}

export function registerConsentRoutes(app: Express): void {
  app.post(
    "/api/consents",
    requireAuth,
    writeRateLimit,
    (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      if (requestBodyIsTooLarge(req)) {
        return res.status(413).json({
          error: "Lote de consentimentos muito grande.",
          code: "PAYLOAD_TOO_LARGE",
        });
      }

      const parsed = parseConsentBatchPayload(req.body);
      if (!parsed.ok) {
        return res.status(400).json({
          error: parsed.message,
          code: "VALIDATION_ERROR",
        });
      }

      const context = getAuditContextFromRequest(req);
      try {
        const result = recordConsentBatch({
          userId: req.user!.id,
          input: parsed.value,
          ipAddress: context.ipAddress?.slice(0, 64),
          userAgent: context.userAgent?.slice(0, 512),
        });
        return res.status(result.idempotent ? 200 : 201).json(result);
      } catch (error) {
        if (error instanceof ConsentBatchConflictError) {
          return res.status(409).json({
            error: error.message,
            code: "INCONSISTENT_BATCH",
          });
        }
        console.error("[consents.POST] SQLite error:", error);
        return res.status(500).json({
          error: "Erro ao registrar consentimentos.",
          code: "DB_ERROR",
        });
      }
    },
  );

  app.get("/api/consents", requireAuth, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      return res.json({ data: listOwnConsents(req.user!.id) });
    } catch (error) {
      console.error("[consents.GET] SQLite error:", error);
      return res.status(500).json({
        error: "Erro ao consultar consentimentos.",
        code: "DB_ERROR",
      });
    }
  });
}
