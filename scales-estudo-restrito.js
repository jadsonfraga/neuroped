/* NeuroPed EDJ — Instrumentos NÃO-LIVRES: REFERÊNCIA DE ESTUDO (uso restrito)
 * --------------------------------------------------------------------------
 * Instrumentos proprietários (licença paga) catalogados APENAS como referência
 * de ESTUDO, atrás de senha (uso restrito, não clínico). NÃO contêm os itens
 * originais (protegidos por direito autoral) — trazem nome, construto, faixa,
 * citação + LINK DA FONTE OFICIAL (onde licenciar/obter o original) e perguntas-
 * guia AUTORAIS sobre o mesmo construto (preenchidas por scales-official-
 * questions.js). study_only:true → o runner exige senha e marca "não clínico".
 */
(function () {
  'use strict';
  if (window.NEUROPED_ESTUDO_RESTRITO_LOADED) return;
  window.NEUROPED_ESTUDO_RESTRITO_LOADED = true;

  var ITEMS = [
    { id: 'rst-conners3', t: 'Conners-3 — TDAH e comorbidades', dom: 'TDAH', band: '6–18 anos', mn: 72, mx: 215, pub: 'MHS (Multi-Health Systems)', url: 'https://mhs.com/', flag: '🇨🇦' },
    { id: 'rst-vineland3', t: 'Vineland-3 — comportamento adaptativo', dom: 'Comportamento adaptativo', band: '0–18+ anos', mn: 0, mx: 960, pub: 'Pearson', url: 'https://www.pearsonassessments.com/', flag: '🇺🇸' },
    { id: 'rst-cars2', t: 'CARS-2 — gravidade do autismo', dom: 'TEA (gravidade)', band: '2–18+ anos', mn: 24, mx: 960, pub: 'WPS', url: 'https://www.wpspublish.com/', flag: '🇺🇸' },
    { id: 'rst-cbcl', t: 'CBCL / ASEBA — banda larga (Achenbach)', dom: 'Comportamento (banda larga)', band: '1,5–18 anos', mn: 18, mx: 215, pub: 'ASEBA', url: 'https://aseba.org/', flag: '🇺🇸' },
    { id: 'rst-brief2', t: 'BRIEF-2 — funções executivas', dom: 'Função executiva', band: '5–18 anos', mn: 60, mx: 215, pub: 'PAR', url: 'https://www.parinc.com/', flag: '🇺🇸' },
    { id: 'rst-srs2', t: 'SRS-2 — responsividade social (TEA)', dom: 'TEA (traços sociais)', band: '2,5–18 anos', mn: 30, mx: 215, pub: 'WPS', url: 'https://www.wpspublish.com/', flag: '🇺🇸' },
    { id: 'rst-mabc2', t: 'Movement ABC-2 — coordenação motora', dom: 'Motor / coordenação', band: '3–16 anos', mn: 36, mx: 192, pub: 'Pearson', url: 'https://www.pearsonassessments.com/', flag: '🇬🇧' },
    { id: 'rst-ados2', t: 'ADOS-2 — observação para TEA', dom: 'TEA (observação)', band: '12 meses–adulto', mn: 12, mx: 960, pub: 'WPS', url: 'https://www.wpspublish.com/', flag: '🇺🇸' },
    { id: 'rst-wiscv', t: 'WISC-V — inteligência (QI)', dom: 'Cognição / inteligência', band: '6–16 anos', mn: 72, mx: 200, pub: 'Pearson', url: 'https://www.pearsonassessments.com/', flag: '🇺🇸' },
    { id: 'rst-bayley4', t: 'Bayley-4 — desenvolvimento infantil', dom: 'Desenvolvimento (0–3a)', band: '0–42 meses', mn: 0, mx: 42, pub: 'Pearson', url: 'https://www.pearsonassessments.com/', flag: '🇺🇸' },
    { id: 'rst-asq3', t: 'ASQ-3 — Ages & Stages (triagem do desenvolvimento)', dom: 'Vigilância do desenvolvimento', band: '1–66 meses', mn: 1, mx: 66, pub: 'Brookes Publishing', url: 'https://agesandstages.com/', flag: '🇺🇸' }
  ];

  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = [];
  ITEMS.forEach(function (it) {
    if (ids[it.id]) return;
    add.push({
      id: it.id, title: '🔒 ' + it.t, short_title: it.t.split(' — ')[0] + ' (estudo)', emoji: '🔒',
      audience: 'clinico', audience_label: 'Estudo (uso restrito)',
      age_band: it.band, age_min_months: it.mn, age_max_months: it.mx,
      domain: it.dom,
      official_catalog: true, official_url: it.url,
      plain_questions: [],            // preenchidas (autorais) por scales-official-questions.js
      applicable: false,
      license_status: 'restrito', study_only: true,
      _origin: it.flag, _citation: 'Instrumento proprietário — ' + it.pub + '. Licenciar/obter na fonte oficial.',
      _intl_curated: true, _study_ref: true
    });
  });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_ESTUDO_RESTRITO = add;
})();
