/**
 * POST /api/auth/verify-email — troca o token de verificação pela marcação de
 * posse do e-mail.
 *
 * Invariantes de segurança:
 * - claim atômico do token (consumed_by_request_id) dentro de um único batch:
 *   a conta não é marcada como verificada sem o claim ter vencido a corrida;
 * - o token só vale para o endereço vigente na emissão — se o e-mail da conta
 *   mudou depois, o token provou posse do endereço antigo e é recusado;
 * - reuso, expiração e token desconhecido respondem o MESMO 400 genérico;
 * - marcar como verificado é idempotente do ponto de vista do usuário: um
 *   segundo clique no mesmo link dá o erro genérico, não um estado quebrado.
 */
import { sha256Hex } from "./_crypto";
import { canonicalEmail, json, type Env } from "./_shared";
import { boundedText, isPlainObject } from "../_request";

function invalidToken(): Response {
  return json(
    {
      error: "Link de confirmação inválido, expirado ou já utilizado.",
      code: "EMAIL_VERIFICATION_TOKEN_INVALID",
    },
    400,
  );
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db)
    return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);

  let parsed: unknown;
  try {
    parsed = await context.request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }
  if (!isPlainObject(parsed)) {
    return json(
      { error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" },
      400,
    );
  }

  const token = boundedText(parsed.token, 256);
  if (token.length < 32) return invalidToken();

  const tokenHash = await sha256Hex(token);
  const nowIso = new Date().toISOString();

  const row = await db
    .prepare(
      `SELECT t.user_id, t.email_at_issue, u.email
         FROM auth_email_verification_tokens t
         JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = ?
          AND t.consumed_at IS NULL
          AND julianday(t.expires_at) > julianday(?)
          AND u.is_active = 1
        LIMIT 1`,
    )
    .bind(tokenHash, nowIso)
    .first<{ user_id: string; email_at_issue: string; email: string }>();
  if (!row) return invalidToken();

  // O token provou posse do endereço vigente na emissão. Se a conta trocou de
  // e-mail depois, confirmar aqui marcaria como verificado um endereço que
  // ninguém provou controlar.
  if (canonicalEmail(row.email) !== canonicalEmail(row.email_at_issue)) {
    return invalidToken();
  }

  const claimId = crypto.randomUUID();
  const auditId = crypto.randomUUID();

  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE auth_email_verification_tokens
              SET consumed_at = ?, consumed_by_request_id = ?
            WHERE token_hash = ?
              AND consumed_at IS NULL
              AND julianday(expires_at) > julianday(?)`,
        )
        .bind(nowIso, claimId, tokenHash, nowIso),
      db
        .prepare(
          `UPDATE users
              SET email_verified_at = ?,
                  email_verified_source = 'self_service_token',
                  updated_at = ?
            WHERE id = ?
              AND EXISTS (
                SELECT 1
                  FROM auth_email_verification_tokens t
                 WHERE t.user_id = users.id
                   AND t.token_hash = ?
                   AND t.consumed_by_request_id = ?
              )`,
        )
        .bind(nowIso, nowIso, row.user_id, tokenHash, claimId),
      db
        .prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
           SELECT ?, NULL, ?, 'email_verified', 'user', ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM auth_email_verification_tokens t
               WHERE t.user_id = ?
                 AND t.token_hash = ?
                 AND t.consumed_by_request_id = ?
            )`,
        )
        .bind(
          auditId,
          row.user_id,
          row.user_id,
          // Metadata sem o endereço: o e-mail é PII e já está na coluna da conta.
          JSON.stringify({ source: "self_service_token" }),
          nowIso,
          row.user_id,
          tokenHash,
          claimId,
        ),
    ]);

    if (
      Number(results[0]?.meta?.changes ?? 0) !== 1 ||
      Number(results[1]?.meta?.changes ?? 0) !== 1 ||
      Number(results[2]?.meta?.changes ?? 0) !== 1
    ) {
      return invalidToken();
    }
  } catch (error) {
    console.error("[auth/verify-email] verification failed", error);
    return json(
      {
        error: "Não foi possível confirmar o e-mail.",
        code: "EMAIL_VERIFICATION_FAILED",
      },
      500,
    );
  }

  return json({
    ok: true,
    message: "E-mail confirmado. Sua conta já pode criar uma clínica.",
  });
};
