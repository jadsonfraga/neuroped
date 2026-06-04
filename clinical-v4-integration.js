/* =====================================================================
   NeuroPed EDJ · V4 INTEGRATION ORCHESTRATOR V4.0
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Orquestra os 4 adapters V4.0 sobre o event bus V3.2.
     · LGPD gate em todas as ações
     · Drive auto-sync após geração de PDF
     · FHIR auto-export em demanda
     · Auth gate em capabilities sensíveis
   ===================================================================== */
(function (global) {
  "use strict";

  function safe(fn) { try { return fn(); } catch (e) { console.warn("[V4 Integration]", e); return null; } }

  function wire() {
    const v4 = global.NeuroPedClinicalV4;
    if (!v4) return false;
    const bus = global.NeuroPedClinicalEventBus?.bus;
    if (!bus) return false;

    // 1. PDF gerado → tenta Drive (se consent ok)
    bus.on("pdf:generated", async (e) => {
      if (!v4.lgpd?.hasConsent("drive_sync")) return;
      const detail = e.payload || {};
      if (detail.drive_audit) return; // já foi processado
      if (detail.blob && v4.driveAdapter) {
        await v4.driveAdapter.uploadPDF({
          blob: detail.blob,
          filename: detail.filename,
          patient: detail.patient
        });
      }
    });

    // 2. Auth listener — após login, recarrega gates de UI
    bus.on("plugin:loaded", (e) => {
      if (e.payload?.auth_session_changed) {
        v4.auth?.guardAllByDataAttr();
      }
    });

    return true;
  }

  function exposeAPI() {
    const v4 = global.NeuroPedClinicalV4 || {};
    v4.platform = {
      version: "4.0.0",
      adapters: {
        drive: !!v4.driveAdapter,
        fhir:  !!v4.fhirAdapter,
        lgpd:  !!v4.lgpd,
        auth:  !!v4.auth
      },
      health() {
        return {
          v3: !!global.NeuroPedClinical,
          v32_governance: !!global.NeuroPedClinicalGovernance,
          v32_event_bus:  !!global.NeuroPedClinicalEventBus,
          v32_pipeline:   !!global.NeuroPedRecommendation,
          v32_storage:    !!global.NeuroPedClinicalStorage,
          v4_drive: !!v4.driveAdapter,
          v4_fhir:  !!v4.fhirAdapter,
          v4_lgpd:  !!v4.lgpd,
          v4_auth:  !!v4.auth
        };
      }
    };
    global.NeuroPedClinicalV4 = v4;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      safe(wire);
      safe(exposeAPI);
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
