// Cloudflare Pages Function — /api/submissions
// Aceita POST anônimo (escalas familiares); GET requer X-Clinic-Token
// Bindings esperados: env.DB (D1) e env.APP_TOKEN (Secret)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Clinic-Token'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const required = ['instrument_id', 'instrument_title'];
    for (const k of required) if (!body[k]) return json({ ok: false, error: 'missing_' + k }, 400);

    const stmt = env.DB.prepare(`
      INSERT INTO submissions
        (case_code, patient_code, instrument_id, instrument_title, answers_json, raw_score, total_items, source_page, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      body.case_code || null,
      body.patient_code || null,
      body.instrument_id,
      body.instrument_title,
      JSON.stringify(body.answers || {}),
      body.raw_score ?? null,
      body.total_items ?? null,
      body.source_page || null
    );
    const r = await stmt.run();
    return json({ ok: true, id: r.meta?.last_row_id || null });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

export async function onRequestGet({ request, env }) {
  const token = request.headers.get('X-Clinic-Token');
  if (!env.APP_TOKEN || token !== env.APP_TOKEN) return json({ ok: false, error: 'unauthorized' }, 401);
  try {
    const rs = await env.DB.prepare('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 200').all();
    return json({ ok: true, count: rs.results.length, items: rs.results });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
