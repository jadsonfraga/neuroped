import {
  ensureScaleShareSchema,
  json,
  normalizeShareScales,
  presentShare,
  randomAccessToken,
  SHARE_TTL_MS,
  tokenHash,
} from "./_scaleShare";
import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
} from "./auth/_authorization";
import { isPlainObject } from "./_request";

interface Env {
  DB?: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
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
  if (!isPlainObject(body))
    return json(
      { error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" },
      400,
    );

  const patientId =
    typeof body.patientId === "string" ? body.patientId.trim() : "";
  const scales = normalizeShareScales(body.scales);
  if (!patientId || patientId.length > 128 || !scales) {
    return json(
      {
        error: "Informe um paciente e ao menos uma escala válida.",
        code: "VALIDATION_ERROR",
      },
      400,
    );
  }

  const user = getContextUser(context);
  if (!user)
    return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  if (!canWriteClinicalData(user)) {
    return json(
      { error: "Perfil sem permissão para criar links.", code: "FORBIDDEN" },
      403,
    );
  }

  try {
    await ensureScaleShareSchema(env.DB);
    const access = await getPatientAccess(env.DB, patientId, user);
    if (!access.exists)
      return json(
        { error: "Paciente não encontrado.", code: "NOT_FOUND" },
        404,
      );
    if (!access.allowed)
      return json(
        { error: "Sem permissão para este paciente.", code: "FORBIDDEN" },
        403,
      );

    const token = randomAccessToken();
    const id = `share-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SHARE_TTL_MS).toISOString();
    await env.DB.prepare(
      `
      INSERT INTO scale_share_sessions_demo
        (id, patient_id, created_by_user_id, token_hash, selected_scales, status, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `,
    )
      .bind(
        id,
        patientId,
        user.id,
        await tokenHash(token),
        JSON.stringify(scales),
        expiresAt,
        createdAt,
      )
      .run();

    await env.DB.prepare(
      `
      INSERT INTO audit_logs (id, action, resource, resource_id, user_id, details, created_at)
      VALUES (?, 'share.create', 'scale_share_session', ?, ?, ?, ?)
    `,
    )
      .bind(
        crypto.randomUUID(),
        id,
        user.id,
        JSON.stringify({
          patientId,
          scaleCount: scales.length,
          scaleIds: scales.map((scale) => scale.id),
        }),
        createdAt,
      )
      .run();

    return json(
      {
        ...presentShare(
          {
            id,
            patient_id: patientId,
            created_by_user_id: user.id,
            token_hash: "",
            selected_scales: JSON.stringify(scales),
            status: "pending",
            expires_at: expiresAt,
            submitted_at: null,
            respondent_name: null,
            result_ids: null,
            created_at: createdAt,
          },
          scales,
        ),
        token,
      },
      201,
    );
  } catch (error) {
    console.error("[scale-shares.POST]", error);
    return json(
      { error: "Não foi possível criar o link.", code: "SHARE_CREATE_FAILED" },
      500,
    );
  }
};
