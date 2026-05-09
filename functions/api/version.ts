/**
 * GET /api/version
 * Cloudflare Pages Function — Versão do app e informações do schema
 */

interface Env {
  DB?: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (_context) => {
  const response = {
    app: {
      name: "NeuroPed EDJ",
      version: "2.0.0-fullstack",
      buildDate: "2026-05-08",
      branch: "feat/auditoria-total-ui-backend-memoria",
    },
    api: {
      version: "1",
      endpoints: [
        "GET /api/health",
        "GET /api/version",
        "GET /api/patients",
        "POST /api/patients",
        "GET /api/patients/:id",
        "PATCH /api/patients/:id",
        "GET /api/scales/results/:patientId",
        "POST /api/scales/results",
      ],
    },
    features: {
      semanticSearch: false,
      embedding: false,
      cloudStorage: false,
      smtp: false,
      realPatientsEnabled: false,
      mode: "DEMO_HOMOLOGACAO",
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
};
