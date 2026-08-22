import {
  ensureScaleShareSchema,
  json,
  parseScales,
  tokenHash,
  type ScaleShareRow,
} from "../_scaleShare";
import {
  CLINICAL_INPUT_LIMITS,
  createClinicalRecordId,
  normalizeClinicalResponses,
} from "../_clinicalValidation";
import { isPlainObject } from "../_request";

interface Env {
  DB?: D1Database;
}

interface ShareResultInput {
  scaleId: string;
  patientAge?: string | null;
  responses: Array<{ question: string; answer?: string | null }>;
}

interface ShareSubmitBody {
  token: string;
  respondentName?: string | null;
  results: ShareResultInput[];
}

function isBoundedText(
  value: unknown,
  min: number,
  max: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max
  );
}

function parseBody(value: unknown): ShareSubmitBody | null {
  if (!isPlainObject(value)) return null;
  if (!isBoundedText(value.token, 20, 256)) return null;
  if (value.respondentName != null && typeof value.respondentName !== "string")
    return null;
  if (
    !Array.isArray(value.results) ||
    value.results.length < 1 ||
    value.results.length > 8
  )
    return null;

  const results: ShareResultInput[] = [];
  for (const raw of value.results) {
    if (!isPlainObject(raw) || !isBoundedText(raw.scaleId, 1, 128)) return null;
    if (
      !Array.isArray(raw.responses) ||
      raw.responses.length < 1 ||
      raw.responses.length > CLINICAL_INPUT_LIMITS.responseItems
    )
      return null;
    if (raw.patientAge != null && typeof raw.patientAge !== "string")
      return null;
    results.push({
      scaleId: raw.scaleId.trim(),
      patientAge:
        typeof raw.patientAge === "string"
          ? raw.patientAge.trim().slice(0, 80) || null
          : null,
      responses: raw.responses as ShareResultInput["responses"],
    });
  }
  return {
    token: value.token.trim(),
    respondentName:
      typeof value.respondentName === "string"
        ? value.respondentName.trim().slice(0, 160) || null
        : null,
    results,
  };
}

function responseForScale(input: ShareResultInput) {
  return normalizeClinicalResponses(input.responses);
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const db = env.DB;
  if (!db)
    return json(
      { error: "Persistência indisponível.", code: "DB_REQUIRED" },
      503,
    );

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return json({ error: "JSON inválido.", code: "INVALID_JSON" }, 400);
  }
  const body = parseBody(rawBody);
  if (!body)
    return json(
      {
        error: "Revise as respostas antes de enviar.",
        code: "VALIDATION_ERROR",
      },
      400,
    );

  try {
    await ensureScaleShareSchema(db);
    const row = await db
      .prepare(
        `
      SELECT id, patient_id, created_by_user_id, token_hash, selected_scales,
             status, expires_at, submitted_at, respondent_name, result_ids, created_at
        FROM scale_share_sessions_demo
       WHERE token_hash = ?
       LIMIT 1
    `,
      )
      .bind(await tokenHash(body.token))
      .first<ScaleShareRow>();
    if (!row)
      return json({ error: "Link não encontrado.", code: "NOT_FOUND" }, 404);
    if (row.status === "submitted") {
      return json(
        {
          error: "Este link já foi respondido.",
          code: "SHARE_ALREADY_SUBMITTED",
          submittedAt: row.submitted_at,
        },
        409,
      );
    }
    if (row.status !== "pending" || Date.parse(row.expires_at) <= Date.now()) {
      return json(
        { error: "Este link expirou ou foi revogado.", code: "SHARE_EXPIRED" },
        410,
      );
    }

    const scales = parseScales(row.selected_scales);
    const resultsById = new Map<string, ShareResultInput>();
    for (const result of body.results) {
      if (resultsById.has(result.scaleId)) {
        return json(
          {
            error: "Uma escala foi enviada mais de uma vez.",
            code: "SCALES_MISMATCH",
          },
          400,
        );
      }
      resultsById.set(result.scaleId, result);
    }
    if (
      scales.length === 0 ||
      scales.length !== resultsById.size ||
      scales.some((scale) => !resultsById.has(scale.id))
    ) {
      return json(
        {
          error:
            "O conjunto de respostas não corresponde às escalas deste link.",
          code: "SCALES_MISMATCH",
        },
        400,
      );
    }

    const normalizedById = new Map<
      string,
      Array<{ question: string; answer: string }>
    >();
    for (const scale of scales) {
      const input = resultsById.get(scale.id)!;
      const normalized = responseForScale(input);
      if (!normalized.ok)
        return json({ error: normalized.message, code: normalized.code }, 400);
      normalizedById.set(scale.id, normalized.responses);
    }

    const submittedAt = new Date().toISOString();
    const resultIds = scales.map(() => createClinicalRecordId("scale"));
    const shareResultIds = JSON.stringify(resultIds);
    const statements: D1PreparedStatement[] = [
      db
        .prepare(
          `
        UPDATE scale_share_sessions_demo
           SET status = 'submitted', submitted_at = ?, respondent_name = ?, result_ids = ?
         WHERE id = ? AND status = 'pending' AND expires_at > ?
      `,
        )
        .bind(
          submittedAt,
          body.respondentName ?? null,
          shareResultIds,
          row.id,
          submittedAt,
        ),
    ];

    scales.forEach((scale, index) => {
      const input = resultsById.get(scale.id)!;
      statements.push(
        db
          .prepare(
            `
          INSERT INTO scale_results_demo
            (id, patient_id, scale_id, scale_name, score, interpretation, details, is_demo, applied_at, created_at)
          SELECT ?, patient_id, ?, ?, NULL, NULL, ?, 1, ?, ?
            FROM scale_share_sessions_demo
           WHERE id = ? AND status = 'submitted' AND result_ids = ? AND expires_at > ?
        `,
          )
          .bind(
            resultIds[index],
            scale.id,
            scale.name,
            JSON.stringify({
              responses: normalizedById.get(scale.id),
              patientAge: input.patientAge ?? null,
              source: "family-link",
              respondentName: body.respondentName ?? null,
            }),
            submittedAt,
            submittedAt,
            row.id,
            shareResultIds,
            submittedAt,
          ),
      );
    });

    const outcome = await db.batch(statements);
    const claimed = Number(outcome[0]?.meta?.changes ?? 0);
    if (claimed !== 1) {
      return json(
        {
          error: "Este link já foi respondido ou expirou.",
          code: "SHARE_ALREADY_SUBMITTED",
        },
        409,
      );
    }

    await db
      .prepare(
        `
      INSERT INTO audit_logs (id, action, resource, resource_id, details, created_at)
      VALUES (?, 'share.submit', 'scale_share_session', ?, ?, ?)
    `,
      )
      .bind(
        crypto.randomUUID(),
        row.id,
        JSON.stringify({
          scaleCount: scales.length,
          resultCount: resultIds.length,
          respondentProvided: Boolean(body.respondentName),
        }),
        submittedAt,
      )
      .run();

    return json({ status: "submitted", submittedAt, resultIds }, 201);
  } catch (error) {
    console.error("[scale-shares.submit]", error);
    return json(
      {
        error: "Não foi possível guardar as respostas. Tente novamente.",
        code: "PERSISTENCE_FAILED",
      },
      500,
    );
  }
};
