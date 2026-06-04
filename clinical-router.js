/* =====================================================================
   NeuroPed SDG · CLINICAL ROUTER V3
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Routing e classificação por TIPO clínico canônico:
     · direct_test   → testes-diretos.html
     · scale         → escalas-questionarios.html
     · diary         → diarios-clinicos.html

   Substitui qualquer filtro genérico (if item.tipo === "teste") por
   classificação semântica multi-sinal: ID curado > sintaxe ID >
   respondent > duração > palavras-chave no label/descrição.
   ===================================================================== */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------
   *  CARREGAMENTO DA TAXONOMIA
   * ------------------------------------------------------------------ */
  let TAXONOMY = global.NeuroPedClinicalTaxonomyV3 || null;
  const ALLOWLIST = { scale: new Map(), direct_test: new Map(), diary: new Map() };

  function hydrateAllowlists(tax) {
    if (!tax || !tax.canonical_allowlist) return;
    ["scale", "direct_test", "diary"].forEach((t) => {
      ALLOWLIST[t] = new Map();
      (tax.canonical_allowlist[t] || []).forEach((entry) => {
        ALLOWLIST[t].set(entry.id, entry);
      });
    });
  }
  if (TAXONOMY) hydrateAllowlists(TAXONOMY);

  async function loadTaxonomy(url = "./clinical-taxonomy-v3.json") {
    if (TAXONOMY) return TAXONOMY;
    try {
      const res = await fetch(url);
      TAXONOMY = await res.json();
      hydrateAllowlists(TAXONOMY);
      global.NeuroPedClinicalTaxonomyV3 = TAXONOMY;
      return TAXONOMY;
    } catch (e) {
      console.warn("[ClinicalRouter] falha ao carregar taxonomia:", e);
      return null;
    }
  }

  /* ------------------------------------------------------------------
   *  HEURÍSTICAS SEMÂNTICAS — multi-sinal, ranqueado
   *  Devolve {type, confidence (0-1), reason}
   * ------------------------------------------------------------------ */
  const RGX = {
    diary_id:        /^diar[-_]|diario|diary|^reg-/i,
    direct_test_id:  /^td[-_]|^teste-direto|^teste-aplicado|^prova-/i,
    diary_label:     /\bdi[áa]rio\b|registro\s+(di[áa]rio|semanal)|monitoramento\s+(cont[íi]nuo|di[áa]rio)|linha\s+do\s+tempo|calend[áa]rio/i,
    direct_test_label: /\bteste\s+de\s+(leitura|escrita|nomea[çc][ãa]o|reconhecimento|consci[êe]ncia|mat(em[áa]tica|aritm[ée]tica))\b|\brastreio\s+cognitivo\b|\bprova\s+(neuropsicol[óo]gica|acad[êe]mica)\b|\bfluencia\s+verbal\b|\bdigit\s+span\b|\bstroop\b/i,
    scale_label:     /\bquestion[áa]rio\b|\binvent[áa]rio\b|\bescala\b|\brating\s+scale\b|\bchecklist\b|\bself-report\b/i,
    direct_respondent: /cl[íi]nico_observacao|crian[çc]a_em_desempenho|aplicacao_direta_crianca/i,
    diary_respondent:  /automonitoramento|cuidador|familia.*di[áa]ria|registro_recorrente/i
  };

  function classifyItem(item, opts = {}) {
    const id    = String(item.id || item.code || "").toLowerCase();
    const label = String(item.label || item.name || item.titulo || "");
    const desc  = String(item.description || item.descricao || item.summary || "");
    const resp  = String(item.respondent || item.respondente || "");
    const text  = `${label} ${desc}`.toLowerCase();

    // 1. ALLOWLIST CURADA — prioridade máxima
    if (ALLOWLIST.scale.has(id))       return { type: "scale",       subtype: ALLOWLIST.scale.get(id).subtype,       confidence: 1.0, reason: "allowlist_scale" };
    if (ALLOWLIST.direct_test.has(id)) return { type: "direct_test", subtype: ALLOWLIST.direct_test.get(id).subtype, confidence: 1.0, reason: "allowlist_direct_test" };
    if (ALLOWLIST.diary.has(id))       return { type: "diary",       subtype: ALLOWLIST.diary.get(id).subtype,       confidence: 1.0, reason: "allowlist_diary" };

    // 2. SINTAXE DO ID — alta confiança
    if (RGX.diary_id.test(id))         return { type: "diary",       subtype: inferDiarySubtype(text), confidence: 0.9, reason: "id_pattern_diary" };
    if (RGX.direct_test_id.test(id))   return { type: "direct_test", subtype: inferTestSubtype(text), confidence: 0.9, reason: "id_pattern_direct_test" };

    // 3. RESPONDENTE — sinal forte para direct_test
    if (RGX.direct_respondent.test(resp)) return { type: "direct_test", subtype: inferTestSubtype(text), confidence: 0.85, reason: "respondent_direct" };
    if (RGX.diary_respondent.test(resp))  return { type: "diary",       subtype: inferDiarySubtype(text), confidence: 0.75, reason: "respondent_diary" };

    // 4. LABEL — moderada confiança
    if (RGX.diary_label.test(text))       return { type: "diary",       subtype: inferDiarySubtype(text), confidence: 0.75, reason: "label_diary" };
    if (RGX.direct_test_label.test(text)) return { type: "direct_test", subtype: inferTestSubtype(text), confidence: 0.7,  reason: "label_direct_test" };
    if (RGX.scale_label.test(text))       return { type: "scale",       subtype: inferScaleSubtype(text, resp), confidence: 0.7, reason: "label_scale" };

    // 5. FALLBACK — respondent é familia/escola/autoteste → scale (mais comum)
    if (/familia|escola|autoteste|cuidador/i.test(resp)) {
      return { type: "scale", subtype: inferScaleSubtype(text, resp), confidence: 0.55, reason: "fallback_indirect_respondent" };
    }

    // 6. INDETERMINADO
    return { type: "unknown", subtype: null, confidence: 0, reason: "no_signal" };
  }

  function inferDiarySubtype(t) {
    if (/\bsono|sleep|despertares|enures/i.test(t))       return "sleep";
    if (/\baliment|comida|refei[çc][ãa]o|feeding/i.test(t)) return "feeding";
    if (/\bcrise|epile|convuls|seizure/i.test(t))          return "seizure";
    if (/\bevacu|fezes|intestin|bowel|consti/i.test(t))    return "bowel";
    if (/\bmedica|f[áa]rmaco|dose/i.test(t))               return "medication";
    if (/\bescolar|aula|professor/i.test(t))               return "school_daily";
    if (/\bagressiv|ataque|raiva|tantrum/i.test(t))        return "aggression";
    if (/\bsensorial|sensory/i.test(t))                    return "sensory";
    if (/\bhumor|mood|tristeza|alegria/i.test(t))          return "mood";
    if (/\bcefaleia|enxaqueca|dor\s+de\s+cabe/i.test(t))   return "headache";
    if (/\btique|tic/i.test(t))                            return "tics";
    return "behavior";
  }
  function inferTestSubtype(t) {
    if (/\bleitura|escrita|matem[áa]|acad[êe]mic/i.test(t)) return "academic";
    if (/\bnomea[çc][ãa]o|naming|ran\b/i.test(t))           return "naming";
    if (/\bfonol[óo]g/i.test(t))                            return "phonological_awareness";
    if (/\bletras|letter|alfabe/i.test(t))                  return "letter_recognition";
    if (/\bcognit/i.test(t))                                return "cognitive_screening";
    if (/\bmotora|motor|coordena/i.test(t))                 return "motor_task";
    if (/\bfluencia|fluen[ñn]cy/i.test(t))                  return "language_production";
    if (/\bstroop|trilhas|digit\s+span|executiv/i.test(t))  return "executive_function_task";
    return "neuropsych_brief";
  }
  function inferScaleSubtype(t, resp) {
    if (/\bansiedade|anxiety|scared|gad/i.test(t))          return "anxiety";
    if (/\bdepress|phq|cdi|humor\s+deprim/i.test(t))        return "depression";
    if (/\bsuic|risco|risk|c-ssrs/i.test(t))                return "risk";
    if (/\bsono|sleep|bisq/i.test(t))                       return "sleep_screening";
    if (/\baten[çc][ãa]o|snap|conners|vanderbilt|tdah/i.test(t)) return "attention";
    if (/\btea|autism|m-?chat|srs|cars/i.test(t))           return "social";
    if (/\bsensorial|sensory/i.test(t))                     return "sensory";
    if (/\badapta|vineland/i.test(t))                       return "adaptive";
    if (/\bdesenvolvi|asq|developmental/i.test(t))          return "developmental";
    if (/\bobsess|toc|y-?bocs/i.test(t))                    return "obsessive_compulsive";
    if (/\bescolar|school/i.test(t) && /escola/i.test(resp))return "school";
    return "behavioral";
  }

  /* ------------------------------------------------------------------
   *  FILTROS POR PAINEL — contrato V3
   * ------------------------------------------------------------------ */
  function filterByPanel(catalog, panel) {
    const TARGET = {
      "testes-diretos.html":        "direct_test",
      "escalas-questionarios.html": "scale",
      "diarios-clinicos.html":      "diary"
    }[panel];
    if (!TARGET || !Array.isArray(catalog)) return [];
    return catalog
      .map((it) => ({ ...it, _class: classifyItem(it) }))
      .filter((it) => it._class.type === TARGET);
  }

  function categorize(catalog) {
    const out = { direct_test: [], scale: [], diary: [], unknown: [] };
    (catalog || []).forEach((it) => {
      const c = classifyItem(it);
      out[c.type].push({ ...it, _class: c });
    });
    return out;
  }

  /* ------------------------------------------------------------------
   *  HOOK DE PAINEL — auto-aplica no painel certo
   * ------------------------------------------------------------------ */
  function enableInUI() {
    const path = (global.location && global.location.pathname) || "";
    const engine = global.NeuroPedClinica || global.NeuroPedClinicaEngine;
    if (!engine || typeof engine.recommend !== "function") return false;

    let targetPanel = null;
    if (/testes-diretos/i.test(path))         targetPanel = "testes-diretos.html";
    else if (/escalas-questionarios|filtro-escalas/i.test(path)) targetPanel = "escalas-questionarios.html";
    else if (/diarios-clinicos/i.test(path))  targetPanel = "diarios-clinicos.html";
    if (!targetPanel) return false;

    if (engine.__clinicalRouterWrapped) return true;
    const original = engine.recommend.bind(engine);
    engine.recommend = function (query, catalog) {
      const filtered = filterByPanel(catalog || [], targetPanel);
      const result = original(query, filtered);
      result.meta = result.meta || {};
      result.meta.clinical_router_panel = targetPanel;
      result.meta.clinical_router_kept = filtered.length;
      result.meta.clinical_router_removed = (catalog || []).length - filtered.length;
      return result;
    };
    engine.__clinicalRouterWrapped = true;
    return true;
  }

  /* ------------------------------------------------------------------
   *  EXPORT
   * ------------------------------------------------------------------ */
  const api = {
    classifyItem,
    filterByPanel,
    categorize,
    enableInUI,
    loadTaxonomy,
    version: "3.0.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.NeuroPedClinicalRouter = api;

  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", async () => {
      await loadTaxonomy();
      enableInUI();
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
