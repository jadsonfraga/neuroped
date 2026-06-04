/* ============================================================
   NeuroPed SDG — scales-filter-integration.js
   ============================================================
   Cola taxonomia + medalhas + why-card + context-chips +
   perguntas enriquecidas no filtro-escalas.html SEM reescrever
   o card() inline original.

   Ordem de execução:
     1) DOMContentLoaded: monta context chips, agenda re-run
     2) Pós-card render: enriquece DOM (badge tipo + why + Q cards)
     3) Hook em scoreScale: adiciona contextBoost ao score final

   Idempotente. Não toca em scales-bundle.js.
   ============================================================ */
(function(){
  'use strict';
  if (window.__npFilterEnriched) return;
  window.__npFilterEnriched = true;

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function findIndexById(id){
    if (!window.INDEX || !Array.isArray(window.INDEX)) return null;
    return window.INDEX.find(function(s){ return s.id === id; });
  }
  function findScaleByTitle(title){
    if (!window.INDEX || !Array.isArray(window.INDEX)) return null;
    return window.INDEX.find(function(s){ return s.title === title; });
  }

  function months(s){
    var t = String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    var m = t.match(/\d+([,.]\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0].replace(',','.'));
    if (t.indexOf('mes') >= 0) return Math.round(n);
    if (t.indexOf('ano') >= 0 || /\d+a/.test(t)) return Math.round(n*12);
    return n > 24 ? Math.round(n*12) : Math.round(n);
  }

  function signalsNow(){
    var idadeEl = document.getElementById('idade');
    var queixaEl = document.getElementById('queixaLivre');
    var age = idadeEl ? months(idadeEl.value) : null;
    var complaints = (typeof window.detect === 'function') ? window.detect() : [];
    var contexts = (window.NPContextChips && window.NPContextChips.active()) || [];
    return { ageMonths: age, complaints: complaints, contexts: contexts, free: queixaEl ? queixaEl.value : '' };
  }

  /* ---------- Enrich existing card DOM after render ---------- */
  function enrichCardDOM(cardEl, scale, signals){
    if (!cardEl || !scale) return;
    if (cardEl.dataset.npEnriched === '1') return;
    cardEl.dataset.npEnriched = '1';

    var body = cardEl.querySelector(':scope > div');
    if (!body) return;

    // 1) Type badge — insere logo após h3
    if (window.NPScaleTaxonomy) {
      var typeBadge = window.NPScaleTaxonomy.badge(scale, { size: 'sm' });
      var firstBadge = body.querySelector('.badge');
      if (firstBadge) firstBadge.insertAdjacentHTML('beforebegin', typeBadge + ' ');
      else {
        var h3 = body.querySelector('h3');
        if (h3) h3.insertAdjacentHTML('afterend', typeBadge);
      }
    }

    // 2) Medal pill grande — substitui o .rank simples por medalha visual completa
    if (window.NPScaleMedals) {
      var rankEl = cardEl.querySelector('.rank');
      var rows = (window.LAST_ROWS || []);
      var idx = rows.indexOf(scale);
      // se row é scored, tier vem do score; senão tier baseado em posição
      var fakeRow = { score: 100 - idx*15, warnings: [] };
      var tier = window.NPScaleMedals.tierFor(fakeRow.score, fakeRow.warnings);
      if (rankEl) {
        rankEl.classList.add('np-medal-rank', 'np-medal-rank-' + tier);
        rankEl.dataset.tier = tier;
      }
    }

    // 3) Why-card — sob o "Por que apareceu" mini
    if (window.NPScaleWhy) {
      var whyHtml = window.NPScaleWhy.html(scale, signals);
      var miniWhy = body.querySelector('.mini');
      if (whyHtml && miniWhy) {
        miniWhy.insertAdjacentHTML('afterend', whyHtml);
      }
    }

    // 4) Substitui <ol class="questions"> por cards enriquecidos
    if (window.NPEnrichedQuestion) {
      var ol = body.querySelector('ol.questions');
      if (ol) {
        var enrichedHtml = (scale.plain_questions || []).slice(0, 5).map(function(q, i){
          var en = window.NPEnrichedQuestion.enrich(q, scale, i);
          return window.NPEnrichedQuestion.renderCard(en);
        }).join('');
        var wrap = document.createElement('div');
        wrap.className = 'np-q-list';
        wrap.innerHTML = enrichedHtml;
        ol.parentNode.replaceChild(wrap, ol);
      }
    }
  }

  function enrichAllCards(){
    var signals = signalsNow();
    var cards = document.querySelectorAll('#results .result-card');
    cards.forEach(function(c){
      var h3 = c.querySelector('h3'); if (!h3) return;
      var scale = findScaleByTitle(h3.textContent.trim());
      if (scale) enrichCardDOM(c, scale, signals);
    });
  }

  /* ---------- Score hook (contextBoost) ---------- */
  function wrapScoreScale(){
    if (typeof window.scoreScale !== 'function') return false;
    if (window.__scoreScaleOriginal) return true;
    window.__scoreScaleOriginal = window.scoreScale;
    window.scoreScale = function(s, comp, age, resp, mode, text){
      var base = window.__scoreScaleOriginal.apply(this, arguments);
      var ctx = (window.NPContextChips && window.NPContextChips.active()) || [];
      if (ctx.length && window.NPContextChips && window.NPContextChips.contextBoost) {
        var boost = window.NPContextChips.contextBoost(s, ctx);
        if (boost > 0) {
          base.score = (base.score || 0) + boost;
          (base.reasons || (base.reasons = [])).push('contexto: ' + ctx.join(','));
        }
      }
      return base;
    };
    return true;
  }

  /* ---------- Observa #results e enriquece ao re-renderizar ---------- */
  function observeResults(){
    var box = document.getElementById('results');
    if (!box) return;
    var mo = new MutationObserver(function(){
      // debounce simples
      clearTimeout(mo.__t);
      mo.__t = setTimeout(enrichAllCards, 50);
    });
    mo.observe(box, { childList: true, subtree: false });
    // Cleanup
    window.addEventListener('pagehide', function(){ try { mo.disconnect(); } catch(e){} }, { once: true });
  }

  /* ---------- Re-run em mudança de contexto ---------- */
  function bindContextRerun(){
    document.addEventListener('npContextChange', function(){
      if (typeof window.run === 'function') window.run();
    });
  }

  /* ---------- Boot ---------- */
  ready(function(){
    if (window.NPContextChips) window.NPContextChips.mount();
    bindContextRerun();
    var ok = wrapScoreScale();
    if (!ok) {
      // tenta de novo após INDEX carregar
      var tries = 0;
      var t = setInterval(function(){
        tries++;
        if (wrapScoreScale() || tries > 30) clearInterval(t);
      }, 200);
    }
    observeResults();
    setTimeout(enrichAllCards, 300); // primeiro render
  });
})();
