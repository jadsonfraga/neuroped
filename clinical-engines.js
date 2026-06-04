/* =====================================================================
   NeuroPed EDJ · CLINICAL ENGINES V3.1
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Arquitetura: 3 engines ISOLADAS herdando BaseClinicalEngine, mais
   InstrumentRegistry plugável. Tipagem forte via JSDoc — VS Code,
   IntelliJ e tsc --checkJs validam estaticamente.

   APIs públicas:
     window.NeuroPedClinical = {
       DirectTestEngine,
       ScaleEngine,
       DiaryEngine,
       InstrumentRegistry,
       loadCatalog(url),
       version
     }
   ===================================================================== */

/**
 * @typedef {"direct_test"|"scale"|"diary"} InstrumentType
 * @typedef {"clinical_application"|"pre_consultation"|"longitudinal_followup"} InstrumentCategory
 * @typedef {"presencial"|"remoto"|"hibrido"|"recorrente"} ApplicationMode
 * @typedef {"clinico"|"clinico_observacao"|"familia"|"escola"|"autoteste_adolescente"|"familia_e_escola"|"cuidador"|"paciente_em_desempenho"} Respondent
 * @typedef {"triagem"|"confirmacao"|"acompanhamento"|"monitoramento"|"resposta_tratamento"|"rastreio_risco"} Purpose
 *
 * @typedef {Object} Instrument
 * @property {string} id
 * @property {string} name
 * @property {InstrumentType} type
 * @property {string} subtype
 * @property {InstrumentCategory} category
 * @property {ApplicationMode} application_mode
 * @property {Respondent} respondent
 * @property {boolean} longitudinal
 * @property {boolean} requires_training
 * @property {number} estimated_minutes
 * @property {Purpose} purpose
 *
 * @typedef {Object} ClinicalQuery
 * @property {number} [age_months]
 * @property {string[]} [chief_complaints]
 * @property {string[]} [red_flags]
 * @property {string} [respondent]
 *
 * @typedef {Object} RecommendationResult
 * @property {Instrument[]} top
 * @property {Instrument[]} all
 * @property {Object} meta
 */

(function (global) {
  "use strict";

  /* ====================================================================
   *  INSTRUMENT REGISTRY — plugável
   * ==================================================================== */
  class InstrumentRegistry {
    constructor() {
      /** @type {Map<string, Instrument>} */
      this._byId = new Map();
      /** @type {Map<InstrumentType, Set<string>>} */
      this._byType = new Map([["direct_test", new Set()], ["scale", new Set()], ["diary", new Set()]]);
      this._listeners = new Set();
    }

    /** @param {Instrument} inst */
    register(inst) {
      this._validate(inst);
      this._byId.set(inst.id, inst);
      this._byType.get(inst.type).add(inst.id);
      this._emit("register", inst);
      return inst;
    }

    /** @param {Instrument[]} instruments */
    registerMany(instruments) {
      (instruments || []).forEach((i) => {
        try { this.register(i); } catch (e) { console.warn("[Registry] inválido:", i?.id, e.message); }
      });
    }

    /** @param {string} id @returns {Instrument|undefined} */
    get(id) { return this._byId.get(id); }

    /** @param {InstrumentType} type @returns {Instrument[]} */
    listByType(type) {
      const ids = this._byType.get(type) || new Set();
      return Array.from(ids).map((id) => this._byId.get(id)).filter(Boolean);
    }

    /** @returns {Instrument[]} */
    listAll() { return Array.from(this._byId.values()); }

    /** @param {Instrument} i */
    _validate(i) {
      const required = ["id","name","type","subtype","category","application_mode","respondent","longitudinal","requires_training","estimated_minutes","purpose"];
      for (const k of required) {
        if (i[k] === undefined || i[k] === null) {
          throw new Error(`campo obrigatório ausente: ${k}`);
        }
      }
      if (!["direct_test","scale","diary"].includes(i.type)) throw new Error(`type inválido: ${i.type}`);
      if (i.type === "diary" && i.longitudinal !== true)     throw new Error(`diary deve ter longitudinal=true`);
      if (i.type !== "diary" && i.longitudinal === true)     throw new Error(`apenas diary pode ter longitudinal=true`);
    }

    on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
    _emit(ev, payload) { this._listeners.forEach((fn) => { try { fn(ev, payload); } catch(_){} }); }
  }

  /* ====================================================================
   *  BASE CLINICAL ENGINE — superclasse compartilhada
   * ==================================================================== */
  class BaseClinicalEngine {
    /**
     * @param {InstrumentType} type
     * @param {InstrumentRegistry} registry
     * @param {Object} [opts]
     */
    constructor(type, registry, opts = {}) {
      this.type = type;
      this.registry = registry;
      this.storageNS = opts.storageNS || `neuroped.${type}.v3-1`;
      // Injeção de Storage V3.2 se disponível
      if (global.NeuroPedClinicalStorage && global.NeuroPedClinicalStorage.VersionedStorageLayer) {
        try {
          this.v32Storage = new global.NeuroPedClinicalStorage.VersionedStorageLayer(`neuro.${type}`);
        } catch (e) { console.warn(`[Engine] falha ao iniciar storage v3.2 para ${type}:`, e.message); }
      }
    }

    /** @returns {Instrument[]} */
    list() { return this.registry.listByType(this.type); }

    /** @param {string} id @returns {Instrument|undefined} */
    find(id) {
      const i = this.registry.get(id);
      return i && i.type === this.type ? i : undefined;
    }

    /**
     * Recommend genérico por afinidade textual + filtros de janela etária.
     * Engines especializadas podem sobrescrever.
     * @param {ClinicalQuery} query
     * @returns {RecommendationResult}
     */
    recommend(query = {}) {
      const inventory = this.list();
      const tags = new Set((query.chief_complaints || []).map(t => t.toLowerCase()));
      const scored = inventory.map((inst) => {
        const text = `${inst.name} ${inst.subtype}`.toLowerCase();
        let score = 0;
        tags.forEach((t) => { if (text.includes(t.replace(/_/g, " ")) || text.includes(t)) score += 1; });
        return { inst, score };
      })
      .filter((x) => x.score > 0 || tags.size === 0)
      .sort((a, b) => b.score - a.score);

      const all = scored.map((s) => s.inst);
      return {
        top: all.slice(0, 5),
        all,
        meta: {
          engine: this.constructor.name,
          type: this.type,
          n_inventory: inventory.length,
          n_matched: all.length
        }
      };
    }

    /* ----------- persistência local ----------- */
    _read() { try { return JSON.parse(localStorage.getItem(this.storageNS) || "{}"); } catch(_){ return {}; } }
    _write(d) { try { localStorage.setItem(this.storageNS, JSON.stringify(d)); } catch(_){} }

    /** @param {string} instrumentId @param {Object} payload */
    save(instrumentId, payload) {
      // V3.2: Persistência versionada com checksum e RLS-ready
      if (this.v32Storage) {
        this.v32Storage.save(instrumentId, payload);
      }
      // Fallback/Legacy V3.1: Mantém compatibilidade com código antigo
      const s = this._read();
      s[instrumentId] = s[instrumentId] || [];
      s[instrumentId].push({ ts: Date.now(), ...payload });
      this._write(s);
      return s[instrumentId].length;
    }

    /** @param {string} instrumentId */
    history(instrumentId) {
      // Tenta carregar do V3.2 primeiro (mais íntegro)
      if (this.v32Storage) {
        const res = this.v32Storage.load(instrumentId);
        if (res.ok) {
           // O storage V3.2 guarda o último registro; para histórico completo v3.1 é mantido.
           // Em uma refatoração futura, o V3.2 suportará histórico nativo.
        }
      }
      return (this._read()[instrumentId] || []).sort((a,b) => a.ts - b.ts);
    }

    /** @param {string} instrumentId */
    clear(instrumentId) {
      const s = this._read();
      delete s[instrumentId];
      this._write(s);
    }
  }

  /* ====================================================================
   *  DIRECT TEST ENGINE — testes presenciais aplicados na criança
   * ==================================================================== */
  class DirectTestEngine extends BaseClinicalEngine {
    constructor(registry, opts) { super("direct_test", registry, opts); }

    /**
     * Inicia uma aplicação presencial (cronômetro + tela de aplicação).
     * @param {string} instrumentId
     * @param {Object} [context]
     */
    startApplication(instrumentId, context = {}) {
      const inst = this.find(instrumentId);
      if (!inst) throw new Error(`teste não encontrado: ${instrumentId}`);
      return {
        instrument: inst,
        startedAt: Date.now(),
        context,
        clock: {
          start: Date.now(),
          stop: () => Date.now() - this._lastStart,
        },
        commit: (result) => this.save(instrumentId, { ...context, ...result, finishedAt: Date.now() })
      };
    }

    /** Override: pondera tempo curto e age-window quando disponíveis */
    recommend(query) {
      const base = super.recommend(query);
      base.all.sort((a, b) => (a.estimated_minutes || 99) - (b.estimated_minutes || 99));
      base.top = base.all.slice(0, 5);
      base.meta.priorities = ["tempo_de_aplicacao_curto", "subtype_match"];
      return base;
    }
  }

  /* ====================================================================
   *  SCALE ENGINE — escalas/questionários de pré-consulta
   * ==================================================================== */
  class ScaleEngine extends BaseClinicalEngine {
    constructor(registry, opts) {
      super("scale", registry, opts);
      /** @type {{allow: Set<string>, block: Set<string>}} */
      this.preConsultaPolicy = {
        allow: new Set(opts?.preConsultaAllow || []),
        block: new Set(opts?.preConsultaBlock || [])
      };
    }

    /**
     * Bloqueia instrumentos que exigem treinamento clínico, observação
     * estruturada, >20min, gate diagnóstico.
     * @param {Instrument} inst
     * @returns {boolean}
     */
    isPreConsulta(inst) {
      if (this.preConsultaPolicy.block.has(inst.id)) return false;
      if (this.preConsultaPolicy.allow.has(inst.id)) return true;
      if (inst.requires_training === true) return false;
      if (inst.estimated_minutes > 20) return false;
      if (/cl[íi]nico/.test(inst.respondent)) return false;
      if (!["triagem","acompanhamento","monitoramento","resposta_tratamento"].includes(inst.purpose)) return false;
      return true;
    }

    listPreConsulta() { return this.list().filter((i) => this.isPreConsulta(i)); }

    /** Override: aplica filtro pré-consulta automaticamente */
    recommend(query) {
      const inventory = this.listPreConsulta();
      const tags = new Set((query.chief_complaints || []).map((t) => t.toLowerCase()));
      const scored = inventory.map((inst) => {
        const text = `${inst.name} ${inst.subtype}`.toLowerCase();
        let s = 0;
        tags.forEach((t) => { if (text.includes(t.replace(/_/g, " "))) s += 1; });
        return { inst, score: s };
      })
      .filter((x) => x.score > 0 || tags.size === 0)
      .sort((a, b) => b.score - a.score);

      const all = scored.map((s) => s.inst);
      return {
        top: all.slice(0, 5),
        all,
        meta: {
          engine: "ScaleEngine",
          type: "scale",
          preconsulta_filter_active: true,
          preconsulta_removed: this.list().length - inventory.length,
          n_inventory_pre: inventory.length
        }
      };
    }

    /** Gera link para preenchimento remoto (placeholder URL) */
    remoteFillLink(instrumentId, patientHash) {
      const inst = this.find(instrumentId);
      if (!inst) return null;
      const base = (global.location && global.location.origin) || "https://jadsonfraga.github.io/neuroped";
      return `${base}/escalas-questionarios.html?inst=${encodeURIComponent(inst.id)}&p=${encodeURIComponent(patientHash || "")}`;
    }
  }

  /* ====================================================================
   *  DIARY ENGINE — diários longitudinais
   * ==================================================================== */
  class DiaryEngine extends BaseClinicalEngine {
    constructor(registry, opts) { super("diary", registry, opts); }

    /** Adiciona registro temporal (mantém ordenação por timestamp) */
    logEntry(diaryId, entry) {
      if (!this.find(diaryId)) throw new Error(`diário não encontrado: ${diaryId}`);
      const e = { ...entry, ts: Date.now(), date: entry.date || new Date().toISOString().slice(0, 10) };
      return this.save(diaryId, e);
    }

    /** Estatísticas agregadas dos últimos N dias (média/mín/máx/contagem) */
    summary(diaryId, days = 30) {
      const horizon = Date.now() - days * 86400 * 1000;
      const entries = this.history(diaryId).filter((e) => e.ts >= horizon);
      const numericKey = entries.length
        ? Object.keys(entries[0]).find((k) => /1_5|1_10|n_|duracao/.test(k))
        : null;
      if (!numericKey) return { n: entries.length, days };
      const vals = entries.map((e) => Number(e[numericKey])).filter((v) => !Number.isNaN(v));
      const sum = vals.reduce((a, b) => a + b, 0);
      return {
        n: entries.length,
        days,
        metric: numericKey,
        avg: vals.length ? sum / vals.length : null,
        min: vals.length ? Math.min(...vals) : null,
        max: vals.length ? Math.max(...vals) : null
      };
    }

    /** Trend simples: compara médias semanais consecutivas */
    trend(diaryId, weeks = 4) {
      const horizon = Date.now() - weeks * 7 * 86400 * 1000;
      const entries = this.history(diaryId).filter((e) => e.ts >= horizon);
      const numericKey = entries.length
        ? Object.keys(entries[0]).find((k) => /1_5|1_10|n_/.test(k))
        : null;
      if (!numericKey) return { weeks: [], delta: 0 };
      const buckets = Array.from({ length: weeks }, () => []);
      entries.forEach((e) => {
        const idx = Math.min(weeks - 1, Math.floor((Date.now() - e.ts) / (7 * 86400 * 1000)));
        const v = Number(e[numericKey]);
        if (!Number.isNaN(v)) buckets[weeks - 1 - idx].push(v);
      });
      const avgs = buckets.map((b) => b.length ? b.reduce((a, c) => a + c, 0) / b.length : null);
      const valid = avgs.filter((v) => v != null);
      const delta = valid.length >= 2 ? valid[valid.length - 1] - valid[0] : 0;
      return { weeks: avgs, delta, direction: delta > 0.3 ? "piorando" : delta < -0.3 ? "melhorando" : "estavel" };
    }

    /** Override: prioriza diários ativos (com entries recentes) */
    recommend(query) {
      const inventory = this.list();
      const subtypeHints = (query.chief_complaints || []).join(" ").toLowerCase();
      const ranked = inventory.map((inst) => {
        let s = 0;
        if (subtypeHints && subtypeHints.includes(inst.subtype.replace(/_/g, " "))) s += 2;
        const lastEntry = this.history(inst.id).slice(-1)[0];
        if (lastEntry && (Date.now() - lastEntry.ts) < 30 * 86400 * 1000) s += 1;
        return { inst, score: s };
      }).sort((a, b) => b.score - a.score);

      const all = ranked.map((r) => r.inst);
      return {
        top: all.slice(0, 5),
        all,
        meta: { engine: "DiaryEngine", type: "diary", n_inventory: inventory.length }
      };
    }
  }

  /* ====================================================================
   *  BOOTSTRAP & CATALOG LOADER
   * ==================================================================== */
  const registry = new InstrumentRegistry();

  /** Carrega o canonical_catalog do taxonomy v3.1 e registra tudo */
  async function loadCatalog(url = "./clinical-taxonomy-v3.1.json") {
    try {
      const res = await fetch(url);
      const tax = await res.json();
      ["direct_test", "scale", "diary"].forEach((t) => {
        (tax.canonical_catalog?.[t] || []).forEach((raw) => {
          const inst = {
            ...raw,
            type: t,
            category: tax.types[t].category_canonical
          };
          registry.register(inst);
        });
      });
      const preFilter = tax.pre_consultation_filter || {};
      global.NeuroPedClinical.scaleEngine.preConsultaPolicy = {
        allow: new Set(preFilter.allowlist || []),
        block: new Set(preFilter.blocklist || [])
      };
      return tax;
    } catch (e) {
      console.warn("[loadCatalog]", e);
      return null;
    }
  }

  const directTestEngine = new DirectTestEngine(registry);
  const scaleEngine      = new ScaleEngine(registry);
  const diaryEngine      = new DiaryEngine(registry);

  global.NeuroPedClinical = {
    InstrumentRegistry,
    BaseClinicalEngine,
    DirectTestEngine,
    ScaleEngine,
    DiaryEngine,
    registry,
    directTestEngine,
    scaleEngine,
    diaryEngine,
    loadCatalog,
    version: "3.1.0"
  };

  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinical;

  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => loadCatalog());
  }
})(typeof window !== "undefined" ? window : globalThis);
