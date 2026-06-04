/* ============================================================
   NeuroPed SDG — scales-taxonomy.js
   ------------------------------------------------------------
   Fundação de LÓGICA para o módulo de escalas/testes (não estética).
   ------------------------------------------------------------
   1) classify(s): tipa o instrumento por CAMPO FACTUAL (audience/respondent/
      direct_test) + heurística de título/keywords. Diferencia:
        escala parental · inventário · questionário · teste direto ·
        observação clínica · triagem · autorrelato.
      Resolve a dor "separar escala respondida pelos pais × teste aplicado
      na criança" sem inventar dado.
   2) functionalExamples(tag): exemplos FUNCIONAIS do cotidiano (casa/escola/
      social) por queixa — linguagem de pais. NÃO são itens de instrumentos
      proprietários (que não podem ser reproduzidos); são prompts genéricos
      de observação, conhecimento comum.
   3) Compat shim window.NPScaleTaxonomy — expõe inferType()/badge() pra
      a camada de display premium (scales-medals, scales-why-card,
      scales-filter-integration, instrumento-enriched) sem duplicar lógica.

   Puro, sem dependências. Funciona no browser (window.NeuroPedTaxonomy +
   window.NPScaleTaxonomy) e em Node (module.exports) para teste unitário.
   ============================================================ */
(function (root) {
  'use strict';

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // Tipos canônicos do módulo (rótulo + emoji factuais, não decorativos)
  var KINDS = {
    teste_direto: { label: 'Teste direto com a criança', emoji: '🎯', direct: true },
    observacao:   { label: 'Observação clínica estruturada', emoji: '👀', direct: true },
    triagem:      { label: 'Triagem / rastreio rápido', emoji: '⚡', direct: false },
    inventario:   { label: 'Inventário comportamental/emocional', emoji: '🧠', direct: false },
    autorrelato:  { label: 'Autorrelato (criança/adolescente)', emoji: '🧒', direct: false },
    escala_pais:  { label: 'Escala — respondida pela família', emoji: '👪', direct: false },
    escala_escola:{ label: 'Escala — respondida pela escola', emoji: '🏫', direct: false },
    questionario: { label: 'Questionário estruturado', emoji: '📋', direct: false }
  };

  /* classify: retorna { kind, label, emoji, direct } — factual, determinístico.
     Estratégia (refinada contra o catálogo real, scripts/audit-taxonomy.mjs):
     o GÊNERO do instrumento manda quando o próprio NOME o declara (inventário/
     triagem/observação) ou há tarefa neuropsicológica nomeada; senão decide pela
     AUDIÊNCIA (sinal factual). Conservador no teste_direto: melhor sub-rotular do
     que chamar uma escala de avaliação de "teste aplicado na criança". */
  function classify(s) {
    s = s || {};
    var a = norm(s.audience);
    var resp = norm([].concat(s.respondent || s.respondente || []).join(' ') + ' ' + a);
    var title = norm([s.title, s.short_title].join(' '));
    var t = norm([s.title, s.short_title, s.domain, s.finalidade,
      [].concat(s.keywords || []).join(' '), [].concat(s.symptoms || []).join(' ')].join(' '));

    // 0) TESTE DIRETO explícito (flag) — sinal mais forte e raro.
    if (s.direct_test === true || s.direct_test === 1 || s.task === true) return view('teste_direto');

    // 1) GÊNERO declarado no NOME do instrumento (sinal forte, pouco ruído).
    if (/\b(invent[áa]rio|inventory)\b/.test(title)) return view('inventario');
    if (/\b(triagem|rastreio|screening|sinais precoces|m-?chat|q-?chat)\b/.test(title)) return view('triagem');
    if (/\b(observa[çc][aã]o|protocolo observ|checklist observ)\b/.test(title)) return view('observacao');

    // 2) TAREFA neuropsicológica DIRETA — whitelist específica de nome de tarefa
    //    (não palavras amplas como "leitura/escrita", que aparecem em escalas).
    if (/\b(span de d[íi]gitos|d[íi]gitos diretos|d[íi]gitos inversos|trail making|teste de trilhas|nomea[çc][aã]o autom[áa]tica r[áa]pida|\bran\b|cubos de corsi|flu[êe]ncia verbal|teste direto|tarefa de |prova de )\b/.test(t)) {
      return view('teste_direto');
    }

    // 3) AUTORRELATO — a própria criança/adolescente responde.
    if (a === 'autoteste' || a === 'autorrelato' || /\b(autorrelato|autorelato|autoteste|self report|self-report)\b/.test(resp)) {
      return view('autorrelato');
    }
    // 4) ESCALA por RESPONDENTE (heterorrelato) — sinal factual de audiência.
    if (a === 'escola' || /\b(escola|professor|pedagog)\b/.test(resp)) return view('escala_escola');
    if (a === 'pais' || a === 'familia' || a === 'cuidador' || /\b(pais|familia|cuidador|responsavel)\b/.test(resp)) return view('escala_pais');

    // 5) clinico/terapeuta/misto e demais → questionário estruturado (aplicado/
    //    avaliado por profissional). NÃO é "teste direto" sem nomear a tarefa.
    return view('questionario');
  }
  function view(kind) {
    var k = KINDS[kind];
    return { kind: kind, label: k.label, emoji: k.emoji, direct: k.direct };
  }

  /* functionalExamples: prompts FUNCIONAIS por queixa (não itens de instrumento).
     Cada entrada: { emoji, examples:[cotidiano], observe:[sinais] }. */
  var EXAMPLES = {
    fala: { emoji: '🗣️', examples: ['aponta o que quer', 'fala palavras soltas ou frases', 'imita sons e gestos', 'pede ajuda falando'], observe: ['usa mais gesto que fala', 'troca/omite sons', 'fala pouco para a idade'] },
    tea: { emoji: '🧩', examples: ['responde quando chamam o nome', 'olha nos olhos ao interagir', 'aponta para mostrar interesse', 'brinca de faz-de-conta'], observe: ['prefere brincar sozinho', 'repete falas/movimentos', 'incomoda-se com mudança de rotina'] },
    tdah: { emoji: '🎯', examples: ['termina uma atividade que começou', 'escuta uma história até o fim', 'espera a vez em jogos', 'guarda o material da escola'], observe: ['muda muito rápido de atividade', 'parece "desligar"', 'agita-se, não para quieto'] },
    escola: { emoji: '📚', examples: ['reconhece letras/números', 'acompanha a turma nas tarefas', 'lê/escreve conforme a série', 'organiza o caderno'], observe: ['evita ler ou escrever', 'rende abaixo do esperado', 'cansa rápido na tarefa'] },
    comportamento: { emoji: '💢', examples: ['aceita ouvir "não"', 'cumpre combinados simples', 'pede em vez de exigir'], observe: ['desafia com frequência', 'irrita-se com facilidade', 'discute por limites'] },
    agressividade: { emoji: '🌋', examples: ['pede ajuda quando irritado', 'se acalma com apoio'], observe: ['bate/morde/empurra', 'tem crises intensas', 'se machuca quando frustrado'] },
    ansiedade: { emoji: '😰', examples: ['encara situações novas com apoio', 'se separa dos pais sem grande sofrimento'], observe: ['preocupa-se demais', 'evita lugares/pessoas', 'queixas físicas sem causa'] },
    humor: { emoji: '💧', examples: ['demonstra alegria nas atividades', 'recupera-se de uma tristeza'], observe: ['triste/irritado na maior parte do dia', 'isola-se', 'perdeu interesse no que gostava'] },
    sono: { emoji: '🌙', examples: ['adormece em tempo razoável', 'dorme a noite toda'], observe: ['demora muito para dormir', 'acorda várias vezes', 'sonolento de dia'] },
    alimentacao: { emoji: '🍽️', examples: ['aceita variedade de alimentos', 'come com a família'], observe: ['recusa texturas/cores', 'come pouquíssimos itens', 'engasga/seletividade intensa'] },
    sensorial: { emoji: '✨', examples: ['tolera barulho/toque do dia a dia', 'aceita roupas e banho'], observe: ['tapa os ouvidos com sons', 'incomoda-se com etiquetas/texturas', 'busca muito movimento'] },
    motor: { emoji: '🤸', examples: ['anda/corre com equilíbrio', 'segura lápis/talheres', 'sobe escadas'], observe: ['cai muito', 'tropeça/desajeitado', 'cansa rápido no esforço'] },
    autonomia: { emoji: '🧷', examples: ['come sozinho', 'ajuda a se vestir', 'avisa para ir ao banheiro'], observe: ['depende para tarefas simples da idade', 'não avisa necessidades'] },
    epilepsia: { emoji: '⚡', examples: ['mantém-se conectado ao ambiente'], observe: ['olhar parado/ausências', 'movimentos repetitivos súbitos', 'episódios de desconexão'] },
    risco: { emoji: '🛟', examples: ['procura um adulto quando está mal'], observe: ['fala em se machucar', 'machuca o próprio corpo', 'expressa não querer viver'] }
  };
  function functionalExamples(tag) {
    return EXAMPLES[norm(tag)] || null;
  }

  /* ---------- Cobertura por MODALIDADE (triangulação clínica) ----------
     Garante que a recomendação cruze olhares (família × escola × criança ×
     teste direto × observação) em vez de empilhar só questionários parentais.
     Resolve a dor "o filtro só sugere questionário" — testes diretos e
     observação entram no topo quando existem e são relevantes. */
  var BUCKET = {
    escala_pais: 'familia', escala_escola: 'escola', autorrelato: 'crianca',
    teste_direto: 'direto', observacao: 'observacao', triagem: 'triagem',
    inventario: 'relato', questionario: 'relato'
  };
  var BUCKET_LABEL = {
    familia: '👪 Família', escola: '🏫 Escola', crianca: '🧒 Criança',
    direto: '🎯 Teste direto', observacao: '👀 Observação', triagem: '⚡ Triagem', relato: '📋 Relato estruturado'
  };
  function bucketOf(s) { return BUCKET[classify(s).kind] || 'relato'; }

  // Reordena uma lista JÁ ordenada por relevância (score desc) para maximizar a
  // diversidade de modalidade no topo, sem inventar relevância: pega o melhor de
  // cada modalidade ainda não coberta; quando todas cobertas, segue pelo ranking.
  function balanceByType(rows, limit) {
    limit = Math.max(1, limit || 3);
    var pool = (rows || []).slice();
    var picked = [], used = {};
    while (picked.length < limit && pool.length) {
      var idx = -1;
      for (var i = 0; i < pool.length; i++) { if (!used[bucketOf(pool[i])]) { idx = i; break; } }
      if (idx === -1) idx = 0; // todas as modalidades já cobertas → segue o ranking puro
      used[bucketOf(pool[idx])] = 1;
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  }

  // Lista de modalidades presentes (para um resumo "este caso cruza: …").
  function coverageOf(rows) {
    var seen = {}, out = [];
    (rows || []).forEach(function (s) { var b = bucketOf(s); if (!seen[b]) { seen[b] = 1; out.push(b); } });
    return out;
  }
  function coverageLabels(rows) { return coverageOf(rows).map(function (b) { return BUCKET_LABEL[b] || b; }); }

  var api = {
    classify: classify, functionalExamples: functionalExamples, KINDS: KINDS,
    bucketOf: bucketOf, balanceByType: balanceByType, coverageOf: coverageOf, coverageLabels: coverageLabels
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedTaxonomy = api;

  /* ============================================================
     Compat shim — window.NPScaleTaxonomy
     ------------------------------------------------------------
     A camada premium (scales-medals, scales-why-card, scales-filter-integration,
     instrumento-enriched) usa uma API curta com 6 tipos visuais e cor por
     categoria. Mapeia 1:1 sobre classify() acima.
     ============================================================ */
  if (!root) return;

  var TYPES = {
    'escala':       { emoji: '📋', label: 'Escala',          color: '#7c79ff', desc: 'Métrica formal pontuada' },
    'inventario':   { emoji: '📚', label: 'Inventário',      color: '#9b7bff', desc: 'Perfil multi-domínio' },
    'questionario': { emoji: '📝', label: 'Questionário',    color: '#60a5fa', desc: 'Coleta estruturada' },
    'teste-direto': { emoji: '🎯', label: 'Teste direto',    color: '#f59e0b', desc: 'Tarefa aplicada na criança' },
    'observacao':   { emoji: '👀', label: 'Observação',      color: '#34d399', desc: 'Checklist observacional clínico' },
    'triagem':      { emoji: '⚡', label: 'Triagem',          color: '#f472b6', desc: 'Rastreio rápido' }
  };

  // Mapeia kind do classify() (8 categorias) → tipo visual (6 categorias)
  var KIND_TO_TYPE = {
    teste_direto: 'teste-direto',
    observacao:   'observacao',
    triagem:      'triagem',
    inventario:   'inventario',
    autorrelato:  'escala',     // autorrelato vira escala visual (com badge de família neutra)
    escala_pais:  'escala',
    escala_escola:'escala',
    questionario: 'questionario'
  };

  function inferType(scale){
    if (!scale) return 'escala';
    if (scale.tipo && TYPES[scale.tipo]) return scale.tipo;
    var k = classify(scale).kind;
    return KIND_TO_TYPE[k] || 'escala';
  }

  function badge(scale, opts){
    var tipo = inferType(scale);
    var meta = TYPES[tipo];
    var size = (opts && opts.size) || 'sm';
    var pad = size === 'lg' ? '5px 11px' : '3px 8px';
    var fz = size === 'lg' ? '12px' : '10.5px';
    return '<span class="np-type-badge" data-tipo="' + tipo + '" ' +
      'title="' + meta.label + ' — ' + meta.desc + '" ' +
      'style="display:inline-flex;align-items:center;gap:4px;padding:' + pad + ';' +
      'border-radius:7px;font:800 ' + fz + '/1 system-ui;letter-spacing:.02em;' +
      'background:' + meta.color + '22;color:' + meta.color + ';' +
      'border:1px solid ' + meta.color + '55;">' +
      meta.emoji + ' ' + meta.label + '</span>';
  }

  function listAll(){ return Object.keys(TYPES).map(function(k){ return Object.assign({ id: k }, TYPES[k]); }); }

  root.NPScaleTaxonomy = {
    version: '1.1.0',
    TYPES: TYPES,
    KIND_TO_TYPE: KIND_TO_TYPE,
    inferType: inferType,
    badge: badge,
    listAll: listAll
  };
})(typeof window !== 'undefined' ? window : null);
