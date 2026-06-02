#!/usr/bin/env node
/* =====================================================================
   NeuroPed EDJ · sanitize-catalog.js  v1.0
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Pipeline de saneamento do catálogo do NeuroPed EDJ.

   Entrada:
     - scales-index.json (15 oficiais)
     - scales-bundle.js → NEUROPED_EDITORIAL_SCALES (422 editorial)
     - gold-standards-import.json (18 curados)

   Saída:
     - catalog-sanitized.json (apenas defensáveis, dedupados, classificados)
     - catalog-blocked.json (licença comercial — referência)
     - catalog-experimental.json (catalogados sem qualificação clínica)
     - catalog-stats.json (estatísticas do saneamento)
     - catalog-removed.json (descartados com justificativa)

   Uso:
     node sanitize-catalog.js [--in path] [--out dir] [--dry-run]

   Pode rodar em Node OU no browser (export window.NeuroPedSanitizer).
   ===================================================================== */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NeuroPedSanitizer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==================================================================
  // 1. CONFIG — vocabulários e mapas
  // ==================================================================

  var CANONICAL_DOMAINS = [
    'TEA', 'TDAH', 'Linguagem', 'Aprendizagem', 'Comportamento',
    'Ansiedade', 'Humor', 'Sono', 'Alimentacao', 'Sensorial',
    'Motor', 'Autonomia', 'Neurologico', 'Risco', 'Acompanhamento',
    'Paralisia cerebral', 'Desenvolvimento global'
  ];

  // Mapeamento raw → canônico
  var DOMAIN_MAP = {
    // TEA family
    'tea': 'TEA',
    'tea/comportamento': 'TEA',
    'tea precision-95': 'TEA',
    'tea nível de suporte': 'TEA',
    'tea funcional': 'TEA',
    'social/tea': 'TEA',
    'tea e comunicação social': 'TEA',
    'tea precoce e comunicação social': 'TEA',
    'tea precoce': 'TEA',
    'autismo': 'TEA',
    // TDAH family
    'tdah': 'TDAH',
    'tdah/tod': 'TDAH',
    'tdah/tod escolar': 'TDAH',
    'tdah/tod adolescente': 'TDAH',
    'tdah e atenção': 'TDAH',
    'tdah e função executiva': 'TDAH',
    // Linguagem family
    'linguagem': 'Linguagem',
    'tdl e aprendizagem': 'Linguagem',
    'linguagem e aprendizagem': 'Aprendizagem',
    'linguagem e comunicação funcional': 'Linguagem',
    'comunicação funcional': 'Linguagem',
    // Comportamento family
    'comportamento': 'Comportamento',
    'comportamento e participação escolar': 'Comportamento',
    'agressividade': 'Comportamento',
    'oposição': 'Comportamento',
    // Risco
    'segurança / risco de suicídio': 'Risco',
    'risco': 'Risco',
    // PC
    'paralisia cerebral / motor': 'Paralisia cerebral',
    // Outros
    'sono': 'Sono', 'sono infantil': 'Sono',
    'ansiedade': 'Ansiedade', 'ansiedade e medos': 'Ansiedade',
    'humor': 'Humor', 'depressão': 'Humor',
    'autonomia': 'Autonomia', 'avd': 'Autonomia',
    'motor': 'Motor', 'desenvolvimento motor': 'Motor',
    'sensorial': 'Sensorial',
    'alimentação': 'Alimentacao',
    'neurológico': 'Neurologico', 'epilepsia': 'Neurologico'
  };

  // Padrões de ID que disparam requires_diagnosis_of
  var ID_REQUIRES_DIAGNOSIS = {
    'ofc-gmfcs':      ['paralisia cerebral', 'pc', 'encefalopatia cronica nao evolutiva'],
    'ofc-gmfcs-er':   ['paralisia cerebral', 'pc'],
    'ofc-macs':       ['paralisia cerebral'],
    'ofc-cfcs':       ['paralisia cerebral'],
    'ofc-cssrs':      ['risco', 'ideacao suicida', 'humor grave'],
    'ofc-cars-2':     ['suspeita tea forte', 'tea em investigação'],
    'ofc-ados':       ['suspeita tea forte'],
    'ofc-adir':       ['suspeita tea forte']
  };

  // Pattern → tier inferido
  var TIER_PATTERNS = [
    { re: /(^ofc-).*(gmfcs|cssrs|columbia|asq toolkit|asq sui)/i, tier: 'gold' },
    { re: /(m chat|mchat|snap iv|conners|vineland|cbcl|srs 2|cars 2|asq 3|phq|gad 7|cdi|bisq)/i, tier: 'gold' },
    { re: /(sdq|vanderbilt|scared|bayley|denver)/i, tier: 'screening_validated' },
    { re: /^fam-/, tier: 'authoral_structured' },  // sob condição
    { re: /^jf-/, tier: 'authoral_structured' },
    { re: /^ofc-/, tier: 'complementary' },
    { re: /^npe-br-/, tier: 'observational' },
    { re: /^aut\d/, tier: 'observational' }
  ];

  // ==================================================================
  // 2. HELPERS
  // ==================================================================

  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function ctitle(s) {
    return String(s || '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function idFamily(id) {
    var s = String(id || '').toLowerCase();
    var patterns = [
      /^(fam-\d+-\d+-[a-z]+)/,
      /^(jf-[a-z]+(?:-[a-z]+)?)/,
      /^(ofc-[a-z0-9-]+)/,
      /^(npe-br-\d+)/,
      /^(aut\d+-\d+)/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = s.match(patterns[i]);
      if (m) return m[1];
    }
    return s;
  }

  // ==================================================================
  // 3. STEP — Canonicalize domain
  // ==================================================================
  function canonicalizeDomain(scale) {
    if (!scale.domain) {
      scale._domain_canonical = null;
      return scale;
    }
    var n = norm(scale.domain);
    if (DOMAIN_MAP[n]) {
      scale._domain_canonical = DOMAIN_MAP[n];
      return scale;
    }
    // Substring fallback
    for (var key in DOMAIN_MAP) {
      if (n.indexOf(key) >= 0) {
        scale._domain_canonical = DOMAIN_MAP[key];
        return scale;
      }
    }
    // Por subdomain canônico
    for (var i = 0; i < CANONICAL_DOMAINS.length; i++) {
      if (n.indexOf(norm(CANONICAL_DOMAINS[i])) >= 0) {
        scale._domain_canonical = CANONICAL_DOMAINS[i];
        return scale;
      }
    }
    scale._domain_canonical = null;
    return scale;
  }

  // ==================================================================
  // 4. STEP — Clip priority 0–100
  // ==================================================================
  function clipPriority(scale) {
    var p = Number(scale.priority || 50);
    if (isNaN(p)) p = 50;
    if (p > 100) {
      scale._priority_was_inflated = p;
      scale.priority = 100;
    } else if (p < 0) {
      scale.priority = 0;
    } else {
      scale.priority = p;
    }
    return scale;
  }

  // ==================================================================
  // 5. STEP — Infer evidence_tier
  // ==================================================================
  function inferEvidenceTier(scale) {
    if (scale.evidence_tier) return scale;

    var id = String(scale.id || '');
    var title = String(scale.title || '');
    var combined = id + ' ' + title;

    for (var i = 0; i < TIER_PATTERNS.length; i++) {
      if (TIER_PATTERNS[i].re.test(combined)) {
        var inferred = TIER_PATTERNS[i].tier;
        // Para fam- e jf-: rebaixa a observational se completude baixa
        if ((inferred === 'authoral_structured') &&
            (!(scale.priority >= 80 && scale.plain_questions && scale.plain_questions.length >= 5))) {
          inferred = 'observational';
        }
        scale.evidence_tier = inferred;
        scale._tier_inferred = true;
        return scale;
      }
    }
    scale.evidence_tier = 'observational';
    scale._tier_inferred = true;
    return scale;
  }

  // ==================================================================
  // 6. STEP — Infer requires_diagnosis_of
  // ==================================================================
  function inferRequiresDiagnosis(scale) {
    if (scale.requires_diagnosis_of && scale.requires_diagnosis_of.length) return scale;
    var id = String(scale.id || '').toLowerCase();
    if (ID_REQUIRES_DIAGNOSIS[id]) {
      scale.requires_diagnosis_of = ID_REQUIRES_DIAGNOSIS[id];
      scale._dx_inferred = true;
      return scale;
    }
    // Por domínio
    var dom = norm(scale.domain || '');
    if (/paralisia cerebral/.test(dom)) {
      scale.requires_diagnosis_of = ['paralisia cerebral', 'pc'];
      scale._dx_inferred = true;
    } else if (/seguranca risco|risco de suicidio/.test(dom)) {
      scale.requires_diagnosis_of = ['risco', 'ideacao'];
      scale._dx_inferred = true;
    }
    return scale;
  }

  // ==================================================================
  // 7. STEP — Mark completeness
  // ==================================================================
  function markCompleteness(scale) {
    var fields = [
      'title', 'domain', 'age_min_months', 'age_max_months',
      'audience', 'n_items', 'evidence_tier', 'license_status',
      'app_status', 'clinical_use', 'plain_questions',
      'symptoms', 'keywords', 'complaints'
    ];
    var present = 0;
    fields.forEach(function (f) {
      if (scale[f] != null && (Array.isArray(scale[f]) ? scale[f].length > 0 : scale[f] !== '')) {
        present++;
      }
    });
    scale._completeness = +(present / fields.length).toFixed(2);
    scale._completeness_grade =
      scale._completeness >= 0.85 ? 'A' :
      scale._completeness >= 0.70 ? 'B' :
      scale._completeness >= 0.50 ? 'C' :
      scale._completeness >= 0.30 ? 'D' : 'F';
    return scale;
  }

  // ==================================================================
  // 8. STEP — Compute id_family + canonical_title
  // ==================================================================
  function addCanonicals(scale) {
    scale._id_family = idFamily(scale.id);
    scale._canonical_title = ctitle(scale.title || scale.id);
    return scale;
  }

  // ==================================================================
  // 9. STEP — Dedup by id_family
  // ==================================================================
  function dedupByFamily(scales) {
    var groups = {};
    scales.forEach(function (s) {
      if (!s || !s.id) return;
      var fam = s._id_family;
      (groups[fam] = groups[fam] || []).push(s);
    });

    var winners = [];
    var losers = [];

    Object.keys(groups).forEach(function (fam) {
      var group = groups[fam];
      // Sort by: tier > completeness > priority > id length
      group.sort(function (a, b) {
        // Tier score
        var tierRank = { 'gold': 6, 'screening_validated': 5, 'authoral_structured': 4,
                         'complementary': 3, 'observational': 2, 'experimental': 1 };
        var ta = tierRank[a.evidence_tier] || 0;
        var tb = tierRank[b.evidence_tier] || 0;
        if (tb !== ta) return tb - ta;
        if (b._completeness !== a._completeness) return b._completeness - a._completeness;
        if (b.priority !== a.priority) return b.priority - a.priority;
        return String(b.id).length - String(a.id).length;
      });

      var winner = group[0];
      winner._family_size = group.length;
      winner._family_alts = group.slice(1).map(function (s) { return s.id; });
      winners.push(winner);

      group.slice(1).forEach(function (s) {
        s._dedup_winner = winner.id;
        s._dedup_reason = 'duplicata da família ' + fam;
        losers.push(s);
      });
    });

    return { winners: winners, losers: losers };
  }

  // ==================================================================
  // 10. STEP — Classify into categories
  // ==================================================================
  function classify(scale) {
    var t = scale.evidence_tier;
    var status = norm(scale.app_status || '');

    // UTILIZÁVEL: tier respeitável + completeness alto + status live
    if ((t === 'gold' || t === 'screening_validated' || t === 'authoral_structured') &&
        scale._completeness >= 0.70 &&
        (status === 'live' || (!status && scale.clinical_use))) {
      scale._classification = 'UTILIZAVEL';
      return scale;
    }

    // BLOQUEADO: license comercial sem live
    if (norm(scale.license_status || '').indexOf('comercial') >= 0 && status !== 'live') {
      scale._classification = 'BLOQUEADO';
      return scale;
    }

    // OBSOLETO: descontinuado
    if (norm(scale.validation_status || '') === 'descontinuado') {
      scale._classification = 'OBSOLETO';
      return scale;
    }

    // PARCIAL: tier bom mas completeness médio
    if ((t === 'gold' || t === 'screening_validated' || t === 'complementary' || t === 'authoral_structured') &&
        scale._completeness >= 0.50) {
      scale._classification = 'PARCIAL';
      return scale;
    }

    // EXPERIMENTAL: explicitamente marcado
    if (t === 'experimental') {
      scale._classification = 'EXPERIMENTAL';
      return scale;
    }

    // NÃO DEFENSÁVEL: tudo o resto
    scale._classification = 'NAO_DEFENSAVEL';
    return scale;
  }

  // ==================================================================
  // 11. STEP — Strip transient fields (saída limpa)
  // ==================================================================
  function strip(scale, keep) {
    var clean = {};
    Object.keys(scale).forEach(function (k) {
      if (k[0] === '_' && !keep) return;  // transients
      clean[k] = scale[k];
    });
    return clean;
  }

  // ==================================================================
  // 12. PIPELINE PRINCIPAL
  // ==================================================================
  function sanitize(rawScales, opts) {
    opts = opts || {};
    var debug = opts.debug || false;

    // Stage 1: enrich each scale
    var enriched = rawScales.filter(Boolean).map(function (s) {
      // Clona pra não mutar original
      var scale = Object.assign({}, s);
      addCanonicals(scale);
      canonicalizeDomain(scale);
      clipPriority(scale);
      inferEvidenceTier(scale);
      inferRequiresDiagnosis(scale);
      markCompleteness(scale);
      return scale;
    });

    // Stage 2: remove "Lote" / "Banco completo"
    var removed = [];
    enriched = enriched.filter(function (s) {
      if (/lote|banco completo/i.test(s.title || '')) {
        s._removed_reason = 'lote/banco_meta';
        removed.push(s);
        return false;
      }
      return true;
    });

    // Stage 3: dedup by id_family
    var dedupResult = dedupByFamily(enriched);
    removed = removed.concat(dedupResult.losers);
    var deduped = dedupResult.winners;

    // Stage 4: classify
    deduped.forEach(classify);

    // Stage 5: split into output groups
    var utilizavel = deduped.filter(function (s) { return s._classification === 'UTILIZAVEL'; });
    var parcial = deduped.filter(function (s) { return s._classification === 'PARCIAL'; });
    var bloqueado = deduped.filter(function (s) { return s._classification === 'BLOQUEADO'; });
    var experimental = deduped.filter(function (s) { return s._classification === 'EXPERIMENTAL'; });
    var obsoleto = deduped.filter(function (s) { return s._classification === 'OBSOLETO'; });
    var naoDefensavel = deduped.filter(function (s) { return s._classification === 'NAO_DEFENSAVEL'; });

    // catalog-sanitized = UTILIZAVEL + PARCIAL (cleaned)
    var sanitized = utilizavel.concat(parcial).map(function (s) {
      return strip(s, debug);
    });

    var blockedOut = bloqueado.map(function (s) { return strip(s, debug); });
    var experimentalOut = experimental.concat(naoDefensavel).map(function (s) { return strip(s, debug); });
    var removedOut = removed.concat(obsoleto).map(function (s) { return strip(s, true); });

    // Stats
    var stats = {
      input_count: rawScales.length,
      after_lote_filter: enriched.length,
      after_dedup: deduped.length,
      duplicates_removed: dedupResult.losers.length,
      lote_filtered: removed.length - dedupResult.losers.length,
      classifications: {
        UTILIZAVEL: utilizavel.length,
        PARCIAL: parcial.length,
        BLOQUEADO: bloqueado.length,
        EXPERIMENTAL: experimental.length,
        OBSOLETO: obsoleto.length,
        NAO_DEFENSAVEL: naoDefensavel.length
      },
      by_tier_after: {
        gold: deduped.filter(function (s) { return s.evidence_tier === 'gold'; }).length,
        screening_validated: deduped.filter(function (s) { return s.evidence_tier === 'screening_validated'; }).length,
        complementary: deduped.filter(function (s) { return s.evidence_tier === 'complementary'; }).length,
        authoral_structured: deduped.filter(function (s) { return s.evidence_tier === 'authoral_structured'; }).length,
        observational: deduped.filter(function (s) { return s.evidence_tier === 'observational'; }).length,
        experimental: deduped.filter(function (s) { return s.evidence_tier === 'experimental'; }).length
      },
      by_canonical_domain: countBy(deduped, '_domain_canonical'),
      by_completeness_grade: countBy(deduped, '_completeness_grade'),
      output: {
        catalog_sanitized: sanitized.length,
        catalog_blocked: blockedOut.length,
        catalog_experimental: experimentalOut.length,
        catalog_removed: removedOut.length
      },
      generated_at: new Date().toISOString(),
      version: '1.0.0'
    };

    return {
      sanitized: sanitized,
      blocked: blockedOut,
      experimental: experimentalOut,
      removed: removedOut,
      stats: stats
    };
  }

  function countBy(arr, field) {
    var out = {};
    arr.forEach(function (item) {
      var k = item[field] || '(none)';
      out[k] = (out[k] || 0) + 1;
    });
    return out;
  }

  // ==================================================================
  // 13. NODE CLI (se estiver rodando como script)
  // ==================================================================
  function runCLI() {
    if (typeof process === 'undefined' || typeof require !== 'function') return;
    var fs = require('fs');
    var path = require('path');
    var argv = process.argv.slice(2);
    var inDir = argv.includes('--in') ? argv[argv.indexOf('--in') + 1] : '.';
    var outDir = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : './out';
    var dryRun = argv.includes('--dry-run');

    var sources = [
      path.join(inDir, 'scales-index.json'),
      path.join(inDir, 'gold-standards-import.json')
    ];

    var raw = [];
    sources.forEach(function (src) {
      if (!fs.existsSync(src)) { console.warn('skip missing:', src); return; }
      var content = JSON.parse(fs.readFileSync(src, 'utf-8'));
      if (Array.isArray(content)) raw = raw.concat(content);
      else if (content.instruments) raw = raw.concat(content.instruments);
      else console.warn('format desconhecido em', src);
    });

    console.log('Carregadas ' + raw.length + ' escalas brutas');

    var result = sanitize(raw, { debug: argv.includes('--debug') });

    console.log('\n--- ESTATÍSTICAS ---');
    console.log(JSON.stringify(result.stats, null, 2));

    if (dryRun) {
      console.log('\n[DRY RUN] Nada foi escrito em disco.');
      return;
    }

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, 'catalog-sanitized.json'),
      JSON.stringify(result.sanitized, null, 2));
    fs.writeFileSync(path.join(outDir, 'catalog-blocked.json'),
      JSON.stringify(result.blocked, null, 2));
    fs.writeFileSync(path.join(outDir, 'catalog-experimental.json'),
      JSON.stringify(result.experimental, null, 2));
    fs.writeFileSync(path.join(outDir, 'catalog-removed.json'),
      JSON.stringify(result.removed, null, 2));
    fs.writeFileSync(path.join(outDir, 'catalog-stats.json'),
      JSON.stringify(result.stats, null, 2));

    console.log('\nArquivos escritos em ' + outDir + '/');
  }

  // ==================================================================
  // 14. EXPORT
  // ==================================================================
  if (typeof process !== 'undefined' && require.main === module) {
    runCLI();
  }

  return {
    version: '1.0.0',
    sanitize: sanitize,
    helpers: {
      norm: norm,
      ctitle: ctitle,
      idFamily: idFamily,
      canonicalizeDomain: canonicalizeDomain,
      clipPriority: clipPriority,
      inferEvidenceTier: inferEvidenceTier,
      inferRequiresDiagnosis: inferRequiresDiagnosis,
      markCompleteness: markCompleteness,
      dedupByFamily: dedupByFamily,
      classify: classify
    },
    config: {
      CANONICAL_DOMAINS: CANONICAL_DOMAINS,
      DOMAIN_MAP: DOMAIN_MAP,
      ID_REQUIRES_DIAGNOSIS: ID_REQUIRES_DIAGNOSIS,
      TIER_PATTERNS: TIER_PATTERNS
    }
  };
}));
