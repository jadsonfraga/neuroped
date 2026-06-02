/* =====================================================================
   NeuroPed EDJ · Filtro Engine v4.0  "Engine Clínica Defensável"
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756

   Correções sobre v3 baseadas em TESTE-DE-ESTRESSE-5-PACIENTES.md:

   ▸ Score MULTIPLICATIVO (não somativo): tier vira multiplicador →
     gold para condição ERRADA não vence mais autoral para condição certa.
     RESOLVE: C-SSRS no #1 para birra (P4), GMFCS no #1 para atraso (P5).

   ▸ DIAGNOSIS GATE: escalas de classificação funcional (GMFCS, MACS, C-SSRS,
     CARS-2 etc.) requerem que a condição esteja declarada como SUSPEITA
     ou CONFIRMADA pela query. Não aparecem em triagem cega.

   ▸ DEDUP por ID_FAMILY: `fam-12-36-tea-*` colapsa em uma família, o
     first_line bate corretamente. RESOLVE: PrimaryIndicationBonus = 0
     em 4/5 pacientes na v3.

   ▸ SCORE NORMALIZADO 0–100 interpretável (ClinicalFit em decimais).

   ▸ TRIANGULAÇÃO INTELIGENTE: só inclui visão diferente se score ≥ 60%
     do ouro. Senão prefere 3 instrumentos da mesma visão de alta relevância.

   ▸ RED FLAG OVERRIDE: risco/regressão injeta avaliação específica no
     topo SEM expulsar o resto.

   ▸ CAPACITY-RESPONDENT MATCH: adolescente verbal recebe boost para
     autorrelato. Pré-escolar com baixa tolerância penaliza baterias longas.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__NP_FILTRO_ENGINE_V4) return;
  window.__NP_FILTRO_ENGINE_V4 = true;

  // ==================================================================
  // 1. TAXONOMIA CANÔNICA v2 (15 domínios + id_families + diagnosis)
  // ==================================================================
  var TAX = {
    TEA: {
      label: 'TEA',
      primary_tags: ['tea'],
      related_tags: ['fala', 'social', 'sensorial', 'comportamento'],
      synonyms: ['tea', 'autismo', 'autista', 'espectro', 'tea precoce',
                 'tea funcional', 'tea precision', 'tea nivel de suporte',
                 'tea comportamento', 'tea e comunicacao social',
                 'social tea', 'tea e ', 'rastreio tea'],
      first_line_families: ['fam-12-36-tea', 'fam-12-36-brincar', 'fam-3-5-flexibilidade']
    },
    TDAH: {
      label: 'TDAH',
      primary_tags: ['tdah'],
      related_tags: ['escola', 'comportamento', 'autonomia'],
      synonyms: ['tdah', 'tdah tod', 'tdah escolar', 'tdah adolescente',
                 'tdah atencao', 'tdah funcao executiva', 'funcao executiva',
                 'deficit de atencao'],
      first_line_families: ['fam-6-11-atencao', 'fam-6-11-organizacao']
    },
    Linguagem: {
      label: 'Linguagem',
      primary_tags: ['fala'],
      related_tags: ['tea', 'escola', 'social'],
      synonyms: ['linguagem', 'fala', 'comunicacao funcional', 'tdl',
                 'comunicacao social', 'apraxia', 'linguagem e comunicacao'],
      first_line_families: ['fam-12-36-fala', 'fam-3-5-comunicacao']
    },
    Aprendizagem: {
      label: 'Aprendizagem',
      primary_tags: ['escola'],
      related_tags: ['tdah', 'fala', 'autonomia'],
      synonyms: ['aprendizagem', 'aprendizado', 'leitura', 'escrita',
                 'matematica', 'rendimento', 'alfabetizacao',
                 'tdl e aprendizagem', 'linguagem e aprendizagem'],
      first_line_families: []
    },
    Comportamento: {
      label: 'Comportamento',
      primary_tags: ['comportamento', 'agressividade'],
      related_tags: ['tdah', 'ansiedade', 'tea'],
      synonyms: ['comportamento', 'oposicao', 'tod', 'irritabilidade',
                 'crises', 'birra', 'agressividade', 'comportamento e participacao'],
      first_line_families: ['fam-3-5-crises', 'fam-6-11-oposicao']
    },
    Ansiedade: {
      label: 'Ansiedade',
      primary_tags: ['ansiedade'],
      related_tags: ['escola', 'sono', 'humor'],
      synonyms: ['ansiedade', 'medos', 'fobia', 'separacao', 'panico'],
      first_line_families: ['fam-6-11-ansiedade']
    },
    Humor: {
      label: 'Humor',
      primary_tags: ['humor'],
      related_tags: ['ansiedade', 'risco', 'comportamento'],
      synonyms: ['humor', 'depressao', 'tristeza', 'anedonia',
                 'rastreio depressao', 'phq'],
      first_line_families: []
    },
    Sono: {
      label: 'Sono',
      primary_tags: ['sono'],
      related_tags: ['tdah', 'comportamento', 'ansiedade'],
      synonyms: ['sono', 'sono infantil', 'insonia', 'ronco'],
      first_line_families: ['fam-12-36-sono', 'fam-6-11-sono']
    },
    Alimentacao: {
      label: 'Alimentação',
      primary_tags: ['alimentacao'],
      related_tags: ['sensorial', 'tea'],
      synonyms: ['alimentacao', 'seletividade alimentar', 'arfid',
                 'perfil sensorial oral'],
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
      synonyms: ['autonomia', 'avds', 'avd', 'atividades de vida diaria'],
      first_line_families: ['fam-3-5-autonomia']
    },
    Neurologico: {
      label: 'Neurológico',
      primary_tags: ['epilepsia', 'cefaleia'],
      related_tags: [],
      synonyms: ['neurologico', 'epilepsia', 'cefaleia', 'regressao', 'tics'],
      first_line_families: []
    },
    Risco: {
      label: 'Risco Clínico',
      primary_tags: ['risco'],
      related_tags: ['humor', 'ansiedade', 'comportamento'],
      synonyms: ['risco', 'autolesao', 'ideacao suicida', 'autoagressao',
                 'seguranca risco', 'risco de suicidio'],
      first_line_families: [],
      urgent: true
    },
    Acompanhamento: {
      label: 'Acompanhamento',
      primary_tags: ['medicacao'],
      related_tags: ['tdah', 'comportamento'],
      synonyms: ['acompanhamento', 'medicacao', 'impacto medicacao',
                 'evolucao clinica', 'reavaliacao'],
      first_line_families: []
    }
  };

  // ==================================================================
  // 2. TIERS DE EVIDÊNCIA — agora MULTIPLICATIVOS
  // ==================================================================
  var TIER_MULT = {
    gold:                  1.40,
    screening_validated:   1.25,
    complementary:         1.10,
    authoral_structured:   1.20,  // valoriza autoral do Dr.
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
  // 3. ESCALAS QUE REQUEREM DIAGNÓSTICO ESTABELECIDO
  //    Lista curada — não aparecem em triagem cega.
  // ==================================================================
  var REQUIRES_DIAGNOSIS = {
    'ofc-gmfcs':  ['paralisia cerebral', 'pc', 'encefalopatia cronica nao evolutiva'],
    'ofc-macs':   ['paralisia cerebral'],
    'ofc-cfcs':   ['paralisia cerebral'],
    'ofc-cssrs':  ['risco', 'ideacao suicida', 'depressao grave', 'humor'],
    'ofc-asq':    ['risco', 'ideacao suicida'],  // ainda permitido se risco declarado
    'ofc-cars2':  ['tea', 'suspeita tea'],
    'ofc-ados':   ['tea', 'suspeita tea forte'],
    'ofc-adir':   ['tea', 'suspeita tea forte'],
    'ofc-bender': ['suspeita disfuncao cognitiva', 'avaliacao cognitiva'],
    // Padrões por substring de domain (para cobrir variantes não catalogadas)
  };

  var DOMAIN_REQUIRES_DX = {
    'paralisia cerebral': ['motor confirmado', 'pc', 'paralisia cerebral'],
    'risco de suicidio':  ['risco', 'ideacao'],
    'avaliacao cognitiva': ['suspeita di', 'deficiencia intelectual']
  };

  // ==================================================================
  // 4. UTILS
  // ==================================================================
  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Família canônica do ID — colapsa formas curtas/longas
  // fam-12-36-tea-primeiros-sinais → fam-12-36-tea
  function idFamily(id) {
    var s = String(id || '').toLowerCase();
    // fam-{idade}-{tag} (preserva os 4 primeiros segmentos)
    var m = s.match(/^(fam-\d+-\d+-[a-z]+)/);
    if (m) return m[1];
    // jf-{sigla} (preserva os 2 primeiros)
    var m2 = s.match(/^(jf-[a-z]+(-[a-z]+)?)/);
    if (m2) return m2[1];
    // npe-br-{num}
    var m3 = s.match(/^(npe-br-\d+)/);
    if (m3) return m3[1];
    // aut{num}-{num}
    var m4 = s.match(/^(aut\d+-\d+)/);
    if (m4) return m4[1];
    // ofc-{nome}
    var m5 = s.match(/^(ofc-[a-z]+)/);
    if (m5) return m5[1];
    return s;
  }

  function canonicalTitle(s) {
    return String(s || '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function canonicalizeDomain(rawDomain) {
    if (!rawDomain) return null;
    var n = norm(rawDomain);
    for (var k in TAX) {
      var t = TAX[k];
      for (var i = 0; i < t.synonyms.length; i++) {
        var s = norm(t.synonyms[i]);
        if (n === s || n.indexOf(s) >= 0 || s.indexOf(n) >= 0) return k;
      }
    }
    return null;
  }

  function inferEvidenceTier(scale) {
    if (scale.evidence_tier && TIER_MULT[scale.evidence_tier]) return scale.evidence_tier;
    var id = String(scale.id || '');
    var title = norm(scale.title || '');
    if (/m chat|mchat|snap iv|conners|vineland|cbcl|srs|cars 2|cars2|asq 3|asq3|gmfcs|macs|cssrs|c ssrs|columbia|phq|cdi/.test(title)) {
      return 'gold';
    }
    if (/^fam-/.test(id)) {
      if ((scale.priority || 0) >= 80 && scale.plain_questions && scale.plain_questions.length >= 5) {
        return 'authoral_structured';
      }
      return 'observational';
    }
    if (/^jf-/.test(id)) return 'authoral_structured';
    if (/^ofc-/.test(id)) {
      // Oficiais geralmente são triagem validada ou gold
      if (/validad|normatizad|oficial/.test(norm(scale.validation_status || ''))) return 'screening_validated';
      return 'complementary';
    }
    return 'observational';
  }

  // ==================================================================
  // 5. DEDUP por ID_FAMILY (resolve bug do v3)
  // ==================================================================
  function dedup(scales) {
    var groups = {};
    scales.forEach(function (s) {
      if (!s || !s.id) return;
      var fam = idFamily(s.id);
      if (!groups[fam]) groups[fam] = [];
      groups[fam].push(s);
    });

    var deduped = [];
    Object.keys(groups).forEach(function (fam) {
      var group = groups[fam];
      // Escolhe o "mais completo" da família
      group.sort(function (a, b) {
        var ca = (a.clinical_use ? 1 : 0) + (a.plain_questions ? 1 : 0) +
                 (a.symptoms ? 1 : 0) + (a.differentiator ? 1 : 0);
        var cb = (b.clinical_use ? 1 : 0) + (b.plain_questions ? 1 : 0) +
                 (b.symptoms ? 1 : 0) + (b.differentiator ? 1 : 0);
        if (cb !== ca) return cb - ca;
        // Desempate por id mais longo (descrição mais rica)
        return String(b.id).length - String(a.id).length;
      });
      var winner = group[0];
      winner._family = fam;
      winner._family_size = group.length;
      winner._family_alts = group.slice(1).map(function (s) { return s.id; });
      deduped.push(winner);
    });
    return deduped;
  }

  // ==================================================================
  // 6. EXTRAÇÃO DE TAGS
  // ==================================================================
  var COMPLAINT_VOCAB = {
    fala: ['fala', 'linguagem', 'comunicacao', 'apraxia', 'ecolalia', 'palavra', 'nao fala'],
    tea: ['tea', 'autismo', 'autista', 'rotina', 'rigidez', 'estereotipia',
          'contato visual', 'nome', 'brinca sozinho', 'evita olhar'],
    tdah: ['tdah', 'desatencao', 'hiperatividade', 'foco', 'distrai', 'esquece',
           'organiza', 'nao termina', 'inquieto', 'desligada'],
    escola: ['escola', 'aprendizagem', 'leitura', 'escrita', 'matematica',
             'rendimento', 'professora', 'professor', 'baixo rendimento'],
    comportamento: ['birra', 'oposicao', 'desafia', 'irritabilidade', 'crise', 'limite',
                    'frustracao'],
    agressividade: ['agressivo', 'agride', 'bate', 'morde', 'machuca', 'joga objetos'],
    sono: ['sono', 'dorme', 'insonia', 'ronco', 'desperta'],
    alimentacao: ['alimentacao', 'seletividade', 'textura', 'recusa comida'],
    ansiedade: ['ansiedade', 'medo', 'preocupacao', 'fobia', 'evita', 'separacao'],
    humor: ['humor', 'triste', 'depressao', 'chora', 'isolamento', 'sumir'],
    motor: ['motor', 'marcha', 'anda', 'equilibrio', 'coordenacao', 'quedas',
            'nao anda', 'gatinha'],
    sensorial: ['sensorial', 'barulho', 'textura', 'toque', 'cheiro', 'luz'],
    epilepsia: ['epilepsia', 'crise convulsiva', 'convulsao', 'ausencia'],
    cefaleia: ['cefaleia', 'cabeca', 'enxaqueca'],
    autonomia: ['autonomia', 'avd', 'higiene', 'banho', 'desfralde', 'fralda'],
    risco: ['risco', 'autolesao', 'suicid', 'morrer', 'se cortar',
            'nao quer viver', 'queria sumir', 'tentou se machucar'],
    medicacao: ['medicacao', 'remedio', 'ritalina', 'venvanse', 'efeito colateral']
  };

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
  // 7. RED FLAG DETECTOR
  // ==================================================================
  function detectRedFlags(tags, freeText) {
    var text = norm(freeText || '');
    var flags = [];
    var urgent = false;
    var has_humor = false;
    var has_regression = false;

    if (tags.indexOf('risco') >= 0) {
      urgent = true;
      flags.push({ severity: 'CRITICAL', label: 'Risco clínico declarado' });
    }
    if (/queria sumir|nao quer viver|pensa em morrer|tentou se|se cortou|nao queria viver|queria morrer/.test(text)) {
      urgent = true;
      flags.push({ severity: 'CRITICAL', label: 'Ideação ou comportamento autolesivo' });
    }
    if (/regress|perdeu (fala|palavra|marco)|parou de (falar|andar)/.test(text)) {
      urgent = true;
      has_regression = true;
      flags.push({ severity: 'HIGH', label: 'Possível regressão de desenvolvimento' });
    }
    if (/crise convulsiva|status epileptico|olhar parado prolongado/.test(text)) {
      urgent = true;
      flags.push({ severity: 'HIGH', label: 'Possível atividade convulsiva' });
    }
    // Humor sem risco explícito
    if (!urgent && /triste|depress|anedonia|chora muito|isolamento/.test(text)) {
      has_humor = true;
      flags.push({ severity: 'MEDIUM', label: 'Sinal de humor — considere avaliação' });
    }
    return { flags: flags, urgent: urgent, has_humor: has_humor, has_regression: has_regression };
  }

  // ==================================================================
  // 8. DIAGNOSIS GATE — bloqueia escalas fora de contexto
  // ==================================================================
  function diagnosisGate(scale, query) {
    var id = String(scale.id || '').toLowerCase();
    var domain = norm(scale.domain || '');

    // Por ID curado
    if (REQUIRES_DIAGNOSIS[id]) {
      var requiredDxs = REQUIRES_DIAGNOSIS[id];
      var hasIt = requiredDxs.some(function (dx) {
        return query.tags.indexOf(norm(dx)) >= 0 ||
               (query.text && norm(query.text).indexOf(norm(dx)) >= 0);
      });
      if (!hasIt) return 0;  // GATE FECHADO
      return 1.2;            // GATE ABERTO + boost
    }

    // Por domain
    for (var dxKey in DOMAIN_REQUIRES_DX) {
      if (domain.indexOf(dxKey) >= 0) {
        var required = DOMAIN_REQUIRES_DX[dxKey];
        var matches = required.some(function (m) {
          return query.tags.indexOf(norm(m)) >= 0 ||
                 (query.text && norm(query.text).indexOf(norm(m)) >= 0);
        });
        if (!matches) return 0;
      }
    }

    // Caso geral: passa livre
    return 1.0;
  }

  // ==================================================================
  // 9. SCORE COMPONENTES (cada um normalizado 0–1)
  // ==================================================================

  function f_domainMatch(scale, tags) {
    var sd = canonicalizeDomain(scale.domain);
    if (!sd) return 0.20;  // genérico baixo
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      for (var k in TAX) {
        if (k !== sd) continue;
        if (TAX[k].primary_tags.indexOf(tag) >= 0) return 1.0;
        if (TAX[k].related_tags.indexOf(tag) >= 0) return 0.50;
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
      var distFromCenter = Math.abs(ageMonths - c);
      // 1.0 no centro, 0.80 na borda
      return 1.0 - (distFromCenter / Math.max(h, 1)) * 0.20;
    }
    // Fora — decay gaussiano agressivo
    var dist = ageMonths < a ? a - ageMonths : ageMonths - b;
    var sigma = (mode === 'precisa') ? 2 : (mode === 'muito-alta') ? 18 : 6;
    var score = Math.exp(-(dist * dist) / (2 * sigma * sigma));
    if (score < 0.05) return 0.0;  // exclui efetivamente
    return score * 0.7;  // teto 0.7 mesmo decay forte
  }

  function f_symptomMatch(scale, freeText, tags) {
    var pool = [].concat(scale.symptoms || [], scale.keywords || [], scale.complaints || [])
                 .map(norm);
    if (!pool.length) return 0;
    var matches = new Set();
    norm(freeText || '').split(/\s+/).filter(function (t) { return t.length >= 4; })
      .forEach(function (t) {
        pool.forEach(function (p) { if (p.indexOf(t) >= 0) matches.add(t); });
      });
    tags.forEach(function (tag) {
      var vocab = COMPLAINT_VOCAB[tag] || [];
      vocab.forEach(function (kw) {
        var nk = norm(kw);
        if (pool.some(function (p) { return p.indexOf(nk) >= 0; })) matches.add(kw);
      });
    });
    return Math.min(matches.size / 6, 1.0);  // satura em 6 matches
  }

  function f_primaryIndication(scale, tags) {
    var fam = scale._family || idFamily(scale.id);
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      for (var k in TAX) {
        if (TAX[k].primary_tags.indexOf(tag) >= 0) {
          if ((TAX[k].first_line_families || []).indexOf(fam) >= 0) return 1.0;
        }
      }
    }
    return 0;
  }

  function f_respondent(scale, desiredResp, query) {
    var a = norm(scale.audience || '');

    // Capacity-respondent — ajusta automaticamente baseado em idade do paciente
    if (query.ageMonths != null) {
      // Adolescente (≥120m = 10a) verbal pode autoteste
      if (query.ageMonths >= 120 && a === 'autoteste') return 1.0;
      // Criança <8a NÃO pode autoteste — penaliza
      if (query.ageMonths < 96 && a === 'autoteste') return 0.0;
      // Criança <3a NÃO faz teste direto (clínico) longo
      if (query.ageMonths < 36 && a === 'clinico' && (Number(scale.n_items) || 0) > 30) return 0.20;
    }

    if (!desiredResp) return 0.60;  // neutro
    if (a.indexOf(norm(desiredResp)) >= 0) return 1.0;
    return 0.30;
  }

  function f_utility(scale, query) {
    var score = 0.4;  // base
    var n = Number(scale.n_items || 0);
    if (n > 0 && n <= 10) score += 0.30;       // ultra-curta
    else if (n > 10 && n <= 30) score += 0.15;
    else if (n > 60) score -= 0.10;            // bateria longa penaliza
    if (scale.clinical_use) score += 0.20;
    if (scale.plain_questions && scale.plain_questions.length >= 5) score += 0.10;
    return Math.max(0, Math.min(1, score));
  }

  // ==================================================================
  // 10. SCORE FINAL (multiplicativo, 0–100 normalizado)
  // ==================================================================
  function scoreScale(scale, query) {
    // GATES DUROS
    if (/lote|banco completo/i.test(scale.title || '')) return null;
    if (scale.app_status === 'bloqueado' && query.mode === 'aplicar') return null;
    if (scale.validation_status === 'descontinuado') return null;

    var ageFit = f_ageFit(scale, query.ageMonths, query.ageMode || 'alta');
    if (ageFit === 0) return null;  // exclusão por idade

    var dxGate = diagnosisGate(scale, query);
    if (dxGate === 0) return null;  // exclusão por diagnóstico ausente

    var domain    = f_domainMatch(scale, query.tags);
    var symptom   = f_symptomMatch(scale, query.text, query.tags);
    var primary   = f_primaryIndication(scale, query.tags);
    var resp      = f_respondent(scale, query.desiredResp, query);
    var utility   = f_utility(scale, query);

    // CLINICAL FIT (média ponderada)
    var fit = (
      domain  * 0.40 +
      ageFit  * 0.25 +
      symptom * 0.15 +
      resp    * 0.10 +
      utility * 0.10
    );  // 0–1

    // EVIDENCE MULTIPLIER (não soma)
    var tier = inferEvidenceTier(scale);
    var em = TIER_MULT[tier] || 0.85;

    // PRIMARY INDICATION boost familiar (1.0 → 1.20)
    var pi = 1 + primary * 0.20;

    // CAPACITY-RESPONDENT já está embutido em f_respondent

    // COMPLETENESS penalty
    var cp = 1.0;
    if (!scale.clinical_use) cp *= 0.80;
    if (!scale.plain_questions) cp *= 0.92;
    if (Number(scale.priority || 0) > 100) cp *= 0.95;  // priority inflado = sinal de aviso

    // SCORE FINAL: produto
    var raw = fit * em * pi * dxGate * cp;

    // Normaliza para 0–100 (com cap)
    var finalScore = Math.min(100, Math.round(raw * 70));

    return Object.assign({}, scale, {
      score: finalScore,
      clinical_fit: Math.round(fit * 100),
      tier: tier,
      multipliers: { em: em, pi: pi, dxGate: dxGate, cp: cp },
      factors: {
        domain: Math.round(domain * 100),
        age: Math.round(ageFit * 100),
        symptom: Math.round(symptom * 100),
        respondent: Math.round(resp * 100),
        utility: Math.round(utility * 100),
        primary: Math.round(primary * 100)
      }
    });
  }

  // ==================================================================
  // 11. VIEW DETECTION
  // ==================================================================
  function viewOf(scale) {
    var a = norm(scale.audience || '');
    if (a === 'autoteste' || a === 'self' || a === 'auto') return 'auto';
    if (a === 'escola') return 'escola';
    if (a === 'clinico' || a === 'direct' || a === 'terapeuta') return 'direto';
    return 'familia';
  }

  // ==================================================================
  // 12. RANKING INTELIGENTE — Gold / Silver / Bronze
  // ==================================================================
  function rankGSB(scoredScales, query) {
    var rf = detectRedFlags(query.tags, query.text);
    var L = scoredScales.filter(function (s) { return s && s.score > 0; });
    L.sort(function (a, b) { return b.score - a.score; });

    if (!L.length) return { gold: null, silver: null, bronze: null, redFlags: rf, all: [] };

    var gold = L[0];
    var goldFamily = gold._family || idFamily(gold.id);
    var goldView = viewOf(gold);
    var goldScore = gold.score;

    // SILVER: visão diferente, score ≥ 60% do gold, não da mesma família
    var silver = null;
    for (var i = 1; i < L.length; i++) {
      var s = L[i];
      var sFam = s._family || idFamily(s.id);
      if (sFam === goldFamily) continue;
      if (viewOf(s) === goldView) continue;
      if (s.score < goldScore * 0.60) break;
      silver = s; break;
    }
    // Se não achou silver com visão diferente, pega 2º melhor de família distinta
    if (!silver) {
      for (var j = 1; j < L.length; j++) {
        var s2 = L[j];
        var s2Fam = s2._family || idFamily(s2.id);
        if (s2Fam !== goldFamily) { silver = s2; break; }
      }
    }

    // BRONZE: terceira visão OU finalidade complementar
    var bronze = null;
    var usedFamilies = new Set([goldFamily]);
    if (silver) usedFamilies.add(silver._family || idFamily(silver.id));
    var usedViews = new Set([goldView]);
    if (silver) usedViews.add(viewOf(silver));

    // Se há red flag urgente e gold não é de risco, injeta avaliação de risco em bronze
    if (rf.urgent) {
      var riskPick = L.find(function (s) {
        var d = canonicalizeDomain(s.domain);
        return (d === 'Risco' || /risco|suicid|cssrs|asq/i.test(s.id || '')) &&
               !usedFamilies.has(s._family || idFamily(s.id));
      });
      if (riskPick) bronze = riskPick;
    }
    if (!bronze) {
      for (var k = 1; k < L.length; k++) {
        var b = L[k];
        var bFam = b._family || idFamily(b.id);
        if (usedFamilies.has(bFam)) continue;
        if (b.score < goldScore * 0.45) break;
        // Prefere visão ainda não usada
        if (!usedViews.has(viewOf(b))) { bronze = b; break; }
      }
      // Fallback
      if (!bronze) {
        for (var l = 1; l < L.length; l++) {
          var b2 = L[l];
          if (usedFamilies.has(b2._family || idFamily(b2.id))) continue;
          bronze = b2; break;
        }
      }
    }

    return { gold: gold, silver: silver, bronze: bronze, redFlags: rf, all: L };
  }

  // ==================================================================
  // 13. API PÚBLICA
  // ==================================================================
  window.NeuroPedEngineV4 = {
    version: '4.0.0',
    TAX: TAX,
    TIER_MULT: TIER_MULT,
    TIER_LABEL: TIER_LABEL,
    REQUIRES_DIAGNOSIS: REQUIRES_DIAGNOSIS,

    canonicalizeDomain: canonicalizeDomain,
    idFamily: idFamily,
    canonicalTitle: canonicalTitle,
    inferEvidenceTier: inferEvidenceTier,
    dedup: dedup,
    extractTags: extractTags,
    detectRedFlags: detectRedFlags,
    diagnosisGate: diagnosisGate,
    scoreScale: scoreScale,
    viewOf: viewOf,
    rankGSB: rankGSB,

    recommend: function (catalog, query) {
      var deduped = dedup(catalog);
      var scored = deduped.map(function (s) { return scoreScale(s, query); }).filter(Boolean);
      return rankGSB(scored, query);
    }
  };

  console.log('%cNeuroPed Engine v4.0 carregada — Engine Clínica Defensável',
              'background:#5b54e8;color:#fff;padding:3px 8px;border-radius:4px;font-weight:bold');
  console.log('Mudanças principais vs v3:');
  console.log('  • Score multiplicativo (tier NÃO soma)');
  console.log('  • Diagnosis gate (GMFCS, C-SSRS, ASQ bloqueados sem dx)');
  console.log('  • Dedup por id_family (resolve PrimaryIndication = 0)');
  console.log('  • Score 0–100 normalizado e interpretável');
  console.log('  • Capacity-respondent (adolescente boost, pré-escolar penaliza)');
})();
