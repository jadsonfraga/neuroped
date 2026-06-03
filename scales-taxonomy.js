/* ============================================================
   NeuroPed EDJ — scales-taxonomy.js
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
   Puro, sem dependências. Funciona no browser (window.NeuroPedTaxonomy) e em
   Node (module.exports) para teste unitário.
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

  /* classify: retorna { kind, label, emoji, direct } — factual, determinístico. */
  function classify(s) {
    s = s || {};
    var a = norm(s.audience);
    var resp = norm([].concat(s.respondent || s.respondente || []).join(' ') + ' ' + a);
    var t = norm([s.title, s.short_title, s.domain, s.finalidade,
      [].concat(s.keywords || []).join(' '), [].concat(s.symptoms || []).join(' ')].join(' '));

    // 1) TESTE DIRETO — flag explícita, audiência clínica, ou tarefa cognitiva/acadêmica
    if (s.direct_test === true || s.direct_test === 1 ||
        a === 'clinico' || a === 'direct' || a === 'terapeuta' ||
        /\b(teste direto|tarefa|prova|nomeacao|nomeacao rapida|span de digitos|span de dig|trilhas|consciencia fonologica|fonologic|leitura|escrita|nomeacao automatica|memoria operacional|memoria de trabalho|fluencia|reconhecimento de letras|aplicacao direta)\b/.test(t)) {
      return view('teste_direto');
    }
    // 2) OBSERVAÇÃO ESTRUTURADA — checklist observacional clínico
    if (/\b(observa|checklist observ|contato ocular|contato visual|reciprocidade|brincar simbolico|estereotipia|protocolo observ)\b/.test(t)) {
      return view('observacao');
    }
    // 3) TRIAGEM / RASTREIO — instrumento breve de rastreio
    if (/\b(triagem|rastreio|screening|m-?chat|q-?chat|rapid|breve|sinais de alerta|red flag)\b/.test(t)) {
      return view('triagem');
    }
    // 4) INVENTÁRIO — perfil comportamental/emocional amplo
    if (/\b(inventario|inventory|cbcl|brief|perfil comportamental|perfil emocional|checklist comportamental)\b/.test(t)) {
      return view('inventario');
    }
    // 5) AUTORRELATO — a própria criança/adolescente responde
    if (a === 'autoteste' || /\b(autorrelato|autorelato|autoteste|self report|self-report|\bself\b|adolescente responde)\b/.test(resp)) {
      return view('autorrelato');
    }
    // 6) ESCALA por RESPONDENTE (heterorrelato)
    if (a === 'escola' || /\b(escola|professor|pedagog)\b/.test(resp)) return view('escala_escola');
    if (a === 'pais' || a === 'familia' || a === 'cuidador' || /\b(pais|familia|cuidador|mae|pai|responsavel)\b/.test(resp)) return view('escala_pais');

    // 7) default
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
})(typeof window !== 'undefined' ? window : null);
