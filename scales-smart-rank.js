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

  // Construto clínico → gatilhos FORTES (específicos: ativam sozinhos) e FRACOS
  // (ambíguos/genéricos: só ativam com corroboração — ≥2 fracos ou junto de 1
  // forte). Isso eleva a PRECISÃO: um único termo ambíguo ("isolado",
  // "irritado", "agitado") não dispara um construto inteiro sozinho.
  // Na expansão só entram os tokens dos gatilhos FORTES do construto ativado —
  // os fracos ficam de fora para não puxar instrumentos irrelevantes.
  var CONSTRUCTS = {
    tea: {
      strong: ['tea', 'autismo', 'autista', 'espectro', 'nao aponta', 'brinca sozinho', 'ecolalia', 'nao responde ao nome', 'nao responde nome', 'gira objetos', 'enfileira', 'faz de conta', 'interesse restrito', 'contato visual'],
      weak: ['nao olha', 'pouco olho', 'repete', 'rigidez', 'rotina', 'isolado', 'sozinho', 'restrito']
    },
    tdah: {
      strong: ['tdah', 'desatento', 'desatencao', 'hiperativo', 'hiperatividade', 'impulsiv', 'nao termina', 'nao para quieto', 'aereo', 'avoado', 'desorganizado'],
      weak: ['atencao', 'agitado', 'inquieto', 'nao para', 'levanta', 'distrai', 'esquece']
    },
    linguagem: {
      strong: ['nao fala', 'atraso de fala', 'atraso fala', 'troca sons', 'troca som', 'gagueira', 'gagueja', 'disfluencia', 'nao monta frase', 'so aponta', 'fala enrolada'],
      weak: ['fala', 'linguagem', 'vocabulario', 'fala pouco']
    },
    aprendizagem: {
      strong: ['dislexia', 'discalculia', 'nao le', 'nao escreve', 'troca letras', 'dificuldade escolar', 'alfabetiza', 'soletra', 'reprovou', 'rendimento escolar'],
      weak: ['escola', 'escolar', 'leitura', 'escrita', 'matematica', 'letras', 'copia']
    },
    ansiedade: {
      strong: ['ansiedade', 'ansioso', 'panico', 'fobia', 'separacao', 'medo', 'preocupa demais', 'aflito'],
      weak: ['preocupa', 'tenso', 'timido', 'evita', 'nervoso']
    },
    humor: {
      strong: ['depress', 'deprimido', 'tristeza', 'triste', 'anedonia', 'sem vontade', 'desanimo'],
      weak: ['irritado', 'irritabilidade', 'choro', 'chora', 'isolado', 'desinteresse']
    },
    sono: {
      strong: ['sono', 'insonia', 'nao dorme', 'pesadelo', 'terror noturno', 'ronca', 'sonambulismo'],
      weak: ['dorme', 'acorda', 'sonolento', 'cansado']
    },
    sensorial: {
      strong: ['sensorial', 'tapa ouvido', 'seletividade', 'hipersensiv', 'defensivo sensorial'],
      weak: ['barulho', 'textura', 'etiqueta', 'luz', 'seletivo', 'tato']
    },
    motor: {
      strong: ['coordenacao', 'motricidade', 'desajeitado', 'tdc', 'anda na ponta', 'desengoncado', 'descoordenado'],
      weak: ['motor', 'equilibrio', 'cai', 'tropeca', 'lapis']
    },
    comportamento: {
      strong: ['oposic', 'opositor', 'desafia', 'tod', 'agressiv', 'explos', 'birra', 'desobedece', 'conduta'],
      weak: ['comportamento', 'bate', 'morde', 'limite', 'teimoso']
    },
    risco: {
      strong: ['suicid', 'se machucar', 'se cortar', 'autoagress', 'nao querer viver', 'tirar a vida', 'morrer', 'sumir', 'cortar'],
      weak: []
    },
    substancias: {
      strong: ['alcool', 'maconha', 'cigarro', 'vape', 'substancia', 'droga', 'crafft', 'bebida'],
      weak: []
    },
    adaptativo: {
      strong: ['autonomia', 'vida diaria', 'avd', 'nao se veste', 'depende para', 'come sozinho', 'autocuidado'],
      weak: ['independencia', 'veste', 'banheiro', 'depende']
    },
    epilepsia: {
      strong: ['epilepsia', 'convuls', 'ausencia', 'olhar parado', 'crise epil', 'abala'],
      weak: ['crise', 'desmaio', 'episodio']
    },
    paralisiacerebral: {
      strong: ['paralisia cerebral', 'gmfcs', 'macs', 'espasti', 'hipotonia', 'cadeira de rodas', 'nao anda'],
      weak: ['paralisia', 'mao fechada']
    },
    desenvolvimento: {
      strong: ['atraso global', 'regressao', 'nao senta', 'nao engatinha', 'marcos', 'atrasado para idade', 'vigilancia do desenvolvimento'],
      weak: ['desenvolvimento', 'atraso']
    }
  };

  // Um construto ATIVA se: ≥1 gatilho forte, OU ≥2 gatilhos fracos (corroboração).
  function activeConstructs(text) {
    var t = ' ' + norm(text) + ' ', active = {};
    Object.keys(CONSTRUCTS).forEach(function (k) {
      var c = CONSTRUCTS[k];
      var strong = (c.strong || []).filter(function (w) { return t.indexOf(w) >= 0; });
      var weak = (c.weak || []).filter(function (w) { return t.indexOf(w) >= 0; });
      if (strong.length >= 1 || weak.length >= 2) active[k] = strong;
    });
    return active;
  }

  // expand(text) → tokens da queixa + construtos ativados + tokens dos gatilhos
  // FORTES desses construtos (os fracos/ambíguos NÃO entram na expansão).
  function expand(text) {
    var out = {};
    tokens(text).forEach(function (x) { out[x] = 1; });
    var active = activeConstructs(text);
    Object.keys(active).forEach(function (k) {
      out[k] = 1;
      (CONSTRUCTS[k].strong || []).forEach(function (w) { w.split(' ').forEach(function (x) { if (x.length >= 3) out[x] = 1; }); });
    });
    return Object.keys(out);
  }

  // Quais construtos a queixa ativou (para "por que apareceu" e diferenciais).
  function constructsOf(text) { return Object.keys(activeConstructs(text)); }

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
