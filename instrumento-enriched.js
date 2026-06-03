/* ============================================================
   NeuroPed EDJ — instrumento-enriched.js
   ============================================================
   Pós-processa o DOM de instrumento.html para enriquecer cada
   .item de pergunta com:
     - emoji contextual no topo
     - lista de exemplos cotidianos
     - nota clínica (details/summary)

   Não toca em data-i / data-v dos botões da escala (a lógica
   de pontuação do instrumento original fica intacta).

   Aguarda render() e observa #questions para repinta-las
   quando o usuário muda de instrumento.
   ============================================================ */
(function(){
  'use strict';
  if (window.__npInstEnriched) return;
  window.__npInstEnriched = true;

  function instOf(){
    try { return window.inst || null; } catch(e){ return null; }
  }

  function enrichItem(itemEl, instrument){
    if (!itemEl || itemEl.dataset.npEnriched === '1') return;
    var h3 = itemEl.querySelector('h3');
    if (!h3) return;

    var raw = h3.textContent.trim().replace(/^\d+\.\s*/, ''); // remove "1. "
    var idx = -1;
    var qs = (instrument && instrument.plain_questions) || [];
    for (var i = 0; i < qs.length; i++) {
      if (qs[i].trim() === raw) { idx = i; break; }
    }
    if (idx < 0) idx = parseInt((h3.textContent.match(/^(\d+)/) || [])[1], 10) - 1;

    if (!window.NPEnrichedQuestion) return;
    var enriched = window.NPEnrichedQuestion.enrich(raw, instrument, idx);

    // Substitui o h3 plain pelo header enriquecido
    var num = (idx + 1) + '. ';
    h3.innerHTML =
      '<span aria-hidden="true" style="display:inline-block;font-size:22px;line-height:1;margin-right:8px;vertical-align:-3px">' + enriched.emoji + '</span>' +
      '<span style="color:#a9a4d8;font-weight:800;margin-right:4px">' + num + '</span>' +
      '<span>' + escapeHtml(enriched.text) + '</span>';

    // Bloco de exemplos
    if (enriched.examples && enriched.examples.length) {
      var ex = document.createElement('div');
      ex.className = 'np-inst-examples';
      ex.style.cssText = 'margin:8px 0 10px;padding:8px 10px;background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.22);border-radius:10px';
      ex.innerHTML =
        '<strong style="display:block;font-size:10.5px;letter-spacing:.06em;color:#8b86b8;text-transform:uppercase;margin-bottom:4px">📌 Exemplos do dia a dia</strong>' +
        '<ul style="list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px">' +
          enriched.examples.map(function(e){
            return '<li style="background:rgba(96,165,250,.10);border:1px solid rgba(96,165,250,.22);border-radius:8px;padding:4px 8px;font-size:12px;color:#cdc8ee">' + escapeHtml(e) + '</li>';
          }).join('') +
        '</ul>';
      h3.insertAdjacentElement('afterend', ex);
    }

    // Bloco de micro (nota clínica)
    if (enriched.micro) {
      var micro = document.createElement('details');
      micro.className = 'np-inst-micro';
      micro.style.cssText = 'margin:6px 0 10px;border-top:1px dashed rgba(124,118,210,.22);padding-top:6px';
      micro.innerHTML =
        '<summary style="cursor:pointer;font-size:11px;letter-spacing:.04em;color:#a9a4d8;font-weight:700;list-style:none">💡 Nota clínica</summary>' +
        '<p style="margin:6px 0 0;color:#cdc8ee;font-size:12.5px;line-height:1.55">' + escapeHtml(enriched.micro) + '</p>';
      // insere ANTES da .scale para não atrapalhar layout grid
      var sc = itemEl.querySelector('.scale');
      if (sc) sc.parentNode.insertBefore(micro, sc);
      else itemEl.appendChild(micro);
    }

    itemEl.dataset.npEnriched = '1';
    if (enriched.source === 'curated') itemEl.dataset.qSource = 'curated';
  }

  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function enrichAll(){
    var instrument = instOf();
    if (!instrument) return;
    document.querySelectorAll('#questions .item').forEach(function(it){
      enrichItem(it, instrument);
    });
  }

  function observe(){
    var box = document.getElementById('questions');
    if (!box) return;
    var mo = new MutationObserver(function(){
      clearTimeout(mo.__t);
      mo.__t = setTimeout(enrichAll, 60);
    });
    mo.observe(box, { childList: true, subtree: false });
    window.addEventListener('pagehide', function(){ try { mo.disconnect(); } catch(e){} }, { once: true });
  }

  function boot(){
    observe();
    // Primeiro render pode demorar (load async). Faz polling curto.
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (document.querySelectorAll('#questions .item').length) {
        enrichAll();
        clearInterval(t);
      } else if (tries > 40) {
        clearInterval(t);
      }
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
