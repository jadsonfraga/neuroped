import {
  ensureScaleShareSchema,
  json,
  parseScales,
  presentShare,
  tokenHash,
  type ScaleShareRow,
} from "../_scaleShare";

interface Env {
  DB?: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB)
    return json(
      { error: "Persistência indisponível.", code: "DB_REQUIRED" },
      503,
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido.", code: "INVALID_JSON" }, 400);
  }
  const token =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof (body as Record<string, unknown>).token === "string"
      ? ((body as Record<string, unknown>).token as string).trim()
      : "";
  if (token.length < 20 || token.length > 256) {
    return json({ error: "Link inválido.", code: "VALIDATION_ERROR" }, 400);
  }

  try {
    await ensureScaleShareSchema(env.DB);
    const row = await env.DB.prepare(
      `
      SELECT id, patient_id, created_by_user_id, token_hash, selected_scales,
             status, expires_at, submitted_at, respondent_name, result_ids, created_at
        FROM scale_share_sessions_demo
       WHERE token_hash = ?
       LIMIT 1
    `,
    )
      .bind(await tokenHash(token))
      .first<ScaleShareRow>();
    if (!row)
      return json({ error: "Link não encontrado.", code: "NOT_FOUND" }, 404);

    const scales = parseScales(row.selected_scales);
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
    if (
      row.status !== "pending" ||
      Date.parse(row.expires_at) <= Date.now() ||
      scales.length === 0
    ) {
      return json(
        { error: "Este link expirou ou foi revogado.", code: "SHARE_EXPIRED" },
        410,
      );
    }
    return json(presentShare(row, scales));
  } catch (error) {
    console.error("[scale-shares.open]", error);
    return json(
      { error: "Não foi possível abrir o link.", code: "SHARE_OPEN_FAILED" },
      500,
    );
  }
};
