/* =====================================================================
   NeuroPed SDG · RECOMMENDATION PIPELINE V3.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Pipeline multicritério explicável. Substitui scores mágicos por
   strategies independentes que justificam cada contribuição.

   API:
     const pipe = new RecommendationPipeline([...strategies]);
     pipe.run(query, candidates) → [{instrument, score, confidence, reasons,
                                     contraindications, clinical_match,
                                     estimated_burden, explainability}]

   Cada Strategy retorna { delta, weight, reasons, flags }.
   O Explainer agrega em prosa clínica auditável.

   ADITIVO — não substitui Engine.recommend(); engines podem optar por
   usar o pipeline via Engine.recommend = pipe.bind(engine).
   ===================================================================== */

(function (global) {
  "use strict";

  /* ------------------------------------------------------------------
   *  BASE STRATEGY
   * ------------------------------------------------------------------ */
  class RecommendationStrategy {
    constructor(name, weight = 1.0) { this.name = name; this.weight = weight; }
    /** @returns {{delta:number, reasons:string[], flags:Object}} */
    evaluate(instrument, query) {
      return { delta: 0, reasons: [], flags: {} };
    }
  }

  /* ------------------------------------------------------------------
   *  STRATEGIES IMPLEMENTADAS
   * ------------------------------------------------------------------ */
  class AgeRangeStrategy extends RecommendationStrategy {
    constructor() { super("age_range", 1.4); }
    evaluate(inst, q) {
      if (q.age_months == null || !inst.age_window) return { delta: 0, reasons: [], flags: { matched_age_range: null } };
      const [min, max] = inst.age_window;
      if (q.age_months >= min && q.age_months <= max) {
        const center = (min + max) / 2;
        const fit = 1 - Math.abs(q.age_months - center) / Math.max(1, (max - min) / 2);
        return { delta: 0.5 + 0.5 * fit, reasons: [`faixa etária compatível (${min}-${max}m)`], flags: { matched_age_range: true } };
      }
      return { delta: -0.8, reasons: [`fora da faixa etária validada (${min}-${max}m)`], flags: { matched_age_range: false } };
    }
  }

  class ComplaintClusterStrategy extends RecommendationStrategy {
    constructor() { super("complaint_cluster", 1.5); }
    evaluate(inst, q) {
      const complaints = (q.chief_complaints || []).map((c) => c.toLowerCase().replace(/_/g, " "));
      if (!complaints.length) return { delta: 0, reasons: [], flags: { matched_complaint_cluster: null } };
      const text = `${inst.name} ${inst.subtype} ${(inst.activates_with || []).join(" ")}`.toLowerCase().replace(/_/g, " ");
      const hits = complaints.filter((c) => text.includes(c));
      if (hits.length) {
        return { delta: 0.4 + 0.2 * hits.length, reasons: [`queixas correspondentes: ${hits.join(", ")}`], flags: { matched_complaint_cluster: true } };
      }
      return { delta: 0, reasons: [], flags: { matched_complaint_cluster: false } };
    }
  }

  class TimeBurdenStrategy extends RecommendationStrategy {
    constructor() { super("time_burden", 0.7); }
    evaluate(inst, q) {
      const t = inst.estimated_minutes;
      if (typeof t !== "number") return { delta: 0, reasons: [], flags: { low_time_burden: null } };
      if (t <= 10) return { delta: 0.4,  reasons: [`baixo custo temporal (${t} min)`],   flags: { low_time_burden: true } };
      if (t <= 20) return { delta: 0.15, reasons: [`custo temporal moderado (${t} min)`], flags: { low_time_burden: true } };
      if (t <= 40) return { delta: -0.2, reasons: [`alto custo temporal (${t} min)`],    flags: { low_time_burden: false } };
      return                      { delta: -0.5, reasons: [`muito alto custo temporal (${t} min)`], flags: { low_time_burden: false } };
    }
  }

  class RemoteFeasibilityStrategy extends RecommendationStrategy {
    constructor() { super("remote_feasibility", 0.6); }
    evaluate(inst, q) {
      const remote = inst.application_mode === "remoto";
      if (q.prefer_remote && remote) return { delta: 0.3,  reasons: ["preenchimento remoto possível"], flags: { remote_possible: true } };
      if (q.prefer_remote && !remote) return { delta: -0.2, reasons: ["exige aplicação presencial"], flags: { remote_possible: false } };
      return { delta: 0, reasons: [], flags: { remote_possible: remote } };
    }
  }

  class TrainingRequirementStrategy extends RecommendationStrategy {
    constructor() { super("training_required", 0.8); }
    evaluate(inst, q) {
      const t = !!inst.requires_training;
      if (q.context === "pre_consultation" && t) return { delta: -1.0, reasons: ["exige treinamento — incompatível com pré-consulta"], flags: { requires_training: true } };
      if (t) return { delta: -0.15, reasons: ["requer treinamento profissional"], flags: { requires_training: true } };
      return       { delta: 0,     reasons: [],                                   flags: { requires_training: false } };
    }
  }

  class PurposeMatchStrategy extends RecommendationStrategy {
    constructor() { super("purpose_match", 1.1); }
    evaluate(inst, q) {
      if (!q.intent) return { delta: 0, reasons: [], flags: { purpose_aligned: null } };
      if (inst.purpose === q.intent) return { delta: 0.4,  reasons: [`propósito alinhado: ${q.intent}`], flags: { purpose_aligned: true } };
      return                                  { delta: -0.1, reasons: [`propósito divergente do desejado (${inst.purpose} ≠ ${q.intent})`], flags: { purpose_aligned: false } };
    }
  }

  class ClinicalDomainSensitivityStrategy extends RecommendationStrategy {
    constructor() { super("clinical_domain_sensitivity", 1.3); }
    evaluate(inst, q) {
      const dom = (q.suspected_domain || "").toLowerCase();
      if (!dom) return { delta: 0, reasons: [], flags: { domain_match: null } };
      const map = {
        tea: ["developmental","social","sensory"],
        tdah: ["attention","behavioral","executive_function_task"],
        tod: ["behavioral"],
        dislexia: ["academic","reading","phonological_awareness","naming"],
        ansiedade: ["anxiety","emotional"],
        depressao: ["depression","emotional","risk"]
      };
      const tokens = map[dom] || [];
      if (tokens.some((t) => inst.subtype === t)) return { delta: 0.45, reasons: [`sensível para ${dom.toUpperCase()}`], flags: { domain_match: true } };
      return { delta: 0, reasons: [], flags: { domain_match: false } };
    }
  }

  class ContextStrategy extends RecommendationStrategy {
    constructor() { super("context_alignment", 0.5); }
    evaluate(inst, q) {
      if (!q.context) return { delta: 0, reasons: [], flags: { context_match: null } };
      const ctx = q.context;
      if (ctx === "school"  && /escola/.test(inst.respondent || ""))  return { delta: 0.3, reasons: ["alinhado ao contexto escolar"],  flags: { context_match: true } };
      if (ctx === "family"  && /familia/.test(inst.respondent || "")) return { delta: 0.3, reasons: ["alinhado ao contexto familiar"], flags: { context_match: true } };
      if (ctx === "clinical"&& /cl[íi]nico/.test(inst.respondent || "")) return { delta: 0.3, reasons: ["alinhado ao contexto clínico"], flags: { context_match: true } };
      return { delta: 0, reasons: [], flags: { context_match: false } };
    }
  }

  /* ------------------------------------------------------------------
   *  DEFAULT BUNDLE
   * ------------------------------------------------------------------ */
  const DEFAULT_STRATEGIES = () => [
    new AgeRangeStrategy(),
    new ComplaintClusterStrategy(),
    new TimeBurdenStrategy(),
    new RemoteFeasibilityStrategy(),
    new TrainingRequirementStrategy(),
    new PurposeMatchStrategy(),
    new ClinicalDomainSensitivityStrategy(),
    new ContextStrategy()
  ];

  /* ------------------------------------------------------------------
   *  EXPLAINER
   * ------------------------------------------------------------------ */
  class RecommendationExplainer {
    static toProse(result) {
      const lines = [];
      lines.push(`Score ${result.score.toFixed(2)} · confiança ${(result.confidence * 100).toFixed(0)}%`);
      if (result.reasons.length) lines.push("Suporte: " + result.reasons.join("; "));
      if (result.contraindications.length) lines.push("Contraindicações: " + result.contraindications.join("; "));
      lines.push(`Carga estimada: ${result.estimated_burden} min`);
      return lines.join(" · ");
    }
  }

  /* ------------------------------------------------------------------
   *  PIPELINE
   * ------------------------------------------------------------------ */
  class RecommendationPipeline {
    /** @param {RecommendationStrategy[]} strategies */
    constructor(strategies) {
      this.strategies = (strategies && strategies.length ? strategies : DEFAULT_STRATEGIES());
    }

    /** @returns {Array} */
    run(query, candidates) {
      const results = (candidates || []).map((inst) => this._evaluateInstrument(inst, query));
      // normaliza score numa janela [0,100] usando max teórico = sum(weights * 1)
      const maxTheoretical = this.strategies.reduce((s, st) => s + st.weight * 1.0, 0) || 1;
      results.forEach((r) => {
        r.score = Math.max(0, Math.min(100, (r._raw / maxTheoretical) * 100));
        r.confidence = computeConfidence(r);
        r.explainability_prose = RecommendationExplainer.toProse(r);
      });
      results.sort((a, b) => b.score - a.score);
      return results;
    }

    _evaluateInstrument(inst, q) {
      let raw = 0;
      const reasons = [];
      const contraindications = [];
      const explainability = {};
      this.strategies.forEach((st) => {
        const r = st.evaluate(inst, q);
        const weighted = r.delta * st.weight;
        raw += weighted;
        if (r.reasons && r.reasons.length) {
          if (r.delta < 0) contraindications.push(...r.reasons);
          else if (r.delta > 0) reasons.push(...r.reasons);
        }
        Object.assign(explainability, r.flags || {});
      });
      return {
        instrument: inst,
        _raw: raw,
        score: 0,
        confidence: 0,
        reasons,
        contraindications,
        clinical_match: {
          subtype: inst.subtype,
          domain: explainability.domain_match ? (q.suspected_domain || null) : null
        },
        estimated_burden: inst.estimated_minutes,
        explainability
      };
    }
  }

  function computeConfidence(r) {
    const positives = r.reasons.length;
    const negatives = r.contraindications.length;
    if (positives + negatives === 0) return 0;
    return Math.max(0, Math.min(1, (positives - 0.6 * negatives) / Math.max(1, positives + negatives)));
  }

  /* ------------------------------------------------------------------
   *  HOOK em engine V3.1 (opt-in, ADITIVO)
   * ------------------------------------------------------------------ */
  function attachToEngine(engine, pipeline) {
    if (!engine || typeof engine.recommend !== "function") return false;
    if (engine.__pipelineAttached) return true;
    const original = engine.recommend.bind(engine);
    engine.recommend = function (query) {
      const baseline = original(query);
      const candidates = baseline.all || engine.list();
      const enriched = pipeline.run(query || {}, candidates);
      return {
        top: enriched.slice(0, 5).map((e) => e.instrument),
        all: enriched.map((e) => e.instrument),
        explained: enriched,
        meta: { ...(baseline.meta || {}), pipeline_active: true, pipeline_version: "3.2.0" }
      };
    };
    engine.__pipelineAttached = true;
    return true;
  }

  global.NeuroPedRecommendation = {
    RecommendationStrategy,
    RecommendationPipeline,
    RecommendationExplainer,
    Strategies: {
      AgeRangeStrategy, ComplaintClusterStrategy, TimeBurdenStrategy,
      RemoteFeasibilityStrategy, TrainingRequirementStrategy, PurposeMatchStrategy,
      ClinicalDomainSensitivityStrategy, ContextStrategy
    },
    attachToEngine,
    DEFAULT_STRATEGIES,
    version: "3.2.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedRecommendation;

  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      const npc = global.NeuroPedClinical;
      if (!npc) return;
      const pipe = new RecommendationPipeline();
      ["directTestEngine","scaleEngine","diaryEngine"].forEach((k) => {
        if (npc[k]) attachToEngine(npc[k], pipe);
      });
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
