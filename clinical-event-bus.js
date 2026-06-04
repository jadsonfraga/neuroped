/* =====================================================================
   NeuroPed SDG · CLINICAL EVENT BUS V3.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Pub/sub clínico desacoplando engines, UI, plugins e adapters futuros.

   Eventos canônicos:
     instrument:registered  · instrument:updated
     application:started    · application:completed
     pdf:generated          · recommendation:generated
     storage:migrated       · plugin:loaded

   Cada evento publicado leva: {trace_id, ts, engine, payload}
   ===================================================================== */
(function (global) {
  "use strict";

  const CANONICAL_EVENTS = new Set([
    "instrument:registered",
    "instrument:updated",
    "application:started",
    "application:completed",
    "pdf:generated",
    "recommendation:generated",
    "storage:migrated",
    "plugin:loaded"
  ]);

  function traceId() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    return "tr-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  class ClinicalEventBus {
    constructor(opts = {}) {
      /** @type {Map<string, Set<Function>>} */
      this._subs = new Map();
      this._auditTrail = [];
      this._strict = opts.strict !== false; // se true, rejeita eventos fora do canon
      this._maxAudit = opts.maxAudit || 2000;
    }

    /** Subscribe a evento. Retorna função de unsubscribe. */
    on(event, handler) {
      if (!this._subs.has(event)) this._subs.set(event, new Set());
      this._subs.get(event).add(handler);
      return () => this._subs.get(event)?.delete(handler);
    }

    /** Subscribe único — auto-remove após primeiro disparo. */
    once(event, handler) {
      const off = this.on(event, (e) => { try { handler(e); } finally { off(); } });
      return off;
    }

    /** Publica evento. Retorna trace_id. */
    emit(event, payload = {}, opts = {}) {
      if (this._strict && !CANONICAL_EVENTS.has(event)) {
        console.warn("[EventBus] evento não-canônico recusado:", event);
        return null;
      }
      const e = {
        event,
        trace_id: opts.trace_id || traceId(),
        ts: Date.now(),
        engine: opts.engine || payload.engine || "unknown",
        payload
      };
      this._audit(e);
      const handlers = this._subs.get(event) || new Set();
      handlers.forEach((h) => { try { h(e); } catch (err) { console.warn("[EventBus] handler erro:", err); } });
      return e.trace_id;
    }

    audit() { return [...this._auditTrail]; }
    canonicalEvents() { return [...CANONICAL_EVENTS]; }

    _audit(e) {
      this._auditTrail.push(e);
      if (this._auditTrail.length > this._maxAudit) this._auditTrail.splice(0, this._auditTrail.length - this._maxAudit);
    }
  }

  const bus = new ClinicalEventBus();
  global.NeuroPedClinicalEventBus = {
    ClinicalEventBus,
    bus,
    CANONICAL_EVENTS: [...CANONICAL_EVENTS],
    traceId,
    version: "3.2.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinicalEventBus;

  /* ---- auto-wire em engines V3.1 (instrument:registered) ---- */
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      const npc = global.NeuroPedClinical;
      if (npc?.registry && !npc.registry.__busAttached) {
        npc.registry.on((ev, inst) => {
          if (ev === "register") bus.emit("instrument:registered", { id: inst.id, type: inst.type }, { engine: "Registry" });
        });
        npc.registry.__busAttached = true;
      }
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
