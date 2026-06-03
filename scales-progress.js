/* ============================================================
   NeuroPed EDJ — scales-progress.js
   Modo FADIGA + salvar/retomar progresso de escalas/testes (spec #10).
   ------------------------------------------------------------
   - Persiste respostas parciais por (instrumento × criança) e permite RETOMAR
     de onde parou (criança irritada, pais cansados → não recomeça do zero).
   - Sugere DIVIDIR escalas longas em blocos e oferecer pausa, reduzindo
     abandono. Lógica de fadiga é PURA (sem efeito colateral) e testável.
   ------------------------------------------------------------
   Tudo local (LGPD: só no dispositivo). Storage injetável → testável em Node.
   API: NeuroPedProgress.{save,load,clear,list,isLong,blockPlan,shouldOfferBreak,key}
   ============================================================ */
(function (root) {
  'use strict';

  var NS = 'np:progress:';
  var TTL = 1000 * 60 * 60 * 24 * 21; // 21 dias: progresso antigo expira

  // Storage com fallback em memória (Node/test e modo restrito do navegador).
  var mem = {};
  function store() {
    try { if (typeof localStorage !== 'undefined' && localStorage) return localStorage; } catch (e) {}
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; }
    };
  }

  function key(instrumentId, childCode) {
    return NS + String(instrumentId || 'x') + ':' + String(childCode || '_');
  }

  /* save: grava o estado parcial. answers: array/obj; index: pergunta atual. */
  function save(state) {
    if (!state || !state.instrumentId) return false;
    var rec = {
      instrumentId: state.instrumentId,
      childCode: state.childCode || '',
      title: state.title || '',
      answers: state.answers || null,
      index: Number(state.index || 0),
      total: Number(state.total || 0),
      startedAt: Number(state.startedAt || Date.now()),
      at: Date.now()
    };
    try { store().setItem(key(rec.instrumentId, rec.childCode), JSON.stringify(rec)); return true; }
    catch (e) { return false; } // quota/modo privado: falha silenciosa, não quebra a aplicação
  }

  /* load: devolve o estado salvo (ou null). Expira após TTL e auto-limpa. */
  function load(instrumentId, childCode) {
    try {
      var raw = store().getItem(key(instrumentId, childCode));
      if (!raw) return null;
      var rec = JSON.parse(raw);
      if (!rec || (Date.now() - Number(rec.at || 0)) > TTL) { clear(instrumentId, childCode); return null; }
      return rec;
    } catch (e) { return null; }
  }

  function clear(instrumentId, childCode) {
    try { store().removeItem(key(instrumentId, childCode)); return true; } catch (e) { return false; }
  }

  // pct concluído de um registro salvo (0..100), para o chip "Continuar".
  function percent(rec) {
    if (!rec || !rec.total) return 0;
    return Math.max(0, Math.min(100, Math.round(100 * Number(rec.index || 0) / Number(rec.total))));
  }

  /* ---------- Lógica de FADIGA (pura) ---------- */

  // Escala "longa" — acima do limiar, vale dividir/oferecer pausa.
  function isLong(total, threshold) {
    return Number(total || 0) > Number(threshold || 15);
  }

  // Divide `total` itens em blocos de ~perBlock, equilibrando o último bloco
  // (evita um bloco final com 1 item). Retorna [{from,to,count,label}], 0-based [from,to).
  function blockPlan(total, perBlock) {
    total = Math.max(0, Number(total || 0));
    perBlock = Math.max(1, Number(perBlock || 8));
    if (total === 0) return [];
    var n = Math.ceil(total / perBlock);
    var base = Math.floor(total / n), extra = total % n; // distribui o resto nos primeiros blocos
    var blocks = [], from = 0;
    for (var i = 0; i < n; i++) {
      var count = base + (i < extra ? 1 : 0);
      blocks.push({ from: from, to: from + count, count: count, label: 'Bloco ' + (i + 1) + ' de ' + n });
      from += count;
    }
    return blocks;
  }

  // Deve oferecer uma pausa AGORA? Verdadeiro ao cruzar um limite de bloco
  // (e não no item 0). Usado pelo runner para um respiro suave.
  function shouldOfferBreak(index, perBlock) {
    index = Number(index || 0); perBlock = Math.max(1, Number(perBlock || 8));
    return index > 0 && index % perBlock === 0;
  }

  /* list: registros em andamento (para "Continuar o caso"). Só funciona com
     localStorage real; em memória devolve o que houver. */
  function list() {
    var out = [];
    try {
      var s = store();
      // localStorage tem .length/.key; o fallback de memória não — trata ambos.
      if (typeof s.length === 'number' && typeof s.key === 'function') {
        for (var i = 0; i < s.length; i++) {
          var k = s.key(i);
          if (k && k.indexOf(NS) === 0) { try { out.push(JSON.parse(s.getItem(k))); } catch (e) {} }
        }
      } else {
        Object.keys(mem).forEach(function (k) { if (k.indexOf(NS) === 0) { try { out.push(JSON.parse(mem[k])); } catch (e) {} } });
      }
    } catch (e) {}
    return out.filter(Boolean).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }

  var api = { key: key, save: save, load: load, clear: clear, percent: percent,
    isLong: isLong, blockPlan: blockPlan, shouldOfferBreak: shouldOfferBreak, list: list };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedProgress = api;
})(typeof window !== 'undefined' ? window : null);
