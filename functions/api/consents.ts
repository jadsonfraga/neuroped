/**
 * Consentimentos LGPD no Cloudflare D1.
 *
 * GET  /api/consents — histórico do usuário autenticado.
 * POST /api/consents — registra os três blocos obrigatórios em um único batch
 *                      transacional e auditável.
 */

import { getContextUser } from "./auth/_authorization";
import { isPlainObject } from "./_request";

interface Env {
  DB?: D1Database;
}

export const REQUIRED_CONSENT_TYPES = [
  "termo_uso",
  "politica_privacidade",
  "tratamento_dados_saude",
] as const;

type ConsentType = (typeof REQUIRED_CONSENT_TYPES)[number];

export const CURRENT_CONSENT_VERSION = "2026-05-08-v1";
export const CANONICAL_CONSENTS: Record<
  ConsentType,
  { consentText: string; legalBasis: string; purpose: string }
> = {
  termo_uso: {
    consentText:
      "O NeuroPed EDJ é ferramenta clínica do Dr. Jadson Fraga (CRM-PE 25227, RQE 17756), destinada ao apoio de profissionais de saúde habilitados e pacientes em acompanhamento.",
    legalBasis: "Art. 7º, V — execução de contrato",
    purpose: "Disponibilização da plataforma para uso profissional",
  },
  politica_privacidade: {
    consentText:
      "Dados clínicos e respostas de escalas devem ser tratados com sigilo, controle de acesso e finalidade definida. Quando houver backend disponível, os registros seguem o fluxo seguro da plataforma.",
    legalBasis: "Art. 7º, II — obrigação legal / Art. 7º, V",
    purpose: "Operação do serviço e direitos do titular",
  },
  tratamento_dados_saude: {
    consentText:
      "O tratamento de dados de saúde deve ocorrer apenas para avaliação, acompanhamento, prescrição, documentação clínica e suporte assistencial, sob responsabilidade profissional.",
    legalBasis: "Art. 11, II, f — proteção da saúde por profissional habilitado",
    purpose: "Cuidado clínico individualizado",
  },
};

interface ConsentInput {
  consentType: ConsentType;
  consentVersion: string;
  consentText: string;
  granted: true;
  legalBasis: string;
  purpose: string;
}

export interface ConsentBatchInput {
  version: string;
  acceptedAt: string;
  consents: ConsentInput[];
}

interface ConsentRow {
  id: string;
  batch_id: string;
  consent_type: ConsentType;
  consent_version: string;
  consent_text: string;
  granted: number;
  accepted_at: string;
  legal_basis: string;
  purpose: string;
  created_at: string;
}

type ParseResult =
  | { ok: true; value: ConsentBatchInput }
  | { ok: false; message: string };

const MAX_REQUEST_BYTES = 32 * 1024;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CANONICAL_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const REQUIRED_TYPE_SET = new Set<string>(REQUIRED_CONSENT_TYPES);
const TOP_LEVEL_KEYS = new Set(["version", "acceptedAt", "consents"]);
const CONSENT_KEYS = new Set([
  "consentType",
  "consentVersion",
  "consentText",
  "granted",
  "legalBasis",
  "purpose",
]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function boundedText(
  value: unknown,
  min: number,
  max: number,
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= min && normalized.length <= max
    ? normalized
    : null;
}

/** Exportada para testes de contrato; não confia em campos desconhecidos. */
export function parseConsentBatchPayload(
  input: unknown,
  nowMs = Date.now(),
): ParseResult {
  if (!isPlainObject(input) || !hasOnlyKeys(input, TOP_LEVEL_KEYS)) {
    return { ok: false, message: "Corpo deve ser um objeto JSON estrito." };
  }

  const version = boundedText(input.version, 1, 64);
  if (
    !version ||
    !VERSION_PATTERN.test(version) ||
    version !== CURRENT_CONSENT_VERSION
  ) {
    return { ok: false, message: "Versão de consentimento inválida." };
  }

  const acceptedAt = boundedText(input.acceptedAt, 24, 24);
  const acceptedMs = acceptedAt ? Date.parse(acceptedAt) : Number.NaN;
  if (
    !acceptedAt ||
    !CANONICAL_ISO_PATTERN.test(acceptedAt) ||
    !Number.isFinite(acceptedMs) ||
    new Date(acceptedMs).toISOString() !== acceptedAt ||
    acceptedMs > nowMs + 5 * 60_000
  ) {
    return { ok: false, message: "Data de aceite inválida." };
  }

  if (!Array.isArray(input.consents) || input.consents.length !== 3) {
    return {
      ok: false,
      message: "Envie os três consentimentos obrigatórios em um único lote.",
    };
  }

  const seen = new Set<string>();
  const consents: ConsentInput[] = [];
  for (const candidate of input.consents) {
    if (!isPlainObject(candidate) || !hasOnlyKeys(candidate, CONSENT_KEYS)) {
      return { ok: false, message: "Item de consentimento inválido." };
    }

    const consentType = candidate.consentType;
    const consentVersion = boundedText(candidate.consentVersion, 1, 64);
    const consentText = boundedText(candidate.consentText, 10, 4_000);
    const legalBasis = boundedText(candidate.legalBasis, 3, 500);
    const purpose = boundedText(candidate.purpose, 3, 500);
    const canonical =
      typeof consentType === "string" && REQUIRED_TYPE_SET.has(consentType)
        ? CANONICAL_CONSENTS[consentType as ConsentType]
        : null;
    if (
      typeof consentType !== "string" ||
      !REQUIRED_TYPE_SET.has(consentType) ||
      seen.has(consentType) ||
      consentVersion !== version ||
      !consentText ||
      candidate.granted !== true ||
      !legalBasis ||
      !purpose ||
      consentText !== canonical?.consentText ||
      legalBasis !== canonical?.legalBasis ||
      purpose !== canonical?.purpose
    ) {
      return { ok: false, message: "Conteúdo do consentimento inválido." };
    }

    seen.add(consentType);
    consents.push({
      consentType: consentType as ConsentType,
      consentVersion,
      consentText,
      granted: true,
      legalBasis,
      purpose,
    });
  }

  if (REQUIRED_CONSENT_TYPES.some((type) => !seen.has(type))) {
    return { ok: false, message: "Há consentimento obrigatório ausente." };
  }

  return { ok: true, value: { version, acceptedAt, consents } };
}

function present(row: ConsentRow) {
  return {
    id: row.id,
    batchId: row.batch_id,
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

async function findExistingBatch(
  db: D1Database,
  userId: string,
  version: string,
  acceptedAt: string,
): Promise<ConsentRow[]> {
  const result = await db
    .prepare(
      `SELECT id, batch_id, consent_type, consent_version, consent_text,
              granted, accepted_at, legal_basis, purpose, created_at
         FROM consents
        WHERE user_id = ? AND consent_version = ? AND accepted_at = ?
        ORDER BY consent_type ASC`,
    )
    .bind(userId, version, acceptedAt)
    .all<ConsentRow>();
  return result.results ?? [];
}

function completeBatch(rows: ConsentRow[]): boolean {
  return (
    rows.length === REQUIRED_CONSENT_TYPES.length &&
    REQUIRED_CONSENT_TYPES.every((type) =>
      rows.some((row) => row.consent_type === type),
    )
  );
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  if (!env.DB) {
    return json(
      {
        error: "Backend de consentimentos indisponível.",
        code: "BACKEND_UNAVAILABLE",
      },
      503,
    );
  }
  const user = getContextUser(context);
  if (!user) {
    return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  }

  try {
    const result = await env.DB.prepare(
      `SELECT id, batch_id, consent_type, consent_version, consent_text,
              granted, accepted_at, legal_basis, purpose, created_at
         FROM consents
        WHERE user_id = ?
        ORDER BY accepted_at DESC, consent_type ASC
        LIMIT 100`,
    )
      .bind(user.id)
      .all<ConsentRow>();
    return json({ data: (result.results ?? []).map(present) });
  } catch (error) {
    console.error("[consents.GET] D1 error:", error);
    return json(
      { error: "Erro ao consultar consentimentos.", code: "DB_ERROR" },
      500,
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) {
    return json(
      {
        error: "Backend de consentimentos indisponível.",
        code: "BACKEND_UNAVAILABLE",
      },
      503,
    );
  }
  const user = getContextUser(context);
  if (!user) {
    return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return json(
      { error: "Lote de consentimentos muito grande.", code: "PAYLOAD_TOO_LARGE" },
      413,
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ error: "Não foi possível ler o corpo.", code: "INVALID_JSON" }, 400);
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    return json(
      { error: "Lote de consentimentos muito grande.", code: "PAYLOAD_TOO_LARGE" },
      413,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Corpo JSON inválido.", code: "INVALID_JSON" }, 400);
  }
  const parsed = parseConsentBatchPayload(body);
  if (!parsed.ok) {
    return json(
      { error: parsed.message, code: "VALIDATION_ERROR" },
      400,
    );
  }

  try {
    const existing = await findExistingBatch(
      env.DB,
      user.id,
      parsed.value.version,
      parsed.value.acceptedAt,
    );
    if (completeBatch(existing)) {
      return json({
        batchId: existing[0].batch_id,
        version: parsed.value.version,
        acceptedAt: parsed.value.acceptedAt,
        consents: existing.map(present),
        idempotent: true,
      });
    }
    if (existing.length > 0) {
      return json(
        {
          error: "Lote anterior está inconsistente; revisão administrativa necessária.",
          code: "INCONSISTENT_BATCH",
        },
        409,
      );
    }

    const batchId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const ip = (
      request.headers.get("CF-Connecting-IP") ??
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
      ""
    ).slice(0, 64) || null;
    const userAgent = (request.headers.get("User-Agent") ?? "").slice(0, 512) || null;
    const rows = parsed.value.consents.map((consent) => ({
      ...consent,
      id: crypto.randomUUID(),
    }));
    const statements = rows.map((row) =>
      env.DB!.prepare(
        `INSERT INTO consents
          (id, batch_id, user_id, consent_type, consent_version, consent_text,
           granted, accepted_at, legal_basis, purpose, ip, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        row.id,
        batchId,
        user.id,
        row.consentType,
        row.consentVersion,
        row.consentText,
        parsed.value.acceptedAt,
        row.legalBasis,
        row.purpose,
        ip,
        userAgent,
        createdAt,
      ),
    );
    statements.push(
      env.DB.prepare(
        `INSERT INTO audit_logs
          (id, action, resource, resource_id, user_id, ip, details, created_at)
         VALUES (?, 'consent.batch.granted', 'consent_batch', ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        batchId,
        user.id,
        ip,
        JSON.stringify({
          version: parsed.value.version,
          acceptedAt: parsed.value.acceptedAt,
          consentTypes: REQUIRED_CONSENT_TYPES,
          count: rows.length,
        }),
        createdAt,
      ),
    );

    await env.DB.batch(statements);
    return json(
      {
        batchId,
        version: parsed.value.version,
        acceptedAt: parsed.value.acceptedAt,
        consents: rows.map((row) => ({
          id: row.id,
          batchId,
          consentType: row.consentType,
          consentVersion: row.consentVersion,
          granted: true,
          acceptedAt: parsed.value.acceptedAt,
          createdAt,
        })),
        idempotent: false,
      },
      201,
    );
  } catch (error) {
    // Corrida entre dois reenvios idênticos: a restrição UNIQUE pode vencer
    // depois da consulta inicial. Se o lote completo existe, responda de forma
    // idempotente em vez de apresentar um falso erro ao usuário.
    try {
      const existing = await findExistingBatch(
        env.DB,
        user.id,
        parsed.value.version,
        parsed.value.acceptedAt,
      );
      if (completeBatch(existing)) {
        return json({
          batchId: existing[0].batch_id,
          version: parsed.value.version,
          acceptedAt: parsed.value.acceptedAt,
          consents: existing.map(present),
          idempotent: true,
        });
      }
    } catch {
      // Preserva o erro original abaixo.
    }
    console.error("[consents.POST] D1 error:", error);
    return json(
      { error: "Erro ao registrar consentimentos.", code: "DB_ERROR" },
      500,
    );
  }
};
