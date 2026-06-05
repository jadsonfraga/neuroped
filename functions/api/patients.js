/**
 * NeuroPed · /api/patients
 * Status: NOT_IMPLEMENTED — stub honesto até integração backend (MP9.0 WS1).
 * Roadmap: /MIGRATION_BACKEND.md
 */
export async function onRequest({ request }) {
  const body = {
    error: "not_implemented",
    endpoint: "/api/patients",
    description: "Lista/cria pacientes do m\u00e9dico autenticado",
    expected_payload: {"name": "string", "dob": "YYYY-MM-DD", "sex": "M|F|O"},
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
