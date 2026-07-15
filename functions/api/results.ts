/**
 * POST /api/results — registra resultado de escala vindo da UI.
 *
 * Adaptador: a UI envia o corpo em camelCase com a transcrição integral das
 * perguntas e respostas. Escore, classificação e interpretação não fazem parte
 * da entrega; a análise é realizada pelo profissional.
 * Esta function traduz para a tabela `scale_results_demo` do D1. Existe para que
 * o path /api/results (usado pela UI) seja servido pelo D1 — antes caía no proxy
 * (Railway) e retornava 404.
 */

interface Env {
  DB?: D1Database;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "escala"
  );
}

function normalizeResponses(
  value: unknown,
): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const question = String((item as any).question ?? "").trim();
      const answer = String((item as any).answer ?? "").trim();
      if (!question) return null;
      return { question, answer: answer || "Não respondida" };
    })
    .filter(
      (item): item is { question: string; answer: string } => item !== null,
    );
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return json(
      { error: "Corpo da requisição inválido.", code: "INVALID_JSON" },
      400,
    );
  }

  const patient_id = String(body.patientId ?? body.patient_id ?? "").trim();
  // Sem paciente vinculado (ex.: aplicação avulsa de escala): não há onde
  // persistir (scale_results_demo exige patient_id). Responde suave, sem erro.
  if (!patient_id) {
    return json(
      {
        stored: false,
        note: "Resultado não vinculado a paciente — não persistido.",
      },
      200,
    );
  }

  const scale_name = String(
    body.scaleName ?? body.scale_name ?? "Escala",
  ).trim();
  const scale_id = String(
    body.scaleId ?? body.scale_id ?? slug(scale_name),
  ).trim();
  const responses = normalizeResponses(body.responses ?? body.answers);
  if (responses.length === 0) {
    return json(
      {
        error: "Envie todas as perguntas e respostas por extenso.",
        code: "RESPONSES_REQUIRED",
      },
      400,
    );
  }
  const details = JSON.stringify({
    responses,
    patientAge: body.patientAge ?? null,
  });

  const id = `scale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const applied_at = String(body.applied_at ?? new Date().toISOString());

  const payload = {
    id,
    patient_id,
    scale_id,
    scale_name,
    responses,
    applied_at,
  };

  if (!env.DB) {
    return json(
      {
        ...payload,
        mode: "demo",
        note: "Banco não configurado — registro simulado.",
      },
      201,
    );
  }

  try {
    await env.DB.prepare(
      `INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, score, interpretation, details, is_demo, applied_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    )
      .bind(
        id,
        patient_id,
        scale_id,
        scale_name,
        null,
        null,
        details,
        applied_at,
      )
      .run();
    return json({ ...payload, mode: "db" }, 201);
  } catch (err) {
    console.error("[results.POST] DB error:", err);
    return json(
      { error: "Erro ao registrar resultado.", code: "DB_ERROR" },
      500,
    );
  }
};
