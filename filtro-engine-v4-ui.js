/* =====================================================================
   NeuroPed EDJ · Filtro Engine v4 — UI Renderer
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756

   Hooks no filtro-escalas.html para renderizar a UI da engine v4.

   Comportamento:
   ▸ Substitui a renderização padrão do filtro original
   ▸ Renderiza Gold / Silver / Bronze com medalhas
   ▸ Decomposição clínica visível em 7 barras (clicável)
   ▸ Red flag banner quando aplicável (urgente vs medium)
   ▸ Empty state educativo (3 passos + legenda de tiers)
   ▸ "Por que NÃO?" expansível (transparência total)
   ▸ Filtro de finalidade (triagem/laudo/PEI/etc.)
   ▸ Multipliers visíveis no breakdown
   ▸ Export e print preservando hierarquia

   Dependências:
   - filtro-engine-v4.js (engine — NeuroPedEngineV4)
   - filtro-engine-v4.css (estilo)
   ===================================================================== */
(function () {
  'use strict';
  if (window.__NP_UI_V4) return;
  window.__NP_UI_V4 = true;

  // ──────────────────────────────────────────────────────────────────
  // CONSTANTES
  // ──────────────────────────────────────────────────────────────────
  var TIER_LABEL = {
    gold: 'Gold clínico',
    screening_validated: 'Triagem validada',
    complementary: 'Complementar',
    authoral_structured: 'Autoral estruturado',
    observational: 'Observacional',
    experimental: 'Experimental'
  };

  var TIER_TAG_CLASS = {
    gold: 'tier-gold',
    screening_validated: 'tier-screening',
    complementary: 'tier-complementary',
    authoral_structured: 'tier-authoral',
    observational: 'tier-observational',
    experimental: 'tier-experimental'
  };

  var PURPOSE_LABELS = {
    triagem: 'Triagem',
    confirmacao: 'Confirmação',
    seguimento: 'Seguimento',
    pei: 'PEI',
    laudo: 'Laudo',
    inss: 'INSS',
    junta: 'Junta'
  };

  var MEDAL_MARK = { gold: '1º', silver: '2º', bronze: '3º' };
  var RANK_LABEL = { gold: '🥇 OURO clínico', silver: '🥈 PRATA — visão alternativa', bronze: '🥉 BRONZE — complementar' };

  var FACTOR_META = [
    { key: 'domain',     lbl: 'Domínio',     max: 100 },
    { key: 'age',        lbl: 'Idade',       max: 100 },
    { key: 'symptom',    lbl: 'Sinais',      max: 100 },
    { key: 'respondent', lbl: 'Respondente', max: 100 },
    { key: 'utility',    lbl: 'Utilidade',   max: 100 },
    { key: 'primary',    lbl: '1ª linha',    max: 100 }
  ];

  // ──────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtAge(s) {
    var a = s.age_min_months, b = s.age_max_months;
    if (a == null || b == null) return '?';
    if (b - a < 36) return a + '–' + b + 'm';
    var lo = Math.floor(a / 12), hi = Math.floor(b / 12);
    if (lo === hi) return lo + 'a';
    return lo + '–' + hi + 'a';
  }

  function fmtTime(s) {
    var t = s.time_minutes;
    if (!t) return '?';
    return t + ' min';
  }

  function fmtAudience(s) {
    var a = String(s.audience || '').toLowerCase();
    var map = {
      familia: '👪 Família', escola: '🏫 Escola',
      autoteste: '🧒 Autoteste', clinico: '🩺 Profissional',
      terapeuta: '🧩 Terapeuta', misto: '⚖ Misto'
    };
    return map[a] || a;
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }

  // ──────────────────────────────────────────────────────────────────
  // TAGS — gera as badges visíveis no card
  // ──────────────────────────────────────────────────────────────────
  function renderTags(scale) {
    var tags = [];
    var tier = scale.tier || scale.evidence_tier;
    if (tier && TIER_TAG_CLASS[tier]) {
      tags.push('<span class="np-tag ' + TIER_TAG_CLASS[tier] + '">' +
                esc(TIER_LABEL[tier]) + '</span>');
    }
    if (scale.factors && scale.factors.primary >= 80) {
      tags.push('<span class="np-tag first-line">1ª linha</span>');
    }
    if (scale.license_status && /comercial/.test(scale.license_status)) {
      tags.push('<span class="np-tag license-required">Licença</span>');
    }
    if (scale.time_minutes && scale.time_minutes <= 5) {
      tags.push('<span class="np-tag fast-screen">Triagem rápida</span>');
    }
    if (scale.audience === 'escola') {
      tags.push('<span class="np-tag school-use">Uso escolar</span>');
    }
    if (scale.clinical_use && scale.clinical_use.indexOf('confirmacao') >= 0) {
      tags.push('<span class="np-tag confirmatory">Confirmação</span>');
    }
    if (scale.clinical_use && (scale.clinical_use.indexOf('pei') >= 0 ||
                                scale.clinical_use.indexOf('PEI') >= 0)) {
      tags.push('<span class="np-tag pei">PEI</span>');
    }
    return tags.join('');
  }

  // ──────────────────────────────────────────────────────────────────
  // BREAKDOWN — 7 fatores visíveis em barras
  // ──────────────────────────────────────────────────────────────────
  function renderBreakdown(scale) {
    if (!scale.factors) return '';
    var rows = FACTOR_META.map(function (f) {
      var v = Math.max(0, scale.factors[f.key] || 0);
      var pct = Math.min(100, v);
      var full = v >= 90 ? ' full' : '';
      return '<span class="lbl">' + f.lbl + '</span>' +
             '<span class="bar' + full + '" style="--np-bar-fill:' + pct + '%"></span>' +
             '<span class="num">' + Math.round(v) + '</span>';
    }).join('');

    var multipliersHTML = '';
    if (scale.multipliers) {
      var m = scale.multipliers;
      multipliersHTML = '<div class="np-breakdown-multipliers">' +
        '<strong>Modificadores aplicados:</strong>' +
        '<div class="mult-line">Tier de evidência <span class="mult-val">×' + m.em.toFixed(2) + '</span></div>' +
        '<div class="mult-line">1ª linha <span class="mult-val">×' + m.pi.toFixed(2) + '</span></div>' +
        '<div class="mult-line">Diagnosis gate <span class="mult-val">×' + m.dxGate.toFixed(2) + '</span></div>' +
        '<div class="mult-line">Completude <span class="mult-val">×' + m.cp.toFixed(2) + '</span></div>' +
        '</div>';
    }

    return '<details class="np-breakdown">' +
           '<summary>Por que essa escala? ' +
             '<span class="clinical-fit">Clinical Fit ' + (scale.clinical_fit || 0) + '%</span>' +
           '</summary>' +
           '<div class="np-breakdown-grid">' + rows + '</div>' +
           multipliersHTML +
           '</details>';
  }

  // ──────────────────────────────────────────────────────────────────
  // CARD GSB
  // ──────────────────────────────────────────────────────────────────
  function renderCard(scale, kind) {
    if (!scale) return '';
    var title = (scale.short_title || scale.title || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
    var subtitle = scale.differentiator || '';
    if (subtitle.length > 110) subtitle = subtitle.slice(0, 107) + '…';

    var meta = [
      '<span class="meta-age">' + esc(fmtAge(scale)) + '</span>',
      '<span class="meta-aud">' + esc(fmtAudience(scale)) + '</span>',
      scale.time_minutes ? '<span class="meta-time">' + esc(fmtTime(scale)) + '</span>' : '',
      scale.n_items ? '<span class="meta-items">' + scale.n_items + ' itens</span>' : '',
      scale.domain ? '<span class="meta-domain">' + esc(scale.domain) + '</span>' : ''
    ].filter(Boolean).join('');

    var applyHref = scale.official_url
      ? scale.official_url
      : './escala.html?id=' + encodeURIComponent(scale.id);
    var applyTarget = scale.official_url ? ' target="_blank" rel="noopener"' : '';
    var applyLabel = scale.official_url
      ? 'Abrir fonte oficial ↗'
      : '▸ Aplicar agora';

    return '<article class="np-gsb-card ' + kind + '" data-id="' + esc(scale.id) + '">' +
      '<div class="np-gsb-medal" aria-label="' + esc(MEDAL_MARK[kind]) + '">' + MEDAL_MARK[kind] + '</div>' +
      '<div class="np-gsb-score">' +
        '<span class="np-gsb-score-num">' + (scale.score || 0) + '</span>' +
        '<span class="np-gsb-score-label">de 100</span>' +
      '</div>' +
      '<div class="np-gsb-rank">' + esc(RANK_LABEL[kind]) + '</div>' +
      '<h3 class="np-gsb-title">' + esc(title) + '</h3>' +
      (subtitle ? '<p class="np-gsb-subtitle">' + esc(subtitle) + '</p>' : '') +
      '<div class="np-gsb-meta">' + meta + '</div>' +
      '<div class="np-gsb-tags">' + renderTags(scale) + '</div>' +
      renderBreakdown(scale) +
      '<div class="np-gsb-actions">' +
        '<a class="btn-apply" href="' + esc(applyHref) + '"' + applyTarget + '>' + applyLabel + '</a>' +
        '<button type="button" class="btn-secondary" data-action="why-not" data-id="' + esc(scale.id) + '">📊 Detalhes</button>' +
        '<button type="button" class="btn-secondary" data-action="copy" data-id="' + esc(scale.id) + '">📋 Copiar</button>' +
      '</div>' +
    '</article>';
  }

  // ──────────────────────────────────────────────────────────────────
  // RED FLAG BANNER
  // ──────────────────────────────────────────────────────────────────
  function renderRedFlagBanner(rf) {
    if (!rf || (!rf.flags.length && !rf.urgent)) return '';
    var severity = rf.urgent ? 'critical' : (rf.has_humor ? 'medium' : 'medium');
    var className = severity === 'medium' ? 'np-redflag-banner medium' : 'np-redflag-banner';
    var badge = rf.urgent ? 'URGENTE' : 'ATENÇÃO';
    var listItems = rf.flags.map(function (f) {
      return '<li><strong>' + esc(f.label) + '</strong></li>';
    }).join('');

    var actions = '';
    if (rf.urgent) {
      actions = '<div class="actions-suggested">' +
        '<strong>Ações sugeridas:</strong> ' +
        'considerar avaliação clínica direta no atendimento, ' +
        'plano de segurança documentado, ' +
        'encaminhamento prioritário se aplicável.' +
        '</div>';
    } else if (rf.has_humor) {
      actions = '<div class="actions-suggested">' +
        '<strong>Sugestão:</strong> ' +
        'considere avaliação de humor (PHQ-A) e ansiedade (GAD-7 / SCARED) ' +
        'além das escalas listadas.' +
        '</div>';
    }

    return '<aside class="' + className + '" role="alert">' +
      '<h3>' +
        '<span class="urgent-badge">' + badge + '</span>' +
        (rf.urgent ? 'Sinais clínicos urgentes detectados' : 'Sinais que merecem atenção') +
      '</h3>' +
      '<ul>' + listItems + '</ul>' +
      actions +
      '</aside>';
  }

  // ──────────────────────────────────────────────────────────────────
  // EMPTY STATE — educativo
  // ──────────────────────────────────────────────────────────────────
  function renderEmptyGuide() {
    var tierBadges = Object.keys(TIER_LABEL).map(function (k) {
      return '<span class="np-tag ' + TIER_TAG_CLASS[k] + '">' + esc(TIER_LABEL[k]) + '</span>';
    }).join('');

    return '<div class="np-empty-guide">' +
      '<div class="icon">🧠</div>' +
      '<h3>Engine clínica de apoio decisório</h3>' +
      '<p>O filtro cruza domínio clínico, faixa etária, sintomas, perspectiva do informante, ' +
      'tier de evidência e indicação de 1ª linha para devolver as <strong>3 melhores escalas</strong> ' +
      'em hierarquia <strong>Ouro / Prata / Bronze</strong>.</p>' +
      '<div class="np-steps">' +
        '<div class="np-step"><span class="num">1</span><span class="txt">Toque na <strong>idade</strong> da criança</span></div>' +
        '<div class="np-step"><span class="num">2</span><span class="txt">Toque nas <strong>queixas</strong> principais (até 3)</span></div>' +
        '<div class="np-step"><span class="num">3</span><span class="txt">Veja as <strong>3 escalas</strong> com decomposição clínica do score</span></div>' +
      '</div>' +
      '<div class="np-tier-legend">' + tierBadges + '</div>' +
    '</div>';
  }

  // ──────────────────────────────────────────────────────────────────
  // PURPOSE FILTER
  // ──────────────────────────────────────────────────────────────────
  function renderPurposeFilter() {
    var current = localStorage.getItem('np_filtro_purpose') || 'triagem';
    var buttons = Object.keys(PURPOSE_LABELS).map(function (k) {
      return '<button type="button" data-purpose="' + k + '"' +
             (k === current ? ' class="active"' : '') + '>' +
             esc(PURPOSE_LABELS[k]) + '</button>';
    }).join('');
    return '<div class="np-purpose-filter" role="tablist" aria-label="Finalidade da avaliação">' +
           buttons +
           '</div>';
  }

  // ──────────────────────────────────────────────────────────────────
  // RENDER COMPLETO
  // ──────────────────────────────────────────────────────────────────
  function renderResults(container, result) {
    if (!result || (!result.gold && !result.silver && !result.bronze)) {
      container.innerHTML = renderEmptyGuide();
      return;
    }

    var html = '';
    html += renderRedFlagBanner(result.redFlags);
    html += '<div class="np-gsb-grid">';
    if (result.gold)   html += renderCard(result.gold, 'gold');
    if (result.silver) html += renderCard(result.silver, 'silver');
    if (result.bronze) html += renderCard(result.bronze, 'bronze');
    html += '</div>';

    // "Por que NÃO" — escalas excluídas com motivo
    if (result.excluded && result.excluded.length) {
      html += '<details class="np-why-not">' +
        '<summary>Por que algumas escalas foram filtradas? (' + result.excluded.length + ')</summary>' +
        '<ul>' +
        result.excluded.slice(0, 12).map(function (e) {
          return '<li><strong>' + esc(e.title || e.id) + '</strong>' +
                 '<span class="reason ' + (e.reason_class || '') + '">' + esc(e.reason) + '</span></li>';
        }).join('') +
        '</ul>' +
      '</details>';
    }

    container.innerHTML = html;
    attachActions(container);
  }

  // ──────────────────────────────────────────────────────────────────
  // ACTIONS — copy, detail
  // ──────────────────────────────────────────────────────────────────
  function attachActions(container) {
    container.querySelectorAll('[data-action="copy"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        var card = container.querySelector('[data-id="' + CSS.escape(id) + '"]');
        if (!card) return;
        var title = card.querySelector('.np-gsb-title').textContent;
        var meta = card.querySelector('.np-gsb-meta').textContent.replace(/\s+/g, ' ').trim();
        var txt = title + '\n' + meta + '\nID: ' + id;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(txt).then(function () {
            b.textContent = '✓ Copiado';
            setTimeout(function () { b.textContent = '📋 Copiar'; }, 1500);
          });
        }
      });
    });
    container.querySelectorAll('[data-action="why-not"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.np-gsb-card');
        var bd = card.querySelector('.np-breakdown');
        if (bd) {
          bd.open = !bd.open;
          if (bd.open) bd.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // BUILD QUERY FROM UI STATE
  // ──────────────────────────────────────────────────────────────────
  function buildQueryFromUI() {
    var idadeStr = (document.getElementById('idade') || {}).value || '';
    var queixaLivre = (document.getElementById('queixaLivre') || {}).value || '';
    var resp = (document.getElementById('respondente') || {}).value || '';
    var mode = (document.getElementById('sensibilidade') || {}).value || 'alta';
    var purpose = localStorage.getItem('np_filtro_purpose') || 'triagem';

    var ageMonths = null;
    var ageM = idadeStr.toLowerCase().match(/(\d+(?:[,.]\d+)?)/);
    if (ageM) {
      var n = parseFloat(ageM[1].replace(',', '.'));
      ageMonths = idadeStr.toLowerCase().indexOf('mes') >= 0 ? Math.round(n) :
                  Math.round(n * 12);
    }

    var sel = window.selected ? Array.from(window.selected) : [];
    var tags = window.NeuroPedEngineV4
      ? window.NeuroPedEngineV4.extractTags(sel, queixaLivre)
      : sel;

    return {
      ageMonths: ageMonths,
      tags: tags,
      text: queixaLivre,
      desiredResp: resp,
      ageMode: mode,
      mode: 'aplicar',
      purpose: purpose
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // RUN — pipeline completo (chamado de scratch ou de mutações)
  // ──────────────────────────────────────────────────────────────────
  function run() {
    var resultsEl = document.getElementById('results');
    if (!resultsEl) return;

    var engine = window.NeuroPedEngineV4;
    if (!engine) {
      console.warn('[NeuroPed v4 UI] engine não carregada ainda');
      return;
    }

    // Catálogo: mescla scales-index + editorial + gold imports
    var catalog = [];
    if (Array.isArray(window.INDEX)) catalog = catalog.concat(window.INDEX);
    if (Array.isArray(window.NEUROPED_EDITORIAL_SCALES))
      catalog = catalog.concat(window.NEUROPED_EDITORIAL_SCALES);
    if (Array.isArray(window.NEUROPED_GOLD_IMPORTS))
      catalog = catalog.concat(window.NEUROPED_GOLD_IMPORTS);
    if (!catalog.length) {
      console.warn('[NeuroPed v4 UI] catálogo vazio');
      return;
    }

    var query = buildQueryFromUI();

    // Se nada está preenchido, mostra empty state
    if (!query.ageMonths && !query.tags.length && !query.text) {
      resultsEl.innerHTML = renderEmptyGuide();
      return;
    }

    var result = engine.recommend(catalog, query);
    window.__NP_LAST_RESULT = result;
    renderResults(resultsEl, result);
  }

  // ──────────────────────────────────────────────────────────────────
  // MONTAGEM DE COMPONENTES EXTRAS (purpose filter no panel)
  // ──────────────────────────────────────────────────────────────────
  function mountPurposeFilter() {
    var panel = document.querySelector('.panel.sticky');
    if (!panel) return;
    if (panel.querySelector('.np-purpose-filter')) return;

    var label = document.createElement('label');
    label.textContent = 'Finalidade da avaliação';
    label.style.marginTop = '12px';

    var wrap = el(renderPurposeFilter());
    wrap.addEventListener('click', function (e) {
      if (e.target.tagName !== 'BUTTON') return;
      var p = e.target.getAttribute('data-purpose');
      localStorage.setItem('np_filtro_purpose', p);
      wrap.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b === e.target);
      });
      run();
    });

    var lastField = panel.querySelector('.field:last-of-type');
    if (lastField) {
      lastField.appendChild(label);
      lastField.appendChild(wrap);
    } else {
      panel.appendChild(label);
      panel.appendChild(wrap);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // OBSERVE — re-renderiza quando UI muda
  // ──────────────────────────────────────────────────────────────────
  function bindRunners() {
    ['idade', 'queixaLivre', 'respondente', 'sensibilidade'].forEach(function (id) {
      var elem = document.getElementById(id);
      if (elem) {
        elem.addEventListener('change', run);
        elem.addEventListener('input', debounce(run, 200));
      }
    });

    // Observa chips (sem id estável)
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

  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, a); }, ms);
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────────────
  function init() {
    mountPurposeFilter();
    bindRunners();
    // Primeira execução
    setTimeout(run, 200);
    setTimeout(run, 1000);  // fallback caso engine carregue tarde
    setTimeout(run, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ──────────────────────────────────────────────────────────────────
  // API PÚBLICA
  // ──────────────────────────────────────────────────────────────────
  window.NeuroPedFiltroUI = {
    version: '4.0.0',
    run: run,
    renderResults: renderResults,
    renderEmptyGuide: renderEmptyGuide,
    renderRedFlagBanner: renderRedFlagBanner,
    renderCard: renderCard,
    buildQueryFromUI: buildQueryFromUI
  };

  console.log('%cNeuroPed Filtro UI v4.0 ativo',
              'background:#e7c98b;color:#1f1500;padding:3px 8px;border-radius:4px;font-weight:bold');
})();
