/* =====================================================================
   NeuroPed EDJ · FUTURE ADAPTERS V3.2 (interfaces vazias)
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Contratos para integrações futuras. NÃO implementam — apenas definem
   o shape esperado pelo restante da plataforma.

   Sub-arquiteturas reservadas:
     · DriveAdapter        (MCP Google Drive — regra do CLAUDE.md)
     · FHIRAdapter         (HL7-FHIR R4 mínimo)
     · LGPDConsentLayer    (consentimento + purge + audit)
     · AuthAdapter         (médico/secretária/paciente)
     · SyncAdapter         (cloud bidirecional)
     · OfflineAdapter      (queue + replay)
     · SignatureAdapter    (assinatura digital ICP-BR)
     · TelemedAdapter      (videoconsulta + handoff de contexto)
   ===================================================================== */
(function (global) {
  "use strict";

  class DriveAdapter {
    /** @abstract */ uploadPDF({ blob, filename, parentId }) { throw new Error("not_implemented"); }
    /** @abstract */ listLaudos() { throw new Error("not_implemented"); }
  }
  class FHIRAdapter {
    /** @abstract */ toObservation(instrumentResult) { throw new Error("not_implemented"); }
    /** @abstract */ pushBundle(bundle) { throw new Error("not_implemented"); }
  }
  class LGPDConsentLayer {
    /** @abstract */ requestConsent(scope) { throw new Error("not_implemented"); }
    /** @abstract */ revokeConsent(scope)  { throw new Error("not_implemented"); }
    /** @abstract */ purgePatientData(id)  { throw new Error("not_implemented"); }
    /** @abstract */ auditLog()            { throw new Error("not_implemented"); }
  }
  class AuthAdapter {
    /** @abstract */ login(creds)   { throw new Error("not_implemented"); }
    /** @abstract */ currentUser()  { throw new Error("not_implemented"); }
    /** @abstract */ roles()        { throw new Error("not_implemented"); }
  }
  class SyncAdapter {
    /** @abstract */ pull() { throw new Error("not_implemented"); }
    /** @abstract */ push(diff) { throw new Error("not_implemented"); }
  }
  class OfflineAdapter {
    /** @abstract */ enqueue(action) { throw new Error("not_implemented"); }
    /** @abstract */ flush() { throw new Error("not_implemented"); }
  }
  class SignatureAdapter {
    /** @abstract */ sign(payload, certRef) { throw new Error("not_implemented"); }
    /** @abstract */ verify(signed) { throw new Error("not_implemented"); }
  }
  class TelemedAdapter {
    /** @abstract */ openSession(patientId) { throw new Error("not_implemented"); }
    /** @abstract */ handoffContext(ctx) { throw new Error("not_implemented"); }
  }

  global.NeuroPedFutureAdapters = {
    DriveAdapter, FHIRAdapter, LGPDConsentLayer, AuthAdapter,
    SyncAdapter, OfflineAdapter, SignatureAdapter, TelemedAdapter,
    version: "3.2.0",
    note: "Interfaces apenas. Implementações em V4.x."
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedFutureAdapters;
})(typeof window !== "undefined" ? window : globalThis);
