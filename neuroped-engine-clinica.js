/* =====================================================================
   NeuroPed EDJ · Engine Clínica de Decisão (Consolidada v6.0)
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   ÚNICO arquivo JS que consolida:
   ▸ V4 — score multiplicativo + diagnosis gate + dedup por id_family
   ▸ V5 — 5 camadas de raciocínio clínico + bateria sugerida
   ▸ Psychometrics curado (sensibilidade/especificidade de 18 escalas)

   Substitui: filtro-engine-v2/v3/v4/v5 + ui-v2/v3/v4/v5
   Carregar APÓS scales-bundle.js no filtro-escalas.html.

   API:
     window.NeuroPedClinica.recommend(query, catalog) → { gsb, hypotheses, ... }
     window.NeuroPedClinica.reason(query, catalog)     → reasoning completo
     window.NeuroPedClinica.dedup(catalog)             → catálogo deduplicado
     window.NeuroPedClinica.sanitize(catalog)          → catálogo saneado
   ===================================================================== */
(function () {
  'use strict';
  if (window.__NP_CLINICA) return;
  window.__NP_CLINICA = true;

  // ==================================================================
  // 1. TAXONOMIA — 15 domínios canônicos
  // ==================================================================
  var TAX = {
    TEA: {
      label: 'TEA',
      primary_tags: ['tea'],
      related_tags: ['fala', 'social', 'sensorial', 'comportamento'],
      synonyms: ['tea', 'autismo', 'autista', 'espectro', 'tea precoce',
                 'tea funcional', 'tea precision', 'tea nivel de suporte',
                 'tea comportamento', 'tea e comunicacao social'],
      first_line_families: ['fam-12-36-tea', 'fam-12-36-brincar', 'fam-3-5-flexibilidade', 'ofc-mchat']
    },
    TDAH: {
      label: 'TDAH',
      primary_tags: ['tdah'],
      related_tags: ['escola', 'comportamento', 'autonomia'],
      synonyms: ['tdah', 'tdah tod', 'tdah escolar', 'tdah adolescente',
                 'tdah atencao', 'tdah funcao executiva', 'funcao executiva'],
      first_line_families: ['fam-6-11-atencao', 'fam-6-11-organizacao', 'ofc-snap', 'ofc-vanderbilt']
    },
    Linguagem: {
      label: 'Linguagem',
      primary_tags: ['fala'],
      related_tags: ['tea', 'escola', 'social'],
      synonyms: ['linguagem', 'fala', 'comunicacao funcional', 'tdl', 'comunicacao social', 'apraxia'],
      first_line_families: ['fam-12-36-fala', 'fam-3-5-comunicacao']
    },
    Aprendizagem: {
      label: 'Aprendizagem',
      primary_tags: ['escola'],
      related_tags: ['tdah', 'fala', 'autonomia'],
      synonyms: ['aprendizagem', 'leitura', 'escrita', 'matematica', 'rendimento'],
      first_line_families: []
    },
    Comportamento: {
      label: 'Comportamento',
      primary_tags: ['comportamento', 'agressividade'],
      related_tags: ['tdah', 'ansiedade', 'tea'],
      synonyms: ['comportamento', 'oposicao', 'tod', 'irritabilidade', 'crises',
                 'birra', 'agressividade'],
      first_line_families: ['fam-3-5-crises', 'fam-6-11-oposicao', 'ofc-sdq']
    },
    Ansiedade: {
      label: 'Ansiedade',
      primary_tags: ['ansiedade'],
      related_tags: ['escola', 'sono', 'humor'],
      synonyms: ['ansiedade', 'medos', 'fobia', 'separacao', 'panico'],
      first_line_families: ['fam-6-11-ansiedade', 'ofc-scared', 'ofc-gad']
    },
    Humor: {
      label: 'Humor',
      primary_tags: ['humor'],
      related_tags: ['ansiedade', 'risco', 'comportamento'],
      synonyms: ['humor', 'depressao', 'tristeza', 'anedonia'],
      first_line_families: ['ofc-phq', 'ofc-cdi']
    },
    Sono: {
      label: 'Sono',
      primary_tags: ['sono'],
      related_tags: ['tdah', 'comportamento', 'ansiedade'],
      synonyms: ['sono', 'sono infantil', 'insonia', 'ronco'],
      first_line_families: ['fam-12-36-sono', 'fam-6-11-sono', 'ofc-bisq']
    },
    Alimentacao: {
      label: 'Alimentação',
      primary_tags: ['alimentacao'],
      related_tags: ['sensorial', 'tea'],
      synonyms: ['alimentacao', 'seletividade alimentar', 'arfid'],
      first_line_families: ['fam-12-36-alimentacao']
    },
    Sensorial: {
      label: 'Sensorial',
      primary_tags: ['sensorial'],
      related_tags: ['tea', 'alimentacao', 'comportamento'],
      synonyms: ['sensorial', 'perfil sensorial', 'hipersensibilidade'],
      first_line_families: ['fam-3-5-sensorial']
    },
    Motor: {
      label: 'Motor',
      primary_tags: ['motor'],
      related_tags: ['autonomia'],
      synonyms: ['motor', 'desenvolvimento motor', 'coordenacao motora'],
      first_line_families: []
    },
    Autonomia: {
      label: 'Autonomia',
      primary_tags: ['autonomia'],
      related_tags: ['tea', 'motor'],
      synonyms: ['autonomia', 'avds', 'avd'],
      first_line_families: ['fam-3-5-autonomia', 'ofc-vineland']
    },
    Neurologico: {
      label: 'Neurológico',
      primary_tags: ['epilepsia', 'cefaleia'],
      related_tags: [],
      synonyms: ['neurologico', 'epilepsia', 'cefaleia'],
      first_line_families: []
    },
    Risco: {
      label: 'Risco Clínico',
      primary_tags: ['risco'],
      related_tags: ['humor', 'ansiedade', 'comportamento'],
      synonyms: ['risco', 'autolesao', 'ideacao suicida'],
      first_line_families: ['ofc-asq-suicide', 'ofc-cssrs'],
      urgent: true
    },
    Acompanhamento: {
      label: 'Acompanhamento',
      primary_tags: ['medicacao'],
      related_tags: ['tdah', 'comportamento'],
      synonyms: ['acompanhamento', 'medicacao', 'impacto medicacao'],
      first_line_families: []
    }
  };

  // ==================================================================
  // 2. TIERS DE EVIDÊNCIA (multiplicadores)
  // ==================================================================
  var TIER_MULT = {
    gold:                  1.40,
    screening_validated:   1.25,
    complementary:         1.10,
    authoral_structured:   1.20,
    observational:         0.85,
    experimental:          0.50
  };

  var TIER_LABEL = {
    gold:                'Gold clínico',
    screening_validated: 'Triagem validada',
    complementary:       'Complementar',
    authoral_structured: 'Autoral estruturado',
    observational:       'Observacional',
    experimental:        'Experimental'
  };

  // ==================================================================
  // 3. DIAGNOSIS GATE — escalas que requerem condição declarada
  // ==================================================================
  var REQUIRES_DX = {
    'ofc-gmfcs':       ['paralisia cerebral', 'pc'],
    'ofc-gmfcs-er':    ['paralisia cerebral', 'pc'],
    'ofc-macs':        ['paralisia cerebral'],
    'ofc-cssrs':       ['risco', 'ideacao suicida', 'humor grave'],
    'ofc-asq-suicide': ['risco', 'humor', 'ansiedade'],
    'ofc-cars-2':      ['tea', 'suspeita tea forte'],
    'ofc-ados':        ['tea', 'suspeita tea forte']
  };

  var DOMAIN_REQUIRES_DX = {
    'paralisia cerebral': ['motor confirmado', 'pc'],
    'risco de suicidio':  ['risco', 'ideacao']
  };

  // ==================================================================
  // 4. PSYCHOMETRICS — sensibilidade / especificidade curados
  // ==================================================================
  var PSY = {
    'ofc-mchat-rf':    { sens: 0.85, esp: 0.99, contexto: '16-30m TEA precoce',         when_not: 'Não usar acima de 36m' },
    'ofc-snap-iv':     { sens: 0.78, esp: 0.82, contexto: 'TDAH 6-17a · gold PT-BR',    when_not: 'Não é confirmatório — só triagem' },
    'ofc-asq-3':       { sens: 0.86, esp: 0.85, contexto: 'Desenvolvimento global 1-66m', when_not: 'Não substitui Bayley com atraso significativo' },
    'ofc-conners-3':   { sens: 0.89, esp: 0.88, contexto: 'TDAH 6-18a confirmação',     when_not: 'Pré-escolar — usar Conners ECA' },
    'ofc-vineland-3':  { sens: 0.92, esp: 0.90, contexto: 'Comportamento adaptativo',   when_not: 'Não é triagem — é laudo/INSS' },
    'ofc-cars-2':      { sens: 0.88, esp: 0.93, contexto: 'TEA confirmação 2-17a',      when_not: 'Não é primeira linha — após M-CHAT positivo' },
    'ofc-srs-2':       { sens: 0.83, esp: 0.78, contexto: 'Traços autísticos dimensional', when_not: 'Não para diagnóstico isolado' },
    'ofc-sdq':         { sens: 0.79, esp: 0.77, contexto: 'Comportamento amplo 4-17a',  when_not: 'Não diagnostica condições específicas' },
    'ofc-phq-a':       { sens: 0.89, esp: 0.77, contexto: 'Depressão adolescente 11-17a', when_not: 'Pré-adolescente — usar CDI 2' },
    'ofc-gad-7':       { sens: 0.92, esp: 0.76, contexto: 'Ansiedade generalizada',     when_not: 'Não é específica para fobias/pânico' },
    'ofc-scared':      { sens: 0.74, esp: 0.93, contexto: 'Ansiedade pediátrica 8-17a', when_not: 'Versão pais para < 8a' },
    'ofc-cdi-2':       { sens: 0.84, esp: 0.83, contexto: 'Depressão pediátrica 7-17a', when_not: 'Adolescente prefere PHQ-A' },
    'ofc-asq-suicide': { sens: 0.97, esp: 0.88, contexto: 'Risco suicida triagem',      when_not: 'Não substitui avaliação clínica' },
    'ofc-cssrs':       { sens: 0.95, esp: 0.85, contexto: 'Severidade risco suicida',   when_not: 'Usar APÓS triagem positiva' },
    'ofc-gmfcs-er':    { sens: 0.93, esp: 0.96, contexto: 'PC já diagnosticada',        when_not: 'NÃO usar como triagem de atraso motor' },
    'ofc-vanderbilt':  { sens: 0.80, esp: 0.75, contexto: 'TDAH triagem 6-12a',         when_not: 'Adolescente — preferir SNAP-IV' },
    'ofc-bisq':        { sens: 0.78, esp: 0.85, contexto: 'Sono 0-3a',                  when_not: 'Pré-escolar > 3a' },
    'ofc-cbcl':        { sens: 0.78, esp: 0.82, contexto: 'Psicopatologia amplo',       when_not: 'Não específica — uso de amplo perfil' }
  };

  // ==================================================================
  // 5. HIPÓTESES CLÍNICAS (10 curadas)
  // ==================================================================
  var HYPOTHESES = {
    'TEA_classico': {
      label: 'TEA — apresentação clássica',
      required: ['tea', 'fala'],
      supporting: ['sensorial', 'social', 'comportamento'],
      age_range: [18, 71],
      domains: ['TEA', 'Linguagem', 'Sensorial', 'Social'],
      first_line: ['ofc-mchat-rf', 'fam-12-36-tea-primeiros-sinais'],
      confirmation: ['ofc-cars-2', 'ofc-srs-2'],
      adaptive: ['ofc-vineland-3'],
      explanation: 'Combinação de atraso de linguagem + rigidez + dificuldade social em criança {age} sugere investigação de TEA. Triagem primária com {gold}; confirmação clínica com {confirmation}.'
    },
    'TEA_alto_funcionamento': {
      label: 'TEA — alto funcionamento (Asperger)',
      required: ['tea'],
      supporting: ['ansiedade', 'comportamento'],
      age_range: [60, 215],
      domains: ['TEA', 'Comportamento', 'Ansiedade'],
      first_line: ['ofc-srs-2'],
      confirmation: ['ofc-cars-2'],
      explanation: 'Apresentação tardia com fala preservada + rigidez + dificuldade social pragmática em criança/adolescente {age}. Considere SRS-2 e CARS-2.'
    },
    'TDAH_desatento': {
      label: 'TDAH — apresentação desatenta',
      required: ['tdah'],
      supporting: ['escola'],
      age_range: [72, 215],
      domains: ['TDAH', 'Aprendizagem'],
      first_line: ['ofc-snap-iv', 'ofc-vanderbilt', 'fam-6-11-atencao-casa'],
      confirmation: ['ofc-conners-3'],
      explanation: 'Padrão desatento em criança {age} com queixa escolar. SNAP-IV e Vanderbilt são gold-standards de triagem; Conners-3 para confirmação.'
    },
    'TDAH_combinado': {
      label: 'TDAH — apresentação combinada',
      required: ['tdah'],
      supporting: ['comportamento', 'escola'],
      age_range: [60, 143],
      domains: ['TDAH', 'Comportamento'],
      first_line: ['ofc-snap-iv', 'ofc-vanderbilt'],
      confirmation: ['ofc-conners-3', 'ofc-cbcl']
    },
    'atraso_global': {
      label: 'Atraso global do desenvolvimento',
      required: ['motor', 'fala'],
      supporting: ['autonomia'],
      age_range: [0, 60],
      domains: ['Motor', 'Linguagem', 'Autonomia'],
      first_line: ['ofc-asq-3', 'fam-12-36-fala-inicial'],
      confirmation: ['ofc-bayley-iii'],
      explanation: 'Atraso simultâneo em múltiplos domínios em criança {age} sugere atraso global. ASQ-3 estrutura triagem; Bayley confirma. Considere avaliação genética/metabólica.'
    },
    'TDL': {
      label: 'Transtorno do desenvolvimento da linguagem',
      required: ['fala'],
      supporting: ['escola'],
      negative: ['tea'],
      age_range: [36, 143],
      domains: ['Linguagem'],
      first_line: ['fam-3-5-comunicacao-funcional'],
      explanation: 'Atraso de linguagem isolado sem sinais nucleares de TEA em criança {age} sugere TDL. Encaminhamento fonoaudiológico precoce.'
    },
    'humor_ansiedade_adolescente': {
      label: 'Quadro de humor/ansiedade adolescente',
      required: ['humor', 'ansiedade', 'risco'],
      age_range: [132, 215],
      domains: ['Humor', 'Ansiedade', 'Risco'],
      first_line: ['ofc-phq-a', 'ofc-gad-7', 'ofc-scared'],
      risk: ['ofc-asq-suicide', 'ofc-cssrs'],
      explanation: 'Adolescente {age} com sinais de humor/ansiedade. Autoavaliação com PHQ-A + GAD-7. Quando red flag: triagem de risco com ASQ; severidade com C-SSRS.'
    },
    'desregulacao_pre_escolar': {
      label: 'Desregulação emocional pré-escolar',
      required: ['comportamento', 'agressividade'],
      age_range: [36, 84],
      domains: ['Comportamento'],
      first_line: ['fam-3-5-crises-transicoes'],
      confirmation: ['ofc-sdq', 'ofc-cbcl'],
      explanation: 'Crises frequentes em pré-escolar {age}. Triagem com instrumento autoral 3-5a; ampliação com SDQ para perfil global.'
    },
    'transtorno_aprendizagem': {
      label: 'Suspeita de transtorno específico de aprendizagem',
      required: ['escola'],
      negative: ['tdah'],
      age_range: [84, 143],
      domains: ['Aprendizagem', 'Linguagem'],
      first_line: ['fam-6-11-atencao-casa']
    },
    'transtorno_sono': {
      label: 'Distúrbio de sono',
      required: ['sono'],
      age_range: [6, 215],
      domains: ['Sono'],
      first_line: ['ofc-bisq', 'fam-12-36-sono-pequeno', 'fam-6-11-sono-escolar']
    }
  };

  // ==================================================================
  // 6. UTILS
  // ==================================================================
  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function idFamily(id) {
    var s = String(id || '').toLowerCase();
    var p = [
      /^(fam-\d+-\d+-[a-z]+)/,
      /^(jf-[a-z]+(?:-[a-z]+)?)/,
      /^(ofc-[a-z0-9-]+)/,
      /^(npe-br-\d+)/,
      /^(aut\d+-\d+)/
    ];
    for (var i = 0; i < p.length; i++) {
      var m = s.match(p[i]);
      if (m) return m[1];
    }
    return s;
  }

  function canonicalizeDomain(rawDomain) {
    if (!rawDomain) return null;
    var n = norm(rawDomain);
    for (var k in TAX) {
      for (var i = 0; i < TAX[k].synonyms.length; i++) {
        var sy = norm(TAX[k].synonyms[i]);
        if (n === sy || n.indexOf(sy) >= 0 || sy.indexOf(n) >= 0) return k;
      }
    }
    return null;
  }

  function inferTier(scale) {
    if (scale.evidence_tier && TIER_MULT[scale.evidence_tier]) return scale.evidence_tier;
    var id = String(scale.id || '');
    var title = norm(scale.title || '');
    if (/m chat|mchat|snap iv|conners|vineland|cbcl|srs 2|cars 2|asq 3|phq|gad 7|cdi|bisq|gmfcs|cssrs|columbia|vanderbilt|sdq|scared|bayley|denver/.test(title)) {
      return 'gold';
    }
    if (/^fam-/.test(id)) {
      if ((scale.priority || 0) >= 80 && scale.plain_questions && scale.plain_questions.length >= 5) {
        return 'authoral_structured';
      }
      return 'observational';
    }
    if (/^jf-/.test(id)) return 'authoral_structured';
    if (/^ofc-/.test(id)) return 'complementary';
    return 'observational';
  }

  // ==================================================================
  // 7. DEDUP por id_family
  // ==================================================================
  function dedup(scales) {
    var g = {};
    scales.forEach(function (s) {
      if (!s || !s.id) return;
      var fam = idFamily(s.id);
      (g[fam] = g[fam] || []).push(s);
    });
    var out = [];
    var tr = { gold: 6, screening_validated: 5, authoral_structured: 4,
               complementary: 3, observational: 2, experimental: 1 };
    Object.keys(g).forEach(function (f) {
      var grp = g[f];
      grp.sort(function (a, b) {
        var ta = tr[inferTier(a)] || 0;
        var tb = tr[inferTier(b)] || 0;
        if (tb !== ta) return tb - ta;
        var ca = (a.clinical_use ? 1 : 0) + (a.plain_questions ? 1 : 0);
        var cb = (b.clinical_use ? 1 : 0) + (b.plain_questions ? 1 : 0);
        if (cb !== ca) return cb - ca;
        return String(b.id).length - String(a.id).length;
      });
      var winner = grp[0];
      winner._family = f;
      winner._family_size = grp.length;
      out.push(winner);
    });
    return out;
  }

  // ==================================================================
  // 8. DIAGNOSIS GATE
  // ==================================================================
  function diagnosisGate(scale, query) {
    var id = String(scale.id || '').toLowerCase();
    var d = norm(scale.domain || '');
    if (REQUIRES_DX[id]) {
      var ok = REQUIRES_DX[id].some(function (dx) {
        return (query.tags || []).indexOf(norm(dx)) >= 0 ||
               (query.text && norm(query.text).indexOf(norm(dx)) >= 0);
      });
      return ok ? 1.20 : 0;
    }
    for (var k in DOMAIN_REQUIRES_DX) {
      if (d.indexOf(k) >= 0) {
        var req = DOMAIN_REQUIRES_DX[k];
        var m = req.some(function (x) {
          return (query.tags || []).indexOf(norm(x)) >= 0;
        });
        if (!m) return 0;
      }
    }
    return 1.0;
  }

  // ==================================================================
  // 9. SCORE COMPONENTES (0–1 normalizados)
  // ==================================================================
  function f_domainMatch(scale, tags) {
    var sd = canonicalizeDomain(scale.domain);
    if (!sd) return 0.20;
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      for (var k in TAX) {
        if (k !== sd) continue;
        if (TAX[k].primary_tags.indexOf(t) >= 0) return 1.0;
        if (TAX[k].related_tags.indexOf(t) >= 0) return 0.50;
      }
    }
    return 0.10;
  }

  function f_ageFit(scale, ageMonths, mode) {
    if (ageMonths == null) return 0.55;
    var a = scale.age_min_months != null ? scale.age_min_months : 0;
    var b = scale.age_max_months != null ? scale.age_max_months : 240;
    var c = (a + b) / 2;
    var h = (b - a) / 2;
    if (ageMonths >= a && ageMonths <= b) {
      return 1.0 - (Math.abs(ageMonths - c) / Math.max(h, 1)) * 0.20;
    }
    var dist = ageMonths < a ? a - ageMonths : ageMonths - b;
    var sig = mode === 'precisa' ? 2 : (mode === 'muito-alta' ? 18 : 6);
    var sc = Math.exp(-(dist * dist) / (2 * sig * sig));
    if (sc < 0.05) return 0;
    return sc * 0.7;
  }

  var COMPLAINT_VOCAB = {
    fala: ['fala', 'linguagem', 'comunic', 'apraxia', 'ecolalia', 'palavra', 'nao fala'],
    tea: ['tea', 'autismo', 'autista', 'rotina', 'rigidez', 'estereotipia', 'contato visual', 'nome', 'brinca sozinho'],
    tdah: ['tdah', 'desatencao', 'hiperatividade', 'foco', 'distrai', 'esquece', 'organizacao', 'nao termina', 'inquieto'],
    escola: ['escola', 'aprendizagem', 'leitura', 'escrita', 'matematica', 'rendimento', 'professora'],
    comportamento: ['birra', 'oposicao', 'desafia', 'irritabilidade', 'crise', 'limite', 'frustracao'],
    agressividade: ['agressivo', 'agride', 'bate', 'morde', 'machuca'],
    sono: ['sono', 'dorme', 'insonia', 'ronco', 'desperta'],
    alimentacao: ['alimentacao', 'seletividade', 'textura', 'recusa comida', 'mastigacao'],
    ansiedade: ['ansiedade', 'medo', 'preocupacao', 'fobia', 'evita', 'separacao'],
    humor: ['humor', 'triste', 'depressao', 'chora', 'isolamento'],
    motor: ['motor', 'marcha', 'anda', 'equilibrio', 'coordenacao', 'quedas'],
    sensorial: ['sensorial', 'barulho', 'textura', 'toque', 'cheiro', 'luz'],
    epilepsia: ['epilepsia', 'crise', 'convulsao'],
    cefaleia: ['cefaleia', 'cabeca', 'enxaqueca'],
    autonomia: ['autonomia', 'avd', 'higiene', 'banho', 'desfralde', 'fralda'],
    risco: ['risco', 'autolesao', 'suicid', 'morrer', 'se cortar', 'nao quer viver'],
    medicacao: ['medicacao', 'remedio', 'ritalina', 'venvanse', 'efeito colateral']
  };

  function f_symptomMatch(scale, freeText, tags) {
    var pool = [].concat(scale.symptoms || [], scale.keywords || [], scale.complaints || []).map(norm);
    if (!pool.length) return 0;
    var matches = new Set();
    norm(freeText || '').split(/\s+/).filter(function (t) { return t.length >= 4; }).forEach(function (t) {
      pool.forEach(function (p) { if (p.indexOf(t) >= 0) matches.add(t); });
    });
    tags.forEach(function (tag) {
      var vocab = COMPLAINT_VOCAB[tag] || [];
      vocab.forEach(function (kw) {
        var nk = norm(kw);
        if (pool.some(function (p) { return p.indexOf(nk) >= 0; })) matches.add(kw);
      });
    });
    return Math.min(matches.size / 6, 1.0);
  }

  function f_respondent(scale, desiredResp, query) {
    var a = norm(scale.audience || '');
    if (query.ageMonths != null) {
      if (query.ageMonths >= 120 && a === 'autoteste') return 1.0;
      if (query.ageMonths < 96 && a === 'autoteste') return 0;
      if (query.ageMonths < 36 && a === 'clinico' && (Number(scale.n_items) || 0) > 30) return 0.20;
    }
    if (!desiredResp) return 0.60;
    if (a.indexOf(norm(desiredResp)) >= 0) return 1.0;
    return 0.30;
  }

  function f_utility(scale) {
    var score = 0.4;
    var n = Number(scale.n_items || 0);
    if (n > 0 && n <= 10) score += 0.30;
    else if (n <= 30) score += 0.15;
    else if (n > 60) score -= 0.10;
    if (scale.clinical_use) score += 0.20;
    if (scale.plain_questions && scale.plain_questions.length >= 5) score += 0.10;
    return Math.max(0, Math.min(1, score));
  }

  function f_primaryIndication(scale, tags) {
    var fam = scale._family || idFamily(scale.id);
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      for (var k in TAX) {
        if (TAX[k].primary_tags.indexOf(t) >= 0) {
          var lines = TAX[k].first_line_families || [];
          for (var j = 0; j < lines.length; j++) {
            if (fam.indexOf(lines[j]) >= 0 || lines[j].indexOf(fam) >= 0) return 1.0;
          }
        }
      }
    }
    return 0;
  }

  // ==================================================================
  // 10. SCORE FINAL — multiplicativo, 0-100 normalizado
  // ==================================================================
  function scoreScale(scale, query) {
    if (/lote|banco completo/i.test(scale.title || '')) return null;
    if (scale.app_status === 'bloqueado' && query.mode === 'aplicar') return null;
    if (scale.validation_status === 'descontinuado') return null;

    var ageFit = f_ageFit(scale, query.ageMonths, query.ageMode);
    if (ageFit === 0) return null;

    var dg = diagnosisGate(scale, query);
    if (dg === 0) return null;

    var dom    = f_domainMatch(scale, query.tags || []);
    var sym    = f_symptomMatch(scale, query.text, query.tags || []);
    var prim   = f_primaryIndication(scale, query.tags || []);
    var resp   = f_respondent(scale, query.desiredResp, query);
    var util   = f_utility(scale);

    var fit = dom * 0.40 + ageFit * 0.25 + sym * 0.15 + resp * 0.10 + util * 0.10;
    var tier = inferTier(scale);
    var em = TIER_MULT[tier] || 0.85;
    var pi = 1 + prim * 0.20;
    var cp = 1.0;
    if (!scale.clinical_use) cp *= 0.80;
    if (!scale.plain_questions) cp *= 0.92;

    var raw = fit * em * pi * dg * cp;
    var final = Math.min(100, Math.round(raw * 70));

    return Object.assign({}, scale, {
      score: final,
      clinical_fit: Math.round(fit * 100),
      tier: tier,
      multipliers: { em: em, pi: pi, dxGate: dg, cp: cp },
      factors: {
        domain:    Math.round(dom * 100),
        age:       Math.round(ageFit * 100),
        symptom:   Math.round(sym * 100),
        respondent: Math.round(resp * 100),
        utility:   Math.round(util * 100),
        primary:   Math.round(prim * 100)
      },
      psychometrics: PSY[scale.id] || null
    });
  }

  function viewOf(scale) {
    var a = norm(scale.audience || '');
    if (a === 'autoteste' || a === 'self') return 'auto';
    if (a === 'escola') return 'escola';
    if (a === 'clinico' || a === 'terapeuta') return 'direto';
    return 'familia';
  }

  // ==================================================================
  // 11. RANKING Gold / Silver / Bronze com triangulação
  // ==================================================================
  function rankGSB(scoredScales, query) {
    var L = scoredScales.filter(function (s) { return s && s.score > 0; });
    L.sort(function (a, b) { return b.score - a.score; });
    if (!L.length) return { gold: null, silver: null, bronze: null, all: [] };

    var gold = L[0];
    var goldFam = gold._family || idFamily(gold.id);
    var goldView = viewOf(gold);
    var goldScore = gold.score;

    var silver = null;
    for (var i = 1; i < L.length; i++) {
      var s = L[i];
      var sFam = s._family || idFamily(s.id);
      if (sFam === goldFam) continue;
      if (viewOf(s) === goldView) continue;
      if (s.score < goldScore * 0.60) break;
      silver = s; break;
    }
    if (!silver) {
      for (var j = 1; j < L.length; j++) {
        var s2Fam = L[j]._family || idFamily(L[j].id);
        if (s2Fam !== goldFam) { silver = L[j]; break; }
      }
    }

    var used = new Set([goldFam]);
    if (silver) used.add(silver._family || idFamily(silver.id));
    var seenViews = new Set([goldView]);
    if (silver) seenViews.add(viewOf(silver));

    var bronze = null;
    for (var k = 1; k < L.length; k++) {
      var b = L[k];
      var bFam = b._family || idFamily(b.id);
      if (used.has(bFam)) continue;
      if (b.score < goldScore * 0.45) break;
      if (!seenViews.has(viewOf(b))) { bronze = b; break; }
    }
    if (!bronze) {
      for (var l = 1; l < L.length; l++) {
        if (!used.has(L[l]._family || idFamily(L[l].id))) { bronze = L[l]; break; }
      }
    }

    return { gold: gold, silver: silver, bronze: bronze, all: L };
  }

  // ==================================================================
  // 12. INFERÊNCIA CLÍNICA — gera hipóteses ponderadas
  // ==================================================================
  function generateHypotheses(query) {
    var tags = new Set(query.tags || []);
    var age = query.ageMonths;
    var freeText = String(query.text || '').toLowerCase();

    var hypotheses = [];
    Object.keys(HYPOTHESES).forEach(function (key) {
      var h = HYPOTHESES[key];
      var score = 0;
      var requiredMatched = 0;
      var supportingMatched = 0;
      var negativeHit = 0;

      (h.required || []).forEach(function (s) {
        if (tags.has(s)) { requiredMatched++; score += 30; }
      });
      (h.supporting || []).forEach(function (s) {
        if (tags.has(s)) { supportingMatched++; score += 12; }
      });
      (h.negative || []).forEach(function (s) {
        if (tags.has(s)) negativeHit++;
      });

      var reqRatio = requiredMatched / Math.max(1, (h.required || []).length);
      if (reqRatio < 0.5) return;
      if (negativeHit > 0) score -= 25;

      if (age != null && h.age_range) {
        var a = h.age_range[0], b = h.age_range[1];
        if (age >= a && age <= b) score += 20;
        else {
          var dist = age < a ? a - age : age - b;
          score -= Math.min(dist / 6, 30);
        }
      }

      hypotheses.push({
        key: key,
        label: h.label,
        score: Math.round(Math.max(0, score)),
        requiredMatched: requiredMatched,
        requiredTotal: (h.required || []).length,
        supportingMatched: supportingMatched,
        domains: h.domains || [],
        firstLine: h.first_line || [],
        confirmation: h.confirmation || [],
        adaptive: h.adaptive || [],
        risk: h.risk || [],
        explanation: h.explanation
      });
    });
    hypotheses.sort(function (a, b) { return b.score - a.score; });
    return hypotheses;
  }

  function explainHypothesis(hyp, query) {
    if (!hyp || !hyp.explanation) return null;
    var ageStr = query.ageMonths != null
      ? (query.ageMonths < 36
          ? query.ageMonths + ' meses'
          : Math.floor(query.ageMonths / 12) + ' anos')
      : 'idade não informada';
    var goldNames = (hyp.firstLine || []).slice(0, 2).join(', ');
    var confNames = (hyp.confirmation || []).slice(0, 2).join(', ');
    return hyp.explanation
      .replace(/{age}/g, ageStr)
      .replace(/{gold}/g, goldNames || 'triagem dirigida')
      .replace(/{confirmation}/g, confNames || 'avaliação especializada');
  }

  function detectRedFlags(tags, freeText) {
    var text = norm(freeText || '');
    var flags = [];
    var urgent = false;
    if (tags.indexOf('risco') >= 0) {
      urgent = true;
      flags.push({ severity: 'CRITICAL', label: 'Risco clínico declarado' });
    }
    if (/queria sumir|nao quer viver|pensa em morrer|tentou se|se cortou/.test(text)) {
      urgent = true;
      flags.push({ severity: 'CRITICAL', label: 'Ideação ou comportamento autolesivo' });
    }
    if (/regress|perdeu (fala|palavra|marco)|parou de (falar|andar)/.test(text)) {
      urgent = true;
      flags.push({ severity: 'HIGH', label: 'Possível regressão de desenvolvimento' });
    }
    return { flags: flags, urgent: urgent };
  }

  function suggestBattery(hypothesis, catalog) {
    if (!hypothesis) return null;
    var bundle = { triagem: [], confirmacao: [], funcional: [], risco: [] };
    function findById(id) {
      return catalog.find(function (c) { return c && c.id === id; });
    }
    (hypothesis.firstLine || []).forEach(function (id) { var s = findById(id); if (s) bundle.triagem.push(s); });
    (hypothesis.confirmation || []).forEach(function (id) { var s = findById(id); if (s) bundle.confirmacao.push(s); });
    (hypothesis.adaptive || []).forEach(function (id) { var s = findById(id); if (s) bundle.funcional.push(s); });
    (hypothesis.risk || []).forEach(function (id) { var s = findById(id); if (s) bundle.risco.push(s); });
    return bundle;
  }

  function detectGaps(query, gsb) {
    var covered = new Set();
    [gsb.gold, gsb.silver, gsb.bronze].filter(Boolean).forEach(function (s) {
      var d = canonicalizeDomain(s.domain);
      if (d) covered.add(d);
    });
    var expected = new Set();
    (query.tags || []).forEach(function (tag) {
      Object.keys(TAX).forEach(function (k) {
        if (TAX[k].primary_tags.indexOf(tag) >= 0) expected.add(TAX[k].label);
      });
    });
    var gaps = [];
    expected.forEach(function (d) { if (!covered.has(d)) gaps.push(d); });
    return {
      covered: Array.from(covered),
      expected: Array.from(expected),
      uncovered: gaps,
      message: gaps.length > 0 ? 'Considere também avaliação em: ' + gaps.join(', ') : null
    };
  }

  // ==================================================================
  // 13. PIPELINE INTEGRADO
  // ==================================================================
  function recommend(query, catalog) {
    var deduped = dedup(catalog);
    var scored = deduped.map(function (s) { return scoreScale(s, query); }).filter(Boolean);
    var gsb = rankGSB(scored, query);
    var rf = detectRedFlags(query.tags || [], query.text);
    var hypotheses = generateHypotheses(query);
    var topHyp = hypotheses[0];
    var explanation = explainHypothesis(topHyp, query);
    var battery = topHyp ? suggestBattery(topHyp, catalog) : null;
    var gaps = detectGaps(query, gsb);

    return {
      version: '6.0',
      gold: gsb.gold,
      silver: gsb.silver,
      bronze: gsb.bronze,
      allScored: gsb.all,
      redFlags: rf,
      hypotheses: hypotheses.slice(0, 3),
      topHypothesis: topHyp,
      explanation: explanation,
      battery: battery,
      gaps: gaps,
      meta: {
        timestamp: new Date().toISOString(),
        confidence: topHyp && topHyp.score >= 50 ? 'ALTA' :
                    (topHyp && topHyp.score >= 25 ? 'MÉDIA' : 'BAIXA')
      }
    };
  }

  // ==================================================================
  // 14. EXTRACT TAGS (compat com filtro original)
  // ==================================================================
  function extractTags(selectedChips, freeText) {
    var found = new Set(selectedChips || []);
    var text = norm(freeText || '');
    Object.keys(COMPLAINT_VOCAB).forEach(function (tag) {
      var kws = COMPLAINT_VOCAB[tag];
      for (var i = 0; i < kws.length; i++) {
        if (text.indexOf(norm(kws[i])) >= 0) { found.add(tag); break; }
      }
    });
    return Array.from(found);
  }

  // ==================================================================
  // 15. SOBRESCREVE GLOBAIS DO FILTRO ORIGINAL (back-compat)
  // ==================================================================
  if (typeof window.scoreScale !== 'undefined') {
    window.scoreScale = function (s, comp, age, resp, mode, text) {
      var q = { tags: comp || [], ageMonths: age, desiredResp: resp,
                ageMode: mode, text: text, mode: 'aplicar' };
      return scoreScale(s, q) || Object.assign({}, s, { score: 0, reasons: [], factors: {} });
    };
  }

  // ==================================================================
  // 16. API PÚBLICA
  // ==================================================================
  window.NeuroPedClinica = {
    version: '6.0.0',
    TAX: TAX,
    TIER_MULT: TIER_MULT,
    TIER_LABEL: TIER_LABEL,
    PSY: PSY,
    HYPOTHESES: HYPOTHESES,

    norm: norm,
    idFamily: idFamily,
    canonicalizeDomain: canonicalizeDomain,
    inferTier: inferTier,
    dedup: dedup,
    extractTags: extractTags,
    scoreScale: scoreScale,
    viewOf: viewOf,
    rankGSB: rankGSB,
    generateHypotheses: generateHypotheses,
    explainHypothesis: explainHypothesis,
    detectRedFlags: detectRedFlags,
    suggestBattery: suggestBattery,
    detectGaps: detectGaps,
    recommend: recommend,
    reason: recommend  // alias
  };

  // Aliases retrocompatíveis com nomes antigos
  window.NeuroPedEngineV4 = window.NeuroPedClinica;
  window.NeuroPedEngineV5 = window.NeuroPedClinica;

  console.log('%cNeuroPed Engine Clínica v6.0 ativa',
              'background:#7c79ff;color:#fff;padding:3px 8px;border-radius:4px;font-weight:bold');
  console.log('Taxonomia: ' + Object.keys(TAX).length + ' domínios canônicos · ' +
              Object.keys(HYPOTHESES).length + ' hipóteses · ' +
              Object.keys(PSY).length + ' escalas com psicometria curada');
})();
