/* NeuroPed EDJ — Smart Rank: inteligência de seleção de instrumentos
 * ------------------------------------------------------------------
 * Eleva a escolha do filtro acima da contagem crua de palavras-chave:
 *   1) EXPANSÃO POR CONSTRUTO — termos leigos da queixa ("agitado",
 *      "não para", "não olha", "troca letras") são mapeados ao construto
 *      clínico (tdah, tea, aprendizagem…) e às suas variações, para casar
 *      com os metadados mesmo quando a família não usa o termo técnico.
 *   2) MIX DE MODALIDADE — o top-3 da pré-consulta tende a juntar UM teste
 *      direto (aplicado na criança) + UM inventário de família + UMA escala,
 *      em vez de 3 do mesmo tipo.
 *   3) DEDUP por assinatura (domínio + faixa + respondente) — colapsa as
 *      variantes quase idênticas dos instrumentos gerados.
 *
 * Puro e sem dependências. window.NeuroPedSmartRank (browser) + module.exports
 * (Node, para teste). O filtro usa expand()/pickTop() com fallback gracioso.
 */
(function (root) {
  'use strict';

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function tokens(s) {
    return norm(s).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3; });
  }

  // Construto clínico → gatilhos leigos/técnicos. Se a queixa contém QUALQUER
  // gatilho, expandimos a busca com o construto + todos os tokens dos gatilhos.
  var CONSTRUCTS = {
    tea: ['tea', 'autismo', 'autista', 'espectro', 'nao olha', 'pouco olho', 'contato visual', 'nao aponta', 'brinca sozinho', 'isolado', 'repete', 'ecolalia', 'rigidez', 'rotina', 'nao responde nome', 'gira objetos', 'enfileira', 'restrito'],
    tdah: ['tdah', 'atencao', 'desatento', 'desatencao', 'agitado', 'inquieto', 'nao para', 'levanta', 'impulsivo', 'hiperativo', 'hiperatividade', 'distrai', 'esquece', 'desorganizado', 'nao termina', 'aereo', 'avoado'],
    linguagem: ['linguagem', 'fala', 'nao fala', 'atraso de fala', 'atraso fala', 'troca sons', 'troca som', 'gagueira', 'gagueja', 'disfluencia', 'vocabulario', 'nao monta frase', 'fala pouco', 'so aponta'],
    aprendizagem: ['aprendizagem', 'escola', 'escolar', 'leitura', 'le ', 'nao le', 'escrita', 'nao escreve', 'dislexia', 'discalculia', 'matematica', 'conta', 'letras', 'alfabetiza', 'copia', 'rendimento', 'reprovou', 'troca letras', 'soletra'],
    ansiedade: ['ansiedade', 'ansioso', 'medo', 'preocupa', 'tenso', 'panico', 'fobia', 'separacao', 'timido', 'evita', 'aflito', 'nervoso'],
    humor: ['humor', 'triste', 'tristeza', 'depress', 'deprimido', 'irritado', 'irritabilidade', 'choro', 'chora', 'desanimo', 'sem vontade', 'anedonia'],
    sono: ['sono', 'dorme', 'dormir', 'insonia', 'acorda', 'pesadelo', 'ronca', 'sonolento', 'cansado de dia'],
    sensorial: ['sensorial', 'barulho', 'textura', 'etiqueta', 'luz forte', 'seletivo', 'seletividade', 'tato', 'tapa ouvido', 'enjoa'],
    motor: ['motor', 'coordenacao', 'equilibrio', 'desajeitado', 'cai', 'tropeca', 'lapis', 'motricidade', 'tdc', 'anda na ponta', 'desengoncado'],
    comportamento: ['comportamento', 'oposicao', 'opositor', 'desafia', 'birra', 'agressiv', 'bate', 'morde', 'limite', 'tod', 'explos', 'teimoso', 'desobedece'],
    risco: ['risco', 'suicid', 'se machucar', 'machucar', 'morrer', 'sumir', 'autoagress', 'cortar', 'nao querer viver'],
    adaptativo: ['adaptativo', 'autonomia', 'vida diaria', 'independencia', 'avd', 'veste', 'come sozinho', 'banheiro', 'depende'],
    epilepsia: ['epilepsia', 'convuls', 'crise', 'ausencia', 'desmaio', 'abala', 'olhar parado', 'episodio'],
    paralisiacerebral: ['paralisia', 'pc ', 'gmfcs', 'macs', 'cadeira de rodas', 'espasti', 'hipotonia', 'nao anda', 'mao fechada'],
    desenvolvimento: ['desenvolvimento', 'marcos', 'atraso global', 'nao senta', 'nao engatinha', 'regressao', 'atrasado para idade', 'vigilancia']
  };

  // expand(text) → conjunto de tokens enriquecido com construtos detectados.
  function expand(text) {
    var t = ' ' + norm(text) + ' ';
    var out = {};
    tokens(text).forEach(function (x) { out[x] = 1; });
    Object.keys(CONSTRUCTS).forEach(function (k) {
      var trig = CONSTRUCTS[k];
      var hit = trig.some(function (w) { return t.indexOf(' ' + w) >= 0 || t.indexOf(w + ' ') >= 0 || t.indexOf(w) >= 0; });
      if (hit) {
        out[k] = 1;
        trig.forEach(function (w) { w.split(' ').forEach(function (x) { if (x.length >= 3) out[x] = 1; }); });
      }
    });
    return Object.keys(out);
  }

  // Quais construtos a queixa ativou (para "por que apareceu" e diferenciais).
  function constructsOf(text) {
    var t = ' ' + norm(text) + ' ', hits = [];
    Object.keys(CONSTRUCTS).forEach(function (k) {
      if (CONSTRUCTS[k].some(function (w) { return t.indexOf(w) >= 0; })) hits.push(k);
    });
    return hits;
  }

  function modalityOf(s) {
    if (!s) return 'escala';
    if (s.direct_test || s.kind === 'teste_direto') return 'direto';
    var a = norm(s.audience || '');
    if (a === 'familia' || a === 'pais' || a === 'cuidador') return 'familia';
    if (a === 'escola') return 'escola';
    return 'escala';
  }

  // Assinatura para dedup de variantes quase idênticas (mesmo construto+faixa+quem responde).
  function sig(s) {
    return norm(s.domain || '') + '|' + (s.age_band || (s.age_min_months + '-' + s.age_max_months)) + '|' + norm(s.audience || '');
  }

  // pickTop(ranked, n): a partir da lista JÁ ordenada (rank/score desc), devolve
  // até n itens deduplicados e com MIX de modalidade (1 direto + 1 família + 1
  // escala quando houver), completando por score. ranked = [{s, sc, ...}].
  function pickTop(ranked, n) {
    n = n || 3;
    var bySig = {}, deduped = [];
    ranked.forEach(function (r) {
      var k = sig(r.s);
      if (!bySig[k]) { bySig[k] = 1; deduped.push(r); } // mantém o de maior score (lista já ordenada)
    });
    var pick = [], used = {};
    ['direto', 'familia', 'escala'].forEach(function (m) {
      if (pick.length >= n) return;
      for (var i = 0; i < deduped.length; i++) {
        var r = deduped[i];
        if (!used[r.s.id] && modalityOf(r.s) === m) { pick.push(r); used[r.s.id] = 1; break; }
      }
    });
    for (var i = 0; i < deduped.length && pick.length < n; i++) {
      if (!used[deduped[i].s.id]) { pick.push(deduped[i]); used[deduped[i].s.id] = 1; }
    }
    return pick.sort(function (a, b) { return (b.sc || 0) - (a.sc || 0); });
  }

  // dedupAll(ranked): remove variantes quase idênticas de toda a lista (não só do topo).
  function dedupAll(ranked) {
    var seen = {}, out = [];
    ranked.forEach(function (r) { var k = sig(r.s); if (!seen[k]) { seen[k] = 1; out.push(r); } });
    return out;
  }

  var api = { version: '1.0.0', CONSTRUCTS: CONSTRUCTS, expand: expand, constructsOf: constructsOf, modalityOf: modalityOf, pickTop: pickTop, dedupAll: dedupAll, sig: sig };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedSmartRank = api;
})(typeof window !== 'undefined' ? window : null);
