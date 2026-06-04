/* ============================================================
   NeuroPed SDG — scales-medals.js
   ============================================================
   Atribui medalhas 🥇🥈🥉 a uma lista de resultados ranqueada.

   - Usa o score que JÁ existe no recommender (0–100).
   - Cortes: 🥇 ≥75, 🥈 60–74, 🥉 40–59, ❌ <40 ou com warnings.
   - Não recalcula nada. Só pinta.
   - Renderiza:
       * medal pill no canto do card
       * faixa de cor lateral
       * texto curto explicando o porquê da tier
   ============================================================ */
(function(){
  'use strict';
  if (window.NPScaleMedals) return;

  var MEDALS = {
    gold:   { emoji: '🥇', label: 'Ouro',    short: 'Mais indicado',     color: '#e7c98b', bg: 'rgba(231,201,139,.16)', border: 'rgba(231,201,139,.46)' },
    silver: { emoji: '🥈', label: 'Prata',   short: 'Complementar',       color: '#c0c0c0', bg: 'rgba(192,192,192,.14)', border: 'rgba(192,192,192,.40)' },
    bronze: { emoji: '🥉', label: 'Bronze',  short: 'Refinamento',        color: '#cd7f32', bg: 'rgba(205,127,50,.14)',  border: 'rgba(205,127,50,.40)' },
    avoid:  { emoji: '⚠️', label: 'Evitar',  short: 'Baixa aderência',    color: '#f87171', bg: 'rgba(248,113,113,.14)', border: 'rgba(248,113,113,.40)' }
  };

  function tierFor(score, warnings){
    var s = Number(score) || 0;
    if (warnings && warnings.length) {
      if (s >= 75) return 'gold';       // alta aderência mesmo com aviso
      if (s >= 60) return 'silver';
      if (s >= 40) return 'bronze';
      return 'avoid';
    }
    if (s >= 75) return 'gold';
    if (s >= 60) return 'silver';
    if (s >= 40) return 'bronze';
    return 'avoid';
  }

  function meta(tier){ return MEDALS[tier] || MEDALS.bronze; }

  function pill(tier, opts){
    var m = meta(tier);
    var size = (opts && opts.size) || 'md';
    var pad = size === 'lg' ? '7px 13px' : (size === 'sm' ? '3px 8px' : '5px 11px');
    var fz = size === 'lg' ? '13px' : (size === 'sm' ? '10.5px' : '11.5px');
    return '<span class="np-medal np-medal-' + tier + '" ' +
      'title="' + m.label + ' — ' + m.short + '" ' +
      'style="display:inline-flex;align-items:center;gap:5px;padding:' + pad + ';' +
      'border-radius:999px;font:800 ' + fz + '/1 system-ui;letter-spacing:.02em;' +
      'background:' + m.bg + ';color:' + m.color + ';' +
      'border:1px solid ' + m.border + ';">' +
      '<span aria-hidden="true">' + m.emoji + '</span>' +
      '<span>' + m.label + '</span></span>';
  }

  function assign(rows){
    return (rows || []).map(function(row, idx){
      var tier = tierFor(row.score, row.warnings || row.avisos);
      // No topo da lista (rank 1-3) com score alto, força ouro pra ranqueamento humano
      if (idx === 0 && tier === 'silver' && (row.score || 0) >= 70) tier = 'gold';
      return Object.assign({}, row, { tier: tier, medal: meta(tier) });
    });
  }

  function listAll(){ return Object.keys(MEDALS).map(function(k){ return Object.assign({ id: k }, MEDALS[k]); }); }

  window.NPScaleMedals = {
    version: '1.0.0',
    MEDALS: MEDALS,
    tierFor: tierFor,
    meta: meta,
    pill: pill,
    assign: assign,
    listAll: listAll
  };
})();
