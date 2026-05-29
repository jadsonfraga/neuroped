/* NeuroPed Master — Vitrine: renderiza a amostra catalogada (sem storage, sem PDF). */
(function () {
  "use strict";
  var D = window.NEUROPED_MASTER;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function $(id){ return document.getElementById(id); }
  if (!D) return;

  // Estatísticas gerais da obra
  var s = D.workStats || {};
  var statsEl = $('npm-stats');
  if (statsEl) statsEl.innerHTML =
      '<div class="stat"><b>'+esc(s.protocolos)+'</b><span>Protocolos na obra</span></div>'
    + '<div class="stat"><b>'+esc(s.escalas)+'</b><span>Escalas passivas</span></div>'
    + '<div class="stat"><b>'+esc(s.capitulos)+'</b><span>Capítulos clínicos</span></div>'
    + '<div class="stat"><b>'+esc(s.volumes)+'</b><span>Volumes integrados</span></div>';

  // Amostra de protocolos
  var sel = D.integratedSelection || {};
  var pEl = $('npm-protocols');
  if (pEl) {
    pEl.innerHTML =
      '<p style="margin:0 0 14px">Amostra catalogada — <strong>'+esc((D.protocols||[]).length)+'</strong> protocolos de demonstração (de '+esc(s.protocolos)+' na obra). Apenas título, domínio e descrição pública; os itens completos e as matrizes não são exibidos.</p>'
      + '<div class="grid">'
      + (D.protocols||[]).map(function(r){
          return '<article class="card"><span class="code">'+esc(r[0])+'</span>'
            + '<h3>'+esc(r[1])+'</h3>'
            + '<div class="meta"><span class="chip">'+esc(r[2])+'</span><span class="chip">⏱ '+esc(r[3])+'</span><span class="chip">'+esc(r[4])+'</span></div>'
            + '<p>'+esc(r[5])+'</p></article>';
        }).join('')
      + '</div>';
  }

  // Macrodomínios das escalas
  var bEl = $('npm-scales');
  if (bEl) {
    bEl.innerHTML =
      '<p style="margin:0 0 14px">As <strong>'+esc(s.escalas)+'</strong> escalas passivas estão organizadas em <strong>5 macrodomínios</strong> de observação funcional. Abaixo, a descrição pública de cada bloco (sem os itens individuais).</p>'
      + '<div class="panel">'
      + (D.scaleBlocks||[]).map(function(r){
          return '<div class="block"><span class="num">'+esc(r[0])+'</span><div><h3>'+esc(r[1])+'</h3><p style="margin:0">'+esc(r[2])+'</p></div></div>';
        }).join('')
      + '</div>';
  }

  // Diretriz TEA (fluxo resumido)
  var tEl = $('npm-tea');
  if (tEl) {
    tEl.innerHTML =
      '<p style="margin:0 0 14px">Visão pública resumida de como a obra integra a leitura do TEA. Esta é uma descrição estrutural — não inclui matrizes prescritivas nem farmacoterapia.</p>'
      + '<div class="flow">'
      + (D.teaFlow||[]).map(function(r){ return '<div class="step"><div><h3>'+esc(r[0])+'</h3><p style="margin:0">'+esc(r[1])+'</p></div></div>'; }).join('')
      + '</div>';
  }

  // Abas
  var tabs = document.querySelectorAll('.tab');
  function activate(name){
    tabs.forEach(function(t){ t.classList.toggle('on', t.dataset.tab === name); });
    document.querySelectorAll('.section').forEach(function(sec){ sec.classList.toggle('on', sec.dataset.section === name); });
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ activate(t.dataset.tab); }); });
  if (tabs.length) activate(tabs[0].dataset.tab);
})();
