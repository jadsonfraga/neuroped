/* ============================================================
   NeuroPed EDJ — scales-questions.js
   Camada de DADOS: perguntas-guia ENRIQUECIDAS por queixa, em linguagem de
   pais, com emoji + exemplos funcionais + microexplicação + adaptação por idade.
   ------------------------------------------------------------
   IMPORTANTE (conformidade): NÃO são itens de instrumentos proprietários
   (SNAP-IV, M-CHAT, SRS-2, CBCL, BRIEF… não podem ser reproduzidos). São
   prompts GENÉRICOS de observação do desenvolvimento — conhecimento comum —
   no mesmo espírito das "perguntas-guia" que o app já usa. Apoio à observação,
   não diagnóstico.
   ------------------------------------------------------------
   API: NeuroPedQuestions.guide(tag, ageMonths) -> [{emoji, pergunta,
        explicacao, exemplos:[], contexto:[casa|escola|social], faixa}]
   Puro, sem dependências. Browser (window.NeuroPedQuestions) + Node (exports).
   ============================================================ */
(function (root) {
  'use strict';

  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // q(emoji, pergunta, explicacao, exemplos, contexto, minM, maxM)
  function q(emoji, pergunta, explicacao, exemplos, contexto, minM, maxM) {
    return { emoji: emoji, pergunta: pergunta, explicacao: explicacao,
      exemplos: exemplos || [], contexto: contexto || ['casa'], faixa: [minM || 0, maxM || 240] };
  }

  // Guias enriquecidos por queixa (genéricos, observacionais). Cada item tem faixa
  // etária para adaptação. Mantidos concisos e factuais.
  var GUIDE = {
    tdah: [
      q('🎯', 'Ele consegue manter a atenção numa atividade por alguns minutos?',
        'Observe se sustenta o foco ou troca de tarefa o tempo todo.',
        ['escutar uma história até o fim', 'terminar uma brincadeira', 'fazer a tarefa da escola'], ['casa', 'escola'], 36),
      q('🏃', 'Fica muito agitado, como se "tivesse um motorzinho"?',
        'Hiperatividade vai além de ser ativo: é não conseguir desacelerar.',
        ['não para sentado nas refeições', 'sobe nos móveis', 'mexe nas mãos/pés sem parar'], ['casa', 'escola', 'social'], 36),
      q('⏳', 'Tem dificuldade de esperar a vez ou age sem pensar?',
        'Impulsividade: responde/age antes de o adulto terminar.',
        ['interrompe conversas', 'não espera na fila do jogo', 'se arrisca sem medir'], ['social', 'escola'], 48)
    ],
    tea: [
      q('👀', 'Ele responde quando você chama o nome dele?',
        'Resposta ao nome é um marcador social precoce importante.',
        ['vira ao ser chamado de longe', 'busca seu olhar ao brincar'], ['casa', 'social'], 12),
      q('🤝', 'Demonstra interesse espontâneo por outras crianças?',
        'Interesse social espontâneo (não só quando provocado).',
        ['chama para brincar', 'compartilha o que achou interessante', 'responde quando chamam'], ['social', 'escola'], 24),
      q('🔁', 'Tem rotinas, movimentos ou interesses muito repetitivos?',
        'Padrões repetitivos e resistência a mudança de rotina.',
        ['enfileira objetos', 'repete falas/movimentos', 'incomoda-se com mudanças'], ['casa', 'escola'], 18),
      q('🗣️', 'Aponta para mostrar algo que achou interessante (não só para pedir)?',
        'Atenção compartilhada: dividir interesse, não só obter um objeto.',
        ['aponta a lua e olha pra você', 'mostra um brinquedo só para compartilhar'], ['casa', 'social'], 12, 48)
    ],
    fala: [
      q('🗣️', 'Como ele comunica o que quer hoje?',
        'Veja o meio principal: gesto, palavra solta, frase.',
        ['aponta', 'fala palavras soltas', 'monta frases curtas', 'puxa pela mão'], ['casa'], 12),
      q('👂', 'Ele entende ordens simples sem você apontar?',
        'Linguagem receptiva: compreender separa atraso de fala de outros quadros.',
        ['"pega o sapato"', '"vem comer"', '"cadê a bola?"'], ['casa'], 18),
      q('🔤', 'Troca, omite ou distorce muitos sons ao falar?',
        'Aspecto fonológico/articulatório da fala.',
        ['"tato" por "gato"', 'fala difícil de entender para estranhos'], ['casa', 'escola'], 36)
    ],
    ansiedade: [
      q('😟', 'Ele se preocupa demais ou pede garantias o tempo todo?',
        'Preocupação desproporcional para a idade.',
        ['pergunta "e se…" repetidamente', 'precisa de reasseguramento constante'], ['casa', 'escola'], 48),
      q('🚪', 'Evita lugares, pessoas ou situações por medo?',
        'Evitação é o sinal funcional central da ansiedade.',
        ['recusa ir à escola', 'evita festas', 'não dorme fora'], ['social', 'escola'], 36),
      q('🤕', 'Tem queixas físicas (barriga/cabeça) sem causa médica, em momentos de tensão?',
        'Somatização ligada a contextos de estresse.',
        ['dor de barriga antes da escola', 'cabeça doendo em provas'], ['escola', 'casa'], 60)
    ],
    comportamento: [
      q('💢', 'Quando ouve "não", como ele costuma reagir?',
        'Tolerância à frustração e aceitação de limites.',
        ['aceita com ajuda', 'discute muito', 'tem explosão'], ['casa', 'escola'], 24),
      q('🧩', 'Cumpre combinados e rotinas simples?',
        'Seguir regras previsíveis do dia a dia.',
        ['guarda os brinquedos quando combinado', 'segue a rotina da noite'], ['casa'], 36)
    ],
    escola: [
      q('📚', 'Acompanha a turma nas atividades da idade dele?',
        'Rendimento funcional comparado aos pares.',
        ['reconhece letras/números', 'copia do quadro', 'termina no tempo da turma'], ['escola'], 60),
      q('✍️', 'Evita ou cansa muito rápido em ler/escrever?',
        'Esquiva e fadiga podem indicar dificuldade específica.',
        ['some na hora da lição', 'reclama que "não consegue"'], ['escola', 'casa'], 60)
    ]
  };

  // Resolve a taxonomia no browser (window) ou em Node (require) — fallback DRY.
  function getTax() {
    if (root && root.NeuroPedTaxonomy) return root.NeuroPedTaxonomy;
    try { if (typeof require !== 'undefined') return require('./scales-taxonomy.js'); } catch (e) {}
    return null;
  }
  // Pergunta-guia genérica derivada de uma queixa sem guia curado (fallback honesto).
  function genericFor(tag) {
    var tax = getTax();
    var fe = (tax && tax.functionalExamples) ? tax.functionalExamples(tag) : null;
    if (!fe) return [];
    return [q(fe.emoji || '🔎', 'O que você observa em relação a isso no dia a dia?',
      'Compare com o esperado para a idade e com outras crianças.',
      (fe.observe || fe.examples || []).slice(0, 4), ['casa', 'escola'], 0)];
  }

  function guide(tag, ageMonths) {
    var t = norm(tag);
    var base = GUIDE[t] || genericFor(t);
    if (ageMonths == null || isNaN(ageMonths)) return base.slice();
    var a = Number(ageMonths);
    // adapta por idade: prioriza perguntas cuja faixa inclui a idade; nunca esvazia.
    var inRange = base.filter(function (x) { return a >= x.faixa[0] && a <= x.faixa[1]; });
    return (inRange.length ? inRange : base).slice();
  }

  var api = { guide: guide, GUIDE: GUIDE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedQuestions = api;
})(typeof window !== 'undefined' ? window : null);
