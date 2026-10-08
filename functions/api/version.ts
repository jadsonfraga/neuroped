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
    // Prontidão de runtime (cripto clínica, LGPD, banco, autenticação) é
    // calculada a partir do ambiente real em GET /api/health. Este endpoint
    // publicava aqui um bloco fixo ("DEMO_HOMOLOGACAO", realPatientsEnabled:
    // false, smtp: false) que contradizia a produção; foi removido.
    readiness: "/api/health",
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
};
