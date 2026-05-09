interface Env {
  DB: D1Database;
  APP_TOKEN?: string;
}

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const target = new URL(request.url).origin;
  if (origin) return origin === target;
  if (referer) {
    try { return new URL(referer).origin === target; } catch { return false; }
  }
  return false;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!sameOrigin(request)) {
      return jsonError("Origem nao autorizada.", 403);
    }

    const contentLength = Number(request.headers.get("content-length") || "0");

    if (contentLength > 250_000) {
      return jsonError("Payload muito grande.", 413);
    }

    const body = await request.json<any>();

    if (!body.instrument_id) {
      return jsonError("instrument_id e obrigatorio.");
    }

    const answers = body.answers_json ?? body.answers;

    if (!answers) {
      return jsonError("answers ou answers_json e obrigatorio.");
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const answersJson =
      typeof answers === "string" ? answers : JSON.stringify(answers);

    await env.DB.prepare(
      `
      INSERT INTO submissions (
        id,
        created_at,
        updated_at,
        case_code,
        patient_code,
        instrument_id,
        instrument_title,
        instrument_group,
        answers_json,
        raw_score,
        total_items,
        source_page,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        id,
        now,
        now,
        body.case_code || null,
        body.patient_code || null,
        body.instrument_id,
        body.instrument_title || null,
        body.instrument_group || null,
        answersJson,
        Number.isFinite(body.raw_score) ? body.raw_score : null,
        Number.isFinite(body.total_items) ? body.total_items : null,
        body.source_page || null,
        body.notes || null
      )
      .run();

    await env.DB.prepare(
      `
      INSERT INTO audit_logs (
        id,
        created_at,
        action,
        entity,
        entity_id,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        crypto.randomUUID(),
        now,
        "submission.created",
        "submission",
        id,
        JSON.stringify({
          instrument_id: body.instrument_id,
          case_code: body.case_code || null
        })
      )
      .run();

    return Response.json({
      ok: true,
      saved: true,
      id,
      created_at: now
    });
  } catch (error) {
    console.error("submissions POST error:", error);
    return jsonError("Erro ao salvar resposta.", 500);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = request.headers.get("X-Clinic-Token") || "";

  if (!env.APP_TOKEN || !timingSafeEqual(token, env.APP_TOKEN)) {
    return jsonError("Nao autorizado.", 401);
  }

  const url = new URL(request.url);
  const caseCode = url.searchParams.get("case_code");

  let query = `
    SELECT
      id,
      created_at,
      updated_at,
      case_code,
      patient_code,
      instrument_id,
      instrument_title,
      instrument_group,
      raw_score,
      total_items,
      source_page,
      notes
    FROM submissions
  `;

  const params: string[] = [];

  if (caseCode) {
    query += ` WHERE case_code = ? `;
    params.push(caseCode);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const stmt = env.DB.prepare(query);
  const result = params.length
    ? await stmt.bind(...params).all()
    : await stmt.all();

  return Response.json({
    ok: true,
    count: result.results?.length || 0,
    results: result.results || []
  });
};
