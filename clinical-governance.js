/* =====================================================================
   NeuroPed SDG · CLINICAL GOVERNANCE V3.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Camada de governança do InstrumentRegistry:
     · validateSchema
     · validateSemanticConflicts
     · validateDuplicatePurpose
     · validateRecommendationIntegrity
     · generateClinicalHash (FNV-1a determinístico em hex 8 bytes)

   ADITIVO — não substitui Registry.register(); envelopa-o via attach().
   ===================================================================== */

/**
 * @typedef {Object} GovernanceReport
 * @property {boolean} ok
 * @property {Array<{severity:"error"|"warning"|"info", code:string, message:string, instrumentId?:string}>} findings
 */

(function (global) {
  "use strict";

  /* ------------------------------------------------------------------
   *  HASH DETERMINÍSTICO (FNV-1a 32-bit estendido a 64-bit via duplo seed)
   *  Sem dependência de SubtleCrypto async. Estável entre execuções.
   * ------------------------------------------------------------------ */
  function fnv1a(str, seed) {
    let h = (seed >>> 0) || 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }
  function clinicalHash(obj) {
    const canonical = canonicalJSON(obj);
    const a = fnv1a(canonical, 0x811c9dc5);
    const b = fnv1a(canonical, 0xa1b2c3d4);
    return (a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0"));
  }
  function canonicalJSON(o) {
    if (o === null || typeof o !== "object") return JSON.stringify(o);
    if (Array.isArray(o)) return "[" + o.map(canonicalJSON).join(",") + "]";
    const keys = Object.keys(o).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJSON(o[k])).join(",") + "}";
  }

  /* ------------------------------------------------------------------
   *  REGRAS DE COERÊNCIA
   * ------------------------------------------------------------------ */
  const COHERENCE = {
    typeRespondent: {
      direct_test: ["paciente_em_desempenho", "clinico", "clinico_observacao"],
      scale:       ["familia", "escola", "autoteste_adolescente", "familia_e_escola", "cuidador", "clinico"],
      diary:       ["familia", "escola", "cuidador", "autoteste_adolescente", "paciente_em_desempenho"]
    },
    typeApplicationMode: {
      direct_test: ["presencial", "hibrido"],
      scale:       ["remoto", "presencial", "hibrido"],
      diary:       ["recorrente"]
    },
    timeBoundsMin: { direct_test: [1, 90], scale: [1, 120], diary: [0, 30] }
  };

  /* ------------------------------------------------------------------
   *  CLASSE PRINCIPAL
   * ------------------------------------------------------------------ */
  class ClinicalGovernance {
    constructor(opts = {}) {
      this.schemaVersion = opts.schemaVersion || "3.1.0";
      this.signatureSecret = opts.signatureSecret || "neuroped-edj-2026";
      this._semanticIndex = new Map(); // key → instrumentId
    }

    /** Valida 11 campos obrigatórios + tipos básicos. @returns {GovernanceReport} */
    validateSchema(inst) {
      const findings = [];
      const required = ["id","name","type","subtype","category","application_mode","respondent","longitudinal","requires_training","estimated_minutes","purpose"];
      for (const k of required) {
        if (inst[k] === undefined || inst[k] === null || inst[k] === "") {
          findings.push({ severity: "error", code: "MISSING_FIELD", message: `campo obrigatório ausente: ${k}`, instrumentId: inst.id });
        }
      }
      if (!["direct_test","scale","diary"].includes(inst.type))
        findings.push({ severity: "error", code: "INVALID_TYPE", message: `type inválido: ${inst.type}`, instrumentId: inst.id });
      if (typeof inst.estimated_minutes !== "number" || inst.estimated_minutes < 0 || inst.estimated_minutes > 240)
        findings.push({ severity: "error", code: "INVALID_TIME", message: `estimated_minutes fora de [0,240]`, instrumentId: inst.id });
      if (typeof inst.longitudinal !== "boolean")
        findings.push({ severity: "error", code: "INVALID_LONGITUDINAL", message: `longitudinal deve ser boolean`, instrumentId: inst.id });
      if (inst.type === "diary" && inst.longitudinal !== true)
        findings.push({ severity: "error", code: "INCOHERENT_DIARY", message: "diary deve ter longitudinal=true", instrumentId: inst.id });
      if (inst.type !== "diary" && inst.longitudinal === true)
        findings.push({ severity: "error", code: "INCOHERENT_LONGITUDINAL", message: "apenas diary pode ter longitudinal=true", instrumentId: inst.id });

      // coerência respondent
      const allowedResp = COHERENCE.typeRespondent[inst.type] || [];
      if (allowedResp.length && inst.respondent && !allowedResp.includes(inst.respondent))
        findings.push({ severity: "warning", code: "INCOHERENT_RESPONDENT", message: `respondent '${inst.respondent}' atípico para type '${inst.type}'`, instrumentId: inst.id });

      // coerência application_mode
      const allowedMode = COHERENCE.typeApplicationMode[inst.type] || [];
      if (allowedMode.length && inst.application_mode && !allowedMode.includes(inst.application_mode))
        findings.push({ severity: "warning", code: "INCOHERENT_MODE", message: `application_mode '${inst.application_mode}' atípico para type '${inst.type}'`, instrumentId: inst.id });

      // tempo absurdo
      const [tmin, tmax] = COHERENCE.timeBoundsMin[inst.type] || [0, 240];
      if (typeof inst.estimated_minutes === "number" && (inst.estimated_minutes < tmin || inst.estimated_minutes > tmax))
        findings.push({ severity: "warning", code: "TIME_OUT_OF_RANGE", message: `estimated_minutes ${inst.estimated_minutes} fora do esperado [${tmin},${tmax}] para type '${inst.type}'`, instrumentId: inst.id });

      return { ok: !findings.some((f) => f.severity === "error"), findings };
    }

    /** Detecta instrumentos semanticamente próximos já registrados. */
    validateSemanticConflicts(inst, existingList) {
      const findings = [];
      const key = `${inst.type}::${inst.subtype}::${inst.purpose}::${inst.respondent}`;
      const prev = this._semanticIndex.get(key);
      if (prev && prev !== inst.id) {
        findings.push({
          severity: "warning",
          code: "SEMANTIC_DUPLICATE",
          message: `semanticamente similar a '${prev}' (mesmo type/subtype/purpose/respondent)`,
          instrumentId: inst.id
        });
      }
      // similaridade textual de nome (Jaccard sobre tokens)
      (existingList || []).forEach((other) => {
        if (other.id === inst.id) return;
        const sim = jaccard(tokenize(inst.name), tokenize(other.name));
        if (sim >= 0.75) {
          findings.push({
            severity: "warning",
            code: "NAME_NEAR_DUPLICATE",
            message: `nome muito próximo a '${other.id}' (Jaccard=${sim.toFixed(2)})`,
            instrumentId: inst.id
          });
        }
      });
      return { ok: !findings.some((f) => f.severity === "error"), findings };
    }

    /** Detecta conflito de propósito clínico em uma mesma família. */
    validateDuplicatePurpose(inst, existingList) {
      const findings = [];
      const family = (existingList || []).filter((o) => o.id !== inst.id && o.type === inst.type && o.subtype === inst.subtype);
      const samePurpose = family.filter((o) => o.purpose === inst.purpose);
      if (samePurpose.length >= 2) {
        findings.push({
          severity: "info",
          code: "PURPOSE_OVERSATURATED",
          message: `${samePurpose.length + 1} instrumentos no mesmo subtype/purpose — considerar consolidação`,
          instrumentId: inst.id
        });
      }
      return { ok: true, findings };
    }

    /** Verifica se recommendation tem heurística associada (não-órfão). */
    validateRecommendationIntegrity(inst, opts = {}) {
      const findings = [];
      const hasHeuristic = !!(opts.heuristics && opts.heuristics.length);
      if (!hasHeuristic) {
        findings.push({
          severity: "info",
          code: "ORPHAN_HEURISTIC",
          message: "instrumento sem heurística de matching documentada",
          instrumentId: inst.id
        });
      }
      return { ok: true, findings };
    }

    /** Gera hash clínico determinístico (16 hex) para o instrumento canônico. */
    generateClinicalHash(inst) {
      const canonical = {
        id: inst.id, type: inst.type, subtype: inst.subtype,
        category: inst.category, application_mode: inst.application_mode,
        respondent: inst.respondent, longitudinal: !!inst.longitudinal,
        requires_training: !!inst.requires_training,
        estimated_minutes: inst.estimated_minutes, purpose: inst.purpose,
        name: inst.name
      };
      return clinicalHash(canonical);
    }

    /** Assinatura institucional (HMAC-light com FNV) — auditoria simples. */
    sign(payload) {
      return clinicalHash({ payload, secret: this.signatureSecret, ts: Date.now() }).slice(0, 16);
    }

    /** Pipeline completo de admissão: validate + enrich + sign. */
    admit(inst, existingList, opts = {}) {
      const reports = [
        this.validateSchema(inst),
        this.validateSemanticConflicts(inst, existingList),
        this.validateDuplicatePurpose(inst, existingList),
        this.validateRecommendationIntegrity(inst, opts)
      ];
      const findings = reports.flatMap((r) => r.findings);
      const ok = reports.every((r) => r.ok);
      if (!ok) return { ok: false, findings, enriched: null };

      const now = new Date().toISOString();
      const enriched = {
        ...inst,
        clinical_hash:        this.generateClinicalHash(inst),
        schema_version:       this.schemaVersion,
        created_at:           inst.created_at || now,
        updated_at:           now,
        source_plugin:        inst.source_plugin || opts.sourcePlugin || "core",
        governance_signature: this.sign({ id: inst.id, version: this.schemaVersion })
      };
      this._semanticIndex.set(`${inst.type}::${inst.subtype}::${inst.purpose}::${inst.respondent}`, inst.id);
      return { ok: true, findings, enriched };
    }

    /** Envelopa um InstrumentRegistry V3.1 sem quebrar APIs públicas. */
    attach(registry) {
      if (!registry || typeof registry.register !== "function") return false;
      if (registry.__governanceAttached) return true;
      const originalRegister = registry.register.bind(registry);
      const governance = this;
      registry.register = function (inst) {
        const existing = registry.listAll ? registry.listAll() : [];
        const result = governance.admit(inst, existing);
        if (!result.ok) {
          const err = new Error("[Governance] admissão recusada: " + result.findings.filter((f) => f.severity === "error").map((f) => f.message).join("; "));
          err.findings = result.findings;
          throw err;
        }
        // warnings vão para console; admissão prossegue
        result.findings.filter((f) => f.severity === "warning").forEach((f) => console.warn("[Governance]", f.code, f.message));
        return originalRegister(result.enriched);
      };
      registry.__governanceAttached = true;
      registry.governance = governance;
      return true;
    }
  }

  /* ---------- helpers texto ---------- */
  function tokenize(s) {
    return new Set(String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((t) => t.length >= 3));
  }
  function jaccard(a, b) {
    const inter = new Set([...a].filter((x) => b.has(x))).size;
    const uni   = new Set([...a, ...b]).size || 1;
    return inter / uni;
  }

  global.NeuroPedClinicalGovernance = {
    ClinicalGovernance,
    clinicalHash,
    canonicalJSON,
    version: "3.2.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinicalGovernance;

  // Auto-attach se NeuroPedClinical já existe
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      const npc = global.NeuroPedClinical;
      if (npc && npc.registry && !npc.registry.__governanceAttached) {
        new ClinicalGovernance().attach(npc.registry);
      }
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
