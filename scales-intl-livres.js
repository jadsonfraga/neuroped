/* NeuroPed EDJ — Instrumentos internacionais de LICENÇA LIVRE (curadoria)
 * --------------------------------------------------------------------------
 * Curadoria seletiva (NÃO é "encher linguiça") de instrumentos consagrados,
 * gratuitos/uso livre, que preenchem LACUNAS reais do catálogo — Brasil e mundo.
 * Entram como REFERÊNCIA: catalogados com fonte/citação; as perguntas que abrem
 * são AUTORAIS NeuroPed sobre o mesmo construto (preenchidas por
 * scales-official-questions.js) — NÃO reproduzem os itens originais.
 *
 * Seleção (com fonte primária):
 *  • Q-CHAT  — rastreio quantitativo de TEA no toddler (Allison/Baron-Cohen) · PMID 22265366
 *  • SCARED  — ansiedade infantojuvenil (Birmaher 1997) · PMID 9100430
 *  • CSHQ    — hábitos de sono (Owens 2000) · PMID 11145319
 *  • KIDSCREEN-10 — qualidade de vida (Europa, Ravens-Sieberer) · PMID 30014304
 *  • SNAP-IV — TDAH/TOD (Swanson) · uso livre
 *  • IRDI    — indicadores de risco ao desenvolvimento (Brasil, Kupfer et al.) · uso livre
 */
(function () {
  'use strict';
  if (window.NEUROPED_INTL_LIVRES_LOADED) return;
  window.NEUROPED_INTL_LIVRES_LOADED = true;

  var ITEMS = [
    {
      id: 'ofc3-qchat', title: 'Q-CHAT — rastreio quantitativo de TEA (toddler)', short_title: 'Q-CHAT (referência)',
      emoji: '🧩', domain: 'TEA precoce (rastreio)', age_band: '18–24 meses', age_min_months: 18, age_max_months: 30,
      official_url: 'https://www.autismresearchcentre.com/tests/', _citation: 'Allison C, Baron-Cohen S, et al. (Q-CHAT).', _pmid: '22265366', license_status: 'livre'
    },
    {
      id: 'ofc3-scared', title: 'SCARED — sintomas de ansiedade infantojuvenil', short_title: 'SCARED (referência)',
      emoji: '😟', domain: 'Ansiedade (criança/adolescente)', age_band: '8–18 anos', age_min_months: 96, age_max_months: 215,
      official_url: 'https://www.midss.org/content/screen-child-anxiety-related-disorders-scared', _citation: 'Birmaher B, et al. J Am Acad Child Adolesc Psychiatry. 1997.', _pmid: '9100430', license_status: 'livre'
    },
    {
      id: 'ofc3-cshq', title: 'CSHQ — hábitos e dificuldades de sono', short_title: 'CSHQ (referência)',
      emoji: '🌙', domain: 'Sono', age_band: '4–10 anos', age_min_months: 48, age_max_months: 144,
      official_url: '', _citation: 'Owens JA, Spirito A, McGuinn M. Sleep. 2000.', _pmid: '11145319', license_status: 'livre'
    },
    {
      id: 'ofc3-kidscreen10', title: 'KIDSCREEN-10 — qualidade de vida relacionada à saúde', short_title: 'KIDSCREEN-10 (referência)',
      emoji: '🌈', domain: 'Qualidade de vida', age_band: '8–18 anos', age_min_months: 96, age_max_months: 215,
      official_url: 'https://www.kidscreen.org', _citation: 'Ravens-Sieberer U, et al. (KIDSCREEN). Eur grupo.', _pmid: '30014304', license_status: 'livre-reg'
    },
    {
      id: 'ofc3-snap-iv', title: 'SNAP-IV — TDAH e sintomas de oposição', short_title: 'SNAP-IV (referência)',
      emoji: '🎯', domain: 'TDAH', age_band: '6–18 anos', age_min_months: 72, age_max_months: 215,
      official_url: 'https://www.shared-care.ca/files/Scoring_for_SNAP_IV_Guide_26-item.pdf', _citation: 'Swanson JM, et al. (SNAP-IV). Uso livre.', _pmid: '', license_status: 'livre'
    },
    {
      id: 'ofc3-irdi', title: 'IRDI — indicadores de risco ao desenvolvimento infantil (Brasil)', short_title: 'IRDI (referência)',
      emoji: '🇧🇷', domain: 'Desenvolvimento (risco precoce)', age_band: '0–18 meses', age_min_months: 0, age_max_months: 18,
      official_url: '', _citation: 'Kupfer MC, Jerusalinsky AN, et al. Pesquisa multicêntrica IRDI, Brasil.', _pmid: '', license_status: 'livre'
    }
  ];

  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = [];
  ITEMS.forEach(function (it) {
    if (ids[it.id]) return;
    add.push({
      id: it.id, title: it.emoji + ' ' + it.title, short_title: it.short_title, emoji: it.emoji,
      audience: 'familia', audience_label: 'Família/Clínico',
      age_band: it.age_band, age_min_months: it.age_min_months, age_max_months: it.age_max_months,
      domain: it.domain,
      official_catalog: true, official_url: it.official_url,
      plain_questions: [],            // preenchidas (autorais) por scales-official-questions.js
      applicable: false,
      license_status: it.license_status,
      _citation: it._citation, _pmid: it._pmid, _intl_curated: true
    });
  });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_INTL_LIVRES = add;
})();
