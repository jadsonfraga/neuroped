/**
 * NeuroPed · /api/certificado
 * Status: NOT_IMPLEMENTED — stub honesto até integração backend (MP9.0 WS1).
 * Roadmap: /MIGRATION_BACKEND.md
 */
export async function onRequest({ request }) {
  const body = {
    error: "not_implemented",
    endpoint: "/api/certificado",
    description: "Gera\u00e7\u00e3o de certificado de uso da plataforma",
    expected_payload: {"patient_id": "string", "template": "string"},
    status: "em_implantacao",
    roadmap: "https://github.com/jadsonfraga/neuroped/blob/main/MIGRATION_BACKEND.md",
    contact: "jadsonfraga@hotmail.com",
    ts: new Date().toISOString()
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 501,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-neuroped-status": "not-implemented",
      "x-roadmap": "/MIGRATION_BACKEND.md"
    }
  });
}
