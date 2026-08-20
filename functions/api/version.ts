/**
 * GET /api/version
 * Cloudflare Pages Function — Versão do app e informações do schema
 */
import { BUILD_INFO } from "./_buildInfo";
import { clinicalLgpdReady } from "./tenant/_core";
import { clinicalCryptoReady } from "./tenant/_crypto";

interface Env {
  DB?: D1Database;
  CLINICAL_LIVE_ENABLED?: string;
  CLINICAL_DATA_KEY?: string;
  CLINICAL_DATA_KEY_ID?: string;
  CLINICAL_DATA_KEY_PREVIOUS?: string;
  CLINICAL_DATA_KEY_PREVIOUS_ID?: string;
  CLINICAL_INDEX_KEY?: string;
  CLINICAL_LGPD_READY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const clinicalLiveFlag = context.env.CLINICAL_LIVE_ENABLED?.trim().toLowerCase() === "true";
  const clinicalCryptoConfigured = clinicalCryptoReady(context.env);
  const clinicalLgpdConfigured = clinicalLgpdReady(context.env);
  const clinicalLiveReady =
    clinicalLiveFlag && Boolean(context.env.DB) && clinicalCryptoConfigured && clinicalLgpdConfigured;
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
        ...(clinicalLiveReady
          ? [
              "GET /api/live/patients?clinicId=:id",
              "POST /api/live/patients",
              "GET /api/live/events?clinicId=:id&patientId=:id",
              "POST /api/live/events",
            ]
          : []),
      ],
    },
    features: {
      semanticSearch: false,
      embedding: false,
      cloudStorage: false,
      smtp: false,
      realPatientsEnabled: clinicalLiveReady,
      clinicalLiveFlag,
      clinicalCryptoConfigured,
      clinicalLgpdConfigured,
      clinicalLiveReady,
      legacyClinicalEndpointsRetired: Boolean(context.env.DB),
      mode: clinicalLiveReady
        ? "CLINICAL_LIVE_READY"
        : clinicalLiveFlag
          ? "CLINICAL_LIVE_PENDING_READINESS"
          : "DEMO_HOMOLOGACAO",
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
