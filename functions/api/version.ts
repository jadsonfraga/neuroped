/**
 * GET /api/version
 * Cloudflare Pages Function — Versão do app e informações do schema
 */
import { BUILD_INFO } from "./_buildInfo";

interface Env {
  DB?: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (_context) => {
  const response = {
    app: {
      name: "NeuroPed EDJ",
      version: BUILD_INFO.version,
      buildDate: BUILD_INFO.buildDate,
      commit: BUILD_INFO.commit,
      branch: BUILD_INFO.branch,
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
