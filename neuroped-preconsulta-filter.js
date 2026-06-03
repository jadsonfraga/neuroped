/* =====================================================================
   NeuroPed EDJ · PRÉ-CONSULTA FILTER V10.2
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   FILTRO PERMANENTE no filtro-escalas.html.

   REGRA CLÍNICA (Dr. Jadson, 02/06/2026):
     O filtro-escalas é o painel da SECRETÁRIA no momento da PRÉ-CONSULTA.
     Devem aparecer apenas instrumentos que a secretária possa entregar
     diretamente ao paciente / familiar na sala de espera, sem necessidade
     de:
        - observação clínica estruturada
        - entrevista treinada conduzida pelo médico
        - juízo clínico ativo durante aplicação
        - treinamento profissional certificado
        - tempo superior à tolerância da sala de espera (≤ 20 min)

   Instrumentos clínicos (Vineland, CARS-2, GMFCS, C-SSRS, ASQ Suicide,
   Conners-3, CBCL) NÃO devem aparecer aqui. Eles ficam no painel do
   médico, em outra rota do app.

   COMPORTAMENTO:
     - Filtro ATIVO POR PADRÃO no filtro-escalas.html
     - NÃO há toggle — é uma decisão de produto
     - O médico tem rota separada para instrumentos clínicos
   ===================================================================== */

(function (global) {
  "use strict";

  /* ------------------------------------------------------------------
   *  ALLOW-LIST DA PRÉ-CONSULTA (curada pelo Dr. Jadson)
   *  Estes IDs estão aprovados independentemente do catálogo legado.
   * ------------------------------------------------------------------ */
  const ALLOWLIST_PRECONSULTA = new Set([
    "ofc-mchat-rf",          // M-CHAT-R/F  · familia, 5 min
    "ofc-snap-iv",           // SNAP-IV     · familia+escola, 7 min
    "ofc-asq-3",             // ASQ-3       · familia, 15 min
    "ofc-srs-2",             // SRS-2       · familia+escola, 20 min
    "ofc-phq-a",             // PHQ-A       · autoteste adolescente, 5 min
    "ofc-vanderbilt",        // Vanderbilt  · familia+escola, 10 min
    "ofc-sdq",               // SDQ         · familia/escola/autoteste 11+, 5 min
    "ofc-gad-7",             // GAD-7       · autoteste, 3 min
    "ofc-scared",            // SCARED      · autoteste 8+/pais, 10 min
    "ofc-bisq",              // BISQ        · familia, 5 min
    "ofc-cdi-2",             // CDI 2       · autoteste/pais, 15 min
    "fam-12-36-tea-primeiros-sinais"   // autoral · familia, 4 min
  ]);

  /* ------------------------------------------------------------------
   *  BLOCKLIST EXPLÍCITA — risco se aparecer em pré-consulta
   * ------------------------------------------------------------------ */
  const BLOCKLIST_PRECONSULTA = new Set([
    "ofc-cssrs",          // entrevista clínica estruturada, gate de risco
    "ofc-asq-suicide",    // aplicação direta pelo clínico ao adolescente
    "ofc-gmfcs-er",       // classificação funcional pelo médico
    "ofc-cars-2",         // observação clínica estruturada
    "ofc-vineland-3",     // entrevista clínica de 60 min
    "ofc-conners-3",      // training_required + extenso
    "ofc-cbcl"            // 113 itens, 25 min, fora do orçamento
  ]);

  /* ------------------------------------------------------------------
   *  CHECAGEM AUTOMÁTICA POR ONTOLOGIA (fallback para itens não listados)
   * ------------------------------------------------------------------ */
  function passesByOntology(instrumentId, ontology) {
    const inst = ontology?.instruments?.[instrumentId];
    if (!inst) return false;

    const respondent = String(inst.respondent || "");
    if (/cl[ií]nico/i.test(respondent)) return false;
    if (inst.training_required === true) return false;
    if (typeof inst.estimated_minutes === "number" && inst.estimated_minutes > 20) return false;

    const purpose = String(inst.purpose || "");
    const purposeOK =
      /triagem/i.test(purpose) ||
      /acompanhamento/i.test(purpose) ||
      /resposta-medicacao/i.test(purpose) ||
      /resposta-tratamento/i.test(purpose);
    if (!purposeOK) return false;

    // Exclui qualquer instrumento com gate diagnóstico que exija juízo clínico
    if (inst.requires_diagnosis_of && inst.requires_diagnosis_of.length > 0) return false;

    return true;
  }

  function applies(instrumentId, ontology) {
    if (BLOCKLIST_PRECONSULTA.has(instrumentId)) return false;
    if (ALLOWLIST_PRECONSULTA.has(instrumentId)) return true;
    return passesByOntology(instrumentId, ontology);
  }

  function filter(catalog, ontology) {
    if (!Array.isArray(catalog)) return [];
    return catalog.filter((item) => {
      const id = item.id || item.instrument_id || item.code;
      return applies(id, ontology);
    });
  }

  /* ------------------------------------------------------------------
   *  HOOK PERMANENTE em filtro-escalas.html
   *  Sem toggle. O filtro é decisão de produto.
   * ------------------------------------------------------------------ */
  function enableInUI(opts = {}) {
    const ontology = opts.ontology || global.NeuroPedClinicalOntologyV2 || null;
    const engine = global.NeuroPedClinica || global.NeuroPedClinicaEngine || null;

    if (!engine) {
      console.warn("[PreConsultaFilter] Engine clínica não encontrada.");
      return false;
    }

    if (typeof engine.recommend === "function" && !engine.__preConsultaWrapped) {
      const original = engine.recommend.bind(engine);
      engine.recommend = function (query, catalog) {
        const safeCatalog = filter(catalog || [], ontology);
        const removed = (catalog || []).length - safeCatalog.length;
        const result = original(query, safeCatalog);
        result.meta = result.meta || {};
        result.meta.preconsulta_filter_applied = true;
        result.meta.preconsulta_filter_kept = safeCatalog.length;
        result.meta.preconsulta_filter_removed = removed;
        return result;
      };
      engine.__preConsultaWrapped = true;
    }

    // Banner informativo (não interativo)
    function injectBanner() {
      if (document.getElementById("np-preconsulta-banner")) return;
      const host =
        document.querySelector(".np-filter-toolbar") ||
        document.querySelector(".filtro-toolbar") ||
        document.querySelector("[data-filter-toolbar]") ||
        document.querySelector("main") ||
        document.body;
      if (!host) return;

      const banner = document.createElement("div");
      banner.id = "np-preconsulta-banner";
      banner.setAttribute("role", "note");
      banner.style.cssText = [
        "display:flex", "align-items:center", "gap:.6rem",
        "padding:.75rem 1rem", "border-radius:.85rem",
        "background:linear-gradient(135deg, rgba(109,106,245,.08), rgba(231,201,139,.08))",
        "border:1px solid rgba(231,201,139,.28)",
        "color:var(--wine,#f2dca6)",
        "font-size:.92rem", "line-height:1.4",
        "margin:.65rem 0 1rem",
        "font-family:system-ui,sans-serif"
      ].join(";");

      banner.innerHTML =
        '<span aria-hidden="true" style="font-size:1.1rem;">●</span>' +
        '<span><strong>Painel pré-consulta.</strong> Mostrando apenas instrumentos que ' +
        'a secretária pode entregar ao paciente/familiar antes da consulta. ' +
        'Instrumentos clínicos (Vineland, CARS-2, GMFCS, C-SSRS) ficam no painel médico.</span>';

      host.prepend(banner);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectBanner);
    } else {
      injectBanner();
    }

    return true;
  }

  /* ------------------------------------------------------------------
   *  EXPORT
   * ------------------------------------------------------------------ */
  const api = {
    applies,
    filter,
    enableInUI,
    ALLOWLIST_PRECONSULTA: Array.from(ALLOWLIST_PRECONSULTA),
    BLOCKLIST_PRECONSULTA: Array.from(BLOCKLIST_PRECONSULTA),
    version: "10.2.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.NeuroPedPreConsultaFilter = api;

  // AUTO-INIT em filtro-escalas.html
  if (typeof window !== "undefined" &&
      /filtro-escalas/i.test(window.location?.pathname || "")) {
    window.addEventListener("load", () => api.enableInUI());
  }
})(typeof window !== "undefined" ? window : globalThis);
