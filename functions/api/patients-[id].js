/**
 * NeuroPed · /api/patients/[id]
 * Status: NOT_IMPLEMENTED — stub honesto até integração backend (MP9.0 WS1).
 */
export async function onRequest({ params }) {
  const body = {
    error: "not_implemented",
    endpoint: "/api/patients/" + (params.id || ":id"),
    description: "GET/PATCH/DELETE paciente individual",
    status: "em_implantacao",
    roadmap: "https://github.com/jadsonfraga/neuroped/blob/main/MIGRATION_BACKEND.md",
    ts: new Date().toISOString()
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 501,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-neuroped-status": "not-implemented"
    }
  });
}
