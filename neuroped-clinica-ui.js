/* =====================================================================
   NeuroPed EDJ · UI Clínica (Consolidada v6.0)
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   ÚNICO arquivo JS de UI que renderiza:
   ▸ Cards 🥇 OURO · 🥈 PRATA · 🥉 BRONZE com estética central
   ▸ Decomposição clínica (6 fatores em barras + multipliers)
   ▸ Tier badges (Gold/Triagem/Autoral/Observacional...)
   ▸ Sensibilidade / Especificidade (curated)
   ▸ "Quando NÃO usar" (banner âmbar)
   ▸ Bloco de HIPÓTESE CLÍNICA com explicação em prosa
   ▸ Bateria sugerida (triagem + confirmação + funcional + risco)
   ▸ Detecção de gaps avaliativos
   ▸ Red flag banner (urgência)
   ▸ Empty state educativo

   Carregar APÓS neuroped-engine-clinica.js
   Substitui: filtro-engine-v4-ui.js + filtro-engine-v5-ui.js
   ===================================================================== */
(function () {
  'use strict';
  if (window.__NP_CLINICA_UI) return;
  window.__NP_CLINICA_UI = true;

  var ENG = window.NeuroPedClinica;
  if (!ENG) {
    console.warn('[ui] NeuroPedClinica engine não carregada');
    return;
  }

  // ==================================================================
  // CONSTANTES
  // ==================================================================
  var TIER_TAG_CLASS = {
    gold:                'tier-gold',
    screening_validated: 'tier-screening',
    complementary:       'tier-complementary',
    authoral_structured: 'tier-authoral',
    observational:       'tier-observational',
    experimental:        'tier-experimental'
  };

  var MEDAL = {
    gold:   { mark: 'OURO',   kicker: '🥇 OURO clínico' },
    silver: { mark: 'PRATA',  kicker: '🥈 PRATA — visão alternativa' },
    bronze: { mark: 'BRONZE', kicker: '🥉 BRONZE — complementar' }
  };

  var FACTOR_META = [
    { key: 'domain',     lbl: 'Domínio' },
    { key: 'age',        lbl: 'Idade' },
    { key: 'symptom',    lbl: 'Sinais' },
    { key: 'respondent', lbl: 'Visão' },
    { key: 'utility',    lbl: 'Utilidade' },
    { key: 'primary',    lbl: '1ª linha' }
  ];

  // ==================================================================
  // HELPERS
  // ==================================================================
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pct(n) { return Math.round(n * 100); }

  function cleanTitle(s) {
    return (s || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
  }

  function fmtAge(s) {
    var a = s.age_min_months, b = s.age_max_months;
    if (a == null || b == null) return '?';
    if (b - a < 36) return a + '–' + b + 'm';
    var lo = Math.floor(a / 12), hi = Math.floor(b / 12);
    if (lo === hi) return lo + 'a';
    return lo + '–' + hi + 'a';
  }

  function fmtAudience(s) {
    var a = String(s.audience || '').toLowerCase();
    var map = {
      familia: '👪 Família', escola: '🏫 Escola',
      autoteste: '🧒 Autoteste', clinico: '🩺 Profissional',
      terapeuta: '🧩 Terapeuta', misto: '⚖ Misto'
    };
    return map[a] || (a || '?');
  }

  // ==================================================================
  // TAGS — badges visíveis no card
  // ==================================================================
  function renderTags(scale) {
    var tags = [];
    var tier = scale.tier;
    if (tier && TIER_TAG_CLASS[tier]) {
      tags.push('<span class="np-tag-clin ' + TIER_TAG_CLASS[tier] + '">' +
                esc(ENG.TIER_LABEL[tier]) + '</span>');
    }
    if (scale.factors && scale.factors.primary >= 80) {
      tags.push('<span class="np-tag-clin first-line">🥇 1ª linha</span>');
    }
    if (scale.license_status && /comercial/.test(scale.license_status)) {
      tags.push('<span class="np-tag-clin license-required">🔒 Licença</span>');
    }
    if (scale.time_minutes && scale.time_minutes <= 5) {
      tags.push('<span class="np-tag-clin fast">⏱ Rápida</span>');
    }
    if (scale.audience === 'escola') {
      tags.push('<span class="np-tag-clin school">🏫 Uso escolar</span>');
    }
    if (scale.clinical_use && Array.isArray(scale.clinical_use)) {
      if (scale.clinical_use.indexOf('confirmacao') >= 0)
        tags.push('<span class="np-tag-clin confirm">🧠 Confirmação</span>');
      if (scale.clinical_use.indexOf('pei') >= 0)
        tags.push('<span class="np-tag-clin pei">📊 PEI</span>');
    }
    return tags.length ? '<div class="np-tag-row">' + tags.join('') + '</div>' : '';
  }

  // ==================================================================
  // BREAKDOWN — 6 fatores em barras
  // ==================================================================
  function renderBreakdown(scale) {
    if (!scale.factors) return '';
    var rows = FACTOR_META.map(function (f) {
      var v = Math.max(0, scale.factors[f.key] || 0);
      var pct_ = Math.min(100, v);
      var full = v >= 90 ? ' full' : '';
      return '<span class="lbl">' + f.lbl + '</span>' +
             '<span class="bar' + full + '" style="--np-fill:' + pct_ + '%"></span>' +
             '<span class="num">' + Math.round(v) + '</span>';
    }).join('');

    var mults = '';
    if (scale.multipliers) {
      var m = scale.multipliers;
      mults = '<div class="np-mult-row">' +
        '<strong>Modificadores:</strong>' +
        '<span>Evidência <b>×' + m.em.toFixed(2) + '</b></span>' +
        '<span>1ª linha <b>×' + m.pi.toFixed(2) + '</b></span>' +
        '<span>Dx-gate <b>×' + m.dxGate.toFixed(2) + '</b></span>' +
        '<span>Completude <b>×' + m.cp.toFixed(2) + '</b></span>' +
        '</div>';
    }

    return '<details class="np-breakdown-clin">' +
           '<summary>Por que essa escala? ' +
             '<span class="fit">Clinical Fit ' + (scale.clinical_fit || 0) + '%</span>' +
           '</summary>' +
           '<div class="np-bd-grid">' + rows + '</div>' +
           mults +
           '</details>';
  }

  // ==================================================================
  // PSYCHOMETRICS — sensibilidade/especificidade
  // ==================================================================
  function renderPsychometrics(scale) {
    var psy = scale.psychometrics;
    if (!psy) return '';

    var html = '<div class="np-psy">';

    if (psy.contexto) {
      html += '<div class="np-psy-context"><strong>Contexto ideal:</strong> ' + esc(psy.contexto) + '</div>';
    }

    if (psy.sens != null || psy.esp != null) {
      html += '<div class="np-psy-grid">';
      if (psy.sens != null) {
        html += '<div class="np-psy-row">' +
          '<span class="lbl">Sensibilidade</span>' +
          '<span class="bar"><span style="width:' + pct(psy.sens) + '%;background:#6ee7b7"></span></span>' +
          '<span class="val">' + pct(psy.sens) + '%</span>' +
        '</div>';
      }
      if (psy.esp != null) {
        html += '<div class="np-psy-row">' +
          '<span class="lbl">Especificidade</span>' +
          '<span class="bar"><span style="width:' + pct(psy.esp) + '%;background:#93c5fd"></span></span>' +
          '<span class="val">' + pct(psy.esp) + '%</span>' +
        '</div>';
      }
      html += '</div>';
    }

    if (psy.when_not) {
      html += '<div class="np-when-not"><strong>⚠ Quando NÃO usar:</strong> ' + esc(psy.when_not) + '</div>';
    }
    html += '</div>';
    return html;
  }

  // ==================================================================
  // CARD GSB
  // ==================================================================
  function renderCard(scale, kind) {
    if (!scale) return '';
    var title = cleanTitle(scale.short_title || scale.title || '');
    var subtitle = scale.differentiator || scale.clinical_use_summary || '';
    if (subtitle.length > 120) subtitle = subtitle.slice(0, 117) + '…';

    var meta = [
      '<span>📆 ' + esc(fmtAge(scale)) + '</span>',
      '<span>' + esc(fmtAudience(scale)) + '</span>',
      scale.time_minutes ? '<span>⏱ ' + scale.time_minutes + ' min</span>' : '',
      scale.n_items ? '<span>📋 ' + scale.n_items + ' itens</span>' : '',
      scale.domain ? '<span>🎯 ' + esc(scale.domain) + '</span>' : ''
    ].filter(Boolean).join('');

    var applyHref = scale.official_url
      ? scale.official_url
      : './escala.html?id=' + encodeURIComponent(scale.id);
    var applyTarget = scale.official_url ? ' target="_blank" rel="noopener"' : '';
    var applyLabel = scale.official_url ? 'Abrir fonte oficial ↗' : '▸ Aplicar agora';

    return '<article class="np-card-gsb ' + kind + '" data-id="' + esc(scale.id) + '">' +
      '<div class="np-medal">' + MEDAL[kind].mark + '</div>' +
      '<div class="np-score-display">' +
        '<span class="num">' + (scale.score || 0) + '</span>' +
        '<span class="lbl">de 100</span>' +
      '</div>' +
      '<div class="np-rank">' + esc(MEDAL[kind].kicker) + '</div>' +
      '<h3 class="np-card-title">' + esc(title) + '</h3>' +
      (subtitle ? '<p class="np-card-sub">' + esc(subtitle) + '</p>' : '') +
      '<div class="np-meta-row">' + meta + '</div>' +
      renderTags(scale) +
      renderBreakdown(scale) +
      renderPsychometrics(scale) +
      '<div class="np-card-actions">' +
        '<a class="btn btn-primary" href="' + esc(applyHref) + '"' + applyTarget + '>' + applyLabel + '</a>' +
        '<button type="button" class="btn btn-ghost np-card-copy" data-id="' + esc(scale.id) + '">📋 Copiar</button>' +
      '</div>' +
    '</article>';
  }

  // ==================================================================
  // HIPÓTESE CLÍNICA — banner premium
  // ==================================================================
  function renderHypothesisBlock(reasoning) {
    if (!reasoning || !reasoning.topHypothesis) return '';
    var h = reasoning.topHypothesis;
    var conf = reasoning.meta.confidence;
    var confClass = conf === 'ALTA' ? 'conf-high' : (conf === 'MÉDIA' ? 'conf-med' : 'conf-low');

    var domsHTML = (h.domains || []).map(function (d) {
      return '<span class="np-dom-chip">' + esc(d) + '</span>';
    }).join('');

    return '<div class="np-hypothesis">' +
      '<div class="np-hyp-head">' +
        '<div class="np-hyp-icon">🧠</div>' +
        '<div class="np-hyp-meta">' +
          '<div class="np-hyp-row">' +
            '<span class="np-hyp-kicker">HIPÓTESE CLÍNICA</span>' +
            '<span class="np-confidence ' + confClass + '">Confiança ' + esc(conf) + '</span>' +
          '</div>' +
          '<h2 class="np-hyp-title">' + esc(h.label) + '</h2>' +
        '</div>' +
      '</div>' +
      (reasoning.explanation
        ? '<p class="np-hyp-prose">' + esc(reasoning.explanation) + '</p>'
        : '') +
      (domsHTML
        ? '<div class="np-hyp-doms"><span class="lbl">Domínios:</span>' + domsHTML + '</div>'
        : '') +
    '</div>';
  }

  // ==================================================================
  // RED FLAG BANNER
  // ==================================================================
  function renderRedFlagBanner(rf) {
    if (!rf || !rf.flags.length) return '';
    var severity = rf.urgent ? 'critical' : 'medium';
    var badge = rf.urgent ? 'URGENTE' : 'ATENÇÃO';

    var items = rf.flags.map(function (f) {
      return '<li><strong>' + esc(f.label) + '</strong></li>';
    }).join('');

    var actions = rf.urgent
      ? '<div class="np-rf-actions"><strong>Ações sugeridas:</strong> avaliação clínica direta · plano de segurança documentado · encaminhamento prioritário.</div>'
      : '';

    return '<aside class="np-red-flag ' + severity + '" role="alert">' +
      '<h3><span class="badge">' + badge + '</span>' +
      (rf.urgent ? 'Sinais clínicos urgentes detectados' : 'Sinais que merecem atenção') + '</h3>' +
      '<ul>' + items + '</ul>' +
      actions +
    '</aside>';
  }

  // ==================================================================
  // BATERIA CLÍNICA SUGERIDA
  // ==================================================================
  function renderBattery(battery) {
    if (!battery) return '';
    var blocks = [];
    function block(title, list, klass) {
      if (!list || !list.length) return '';
      var items = list.slice(0, 3).map(function (s) {
        return '<li>' + esc(cleanTitle(s.short_title || s.title)) + '</li>';
      }).join('');
      return '<div class="np-bat-block ' + (klass || '') + '">' +
        '<h4>' + title + '</h4>' +
        '<ul>' + items + '</ul>' +
      '</div>';
    }
    blocks.push(block('🔎 Triagem inicial', battery.triagem, ''));
    blocks.push(block('🧠 Confirmação diagnóstica', battery.confirmacao, ''));
    blocks.push(block('📊 Avaliação funcional', battery.funcional, ''));
    blocks.push(block('🛟 Avaliação de risco', battery.risco, 'urgent'));
    var content = blocks.filter(Boolean).join('');
    if (!content) return '';

    return '<details class="np-battery">' +
      '<summary>📋 Bateria clínica sugerida pela hipótese</summary>' +
      '<div class="np-bat-grid">' + content + '</div>' +
    '</details>';
  }

  // ==================================================================
  // GAPS
  // ==================================================================
  function renderGaps(gaps) {
    if (!gaps || !gaps.uncovered.length || !gaps.message) return '';
    return '<div class="np-gaps">' +
      '<span class="ico">⚙️</span>' +
      '<div><strong>Gap avaliativo:</strong> ' + esc(gaps.message) + '</div>' +
    '</div>';
  }

  // ==================================================================
  // EMPTY STATE
  // ==================================================================
  function renderEmpty() {
    var tierBadges = Object.keys(ENG.TIER_LABEL).map(function (k) {
      return '<span class="np-tag-clin ' + TIER_TAG_CLASS[k] + '">' + esc(ENG.TIER_LABEL[k]) + '</span>';
    }).join('');

    return '<div class="np-empty">' +
      '<div class="ico">🧠</div>' +
      '<h3>Engine clínica de apoio decisório</h3>' +
      '<p>Cruza domínio · idade · sintomas · respondente · evidência · indicação primária para devolver as <strong>3 melhores escalas</strong> em <strong>Ouro / Prata / Bronze</strong> com decomposição clínica visível.</p>' +
      '<div class="np-steps">' +
        '<div class="step"><span class="num">1</span><span>Idade da criança</span></div>' +
        '<div class="step"><span class="num">2</span><span>Queixas principais (até 3)</span></div>' +
        '<div class="step"><span class="num">3</span><span>3 escalas + hipótese + bateria + alertas</span></div>' +
      '</div>' +
      '<div class="np-tier-legend">' + tierBadges + '</div>' +
    '</div>';
  }

  // ==================================================================
  // BUILD QUERY FROM UI STATE
  // ==================================================================
  function buildQueryFromUI() {
    var idadeStr = (document.getElementById('idade') || {}).value || '';
    var queixaLivre = (document.getElementById('queixaLivre') || {}).value || '';
    var resp = (document.getElementById('respondente') || {}).value || '';
    var mode = (document.getElementById('sensibilidade') || {}).value || 'alta';

    var ageMonths = null;
    var m = idadeStr.toLowerCase().match(/(\d+(?:[,.]\d+)?)/);
    if (m) {
      var n = parseFloat(m[1].replace(',', '.'));
      ageMonths = idadeStr.toLowerCase().indexOf('mes') >= 0 ? Math.round(n) : Math.round(n * 12);
    }

    var sel = window.selected ? Array.from(window.selected) : [];
    var tags = ENG.extractTags(sel, queixaLivre);

    return {
      ageMonths: ageMonths,
      tags: tags,
      text: queixaLivre,
      desiredResp: resp,
      ageMode: mode,
      mode: 'aplicar'
    };
  }

  // ==================================================================
  // RUN — pipeline completo
  // ==================================================================
  function run() {
    var resultsEl = document.getElementById('results');
    if (!resultsEl) return;

    var catalog = [];
    if (Array.isArray(window.INDEX)) catalog = catalog.concat(window.INDEX);
    if (Array.isArray(window.NEUROPED_EDITORIAL_SCALES))
      catalog = catalog.concat(window.NEUROPED_EDITORIAL_SCALES);
    if (Array.isArray(window.NEUROPED_GOLD_IMPORTS))
      catalog = catalog.concat(window.NEUROPED_GOLD_IMPORTS);
    if (!catalog.length) return;

    var query = buildQueryFromUI();

    if (!query.ageMonths && !query.tags.length && !query.text) {
      resultsEl.innerHTML = renderEmpty();
      return;
    }

    var reasoning = ENG.recommend(query, catalog);
    window.__NP_LAST_REASONING = reasoning;

    var html = '';
    html += renderRedFlagBanner(reasoning.redFlags);
    html += renderHypothesisBlock(reasoning);

    html += '<div class="np-gsb-grid">';
    if (reasoning.gold)   html += renderCard(reasoning.gold,   'gold');
    if (reasoning.silver) html += renderCard(reasoning.silver, 'silver');
    if (reasoning.bronze) html += renderCard(reasoning.bronze, 'bronze');
    html += '</div>';

    html += renderGaps(reasoning.gaps);
    html += renderBattery(reasoning.battery);

    resultsEl.innerHTML = html;
    attachActions(resultsEl);
  }

  // ==================================================================
  // ACTIONS — copy
  // ==================================================================
  function attachActions(container) {
    container.querySelectorAll('.np-card-copy').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        var card = container.querySelector('[data-id="' + CSS.escape(id) + '"]');
        if (!card) return;
        var title = card.querySelector('.np-card-title')?.textContent || '';
        var meta = card.querySelector('.np-meta-row')?.textContent.replace(/\s+/g, ' ').trim() || '';
        var txt = title + '\n' + meta + '\nID: ' + id + '\nNeuroPed EDJ · Dr. Jadson Fraga · CRM-PE 25227';
        if (navigator.clipboard) {
          navigator.clipboard.writeText(txt).then(function () {
            b.textContent = '✓ Copiado';
            setTimeout(function () { b.textContent = '📋 Copiar'; }, 1500);
          });
        }
      });
    });
  }

  // ==================================================================
  // OBSERVE & BIND
  // ==================================================================
  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, a); }, ms);
    };
  }

  function bindRunners() {
    ['idade', 'queixaLivre', 'respondente', 'sensibilidade'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', debounce(run, 150));
        el.addEventListener('input', debounce(run, 200));
      }
    });
    var chipBox = document.getElementById('chips');
    if (chipBox && window.MutationObserver) {
      var mo = new MutationObserver(debounce(run, 150));
      mo.observe(chipBox, { attributes: true, subtree: true, attributeFilter: ['class', 'aria-pressed'] });
    }
    var ageBox = document.getElementById('ageChips');
    if (ageBox && window.MutationObserver) {
      var mo2 = new MutationObserver(debounce(run, 150));
      mo2.observe(ageBox, { attributes: true, subtree: true, attributeFilter: ['class', 'aria-pressed'] });
    }
  }

  function init() {
    bindRunners();
    setTimeout(run, 200);
    setTimeout(run, 1200);
    setTimeout(run, 3500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================================================================
  // API
  // ==================================================================
  window.NeuroPedClinicaUI = {
    version: '6.0.0',
    run: run,
    renderCard: renderCard,
    renderHypothesisBlock: renderHypothesisBlock,
    renderRedFlagBanner: renderRedFlagBanner,
    renderBattery: renderBattery,
    renderGaps: renderGaps,
    renderEmpty: renderEmpty,
    buildQueryFromUI: buildQueryFromUI
  };

  // Aliases retro-compat
  window.NeuroPedFiltroUI = window.NeuroPedClinicaUI;
  window.NeuroPedFiltroUIV5 = window.NeuroPedClinicaUI;

  console.log('%cNeuroPed UI Clínica v6.0 ativa',
              'background:#e7c98b;color:#1f1500;padding:3px 8px;border-radius:4px;font-weight:bold');
})();
